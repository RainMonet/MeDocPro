# Test MeDocPro Backend Connectivity
Write-Host "Testing MeDocPro Backend..." -ForegroundColor Green

# Test health endpoint
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
    Write-Host "✅ Health Check: $($health.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ Health Check Failed: $_" -ForegroundColor Red
}

# Test patients endpoint  
try {
    $patients = Invoke-RestMethod -Uri "http://localhost:5000/api/patients" -Method GET
    Write-Host "✅ Patients API: Found $($patients.patients.Count) patients" -ForegroundColor Green
} catch {
    Write-Host "❌ Patients API Failed: $_" -ForegroundColor Red
}

# Test templates endpoint
try {
    $templates = Invoke-RestMethod -Uri "http://localhost:5000/api/templates" -Method GET  
    Write-Host "✅ Templates API: Found $($templates.templates.Count) templates" -ForegroundColor Green
} catch {
    Write-Host "❌ Templates API Failed: $_" -ForegroundColor Red
}

# Test AI status endpoint
try {
    $aiStatus = Invoke-RestMethod -Uri "http://localhost:5000/api/documents/ai-status" -Method GET
    Write-Host "✅ AI Status: $($aiStatus.status)" -ForegroundColor Green
} catch {
    Write-Host "❌ AI Status Failed: $_" -ForegroundColor Red
}