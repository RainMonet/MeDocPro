# app/utils/data_retention.py

"""
Data retention and cleanup utilities that respect provider absence periods.
Ensures patient information persists during extended time-off periods.
"""

from datetime import datetime, date, timedelta
from ..extensions import db
from ..models import DailyInformation, PatientCensusRow, ProviderAbsence
from ..utils.audit import log_audit_event
import logging

logger = logging.getLogger(__name__)

class DataRetentionManager:
    """Manages data retention policies with provider absence awareness"""
    
    DEFAULT_RETENTION_DAYS = 7
    
    def __init__(self):
        self.retention_days = self.DEFAULT_RETENTION_DAYS
    
    def get_effective_retention_period(self, user_id=None):
        """
        Calculate the effective retention period considering provider absences.
        
        Args:
            user_id: Optional specific provider to check
            
        Returns:
            tuple: (retention_days, is_paused, reason)
        """
        if user_id:
            # Check specific provider
            if ProviderAbsence.is_cleanup_paused_for_provider(user_id):
                active_absences = ProviderAbsence.get_active_absences(user_id)
                if active_absences:
                    absence = active_absences[0]  # Most recent
                    extension = absence.get_extended_retention_days()
                    if extension == 0:  # Indefinite during absence
                        return (None, True, f"Provider {absence.provider_name} on {absence.absence_type} absence")
                    else:
                        return (self.retention_days + extension, False, f"Extended due to provider absence")
        
        # Check global status
        if ProviderAbsence.is_any_cleanup_paused():
            max_extension = ProviderAbsence.get_max_retention_extension()
            if max_extension is None:  # Indefinite
                return (None, True, "Data cleanup paused due to active provider absences")
            else:
                return (self.retention_days + max_extension, False, "Extended due to provider absences")
        
        # Standard retention
        return (self.retention_days, False, "Standard retention policy")
    
    def should_retain_entry(self, entry):
        """
        Determine if a daily information entry should be retained.
        
        Args:
            entry: DailyInformation instance
            
        Returns:
            tuple: (should_retain, reason)
        """
        if not isinstance(entry, DailyInformation):
            return (False, "Invalid entry type")
        
        # Always retain today's entries
        if entry.entry_date == date.today():
            return (True, "Current day entry")
        
        # Always retain signed/completed entries (clinical significance)
        if entry.status in ['signed', 'completed']:
            return (True, f"Entry status: {entry.status}")
        
        # Check provider-specific retention
        retention_days, is_paused, reason = self.get_effective_retention_period(entry.user_id)
        
        if is_paused:
            return (True, f"Retention paused: {reason}")
        
        if retention_days is None:  # Indefinite
            return (True, "Indefinite retention during provider absence")
        
        # Calculate age of entry
        age_days = (date.today() - entry.entry_date).days
        
        if age_days <= retention_days:
            return (True, f"Within retention period ({age_days}/{retention_days} days)")
        
        return (False, f"Exceeds retention period ({age_days} > {retention_days} days)")
    
    def get_entries_for_cleanup(self, dry_run=True, limit=100):
        """
        Get daily information entries that are eligible for cleanup.
        
        Args:
            dry_run: If True, don't actually delete anything
            limit: Maximum number of entries to process
            
        Returns:
            dict: Summary of cleanup analysis
        """
        # Get all entries older than minimum retention period
        cutoff_date = date.today() - timedelta(days=self.DEFAULT_RETENTION_DAYS)
        
        entries = DailyInformation.query.filter(
            DailyInformation.entry_date < cutoff_date,
            DailyInformation.status.in_(['draft', 'reviewed'])  # Don't cleanup signed/completed
        ).order_by(DailyInformation.entry_date.asc()).limit(limit).all()
        
        analysis = {
            'total_candidates': len(entries),
            'eligible_for_cleanup': 0,
            'retained_entries': 0,
            'cleanup_paused': False,
            'retention_extensions': 0,
            'entries_by_reason': {},
            'dry_run': dry_run,
            'processed_entries': []
        }
        
        for entry in entries:
            should_retain, reason = self.should_retain_entry(entry)
            
            entry_info = {
                'id': entry.id,
                'patient_id': entry.patient_census_row_id,
                'patient_name': entry.patient_name,
                'entry_date': entry.entry_date.isoformat(),
                'age_days': (date.today() - entry.entry_date).days,
                'status': entry.status,
                'user_id': entry.user_id,
                'should_retain': should_retain,
                'reason': reason
            }
            
            if should_retain:
                analysis['retained_entries'] += 1
                if 'paused' in reason.lower() or 'absence' in reason.lower():
                    analysis['cleanup_paused'] = True
                if 'extended' in reason.lower():
                    analysis['retention_extensions'] += 1
            else:
                analysis['eligible_for_cleanup'] += 1
            
            # Count reasons
            if reason not in analysis['entries_by_reason']:
                analysis['entries_by_reason'][reason] = 0
            analysis['entries_by_reason'][reason] += 1
            
            analysis['processed_entries'].append(entry_info)
        
        return analysis
    
    def cleanup_old_entries(self, dry_run=True, limit=100, user_id=None):
        """
        Clean up old daily information entries respecting provider absences.
        
        Args:
            dry_run: If True, don't actually delete anything
            limit: Maximum number of entries to delete
            user_id: User ID for audit logging
            
        Returns:
            dict: Cleanup results summary
        """
        logger.info(f"Starting data cleanup (dry_run={dry_run}, limit={limit})")
        
        analysis = self.get_entries_for_cleanup(dry_run, limit)
        
        deleted_count = 0
        deleted_entries = []
        errors = []
        
        if not dry_run and analysis['eligible_for_cleanup'] > 0:
            try:
                # Delete eligible entries
                for entry_info in analysis['processed_entries']:
                    if not entry_info['should_retain']:
                        try:
                            entry = DailyInformation.query.get(entry_info['id'])
                            if entry:
                                deleted_entries.append({
                                    'id': entry.id,
                                    'patient_name': entry.patient_name,
                                    'entry_date': entry.entry_date.isoformat(),
                                    'age_days': entry_info['age_days']
                                })
                                
                                db.session.delete(entry)
                                deleted_count += 1
                        
                        except Exception as e:
                            error_msg = f"Failed to delete entry {entry_info['id']}: {str(e)}"
                            errors.append(error_msg)
                            logger.error(error_msg)
                
                if deleted_count > 0:
                    db.session.commit()
                    logger.info(f"Successfully deleted {deleted_count} daily information entries")
                
            except Exception as e:
                db.session.rollback()
                error_msg = f"Database error during cleanup: {str(e)}"
                errors.append(error_msg)
                logger.error(error_msg)
        
        # Log audit event
        if user_id:
            log_audit_event(
                user_id=user_id,
                action='data_cleanup_executed',
                resource_type='daily_information',
                details={
                    'dry_run': dry_run,
                    'total_candidates': analysis['total_candidates'],
                    'eligible_for_cleanup': analysis['eligible_for_cleanup'],
                    'retained_entries': analysis['retained_entries'],
                    'deleted_count': deleted_count,
                    'cleanup_paused': analysis['cleanup_paused'],
                    'retention_extensions': analysis['retention_extensions'],
                    'errors_count': len(errors)
                }
            )
        
        return {
            'success': len(errors) == 0,
            'dry_run': dry_run,
            'analysis': analysis,
            'deleted_count': deleted_count,
            'deleted_entries': deleted_entries,
            'errors': errors,
            'summary': {
                'total_processed': analysis['total_candidates'],
                'retained': analysis['retained_entries'],
                'deleted': deleted_count,
                'cleanup_paused_for': analysis['cleanup_paused'],
                'provider_extensions': analysis['retention_extensions']
            }
        }
    
    def get_retention_summary(self):
        """Get a summary of current retention policies and active absences"""
        active_absences = ProviderAbsence.get_active_absences()
        
        summary = {
            'default_retention_days': self.DEFAULT_RETENTION_DAYS,
            'active_absences': len(active_absences),
            'cleanup_globally_paused': ProviderAbsence.is_any_cleanup_paused(),
            'max_retention_extension': ProviderAbsence.get_max_retention_extension(),
            'provider_statuses': []
        }
        
        # Get per-provider status
        providers_with_absences = set()
        for absence in active_absences:
            if absence.user_id not in providers_with_absences:
                providers_with_absences.add(absence.user_id)
                
                retention_days, is_paused, reason = self.get_effective_retention_period(absence.user_id)
                
                summary['provider_statuses'].append({
                    'user_id': absence.user_id,
                    'provider_name': absence.provider_name,
                    'effective_retention_days': retention_days,
                    'is_cleanup_paused': is_paused,
                    'reason': reason,
                    'absence_type': absence.absence_type,
                    'start_date': absence.start_date.isoformat(),
                    'end_date': absence.end_date.isoformat() if absence.end_date else None,
                    'days_remaining': absence.days_remaining
                })
        
        return summary

# Convenience functions for use in other modules
def get_retention_manager():
    """Get a singleton instance of DataRetentionManager"""
    return DataRetentionManager()

def should_retain_daily_info_entry(entry):
    """Quick check if a daily info entry should be retained"""
    manager = get_retention_manager()
    should_retain, reason = manager.should_retain_entry(entry)
    return should_retain

def execute_daily_cleanup(dry_run=True, user_id=None):
    """Execute daily cleanup with current retention policies"""
    manager = get_retention_manager()
    return manager.cleanup_old_entries(dry_run=dry_run, user_id=user_id)

def get_retention_status():
    """Get current retention status summary"""
    manager = get_retention_manager()
    return manager.get_retention_summary()