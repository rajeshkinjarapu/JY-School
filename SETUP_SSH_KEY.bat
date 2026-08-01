@echo off
title SSH Key Setup - One Time Only
color 0A
echo.
echo  =====================================================
echo   SSH KEY SETUP - ఒక్కసారి మాత్రమే password enter చేయండి
echo   తర్వాత ఎప్పటికీ password అడగదు!
echo  =====================================================
echo.

REM Generate SSH key if it doesn't exist
if not exist "%USERPROFILE%\.ssh\id_rsa" (
    echo  Generating SSH Key...
    ssh-keygen -t rsa -b 4096 -f "%USERPROFILE%\.ssh\id_rsa" -N "" -q
    echo  SSH Key Created!
) else (
    echo  SSH Key already exists - OK
)

echo.
echo  =====================================================
echo  Now copying key to VPS - Enter password ONE LAST TIME:
echo  PASSWORD: cJkg_-jnt-xoUxVB
echo  (RIGHT-CLICK to paste, then ENTER)
echo  =====================================================
echo.

REM Copy public key to VPS
type "%USERPROFILE%\.ssh\id_rsa.pub" | ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys && chmod 700 ~/.ssh && echo KEY_ADDED_SUCCESSFULLY"

echo.
echo  =====================================================
echo  DONE! From now on, no password needed!
echo  Now fixing your website...
echo  =====================================================
echo.

REM Now fix the backend without password
ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "pm2 kill ; pm2 delete all ; sed -i 's/PORT=.*/PORT=19999/' /root/JY-School/backend/.env && cd /root/JY-School/backend && pm2 start dist/server.js --name backend && pm2 save && sleep 3 && curl -s http://localhost:19999/api/health && echo && echo Website is LIVE at: http://148.113.8.82:19999"

echo.
echo  =====================================================
echo  ALL DONE! Open: http://148.113.8.82:19999
echo  Next time: No password needed!
echo  =====================================================
pause
