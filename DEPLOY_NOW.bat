@echo off
title JY School - VPS Deploy
color 0A
echo.
echo  =====================================================
echo   JY SCHOOL - VPS SERVER UPDATE
echo  =====================================================
echo.
echo  Step 1: Connecting to VPS Server...
echo  Step 2: Pulling latest code from GitHub...
echo  Step 3: Building and restarting...
echo.
echo  PASSWORD: cJkg_-jnt-xoUxVB
echo  (If asked for password, RIGHT-CLICK to paste, then ENTER)
echo.
echo  =====================================================
ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20048 "cd /root/JY-School && git pull origin main && cd backend && npm install && npm run build && cd ../frontend && npm install && npm run build && pm2 restart all"
echo.
if %errorlevel% == 0 (
    echo  =====================================================
    echo   SUCCESS! Website is LIVE at:
    echo   http://148.113.8.82:19999
    echo  =====================================================
) else (
    echo  =====================================================
    echo   ERROR! Could not connect to server.
    echo   Please check your internet connection.
    echo  =====================================================
)
echo.
pause
