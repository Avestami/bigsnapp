export enum UserType {
  ADMIN = 'ADMIN',
  RIDER = 'RIDER',
  DRIVER = 'DRIVER',
}

export interface User {
  id: number;
  name: string;
  email: string;
  phoneNumber: string;
  userType: UserType;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  };
}