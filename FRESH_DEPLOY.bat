@echo off
color 0E
echo ========================================================
echo FRESH DEPLOYMENT - RESETTING SERVER TO GITHUB STATE
echo ========================================================
echo.
echo Step 1: Uploading local code to GitHub...
git add .
git commit -m "Fresh deployment"
git push origin main
echo.
echo ========================================================
echo Step 2: Updating and Building Server
echo ========================================================
echo PASSWORD: cJkg_-jnt-xoUxVB
echo (Right-click to paste, then press Enter)
echo.
ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "cd /root/JY-School && git fetch origin main && git reset --hard origin/main && pm2 delete all ; cd backend && npm install && sed -i 's/PORT=.*/PORT=19998/' .env && npm run build && pm2 start dist/server.js --name backend && cd ../frontend && npm install && echo VITE_API_URL=http://148.113.8.82:19998/api > .env && npm run build && pm2 serve dist 19999 --name 'frontend' --spa && pm2 save && echo. && echo =============================== && echo FRESH DEPLOYMENT SUCCESSFUL! && echo ==============================="
echo.
pause
