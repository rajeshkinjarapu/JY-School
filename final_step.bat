@echo off
echo ========================================================
echo INSTALLING CURL AND UPDATING NODE.JS TO VERSION 20...
echo PLEASE RIGHT-CLICK TO PASTE PASSWORD: cJKq_-jnt-xoUxVd
echo ========================================================
ssh root@148.113.8.82 -p 20046 "apt update && apt install -y curl && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs && cd /root/JY-School/frontend && npm run build && npm install -g serve && pm2 serve dist 3000 --name 'frontend' --spa"
echo.
echo ========================================================
echo ALL DONE! YOUR PROJECT IS 100%% LIVE ON THE VPS!
echo ========================================================
pause
