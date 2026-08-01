@echo off
color 0B
echo ========================================================
echo UPLOADING THE FIXED FILE TO THE SERVER
echo ========================================================
echo.
echo Please PASTE the password when prompted for BOTH steps:
echo PASSWORD: cJkg_-jnt-xoUxVB
echo (Right-click to paste, then press Enter)
echo.
echo Step 1: Uploading the file...
scp -P 20046 -o StrictHostKeyChecking=no backend\src\controllers\attendance.controller.ts root@148.113.8.82:/root/JY-School/backend/src/controllers/attendance.controller.ts
echo.
echo Step 2: Compiling and Restarting Server...
ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "cd /root/JY-School/backend && npm run build && pm2 restart backend && pm2 logs backend --lines 10 --nostream"
echo.
echo ========================================================
echo ALL DONE! Check if it says "online" above.
echo ========================================================
pause
