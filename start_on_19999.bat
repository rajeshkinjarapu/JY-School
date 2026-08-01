@echo off
echo ========================================================
echo SWITCHING PROJECT TO YOUR OWN PORT (19999)...
echo PLEASE RIGHT-CLICK TO PASTE PASSWORD: cJKq_-jnt-xoUxVd
echo ========================================================
ssh root@148.113.8.82 -p 20046 "pm2 delete frontend ; pm2 serve /root/JY-School/frontend/dist 19999 --name 'frontend' --spa"
echo.
echo ========================================================
echo ALL DONE! OPEN YOUR BROWSER AND GO TO: http://148.113.8.82:19999
echo ========================================================
pause
