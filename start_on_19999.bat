@echo off
echo ========================================================
echo SWITCHING PROJECT TO YOUR OWN PORT (19999)...
echo PLEASE RIGHT-CLICK TO PASTE PASSWORD: c0kg_-)nt-xoUxV8
echo ========================================================
ssh root@148.113.8.82 -p 20048 "sed -i 's/PORT=.*/PORT=19999/g' /root/JY-School/backend/.env && pm2 delete frontend ; pm2 restart backend"
echo.
echo ========================================================
echo ALL DONE! OPEN YOUR BROWSER AND GO TO: http://148.113.8.82:19999
echo ========================================================
pause
