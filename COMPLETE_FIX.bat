@echo off
title JY School - Complete Fix
color 0A
echo.
echo  =====================================================
echo   STEP 1: Kill all old processes
echo   STEP 2: Start ONLY backend on port 19999
echo  =====================================================
echo.
echo  PASSWORD: cJkg_-jnt-xoUxVB
echo  (RIGHT-CLICK to paste, then ENTER)
echo.
ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "pm2 kill && pm2 delete all ; sed -i 's/PORT=.*/PORT=19999/' /root/JY-School/backend/.env && cd /root/JY-School/backend && pm2 start dist/server.js --name backend && pm2 save && sleep 2 && pm2 list && echo TEST: && curl -s http://localhost:19999/api/health"
echo.
echo  =====================================================
echo   Done! Open: http://148.113.8.82:19999
echo  =====================================================
pause
