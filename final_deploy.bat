@echo off
echo ========================================================
echo CONNECTING FRONTEND (19999) AND BACKEND (19998)...
echo PLEASE RIGHT-CLICK TO PASTE PASSWORD: cJKq_-jnt-xoUxVd
echo ========================================================
ssh root@148.113.8.82 -p 20046 "cd /root/JY-School/backend && echo 'PORT=19998' >> .env && pm2 restart backend && cd /root/JY-School/frontend && echo 'VITE_API_URL=http://148.113.8.82:19998' > .env && npm run build && pm2 delete frontend ; pm2 serve dist 19999 --name 'frontend' --spa"
echo.
echo ========================================================
echo ALL DONE! OPEN YOUR BROWSER AND GO TO: http://148.113.8.82:19999
echo ========================================================
pause
