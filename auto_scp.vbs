Set WshShell = WScript.CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c scp -P 20046 -o StrictHostKeyChecking=no backend\src\controllers\attendance.controller.ts root@148.113.8.82:/root/JY-School/backend/src/controllers/attendance.controller.ts", 1, False
WScript.Sleep 2000
WshShell.SendKeys "cJkg_-jnt-xoUxVB{ENTER}"
WScript.Sleep 3000
WshShell.Run "cmd.exe /c ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 ""cd /root/JY-School/backend && npm run build && pm2 restart backend""", 1, False
WScript.Sleep 2000
WshShell.SendKeys "cJkg_-jnt-xoUxVB{ENTER}"
