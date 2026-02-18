import { z } from "zod";

export const UserRoleEnum = {
  PHARMACY: "PHARMACY",
  DEPOT: "DEPOT",
  ADMIN: "ADMIN",
} as const;

export type UserRole = keyof typeof UserRoleEnum;

export const UserStatusEnum = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
} as const;

export type UserStatus = keyof typeof UserStatusEnum;

export const signupStep1Schema = z.object({
  businessName: z.string().min(3, "Business name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  role: z.enum(["PHARMACY", "DEPOT"], {
    message: "Role must be either PHARMACY or DEPOT",
  }),
});

export const signupStep2Schema = z.object({
  district: z.string().min(1, "District is required"),
  sector: z.string().min(1, "Sector is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const signupStep3Schema = z.object({
  licenseNumber: z.string().min(1, "License number is required"),
  licenseDocument: z
    .union([z.instanceof(File), z.null()])
    .refine(file => !file || file.size <= 5 * 1024 * 1024, "License document must be less than 5MB")
    .refine(file => !file || ["application/pdf", "image/jpeg", "image/png"].includes(file.type),
      "License document must be a PDF, JPG, or PNG"),
  rdbRegistration: z
    .union([z.instanceof(File), z.null()])
    .refine(file => !file || file.size <= 5 * 1024 * 1024, "RDB registration must be less than 5MB")
    .refine(file => !file || ["application/pdf", "image/jpeg", "image/png"].includes(file.type),
      "RDB registration must be a PDF, JPG, or PNG"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
      "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character"),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});
