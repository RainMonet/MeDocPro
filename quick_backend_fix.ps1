# Quick fix for MeDocPro AI Status endpoint
Write-Host "🔧 Quick Fix for AI Status Endpoint" -ForegroundColor Cyan

# Check which Flask file you're running
$flaskFiles = @("app.py", "simple_app.py")
$runningFile = $null

foreach ($file in $flaskFiles) {
    if (Test-Path $file) {
        Write-Host "📄 Found: $file" -ForegroundColor Green
        # Check if it has the AI status route
        $content = Get-Content $file -Raw
        if ($content -match "api/ai/status") {
            $runningFile = $file
            Write-Host "✅ $file contains AI status route" -ForegroundColor Green
            break
        }
    }
}

if (-not $runningFile) {
    Write-Host "❌ Could not find Flask file with AI status route" -ForegroundColor Red
    Write-Host "💡 Create a new fixed_app.py file instead" -ForegroundColor Yellow
    
    # Create a complete fixed Flask app
    $fixedApp = @'
# fixed_app.py - MeDocPro with Corrected AI Status Response
from flask import Flask, jsonify
from flask_cors import CORS
import requests
import logging
from datetime import datetime
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, origins=[
    "http://localhost:5173",
    "http://localhost:3000", 
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000"
])

# Configuration
app.config['OLLAMA_URL'] = os.getenv('OLLAMA_URL', 'http://localhost:11434')
app.config['OLLAMA_MODEL'] = os.getenv('OLLAMA_MODEL', 'mistral')

# Mock patient data
MOCK_PATIENTS = [
    {'id': 1, 'name': 'John Smith', 'age': 40, 'diagnosis': 'GAD'},
    {'id': 2, 'name': 'Jane Doe', 'age': 32, 'diagnosis': 'Depression'},
    {'id': 3, 'name': 'Bob Wilson', 'age': 26, 'diagnosis': 'PTSD'}
]

# Mock templates
MOCK_TEMPLATES = [
    {'id': 1, 'name': 'Initial Psychiatric Assessment', 'category': 'assessment'},
    {'id': 2, 'name': 'Progress Note', 'category': 'progress'},
    {'id': 3, 'name': 'Treatment Plan', 'category': 'treatment'},
    {'id': 4, 'name': 'Mental Status Exam', 'category': 'assessment'}
]

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'MeDocPro Backend',
        'version': '1.0.0'
    })

@app.route('/api/patients', methods=['GET'])
def get_patients():
    """Get all patients"""
    return jsonify({
        'success': True,
        'patients': MOCK_PATIENTS
    })

@app.route('/api/templates', methods=['GET'])  
def get_templates():
    """Get all templates"""
    return jsonify({
        'success': True,
        'templates': MOCK_TEMPLATES
    })

@app.route('/api/ai/status', methods=['GET'])
def ai_status():
    """FIXED AI Status endpoint that matches frontend expectations"""
    try:
        ollama_url = app.config.get('OLLAMA_URL', 'http://localhost:11434')
        configured_model = app.config.get('OLLAMA_MODEL', 'mistral')
        
        logger.info(f"Checking AI status - URL: {ollama_url}, Model: {configured_model}")
        
        # Check if Ollama is running
        try:
            response = requests.get(f'{ollama_url}/api/tags', timeout=5)
            response.raise_for_status()
            
            models_data = response.json()
            model_names = [model.get('name', '') for model in models_data.get('models', [])]
            
            # Clean model names (remove version tags for comparison)
            clean_models = [name.split(':')[0] for name in model_names]
            configured_model_base = configured_model.split(':')[0]
            model_exists = configured_model_base in clean_models
            
            # Prepare recommendations
            recommendations = []
            if model_exists:
                recommendations.append('AI service ready for medical documentation')
            else:
                recommendations.extend([
                    f'Install configured model: ollama pull {configured_model}',
                    f'Available models: {", ".join(model_names)}' if model_names else 'No models installed'
                ])
            
            # FIXED: Return the exact format frontend expects
            return jsonify({
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'ollama',                    # Frontend expects this
                'url': ollama_url,
                'configured_model': configured_model,   # Frontend expects this  
                'status': 'available',                  # Frontend expects this
                'available': True,                      # Frontend expects this (CRITICAL!)
                'models': model_names,                  # Frontend expects this
                'model_exists': model_exists,           # Frontend expects this (CRITICAL!)
                'recommendations': recommendations,     # Frontend expects this
                'test_generation': {                    # Frontend expects this
                    'success': True,
                    'note': 'Basic connectivity confirmed'
                }
            })
            
        except requests.exceptions.ConnectionError:
            # Ollama not running - return format frontend expects
            return jsonify({
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'ollama',
                'url': ollama_url,
                'configured_model': configured_model,
                'status': 'unavailable',
                'available': False,                     # CRITICAL: Frontend checks this
                'models': [],
                'model_exists': False,                  # CRITICAL: Frontend checks this
                'recommendations': [
                    'Start Ollama service: ollama serve',
                    'Verify Ollama is running on port 11434'
                ],
                'test_generation': {
                    'success': False,
                    'error': 'Ollama service not running'
                }
            })
            
    except Exception as e:
        logger.error(f"Error checking AI status: {str(e)}")
        return jsonify({
            'timestamp': datetime.utcnow().isoformat(),
            'service': 'ollama',
            'status': 'error',
            'available': False,                         # CRITICAL: Frontend checks this
            'error': str(e),
            'recommendations': ['Check backend logs for details']
        }), 500

if __name__ == '__main__':
    print("🚀 Starting MeDocPro Backend (Fixed Version)")
    print(f"🔗 Ollama URL: {app.config['OLLAMA_URL']}")
    print(f"🤖 Configured Model: {app.config['OLLAMA_MODEL']}")
    print("🌐 Server will start on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
'@

    $fixedApp | Out-File -FilePath "fixed_app.py" -Encoding UTF8
    Write-Host "✅ Created fixed_app.py" -ForegroundColor Green
    Write-Host "🚀 Start it with: python fixed_app.py" -ForegroundColor Cyan
    
} else {
    Write-Host "💡 To fix $runningFile, replace the ai_status function with the fixed version" -ForegroundColor Yellow
    Write-Host "🔧 Or run the new fixed_app.py instead" -ForegroundColor Cyan
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Stop your current Flask app (Ctrl+C)" -ForegroundColor White
Write-Host "2. Start the fixed version: python fixed_app.py" -ForegroundColor White  
Write-Host "3. Test in browser - AI status should now work!" -ForegroundColor White