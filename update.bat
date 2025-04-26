@echo off
setlocal enabledelayedexpansion

echo ===== Electron App Update Script =====
echo Checking for updates...

REM Navigate to the project directory
cd /d %~dp0
REM If your project is in a different directory, specify the path here
REM cd /d C:\path\to\your\electron\project

REM Store the current commit hash in variable
for /f "delims=" %%i in ('git rev-parse HEAD') do set "CURRENT_COMMIT=%%i"

REM Fetch the latest changes from remote
git fetch origin master

REM Get the latest commit hash from master in variable
for /f "delims=" %%i in ('git rev-parse origin/master') do set "LATEST_COMMIT=%%i"

REM Compare current and latest commit hashes
if "!CURRENT_COMMIT!" NEQ "!LATEST_COMMIT!" (
    echo Updates found! Updating to latest version...
    
    REM Pull the latest changes
    git pull origin master
    
    REM Check if pull was successful
    if !ERRORLEVEL! NEQ 0 (
        echo Failed to pull latest changes. Please check your git repository.
        pause
        exit /b 1
    )
    
    echo Installing dependencies...
    call npm install
    
    if !ERRORLEVEL! NEQ 0 (
        echo Failed to install dependencies.
        pause
        exit /b 1
    )
    
    echo Building application...
    call npm run build:prod
    
    if !ERRORLEVEL! NEQ 0 (
        echo Failed to build the application.
        pause
        exit /b 1
    )
    
    echo Creating executable...
    call npm run make
    
    if !ERRORLEVEL! NEQ 0 (
        echo Failed to create the executable.
        pause
        exit /b 1
    )
    
    echo Update completed successfully!
    
    REM Find the installer in the out folder and run it
    echo Looking for installer...
    
    REM Adjust the path according to your Electron Forge configuration
    REM This example looks for a Windows .exe installer
    for /f "delims=" %%i in ('dir /b /s "out\make\*.exe" ^| findstr /i "setup"') do (
        echo Found installer: %%i
        echo Running installer...
        start "" "%%i"
        goto installer_found
    )
    
    echo No installer found in the out/make directory.
    goto end
    
    :installer_found
    echo Installation process started.
) else (
    echo No updates available. You have the latest version.
)

:end
echo ===== Update check completed =====
pause