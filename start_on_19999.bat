@echo off
echo ========================================================
echo SWITCHING PROJECT TO YOUR OWN PORT (19999)...
echo PLEASE RIGHT-CLICK TO PASTE PASSWORD: 6wfSXeFv6gi75yb7
echo ========================================================
ssh root@148.113.9.103 -p 20046 "sed -i 's/PORT=.*/PORT=19999/g' /root/JY-School/backend/.env && pm2 delete frontend ; pm2 restart backend"
echo.
echo ========================================================
echo ALL DONE! OPEN YOUR BROWSER AND GO TO: http://148.113.9.103:19999
echo ========================================================
pause
