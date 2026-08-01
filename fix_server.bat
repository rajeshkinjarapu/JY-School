@echo off
echo ========================================================
echo SERVER REBUILD AND START
echo PLEASE RIGHT-CLICK TO PASTE PASSWORD: cJkg_-jnt-xoUxVB
echo ========================================================
ssh root@148.113.8.82 -p 20048 "pm2 kill && cd /root/JY-School/backend && npm install && npm run build && sed -i 's/PORT=.*/PORT=19999/g' .env && pm2 start npm --name 'backend' -- start && pm2 logs backend --nostream --lines 20"
echo.
echo ========================================================
echo ALL DONE! IF YOU SEE NO ERRORS, OPEN http://148.113.8.82:19999
echo ========================================================
pause
