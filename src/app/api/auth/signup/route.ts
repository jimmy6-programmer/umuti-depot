import { NextRequest, NextResponse } from "next/server";
import { signupStep1Schema, signupStep2Schema, signupStep3Schema, UserStatusEnum } from "@/lib/auth/schemas";
import { hashPassword } from "@/lib/auth/utils";
import type { User } from "@/lib/auth/types";

// Simulated database
const users: User[] = [];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const step = parseInt(formData.get("step") as string) || 1;
    
    if (step === 1) {
      return handleStep1(formData);
    } else if (step === 2) {
      return handleStep2(formData);
    } else if (step === 3) {
      return handleStep3(formData);
    }
    
    return NextResponse.json(
      { success: false, error: "Invalid step" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}

async function handleStep1(formData: FormData) {
  const data = {
    businessName: formData.get("businessName") as string,
    email: formData.get("email") as string,
    phoneNumber: formData.get("phoneNumber") as string,
    role: formData.get("role") as string,
  };

  const validation = signupStep1Schema.safeParse(data);
  if (!validation.success) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Validation failed",
        details: validation.error.issues 
      },
      { status: 400 }
    );
  }

  // Check if user already exists
  const existingUser = users.find(user => user.email === data.email);
  if (existingUser) {
    return NextResponse.json(
      { success: false, error: "User with this email already exists" },
      { status: 400 }
    );
  }

  // Create user record with basic information
  const newUser: User = {
    id: `user-${Date.now()}`,
    businessName: data.businessName,
    email: data.email,
    phoneNumber: data.phoneNumber,
    role: data.role as User["role"], // Cast to UserRole type after validation
    password: null,
    district: null,
    sector: null,
    status: UserStatusEnum.PENDING,
    licenseNumber: null,
    licenseDocumentUrl: null,
    rdbRegistrationUrl: null,
    rejectionReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  users.push(newUser);

  return NextResponse.json({
    success: true,
    message: "Step 1 completed successfully",
    data: { userId: newUser.id },
  });
}

async function handleStep2(formData: FormData) {
  const userId = formData.get("userId") as string;
  const data = {
    district: formData.get("district") as string,
    sector: formData.get("sector") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const validation = signupStep2Schema.safeParse(data);
  if (!validation.success) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Validation failed",
        details: validation.error.issues 
      },
      { status: 400 }
    );
  }

  // Find user
  const userIndex = users.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Update user record
  users[userIndex] = {
    ...users[userIndex],
    district: data.district,
    sector: data.sector,
    password: hashedPassword,
    updatedAt: new Date(),
  };

  return NextResponse.json({
    success: true,
    message: "Step 2 completed successfully",
    data: { userId: userId },
  });
}

async function handleStep3(formData: FormData) {
  const userId = formData.get("userId") as string;
  const licenseNumber = formData.get("licenseNumber") as string;
  const licenseDocument = formData.get("licenseDocument") as File;
  const rdbRegistration = formData.get("rdbRegistration") as File;

  // Validate files
  const validation = signupStep3Schema.safeParse({
    licenseNumber,
    licenseDocument,
    rdbRegistration,
  });

  if (!validation.success) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Validation failed",
        details: validation.error.issues 
      },
      { status: 400 }
    );
  }

  // Find user
  const userIndex = users.findIndex(user => user.id === userId);
  if (userIndex === -1) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  // Simulate file upload
  const licenseDocumentUrl = `/uploads/${userId}/license.${licenseDocument?.name.split('.').pop()}`;
  const rdbRegistrationUrl = `/uploads/${userId}/rdb.${rdbRegistration?.name.split('.').pop()}`;

  // Update user record
  users[userIndex] = {
    ...users[userIndex],
    licenseNumber,
    licenseDocumentUrl: licenseDocument ? licenseDocumentUrl : null,
    rdbRegistrationUrl: rdbRegistration ? rdbRegistrationUrl : null,
    updatedAt: new Date(),
  };

  // Simulate sending verification email
  console.log(`Verification email sent to ${users[userIndex].email}`);

  return NextResponse.json({
    success: true,
    message: "Account created successfully! Your account is under review. You will be notified once approved.",
  });
}
