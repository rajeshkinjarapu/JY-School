$wshell = New-Object -ComObject wscript.shell
Start-Process "cmd.exe" -ArgumentList "/c `"fix_server.bat`"" -WorkingDirectory "C:\Users\Admin\Desktop\JY School\JY ERP\JY-School"
Start-Sleep -Seconds 4
$wshell.SendKeys('c0kg_-{)}nt-xoUxV8')
$wshell.SendKeys('{ENTER}')
