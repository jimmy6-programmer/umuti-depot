export type UserRole = "PHARMACY" | "DEPOT" | "ADMIN";

export type UserStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";

export interface User {
  id: string;
  businessName: string;
  email: string;
  phoneNumber: string;
  role: UserRole;
  district: string | null;
  sector: string | null;
  licenseNumber: string | null;
  licenseDocumentUrl: string | null;
  rdbRegistrationUrl: string | null;
  status: UserStatus;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  password: string | null;
}

export type SignupStep1Data = {
  businessName: string;
  email: string;
  phoneNumber: string;
  role: "PHARMACY" | "DEPOT";
};

export type SignupStep2Data = {
  district: string;
  sector: string;
  password: string;
  confirmPassword: string;
};

export type SignupStep3Data = {
  licenseNumber: string;
  licenseDocument: File | null;
  rdbRegistration: File | null;
};

export interface LoginData {
  email: string;
  password: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  iat: number;
  exp: number;
}
