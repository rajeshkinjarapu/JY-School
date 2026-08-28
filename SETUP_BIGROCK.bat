@echo off
color 0B
echo ========================================================
echo BIGROCK VPS SETUP - JY-SCHOOL ERP
echo IP: 66.116.252.191 (Ubuntu 22)
echo ========================================================
echo You will be asked for your BigRock SSH Password multiple times.
echo (Right-click in terminal to paste the password)
echo.
pause

echo.
echo ========================================================
echo 1. INSTALLING NODE.JS, GIT, PM2 ^& CLONING REPO...
echo ========================================================
ssh root@66.116.252.191 "apt update -y && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt install -y git nodejs unzip && npm install -g pm2 && rm -rf /root/JY-School && git clone https://github.com/rajeshkinjarapu/JY-School.git /root/JY-School"

echo.
echo ========================================================
echo 2. UPLOADING LOCAL .ENV FILE TO SERVER...
echo ========================================================
scp backend\.env root@66.116.252.191:/root/JY-School/backend/.env

echo.
echo ========================================================
echo 3. BUILDING BACKEND ^& FRONTEND...
echo ========================================================
ssh root@66.116.252.191 "cd /root/JY-School/backend && rm -rf /root/.cache/puppeteer && npm install && sed -i 's/PORT=.*/PORT=19998/' .env && npm run build && pm2 start dist/server.js --name 'backend' && cd /root/JY-School/frontend && npm install && echo VITE_API_URL=http://66.116.252.191:19998 > .env && npm run build && pm2 serve dist 19999 --name 'frontend' --spa && pm2 save"

echo.
echo ========================================================
echo VPS SETUP SUCCESSFUL!
echo.
echo FRONTEND URL: http://66.116.252.191:19999
echo BACKEND URL:  http://66.116.252.191:19998
echo ========================================================
pause
