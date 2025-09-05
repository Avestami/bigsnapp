import React from 'react';
import {
  StatusBar,
} from 'react-native';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import AppNavigator from './src/navigation/AppNavigator';

// StatusBar component that uses theme
const ThemedStatusBar = () => {
  const { isDark, theme } = useTheme();
  
  return (
    <StatusBar
      barStyle={isDark ? 'light-content' : 'dark-content'}
      backgroundColor={theme.themeColors.brand}
      translucent={false}
    />
  );
};

// Main app content wrapped with theme
const AppContent = () => {
  return (
    <>
      <ThemedStatusBar />
      <AppNavigator />
    </>
  );
};

function App(): React.JSX.Element {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;