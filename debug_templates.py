#!/usr/bin/env python3
"""
Debug script to check template data and placeholders
"""

import sys
import os

# Add the project root to Python path
sys.path.insert(0, os.getcwd())

try:
    from app import create_app
    from app.models import db, Template, User
    
    app = create_app()
    
    with app.app_context():
        print("=== Template Debug Analysis ===")
        
        # Check all templates
        templates = Template.query.all()
        print(f"\nTotal templates in database: {len(templates)}")
        
        for template in templates[-5:]:  # Show last 5 templates
            print(f"\n--- Template: {template.name} ---")
            print(f"ID: {template.id}")
            print(f"Category: {template.category}")
            print(f"Created: {template.created_at}")
            print(f"Updated: {template.updated_at}")
            print(f"Created by: {template.created_by}")
            print(f"Content length: {len(template.content) if template.content else 0} characters")
            
            # Check placeholders
            placeholders = template.placeholders
            print(f"Placeholders: {len(placeholders) if placeholders else 0}")
            if placeholders:
                for i, placeholder in enumerate(placeholders):
                    print(f"  {i+1}. {placeholder.get('key', 'NO_KEY')} - {placeholder.get('description', 'NO_DESC')}")
            else:
                print("  (No placeholders)")
                
            # Show raw placeholder data
            print(f"Raw placeholder data: {template._placeholders[:200] if template._placeholders else 'None'}...")
        
        # Check for recently created templates (today)
        from datetime import datetime, timedelta
        today = datetime.now().date()
        recent_templates = Template.query.filter(
            db.func.date(Template.created_at) >= today
        ).all()
        
        print(f"\n=== Templates created today ({today}): {len(recent_templates)} ===")
        for template in recent_templates:
            print(f"- {template.name} (ID: {template.id}) - {len(template.placeholders) if template.placeholders else 0} placeholders")
            if template.placeholders:
                for placeholder in template.placeholders:
                    print(f"  * {placeholder.get('key', 'NO_KEY')}: {placeholder.get('description', 'NO_DESC')}")
        
        # Check specific placeholder content
        print(f"\n=== Template Placeholder Analysis ===")
        templates_with_placeholders = [t for t in templates if t.placeholders and len(t.placeholders) > 3]
        print(f"Templates with more than 3 placeholders: {len(templates_with_placeholders)}")
        
        for template in templates_with_placeholders[-3:]:
            print(f"\n{template.name}:")
            for placeholder in template.placeholders:
                print(f"  - {placeholder.get('key', 'NO_KEY')}: {placeholder.get('description', 'NO_DESC')} [{placeholder.get('type', 'text')}]")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()