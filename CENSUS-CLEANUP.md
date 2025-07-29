# Patient Census Cleanup System

## Overview
To prevent unlimited database growth, MeDocPro includes a patient census cleanup system that automatically removes census data older than a specified number of days (default: 7 days).

## Features

### 1. Model-Level Cleanup Method
**Location**: `app/models/patient_census.py`

```python
@classmethod
def cleanup_old_censuses(cls, days_to_keep=7):
    """
    Delete patient censuses older than specified days to prevent database growth.
    
    Args:
        days_to_keep (int): Number of days to keep (default: 7)
        
    Returns:
        dict: Statistics about deleted records
    """
```

**What it cleans:**
- Patient census records older than `days_to_keep`
- Associated patient census rows (cascading delete)
- Related daily information entries

**Returns statistics:**
- Number of censuses deleted
- Number of patient rows deleted  
- Number of daily information entries deleted
- Cutoff date used
- Success message

### 2. CLI Management Command
**Usage**: `python manage.py cleanup-census [OPTIONS]`

**Options:**
- `--days INTEGER`: Number of days to keep (default: 7)
- `--dry-run`: Show what would be deleted without making changes

**Examples:**
```bash
# Dry run to see what would be deleted
python manage.py cleanup-census --dry-run

# Keep only last 14 days
python manage.py cleanup-census --days 14

# Keep only last 3 days (aggressive cleanup)
python manage.py cleanup-census --days 3
```

**Sample Output:**
```
MeDocPro Census Cleanup Operation
========================================
Cleaning up censuses older than 7 days (before 2025-07-17)

Dry run results:
  Censuses to delete: 6
  Patient rows to delete: 133
  Daily info entries to delete: 9

Old censuses found:
Date         User ID  Patients  
--------------------------------
2025-07-11       2       32
2025-07-12       2       25
2025-07-13       2       25
2025-07-14       2       21
2025-07-15       2       25
2025-07-16       2        5

Use --dry-run=false to perform actual cleanup
```

### 3. API Endpoint
**Endpoint**: `POST /api/patient-census/cleanup`  
**Authentication**: JWT required

**Request Body:**
```json
{
  "days_to_keep": 7,
  "dry_run": true
}
```

**Parameters:**
- `days_to_keep` (integer, 1-365): Number of days to keep (default: 7)
- `dry_run` (boolean): If true, shows what would be deleted without deleting (default: false)

**Response (Dry Run):**
```json
{
  "success": true,
  "dry_run": true,
  "would_delete": {
    "censuses": 6,
    "patient_rows": 133,
    "daily_info_entries": 9
  },
  "cutoff_date": "2025-07-17",
  "old_censuses": [
    {
      "date": "2025-07-11",
      "user_id": 2,
      "patient_count": 32
    }
  ],
  "message": "Dry run: 6 censuses would be deleted"
}
```

**Response (Actual Cleanup):**
```json
{
  "success": true,
  "dry_run": false,
  "deleted_censuses": 6,
  "deleted_rows": 133,
  "deleted_daily_info": 9,
  "cutoff_date": "2025-07-17",
  "message": "Successfully deleted 6 censuses older than 7 days"
}
```

## Security & Auditing

### User Permissions
- API endpoint requires JWT authentication
- All cleanup operations are logged via audit system
- Dry run operations also logged for transparency

### Audit Logging
```python
log_audit_event(
    user_id,
    'census_cleanup_performed',
    f'Cleaned up census data: {result["deleted_censuses"]} censuses, '
    f'{result["deleted_rows"]} rows, {result["deleted_daily_info"]} daily info entries deleted'
)
```

### Safety Features
- **Dry run capability**: Always test before actual deletion
- **Parameter validation**: days_to_keep must be 1-365
- **Transaction safety**: Database rollback on errors
- **Cascade protection**: Proper foreign key constraints ensure data integrity

## Recommended Usage

### Daily Maintenance (Automated)
```bash
# Add to cron job for daily cleanup at 2 AM
0 2 * * * /path/to/venv/bin/python /path/to/medocpro/manage.py cleanup-census --days 7
```

### Weekly Review (Manual)
```bash
# Weekly dry run to review what would be cleaned
python manage.py cleanup-census --dry-run --days 7
```

### Aggressive Cleanup (Emergency)
```bash
# For storage emergencies, keep only 3 days
python manage.py cleanup-census --days 3 --dry-run  # Review first
python manage.py cleanup-census --days 3            # Execute
```

## Database Impact

### Before Cleanup
- Patient census records accumulate daily
- Each census contains multiple patient rows
- Daily information entries linked to each patient
- Database size grows linearly with time

### After Cleanup (7-day retention)
- Maximum of 7 days of census data per user
- Significantly reduced database size
- Improved query performance
- Maintained clinical workflow continuity

## Integration Points

### With Daily Rollover
The cleanup system works alongside the daily rollover system:
1. Daily rollover creates new census from previous day
2. Cleanup removes censuses older than retention period
3. Current workflow remains unaffected

### With Backup Systems
Ensure backup systems capture data before cleanup:
1. Run backups before cleanup operations
2. Consider longer retention in backup systems
3. Test restore procedures with cleaned data

## Configuration

### Environment Variables
```bash
# Optional: Set default retention period
CENSUS_RETENTION_DAYS=7

# Optional: Enable automatic cleanup
CENSUS_AUTO_CLEANUP=true
```

### Database Indexes
Cleanup performance depends on proper indexing:
- `patient_census.census_date` (already indexed)
- `patient_census.is_active` (already indexed)
- `daily_information.patient_census_row_id` (foreign key)

## Monitoring

### Success Metrics
- Number of censuses cleaned up daily
- Database size reduction
- Query performance improvement
- No data integrity issues

### Alert Conditions
- Cleanup failures (check logs)
- Unusual deletion counts (potential data issues)
- Database growth despite cleanup (configuration issues)

## Troubleshooting

### Common Issues
1. **Permission denied**: Ensure JWT token is valid
2. **Database locked**: Check for long-running transactions
3. **Foreign key constraints**: Verify cascade relationships
4. **Large deletions timeout**: Reduce retention period gradually

### Recovery Procedures
1. **Accidental deletion**: Restore from backup
2. **Partial cleanup**: Check transaction logs
3. **Performance issues**: Run during off-peak hours

This cleanup system ensures MeDocPro maintains optimal database performance while preserving recent clinical data for operational needs.