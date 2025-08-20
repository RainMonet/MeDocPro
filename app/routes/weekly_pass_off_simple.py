# app/routes/weekly_pass_off_simple.py - Simplified version for testing

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta

weekly_pass_off_bp = Blueprint('weekly_pass_off', __name__)

@weekly_pass_off_bp.route('/weekly-pass-off-summary', methods=['GET'])
@jwt_required()
def get_weekly_pass_off_summary():
    """Generate comprehensive weekly pass-off summary for weekend coverage"""
    try:
        current_user_id = get_jwt_identity()
        
        # Get current date and week range
        today = datetime.now().date()
        start_of_week = today - timedelta(days=today.weekday())  # Monday
        end_of_week = start_of_week + timedelta(days=6)  # Sunday
        
        week_period = f"{start_of_week.strftime('%B %d')} - {end_of_week.strftime('%B %d, %Y')}"
        
        # Generate sample pass-off data for testing
        sample_patients = [
            {
                'id': 'p001',
                'name': 'Sarah Chen',
                'room': '101A',
                'age': 34,
                'admissionDate': '2024-01-05',
                'primaryDiagnosis': 'Major Depressive Disorder',
                'currentCondition': 'stable',
                'keyIssues': ['Mild anxiety episodes', 'Sleep disturbances'],
                'medications': ['Sertraline 50mg daily', 'Trazodone 25mg PRN'],
                'lastAssessment': 'Mood improved, engaging in therapy sessions',
                'riskFactors': 'Low suicide risk, compliant with treatment',
                'weeklyProgress': 'Good engagement, mood stabilizing',
                'urgentConcerns': None,
                'nextActions': 'Continue current medications, monitor sleep'
            },
            {
                'id': 'p002',
                'name': 'Michael Rodriguez',
                'room': '102B',
                'age': 67,
                'admissionDate': '2024-01-03',
                'primaryDiagnosis': 'Bipolar I Disorder',
                'currentCondition': 'monitoring',
                'keyIssues': ['Mood swings', 'Medication compliance'],
                'medications': ['Lithium 900mg BID', 'Quetiapine 200mg HS'],
                'lastAssessment': 'Manic episode subsiding, increased insight',
                'riskFactors': 'Moderate risk, history of non-compliance',
                'weeklyProgress': 'Significant improvement in mood stability',
                'urgentConcerns': 'Monitor lithium levels',
                'nextActions': 'Lab work Monday, continue mood tracking'
            },
            {
                'id': 'p003',
                'name': 'David Kim',
                'room': '104B',
                'age': 55,
                'admissionDate': '2024-01-02',
                'primaryDiagnosis': 'Alcohol Use Disorder',
                'currentCondition': 'critical',
                'keyIssues': ['Withdrawal symptoms', 'Liver function concerns'],
                'medications': ['Thiamine 100mg daily', 'Lorazepam taper schedule'],
                'lastAssessment': 'Withdrawal managed, craving intense',
                'riskFactors': 'High relapse risk, limited support system',
                'weeklyProgress': 'Medically stable, psychologically fragile',
                'urgentConcerns': 'Close monitoring for withdrawal complications',
                'nextActions': 'Continue detox protocol, addiction counseling'
            }
        ]
        
        # Calculate summary statistics
        total_patients = len(sample_patients)
        stable_patients = len([p for p in sample_patients if p['currentCondition'] == 'stable'])
        monitoring_patients = len([p for p in sample_patients if p['currentCondition'] == 'monitoring'])
        critical_patients = len([p for p in sample_patients if p['currentCondition'] == 'critical'])
        urgent_concerns = len([p for p in sample_patients if p['urgentConcerns']])
        
        summary = {
            'totalPatients': total_patients,
            'stablePatients': stable_patients,
            'monitoringPatients': monitoring_patients,
            'criticalPatients': critical_patients,
            'urgentConcerns': urgent_concerns,
            'averageLengthOfStay': 4.2,
            'dischargesPlanned': 1
        }
        
        # Sort patients by condition priority (critical first, then monitoring, then stable)
        priority_order = {'critical': 0, 'monitoring': 1, 'stable': 2}
        sample_patients.sort(key=lambda p: (priority_order[p['currentCondition']], p['name']))
        
        return jsonify({
            'success': True,
            'patients': sample_patients,
            'summary': summary,
            'week_period': week_period,
            'generation_timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Failed to generate weekly pass-off summary: {str(e)}'
        }), 500