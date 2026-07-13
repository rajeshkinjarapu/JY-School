# ================================================================
# RAJ SOFTWARE — GitHub Deploy Script
# Git install అయిన తర్వాత ఈ commands run చేయండి
# ================================================================

# Step 1: Git Initialize
git init

# Step 2: Git config (మీ GitHub name & email పెట్టండి)
git config user.name "Your Name"
git config user.email "your@email.com"

# Step 3: Add all files
git add .

# Step 4: First commit
git commit -m "Initial commit - Raj Software School Management System"

# Step 5: GitHub remote add చేయండి
# (GitHub లో repo create చేసిన తర్వాత URL ఇక్కడ పెట్టండి)
git remote add origin https://github.com/YOURUSERNAME/raj-software.git

# Step 6: Push to GitHub
git branch -M main
git push -u origin main
