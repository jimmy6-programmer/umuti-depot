import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "./types";

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: Omit<JwtPayload, "iat" | "exp">): string => {
  const secret = process.env.JWT_SECRET || "umuti-secret-key";
  const expiresIn = process.env.JWT_EXPIRES_IN || "7d";
  
  return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
};

export const verifyToken = (token: string): JwtPayload => {
  const secret = process.env.JWT_SECRET || "umuti-secret-key";
  
  try {
    return jwt.verify(token, secret) as JwtPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
};

export const generateResetToken = (email: string): string => {
  return jwt.sign({ email }, process.env.JWT_SECRET || "umuti-secret-key", {
    expiresIn: "1h",
  });
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const formatPhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  const digits = phoneNumber.replace(/\D/g, "");
  
  // If starts with 0, replace with +250 for Rwandan numbers
  if (digits.startsWith("0")) {
    return "+250" + digits.slice(1);
  }
  
  return digits.startsWith("+") ? digits : "+" + digits;
};
