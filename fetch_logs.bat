@echo off
ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "pm2 logs backend --lines 50 --nostream" > C:\Users\Admin\Desktop\JY_School_Backend_Logs.txt
