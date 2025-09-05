# SnappClone Mobile App

React Native mobile application for the SnappClone ride-hailing and delivery service.

## Prerequisites

1. **Node.js** (16+) - Already installed ✓
2. **Java Development Kit (JDK)** - Version 11 or higher
   - Download: https://adoptopenjdk.net/
3. **Android Studio** - Already installed ✓
4. **Android Device** or Emulator with:
   - Developer mode enabled
   - USB debugging enabled

## Environment Setup

### 1. Install JDK
Download and install JDK 11 or 17 from the link above.

### 2. Set Environment Variables (Windows)
Add these to your system environment variables:
```
JAVA_HOME = C:\Program Files\Java\jdk-11.x.x
ANDROID_HOME = %LOCALAPPDATA%\Android\Sdk
```

Add to PATH:
```
%JAVA_HOME%\bin
%ANDROID_HOME%\platform-tools
%ANDROID_HOME%\tools
%ANDROID_HOME%\emulator
```

### 3. Configure API URL
Update `src/config/api.ts` with your computer's IP address:
```typescript
const LOCAL_IP = '10.208.159.195'; // Your PC's IP
```

## Running the App

### 1. Start the Backend First
In a separate terminal:
```bash
cd ../../backend
npm run dev
```

### 2. Connect Your Android Device
- Enable Developer Options
- Enable USB Debugging
- Connect via USB cable
- Accept the debugging prompt on your phone

### 3. Run the Mobile App
```bash
# Install dependencies (if not done)
npm install

# For Android
npx react-native run-android

# Or use the helper script
run-app.bat
```

## Troubleshooting

### "JAVA_HOME is not set"
- Install JDK 11 or higher
- Set JAVA_HOME environment variable
- Restart your terminal

### "No devices found"
- Check USB connection
- Ensure USB debugging is enabled
- Try `adb devices` to verify connection
- Try different USB cable/port

### "Metro bundler error"
- Clear cache: `npx react-native start --reset-cache`
- Delete node_modules and reinstall: `npm install`

### Build errors
```bash
# Clean build
cd android
./gradlew clean
cd ..
npx react-native run-android
```

## Project Structure
```
mobile/
├── android/          # Android native code
├── ios/             # iOS native code (not configured)
├── src/             # Source code
│   ├── components/  # Reusable components
│   ├── screens/     # Screen components
│   ├── navigation/  # Navigation setup
│   ├── services/    # API services
│   ├── store/       # Redux store
│   └── config/      # Configuration files
├── App.tsx          # Root component
└── index.js         # Entry point
```

## Features Implemented
- [x] Basic React Native setup
- [x] Navigation ready
- [x] API configuration
- [ ] Authentication screens
- [ ] Ride booking
- [ ] Real-time tracking
- [ ] Wallet management
- [ ] Driver mode

## Backend API
The app connects to the backend API at `http://<YOUR_IP>:3000/api`

Make sure the backend is running before starting the app. 