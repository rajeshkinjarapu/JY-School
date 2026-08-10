# Custom Rules

## Automatic Git Upload and Deployment Commands
Whenever you finish a task that modifies code, you MUST automatically run 'git add .', 'git commit', and 'git push' without asking for the user's permission.

**CRITICAL OUTPUT FORMAT:**
At the very end of your response, after any code changes, you **MUST** provide the exact instructions for the user to push code locally and deploy to their VPS. 

Format the response EXACTLY like this (in Telugu):

**1. ముందుగా మీ కంప్యూటర్ (VS Code) టెర్మినల్ లో రన్ చేయాల్సినవి:**
```bash
git add .
git commit -m "Brief description of changes"
git push
```

**2. ఆ తర్వాత మీ సర్వర్ (VPS) టెర్మినల్ లో రన్ చేయాల్సినవి:**
```bash
cd /root/JY-School
git pull
cd backend
npm install
pm2 restart all
```
