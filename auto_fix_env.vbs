Set WshShell = WScript.CreateObject("WScript.Shell")
WshShell.Run "cmd.exe /c ssh -o StrictHostKeyChecking=no root@148.113.8.82 -p 20046 ""echo VITE_API_URL=http://148.113.8.82:19998 > /root/JY-School/frontend/.env && cd /root/JY-School/frontend && npm run build && pm2 restart frontend""", 1, False
WScript.Sleep 2000
WshShell.SendKeys "cJkg_-jnt-xoUxVB{ENTER}"
