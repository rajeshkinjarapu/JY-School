@echo off
title JY School - Fix Backend Port
color 0A
echo.
echo  =====================================================
echo   JY SCHOOL - FIXING BACKEND API CONNECTION
echo  =====================================================
echo.
echo  PASSWORD: cJkg_-jnt-xoUxVB
echo  (RIGHT-CLICK to paste password, then ENTER)
echo.
echo  =====================================================
ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "pm2 kill && sed -i 's/PORT=.*/PORT=19999/' /root/JY-School/backend/.env && cd /root/JY-School/backend && pm2 start dist/server.js --name backend && sleep 3 && pm2 list"
echo.
if %errorlevel% == 0 (
    echo  =====================================================
    echo   SUCCESS! Backend is running on port 19999
    echo   Open: http://148.113.8.82:19999
    echo  =====================================================
) else (
    echo  ERROR - Check connection
)
pause
