@echo off
scp -P 20046 -o StrictHostKeyChecking=no backend\src\controllers\attendance.controller.ts root@148.113.8.82:/root/JY-School/backend/src/controllers/attendance.controller.ts
ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 "cd /root/JY-School/backend && npm run build && pm2 restart backend"
