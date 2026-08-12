@echo off
echo ========================================================
echo   UPDATING JY-SCHOOL PROJECT ON VPS SERVER
echo ========================================================
echo.
echo Please look at your new AIC Cloud dashboard.
echo The SSH port is now 20046.
echo.
echo PLEASE RIGHT-CLICK TO PASTE YOUR PASSWORD WHEN PROMPTED.
echo Password is: 6wfSXeFv6gi75yb7
echo (You will not see any dots when pasting, just press ENTER)
echo ========================================================
ssh root@148.113.9.103 -p 20046 "cd /root/JY-School && git pull origin main && cd backend && npm install && npx prisma db push && npm run build && cd ../frontend && npm install && npm run build && pm2 restart all"
echo.
echo ========================================================
echo ALL DONE! YOUR CHANGES ARE NOW LIVE ON THE VPS!
echo ========================================================
pause
