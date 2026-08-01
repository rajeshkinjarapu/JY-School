@echo off
color 0A
echo.
echo ========================================================
echo RESTARTING BACKEND - PLEASE PASTE PASSWORD
echo ========================================================
echo.
echo PASSWORD: cJkg_-jnt-xoUxVB
echo (Right-click to paste, then press Enter)
echo.
ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "pm2 delete backend ; cd /root/JY-School/backend && npm install && npm run build && echo PORT=19998 > .env_temp && cat .env >> .env_temp && mv .env_temp .env && pm2 start dist/server.js --name backend && pm2 logs backend --lines 10 --nostream"
echo.
echo ========================================================
echo DONE! Check if backend says "online" above.
echo ========================================================
pause
