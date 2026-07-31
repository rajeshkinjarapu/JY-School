@echo off
echo ===================================================
echo   Uploading JY-School Project to VPS
echo ===================================================
echo.
echo Step 1: Packing the project (excluding heavy folders like node_modules)...
tar.exe -czf project_upload.tar.gz --exclude=node_modules --exclude=.git --exclude=dist --exclude=build --exclude=project_upload.tar.gz .

echo.
echo Step 2: Uploading the packed file to your server...
echo ---------------------------------------------------
echo ** WHEN PROMPTED, ENTER YOUR PASSWORD: N6gV1HVXyEYN8p0I **
echo ---------------------------------------------------
scp -P 20046 project_upload.tar.gz root@148.113.8.82:/root/project_upload.tar.gz

echo.
echo Step 3: Extracting the files on your VPS server...
echo ---------------------------------------------------
echo ** WHEN PROMPTED AGAIN, ENTER YOUR PASSWORD: N6gV1HVXyEYN8p0I **
echo ---------------------------------------------------
ssh -p 20046 root@148.113.8.82 "mkdir -p /root/JY-School && tar -xzf /root/project_upload.tar.gz -C /root/JY-School && rm /root/project_upload.tar.gz"

echo.
echo Cleaning up local files...
del project_upload.tar.gz

echo.
echo ===================================================
echo   SUCCESS! Project uploaded to /root/JY-School 
echo ===================================================
pause
