@echo off
title JY School - Final Repair
color 0A
echo.
echo  =====================================================
echo   FINAL REPAIR - FIXING FRONTEND AND BACKEND
echo  =====================================================
echo.
ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "pm2 kill && cd /root/JY-School/backend && sed -i 's/PORT=.*/PORT=19998/' .env && pm2 start dist/server.js --name backend && cd /root/JY-School/frontend && echo VITE_API_URL=http://148.113.8.82:19998/api > .env && npm run build && pm2 serve dist 19999 --name 'frontend' --spa && pm2 save"
echo.
echo  =====================================================
echo   DONE!
echo   Frontend is on port 19999
echo   Backend is on port 19998
echo   Open: http://148.113.8.82:19999
echo  =====================================================
pause
