# debug_routes.py - Check what routes are registered in your Flask app
import sys
import os

# Add current directory to path
sys.path.insert(0, os.getcwd())

def debug_flask_routes():
    """Debug Flask routes to see what's registered"""
    try:
        # Try to import your main app
        print("🔍 Attempting to import Flask app...")
        
        # Try different import methods based on your project structure
        app = None
        
        # Method 1: Direct app import
        try:
            from app import app
            print("✅ Successfully imported app from 'app.py'")
        except ImportError as e1:
            print(f"❌ Failed to import from app.py: {e1}")
            
            # Method 2: create_app function
            try:
                from app import create_app
                app = create_app()
                print("✅ Successfully created app using create_app()")
            except ImportError as e2:
                print(f"❌ Failed to import create_app: {e2}")
                
                # Method 3: Try __init__.py
                try:
                    from app import create_app
                    app = create_app()
                    print("✅ Successfully imported from app/__init__.py")
                except ImportError as e3:
                    print(f"❌ Failed all import methods: {e3}")
                    return None
        
        if app is None:
            print("❌ Could not create Flask app instance")
            return None
            
        # Print all registered routes
        print("\n📋 Registered Flask Routes:")
        print("=" * 50)
        
        with app.app_context():
            for rule in app.url_map.iter_rules():
                methods = ', '.join(sorted(rule.methods - {'HEAD', 'OPTIONS'}))
                print(f"🔗 {rule.rule:<30} [{methods:<15}] -> {rule.endpoint}")
        
        print("=" * 50)
        
        # Check for AI status route specifically
        ai_routes = [rule for rule in app.url_map.iter_rules() if 'ai' in rule.rule.lower()]
        
        if ai_routes:
            print(f"\n✅ Found {len(ai_routes)} AI-related routes:")
            for route in ai_routes:
                methods = ', '.join(sorted(route.methods - {'HEAD', 'OPTIONS'}))
                print(f"   🤖 {route.rule} [{methods}]")
        else:
            print("\n❌ No AI-related routes found!")
            print("💡 The /api/ai/status route is missing from your Flask app")
        
        return app
        
    except Exception as e:
        print(f"❌ Error debugging routes: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    print("🚀 Flask Route Debugger")
    print("=" * 50)
    
    # Check Python path
    print(f"📁 Current directory: {os.getcwd()}")
    print(f"🐍 Python path: {sys.path[0]}")
    
    # List Python files
    py_files = [f for f in os.listdir('.') if f.endswith('.py')]
    print(f"📄 Python files found: {', '.join(py_files)}")
    
    # Check if app directory exists
    if os.path.exists('app'):
        print("📂 'app' directory found")
        app_files = [f for f in os.listdir('app') if f.endswith('.py')]
        print(f"📄 Files in app/: {', '.join(app_files)}")
    else:
        print("❌ No 'app' directory found")
    
    print("\n" + "=" * 50)
    
    # Debug the routes
    app = debug_flask_routes()
    
    if app:
        print(f"\n✅ Flask app successfully loaded!")
        print(f"📊 Total routes: {len(list(app.url_map.iter_rules()))}")
    else:
        print(f"\n❌ Failed to load Flask app")
        print("💡 Check your app.py file structure and imports")