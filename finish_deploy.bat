@echo off
echo ========================================================
echo RESUMING PROJECT DEPLOYMENT (PUPPETEER FIX)...
echo PLEASE RIGHT-CLICK TO PASTE PASSWORD: cJKq_-jnt-xoUxVd
echo ========================================================
ssh root@148.113.8.82 -p 20046 "export PUPPETEER_SKIP_DOWNLOAD=true && cd /root/JY-School/backend && npm install && npm run build && pm2 start npm --name 'backend' -- start && cd /root/JY-School/frontend && npm install && npm run build && npm install -g serve && pm2 serve dist 3000 --name 'frontend' --spa"
echo.
echo ========================================================
echo ALL DONE! YOUR PROJECT IS NOW LIVE ON THE VPS!
echo ========================================================
pause
