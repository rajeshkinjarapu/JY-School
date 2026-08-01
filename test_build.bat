@echo off
color 0C
echo Checking why the backend is failing to build...
echo PASSWORD: cJkg_-jnt-xoUxVB
echo (Right-click to paste, then press Enter)
ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "cd /root/JY-School/backend && npm run build"
echo.
echo Press any key to continue so we can read the error message above...
pause
