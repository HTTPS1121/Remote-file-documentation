@echo off
echo Starting the application...

:: Start the backend
start cmd /k "cd backend && python app.py"

:: Wait for 3 seconds to let the backend initialize
timeout /t 3 /nobreak

:: Start the frontend
start cmd /k "cd frontend && npm start"

echo Application started successfully!
echo Backend running on http://localhost:5000
echo Frontend running on http://localhost:3000 