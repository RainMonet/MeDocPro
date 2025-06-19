# Quick MeDocPro Backend Test
Write-Host "🔍 Testing MeDocPro Backend Connections..." -ForegroundColor Cyan

# Test 1: Check if Flask backend is running
Write-Host "`n1. Testing Flask Backend (localhost:5000)..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get -TimeoutSec 5
    Write-Host "✅ Flask backend is running" -ForegroundColor Green
    Write-Host "   Service: $($healthResponse.service)" -ForegroundColor White
    Write-Host "   Status: $($healthResponse.status)" -ForegroundColor White
} catch {
    Write-Host "❌ Flask backend not responding on localhost:5000" -ForegroundColor Red
    Write-Host "   Start it with: python app.py" -ForegroundColor Yellow
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Check AI status endpoint
Write-Host "`n2. Testing AI Status Endpoint..." -ForegroundColor Yellow
try {
    $aiResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/ai/status" -Method Get -TimeoutSec 10
    Write-Host "✅ AI status endpoint responding" -ForegroundColor Green
    Write-Host "   Status: $($aiResponse.status)" -ForegroundColor White
    Write-Host "   Available: $($aiResponse.available)" -ForegroundColor White
    Write-Host "   Model: $($aiResponse.configured_model)" -ForegroundColor White
    
    if ($aiResponse.recommendations) {
        Write-Host "   Recommendations:" -ForegroundColor Blue
        foreach ($rec in $aiResponse.recommendations) {
            Write-Host "     • $rec" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ AI status endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Check patients endpoint
Write-Host "`n3. Testing Patients Endpoint..." -ForegroundColor Yellow
try {
    $patientsResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/patients" -Method Get -TimeoutSec 5
    if ($patientsResponse.success) {
        Write-Host "✅ Patients endpoint working" -ForegroundColor Green
        Write-Host "   Found $($patientsResponse.patients.Count) patients" -ForegroundColor White
        foreach ($patient in $patientsResponse.patients) {
            Write-Host "   • $($patient.name) - $($patient.diagnosis)" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️  Patients endpoint returned error: $($patientsResponse.error)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Patients endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Check templates endpoint
Write-Host "`n4. Testing Templates Endpoint..." -ForegroundColor Yellow
try {
    $templatesResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/templates" -Method Get -TimeoutSec 5
    if ($templatesResponse.success) {
        Write-Host "✅ Templates endpoint working" -ForegroundColor Green
        Write-Host "   Found $($templatesResponse.templates.Count) templates" -ForegroundColor White
        foreach ($template in $templatesResponse.templates) {
            Write-Host "   • $($template.name)" -ForegroundColor White
        }
    } else {
        Write-Host "⚠️  Templates endpoint returned error: $($templatesResponse.error)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Templates endpoint failed" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Check Ollama directly
Write-Host "`n5. Testing Ollama Service..." -ForegroundColor Yellow
try {
    $ollamaResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 5
    Write-Host "✅ Ollama is running" -ForegroundColor Green
    if ($ollamaResponse.models) {
        Write-Host "   Available models:" -ForegroundColor White
        foreach ($model in $ollamaResponse.models) {
            Write-Host "   • $($model.name)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Ollama not responding on localhost:11434" -ForegroundColor Red
    Write-Host "   Start it with: ollama serve" -ForegroundColor Yellow
}

Write-Host "`n🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "1. If Flask backend isn't running: python app.py" -ForegroundColor White
Write-Host "2. If Ollama isn't running: ollama serve" -ForegroundColor White
Write-Host "3. Check that your .env file has correct Ollama settings" -ForegroundColor White