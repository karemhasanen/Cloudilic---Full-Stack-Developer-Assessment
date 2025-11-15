@echo off
cd /d "F:\projects\Cloudilic – Full‑Stack Developer Assessment"

echo Initializing Git repository...
git init

echo Adding all files...
git add .

echo Committing changes...
git commit -m "Initial commit: Cloudilic Workflow Builder"

echo Adding GitHub remote...
git remote add origin https://github.com/karemhasanen/Cloudilic-Full-Stack-Developer-Assessment.git

echo Setting branch to main...
git branch -M main

echo Pushing to GitHub...
git push -u origin main

echo Done! Your project has been uploaded to GitHub.
pause

