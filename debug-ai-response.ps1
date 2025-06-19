# Debug AI Status Response - MeDocPro
Write-Host "🔍 Debugging AI Status Response Format..." -ForegroundColor Cyan

# Test the AI status endpoint and show the exact response
Write-Host "`nTesting /api/ai/status endpoint..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/ai/status" -Method Get -TimeoutSec 10
    
    Write-Host "✅ Response received successfully!" -ForegroundColor Green
    Write-Host "`n📋 Full Response Structure:" -ForegroundColor Blue
    
    # Display the response in a readable format
    $response | ConvertTo-Json -Depth 5 | Write-Host
    
    Write-Host "`n🔍 Checking Frontend Expected Fields:" -ForegroundColor Yellow
    
    # Check for fields the frontend expects
    $expectedFields = @(
        'status',
        'available', 
        'service',
        'url',
        'configured_model',
        'models',
        'model_exists',
        'recommendations',
        'test_generation'
    )
    
    foreach ($field in $expectedFields) {
        if ($response.PSObject.Properties[$field]) {
            $value = $response.$field
            Write-Host "✅ $field : $value" -ForegroundColor Green
        } else {
            Write-Host "❌ $field : MISSING" -ForegroundColor Red
        }
    }
    
    Write-Host "`n🎯 Frontend Logic Check:" -ForegroundColor Cyan
    Write-Host "Available: $($response.available)" -ForegroundColor White
    Write-Host "Status: $($response.status)" -ForegroundColor White
    
    if ($response.available -eq $true -and $response.model_exists -eq $true) {
        Write-Host "✅ Should show: AI Ready" -ForegroundColor Green
    } elseif ($response.available -eq $true -and $response.model_exists -eq $false) {
        Write-Host "⚠️  Should show: Model not found" -ForegroundColor Yellow  
    } else {
        Write-Host "❌ Should show: AI service unavailable" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Error testing AI status endpoint" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "`n🔧 Quick Fix Commands:" -ForegroundColor Cyan
Write-Host "1. Check if Ollama is running: ollama serve" -ForegroundColor White
Write-Host "2. List available models: ollama list" -ForegroundColor White  
Write-Host "3. Pull a model: ollama pull mistral" -ForegroundColor White
Write-Host "4. Check backend logs for errors" -ForegroundColor White