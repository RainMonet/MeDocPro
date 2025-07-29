@echo off
echo Testing MeDocPro API Endpoints...
echo.

echo 1. Testing Health Endpoint...
curl -s http://localhost:5000/health
echo.
echo.

echo 2. Testing Daily Info Endpoint (POST)...
curl -s -X POST http://localhost:5000/api/daily-info ^
  -H "Content-Type: application/json" ^
  -H "Authorization: Bearer demo-token" ^
  -d "{\"patient_census_row_id\": 1, \"field_values\": {\"test\": \"data\"}}"
echo.
echo.

echo 3. Testing Daily Info Endpoint (GET)...
curl -s "http://localhost:5000/api/daily-info/1?date=2025-07-14" ^
  -H "Authorization: Bearer demo-token"
echo.
echo.

echo 4. Testing Templates Endpoint...
curl -s http://localhost:5000/api/templates
echo.

pause