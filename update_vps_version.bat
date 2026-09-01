@echo off
color 0A
echo.
echo ========================================================
echo UPDATING APP VERSION ON VPS TO 1.0.2
echo ========================================================
echo.
echo PLEASE ENTER VPS PASSWORD IF PROMPTED...
echo.
ssh -o StrictHostKeyChecking=no root@66.116.252.191 "echo {\"latestVersion\": \"1.0.2\", \"downloadUrl\": \"http://66.116.252.191:19998/app-release.apk\", \"forceUpdate\": false, \"releaseNotes\": \"Progress card full address, dynamic PDF filenames and new app names updated.\"} > /root/JY-School/backend/public/app-version.json && echo App version updated successfully!"
echo.
echo ========================================================
echo DONE! The App Version has been updated to 1.0.2
echo ========================================================
pause
