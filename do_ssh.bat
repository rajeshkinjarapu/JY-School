@echo off
set SSH_ASKPASS=c:\Users\Admin\Desktop\JY School\JY ERP\JY-School\askpass.bat
set DISPLAY=dummy:0
echo . | ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "echo VITE_API_URL=http://148.113.8.82:19998 > /root/JY-School/frontend/.env && cd /root/JY-School/frontend && npm run build && pm2 restart frontend"
