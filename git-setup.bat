@echo off
REM git-setup.bat - Windows batch file for GitHub setup
cls

echo ===================================
echo Git Setup for Interactive Project Tool
echo ===================================
echo.

echo IMPORTANT: Make sure you have:
echo 1. Created a repository on GitHub
echo 2. Git installed on your system
echo.
pause

echo.
echo Enter your GitHub username:
set /p username=

echo.
echo Initializing Git repository...
git init

echo.
echo Adding all files...
git add .

echo.
echo Creating initial commit...
git commit -m "Initial commit: Interactive Project Export/Import Tool v1.2"

echo.
echo Adding GitHub remote...
git remote add origin https://github.com/%username%/interactive-project-tool.git

echo.
echo Setting main branch...
git branch -M main

echo.
echo Pushing to GitHub...
git push -u origin main

echo.
echo Creating .gitignore file...
(
echo node_modules/
echo *.log
echo .DS_Store
echo recovered/
echo export_*.txt
echo *.backup.js
echo .env
echo .idea/
echo .vscode/
echo *.swp
echo *.swo
echo *~
echo .npm
echo .yarn
echo dist/
echo build/
echo coverage/
echo .cache/
) > .gitignore

echo.
echo Creating LICENSE file...
(
echo MIT License
echo.
echo Copyright (c) 2024 %username%
echo.
echo Permission is hereby granted, free of charge, to any person obtaining a copy
echo of this software and associated documentation files (the "Software"^), to deal
echo in the Software without restriction, including without limitation the rights
echo to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
echo copies of the Software, and to permit persons to whom the Software is
echo furnished to do so, subject to the following conditions:
echo.
echo The above copyright notice and this permission notice shall be included in all
echo copies or substantial portions of the Software.
echo.
echo THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
echo IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
echo FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
echo AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
echo LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
echo OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
echo SOFTWARE.
) > LICENSE

echo.
echo Committing additional files...
git add .gitignore LICENSE
git commit -m "Add .gitignore and LICENSE"
git push

echo.
echo ===================================
echo Setup Complete!
echo ===================================
echo.
echo Your repository is available at:
echo https://github.com/%username%/interactive-project-tool
echo.
pause