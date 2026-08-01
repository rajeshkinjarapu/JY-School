@echo off
color 0A
echo.
echo ========================================================
echo FIXING THE BACKEND ERROR - ONE FINAL STEP
echo ========================================================
echo.
echo Step 1: Uploading the fix to Git...
git add .
git commit -m "Fix syntax error in attendance controller"
git push origin main
echo.
echo Step 2: Deploying to VPS...
echo.
echo PASSWORD: cJkg_-jnt-xoUxVB
echo (Right-click to paste, then press Enter)
echo.
ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "cd /root/JY-School && git pull origin main && pm2 delete backend ; cd /root/JY-School/backend && npm install && npm run build && echo PORT=19998 > .env_temp && cat .env >> .env_temp && mv .env_temp .env && pm2 start dist/server.js --name backend && pm2 save && pm2 logs backend --lines 10 --nostream"
echo.
echo ========================================================
echo DONE! Check if backend says "online" above.
echo ========================================================
pause
