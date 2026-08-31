# JY School Mobile ERP - Multi-App Build & Deployment Guide

This guide contains complete documentation, build commands, and deployment instructions for the **JY School Mobile Applications (Student, Teacher, and Admin)**.

---

## 📱 Application Overview

| App Name | Target Users | Package ID | Entry Point | Primary Theme |
| :--- | :--- | :--- | :--- | :--- |
| **JY School - Student** | Students & Parents | `com.jyschool.erp.student` | `lib/main_student.dart` | Royal Indigo & Cyan |
| **JY School - Teacher** | Teachers & Staff | `com.jyschool.erp.teacher` | `lib/main_teacher.dart` | Emerald & Teal Green |
| **JY School - Admin** | Management & Principal | `com.jyschool.erp.admin` | `lib/main_admin.dart` | Slate Navy & Purple |
| **JY School ERP (Universal)** | All Roles (Default) | `com.jyschool.erp` | `lib/main.dart` | Indigo & Violet |

---

## 🛠️ Build Commands (Generate Release APKs)

Open your terminal in the **Local VS Code** and run the following commands:

### 🎓 1. Build Student & Parent APK
```powershell
cd "c:\Users\Admin\Desktop\JY School\JY ERP\JY-School\flutter_mobile"
flutter build apk --flavor student -t lib/main_student.dart --release
```
- **Output File:** `build/app/outputs/flutter-apk/app-student-release.apk`

---

### 👨‍🏫 2. Build Teacher APK
```powershell
cd "c:\Users\Admin\Desktop\JY School\JY ERP\JY-School\flutter_mobile"
flutter build apk --flavor teacher -t lib/main_teacher.dart --release
```
- **Output File:** `build/app/outputs/flutter-apk/app-teacher-release.apk`

---

### 🏛️ 3. Build Admin & Principal APK
```powershell
cd "c:\Users\Admin\Desktop\JY School\JY ERP\JY-School\flutter_mobile"
flutter build apk --flavor admin -t lib/main_admin.dart --release
```
- **Output File:** `build/app/outputs/flutter-apk/app-admin-release.apk`

---

### 🌐 4. Build Universal APK (All-in-One)
```powershell
cd "c:\Users\Admin\Desktop\JY School\JY ERP\JY-School\flutter_mobile"
flutter build apk --flavor universal -t lib/main.dart --release
```
- **Output File:** `build/app/outputs/flutter-apk/app-universal-release.apk`

---

## 🚀 Server Deployment & In-App Updates

### Step 1: Push Local Changes to GitHub
```powershell
cd "c:\Users\Admin\Desktop\JY School\JY ERP\JY-School"
git add .
git commit -m "feat: Multi-app flavors and app update system"
git push origin main
```

---

### Step 2: Upload APK to VPS Server
```powershell
cd "c:\Users\Admin\Desktop\JY School\JY ERP\JY-School\flutter_mobile"
scp "build\app\outputs\flutter-apk\app-release.apk" root@66.116.252.191:/root/JY-School/backend/public/app-release.apk
```

---

### Step 3: Rebuild Backend on VPS Server
```bash
# 1. Login to VPS
ssh root@66.116.252.191

# 2. Pull and rebuild backend
cd /root/JY-School/backend
git pull origin main
npx prisma generate
npx prisma generate --schema prisma/schema_local.prisma
npm run build
pm2 restart backend
```

---

## 🔄 App Update Configuration (`app-version.json`)
The update file is located at `backend/public/app-version.json`. When you release a new update, simply update the version number in this file:

```json
{
  "latestVersion": "1.0.1",
  "downloadUrl": "http://66.116.252.191:19998/app-release.apk",
  "forceUpdate": false,
  "releaseNotes": "Exams Hub added, app installation tracking enabled, and performance optimizations."
}
```
