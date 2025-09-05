@echo off
echo Starting SnappClone React Native App...
echo.

REM Check if device is connected
adb devices > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: ADB is not available. Please ensure Android SDK is installed and in PATH.
    echo.
    pause
    exit /b 1
)

echo Checking connected devices...
adb devices

echo.
echo Starting Metro bundler and building app...
npx react-native run-android

pause 