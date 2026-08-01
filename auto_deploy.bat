@echo off
echo ========================================================
echo 1. DOWNLOADING PROJECT TO SERVER...
echo PLEASE RIGHT-CLICK TO PASTE THIS PASSWORD: c0kg_-)nt-xoUxV8
echo ========================================================
ssh root@148.113.8.82 -p 20048 "apt update && apt install git nodejs npm -y && npm install -g pm2 && git clone https://github.com/rajeshkinjarapu/JY-School.git"
echo.
echo ========================================================
echo 2. UPLOADING .ENV FILE TO SERVER...
echo PLEASE RIGHT-CLICK TO PASTE PASSWORD AGAIN: c0kg_-)nt-xoUxV8
echo ========================================================
scp -P 20048 backend\.env root@148.113.8.82:/root/JY-School/backend/.env
echo.
echo ========================================================
echo 3. INSTALLING AND STARTING PROJECT (FINAL STEP)...
echo PLEASE RIGHT-CLICK TO PASTE PASSWORD AGAIN: c0kg_-)nt-xoUxV8
echo ========================================================
ssh root@148.113.8.82 -p 20048 "cd /root/JY-School/backend && npm install && npm run build && pm2 start npm --name 'backend' -- start && cd /root/JY-School/frontend && npm install && npm run build && npm install -g serve && pm2 serve dist 3000 --name 'frontend' --spa"
echo.
echo ========================================================
echo ALL DONE! YOUR PROJECT IS NOW LIVE ON THE VPS!
echo ========================================================
pause
