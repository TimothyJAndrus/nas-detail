export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
  role: UserRole;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  communication: {
    reminders: boolean;
    promotions: boolean;
  };
}

export enum UserRole {
  CLIENT = 'client',
  ADMIN = 'admin',
  TECHNICIAN = 'technician'
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}