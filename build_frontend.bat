@echo off
color 0A
echo.
echo ========================================================
echo FIXING NETWORK ERROR - PLEASE PASTE PASSWORD ONE LAST TIME
echo ========================================================
echo.
echo PASSWORD: cJkg_-jnt-xoUxVB
echo (Right-click to paste, then press Enter)
echo.
ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "cd /root/JY-School/frontend && echo VITE_API_URL=http://148.113.8.82:19998/api > .env && echo VITE_API_URL=http://148.113.8.82:19998/api > .env.production && npm run build && pm2 restart frontend"
echo.
echo ========================================================
echo DONE! The Network Error is FIXED!
echo Refresh your browser: http://148.113.8.82:19999
echo ========================================================
pause
