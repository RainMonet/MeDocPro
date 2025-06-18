from app import db
from datetime import datetime
import re

class Template(db.Model):
    __tablename__ = 'templates'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    template_type = db.Column(db.String(50), nullable=False)
    description = db.Column(db.Text)
    content = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), default='general')
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f'<Template {self.name}>'
    
    @property
    def has_ai_zones(self):
        """Check if template contains AI enhancement zones"""
        return '{{BEGIN_AI}}' in self.content and '{{END_AI}}' in self.content
    
    @property
    def ai_zone_count(self):
        """Count number of AI zones in template"""
        return len(re.findall(r'{{BEGIN_AI}}.*?{{END_AI}}', self.content, re.DOTALL))
    
    @property
    def placeholder_variables(self):
        """Extract all placeholder variables from template"""
        # Find all {{VARIABLE}} patterns excluding AI zones
        content_without_ai = re.sub(r'{{BEGIN_AI}}.*?{{END_AI}}', '', self.content, flags=re.DOTALL)
        variables = re.findall(r'{{([A-Z_]+)}}', content_without_ai)
        return list(set(variables))  # Remove duplicates
    
    def get_ai_zones(self):
        """Extract AI zone content for preview"""
        zones = re.findall(r'{{BEGIN_AI}}(.*?){{END_AI}}', self.content, re.DOTALL)
        return [zone.strip() for zone in zones]
    
    def preview_without_ai(self):
        """Get template content without AI zones for preview"""
        return re.sub(r'{{BEGIN_AI}}.*?{{END_AI}}', '[AI Enhancement Zone]', self.content, flags=re.DOTALL)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'template_type': self.template_type,
            'description': self.description,
            'content': self.content,
            'category': self.category,
            'is_active': self.is_active,
            'has_ai_zones': self.has_ai_zones,
            'ai_zone_count': self.ai_zone_count,
            'placeholder_variables': self.placeholder_variables,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @staticmethod
    def get_by_type(template_type):
        """Get all templates of a specific type"""
        return Template.query.filter_by(template_type=template_type, is_active=True).all()
    
    @staticmethod
    def get_by_category(category):
        """Get all templates in a specific category"""
        return Template.query.filter_by(category=category, is_active=True).all()
    
    @staticmethod
    def create_sample_templates():
        """Create sample templates with AI zones"""
        
        templates = [
            {
                'name': 'Psychiatric Progress Note',
                'template_type': 'progress_note',
                'category': 'clinical',
                'description': 'Standard progress note template for psychiatric sessions',
                'content': '''PSYCHIATRIC PROGRESS NOTE

Date: {{CURRENT_DATE}}
Patient: {{PATIENT_NAME}} (ID: {{PATIENT_ID}})
Age: {{PATIENT_AGE}} Gender: {{PATIENT_GENDER}}
Primary Diagnosis: {{PRIMARY_DIAGNOSIS}}

SUBJECTIVE:
{{BEGIN_AI}}
Document the patient's reported symptoms, concerns, and subjective experience since the last visit. Include any changes in mood, sleep, appetite, medication adherence, and psychosocial stressors.
{{END_AI}}

OBJECTIVE:
Mental Status Examination:
- Appearance: {{BEGIN_AI}}Describe patient's appearance, grooming, and dress{{END_AI}}
- Behavior: {{BEGIN_AI}}Document observed behavior, psychomotor activity, and cooperation{{END_AI}}
- Speech: {{BEGIN_AI}}Assess rate, rhythm, volume, and fluency of speech{{END_AI}}
- Mood: {{MOOD}}
- Affect: {{AFFECT}}
- Thought Process: {{BEGIN_AI}}Evaluate organization, coherence, and flow of thoughts{{END_AI}}
- Thought Content: {{BEGIN_AI}}Assess for delusions, obsessions, or preoccupations{{END_AI}}
- Perceptions: {{BEGIN_AI}}Screen for hallucinations or perceptual disturbances{{END_AI}}
- Cognition: {{BEGIN_AI}}Brief cognitive assessment if indicated{{END_AI}}
- Insight: {{INSIGHT}}
- Judgment: {{JUDGMENT}}

ASSESSMENT:
{{BEGIN_AI}}
Provide clinical assessment of current mental state, treatment response, and any changes in diagnosis or formulation. Include assessment of risk factors and treatment adherence.
{{END_AI}}

PLAN:
{{BEGIN_AI}}
Outline treatment plan including medication adjustments, therapy recommendations, follow-up schedule, and any safety planning. Include specific, measurable goals for the next visit.
{{END_AI}}

Risk Assessment:
- Suicide Risk: {{SUICIDE_RISK}}
- Homicide Risk: {{HOMICIDE_RISK}}

Next Appointment: ________________
Provider: ________________, MD'''
            },
            
            {
                'name': 'Initial Psychiatric Assessment',
                'template_type': 'intake_assessment',
                'category': 'assessment',
                'description': 'Comprehensive intake assessment for new psychiatric patients',
                'content': '''INITIAL PSYCHIATRIC ASSESSMENT

Date: {{CURRENT_DATE}}
Patient: {{PATIENT_NAME}} (ID: {{PATIENT_ID}})
Age: {{PATIENT_AGE}} Gender: {{PATIENT_GENDER}}
Date of Birth: {{PATIENT_DOB}}

CHIEF COMPLAINT:
{{BEGIN_AI}}
Document the patient's primary concern or reason for seeking psychiatric care in their own words.
{{END_AI}}

HISTORY OF PRESENT ILLNESS:
{{BEGIN_AI}}
Provide a detailed chronological account of the current psychiatric symptoms, including onset, duration, severity, precipitating factors, and impact on functioning. Include any previous treatment attempts and their outcomes.
{{END_AI}}

PAST PSYCHIATRIC HISTORY:
{{BEGIN_AI}}
Detail previous psychiatric diagnoses, hospitalizations, suicide attempts, treatment history including medications and therapy, and family psychiatric history.
{{END_AI}}

MEDICAL HISTORY:
{{BEGIN_AI}}
Review significant medical conditions, current medications, allergies, and any medical conditions that could impact psychiatric treatment.
{{END_AI}}

SUBSTANCE USE HISTORY:
{{BEGIN_AI}}
Assess current and past use of alcohol, illicit drugs, and prescription medications. Include patterns of use, problems related to use, and any treatment history.
{{END_AI}}

PSYCHOSOCIAL HISTORY:
{{BEGIN_AI}}
Document educational background, occupational history, relationships, living situation, legal issues, trauma history, and current psychosocial stressors.
{{END_AI}}

MENTAL STATUS EXAMINATION:
[Detailed MSE as in progress note template]

ASSESSMENT AND DIAGNOSIS:
{{BEGIN_AI}}
Provide differential diagnosis, primary diagnosis with DSM-5 criteria, and formulation including biological, psychological, and social factors contributing to the presentation.
{{END_AI}}

TREATMENT PLAN:
{{BEGIN_AI}}
Develop comprehensive treatment plan including medication recommendations, psychotherapy modalities, psychosocial interventions, treatment goals, and follow-up plan. Address any immediate safety concerns.
{{END_AI}}

RISK ASSESSMENT:
- Suicide Risk: {{SUICIDE_RISK}}
- Homicide Risk: {{HOMICIDE_RISK}}
- Risk Factors: {{BEGIN_AI}}Document specific risk factors present{{END_AI}}
- Protective Factors: {{BEGIN_AI}}Identify protective factors and strengths{{END_AI}}

Provider: ________________, MD
Date: {{CURRENT_DATE}}'''
            },
            
            {
                'name': 'Treatment Plan Update',
                'template_type': 'treatment_plan',
                'category': 'planning',
                'description': 'Comprehensive treatment plan documentation',
                'content': '''TREATMENT PLAN UPDATE

Date: {{CURRENT_DATE}}
Patient: {{PATIENT_NAME}} (ID: {{PATIENT_ID}})
Primary Diagnosis: {{PRIMARY_DIAGNOSIS}}

TREATMENT GOALS:
{{BEGIN_AI}}
Define specific, measurable, achievable, relevant, and time-bound (SMART) treatment goals based on the patient's current presentation and needs.
{{END_AI}}

INTERVENTIONS:

Pharmacological:
{{BEGIN_AI}}
Detail current medications, rationale for medication choices, target symptoms, monitoring parameters, and any planned medication adjustments.
{{END_AI}}

Psychotherapeutic:
{{BEGIN_AI}}
Describe therapy modality, frequency, specific techniques being utilized, and therapeutic targets. Include patient's engagement and progress in therapy.
{{END_AI}}

Psychosocial:
{{BEGIN_AI}}
Address social determinants of health, support systems, vocational/educational goals, and community resources being utilized or recommended.
{{END_AI}}

PROGRESS ASSESSMENT:
{{BEGIN_AI}}
Evaluate progress toward established treatment goals using objective measures where possible. Discuss any barriers to treatment and modifications needed.
{{END_AI}}

SAFETY PLANNING:
{{BEGIN_AI}}
Document current safety plan, crisis intervention strategies, emergency contacts, and any changes to risk assessment since last evaluation.
{{END_AI}}

FOLLOW-UP PLAN:
{{BEGIN_AI}}
Specify frequency of appointments, monitoring requirements, laboratory studies needed, and criteria for treatment plan modifications.
{{END_AI}}

Provider: ________________, MD
Next Review Date: ________________'''
            },
            
            {
                'name': 'Mental Status Examination',
                'template_type': 'mental_status_exam',
                'category': 'assessment',
                'description': 'Detailed mental status examination template',
                'content': '''MENTAL STATUS EXAMINATION

Date: {{CURRENT_DATE}}
Patient: {{PATIENT_NAME}} (ID: {{PATIENT_ID}})
Age: {{PATIENT_AGE}}

APPEARANCE:
{{BEGIN_AI}}
Describe the patient's general appearance, grooming, hygiene, dress, and any notable physical characteristics or abnormalities.
{{END_AI}}

BEHAVIOR:
{{BEGIN_AI}}
Document psychomotor activity, level of cooperation, eye contact, and any unusual behaviors or mannerisms observed during the examination.
{{END_AI}}

SPEECH:
{{BEGIN_AI}}
Assess rate, rhythm, volume, articulation, and spontaneity of speech. Note any speech abnormalities or pressured speech.
{{END_AI}}

MOOD:
Patient's reported mood: {{MOOD}}
{{BEGIN_AI}}
Elaborate on the patient's subjective description of their emotional state and any variations noted.
{{END_AI}}

AFFECT:
Observed affect: {{AFFECT}}
{{BEGIN_AI}}
Describe the objective observation of the patient's emotional expression, including range, appropriateness, and intensity.
{{END_AI}}

THOUGHT PROCESS:
{{BEGIN_AI}}
Evaluate the organization, coherence, and logical flow of thoughts. Note any formal thought disorders such as circumstantiality, tangentiality, or flight of ideas.
{{END_AI}}

THOUGHT CONTENT:
{{BEGIN_AI}}
Assess for delusions, obsessions, compulsions, phobias, and preoccupations. Include details about any abnormal thought content identified.
{{END_AI}}

PERCEPTIONS:
{{BEGIN_AI}}
Screen for auditory, visual, tactile, or other sensory hallucinations. Document any perceptual disturbances and their characteristics.
{{END_AI}}

COGNITION:
{{BEGIN_AI}}
Assess orientation, attention, concentration, memory (immediate, recent, and remote), and executive functioning as clinically indicated.
{{END_AI}}

INSIGHT:
Current insight level: {{INSIGHT}}
{{BEGIN_AI}}
Evaluate the patient's understanding of their illness, need for treatment, and the relationship between symptoms and impairment.
{{END_AI}}

JUDGMENT:
Current judgment: {{JUDGMENT}}
{{BEGIN_AI}}
Assess the patient's ability to make reasonable decisions and understand consequences of their actions.
{{END_AI}}

RISK ASSESSMENT:
- Suicide Risk: {{SUICIDE_RISK}}
- Homicide Risk: {{HOMICIDE_RISK}}

CLINICAL IMPRESSION:
{{BEGIN_AI}}
Provide a summary of significant findings from the mental status examination and their clinical significance.
{{END_AI}}

Examiner: ________________, MD
Date: {{CURRENT_DATE}}'''
            }
        ]
        
        # Create templates
        for template_data in templates:
            existing = Template.query.filter_by(name=template_data['name']).first()
            if not existing:
                template = Template(**template_data)
                db.session.add(template)
        
        try:
            db.session.commit()
            print("Sample templates created successfully!")
        except Exception as e:
            db.session.rollback()
            print(f"Error creating templates: {e}")
    
    @staticmethod
    def update_existing_templates():
        """Update existing templates with AI zones"""
        updates = [
            {
                'name': 'Progress Note',
                'ai_zones': {
                    'Subjective Assessment': 'Document patient\'s reported symptoms and concerns since last visit',
                    'Clinical Observations': 'Describe relevant behavioral and mental status observations',
                    'Treatment Response': 'Assess response to current interventions and medications'
                }
            }
        ]
        
        for update in updates:
            template = Template.query.filter_by(name=update['name']).first()
            if template and not template.has_ai_zones:
                # Add AI zones to existing content
                for zone_name, zone_content in update['ai_zones'].items():
                    placeholder = f"[{zone_name}]"
                    ai_zone = f"{{{{BEGIN_AI}}}}{zone_content}{{{{END_AI}}}}"
                    template.content = template.content.replace(placeholder, ai_zone)
                
                template.updated_at = datetime.utcnow()
        
        try:
            db.session.commit()
            print("Templates updated with AI zones!")
        except Exception as e:
            db.session.rollback()
            print(f"Error updating templates: {e}")