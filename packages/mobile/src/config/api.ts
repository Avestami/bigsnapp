// For Android emulator, use 10.0.2.2 to access localhost
// For physical device, use your computer's actual IP address
// const LOCAL_IP = '10.184.106.195'; // Current computer's IP address
const LOCAL_IP = '10.0.2.2'; // Use this for Android emulator
// const LOCAL_IP = 'localhost'; // Use this for iOS simulator only

declare const __DEV__: boolean;

export const API_BASE_URL = __DEV__ 
  ? `http://${LOCAL_IP}:3535/api/v1`
  : 'http://103.75.197.66/api/v1';

export const SOCKET_URL = __DEV__
  ? `http://${LOCAL_IP}:3535`
  : 'http://103.75.197.66';

export const API_TIMEOUT = 30000; // 30 seconds