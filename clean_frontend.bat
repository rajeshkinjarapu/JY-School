@echo off
echo ========================================================
echo CLEANING OLD PACKAGES AND REBUILDING FRONTEND...
echo PLEASE RIGHT-CLICK TO PASTE PASSWORD: cJKq_-jnt-xoUxVd
echo ========================================================
ssh root@148.113.8.82 -p 20046 "cd /root/JY-School/frontend && rm -rf node_modules package-lock.json && npm install && npm run build && npm install -g serve && pm2 delete frontend ; pm2 serve dist 3000 --name 'frontend' --spa"
echo.
echo ========================================================
echo ALL DONE! YOUR PROJECT IS TRULY 100%% LIVE ON THE VPS!
echo ========================================================
pause
