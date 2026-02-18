import { NextRequest, NextResponse } from "next/server";
import { loginSchema, UserStatusEnum } from "@/lib/auth/schemas";
import { comparePassword, generateToken } from "@/lib/auth/utils";

// Simulated database
let users: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    const validation = loginSchema.safeParse({ email, password });
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
    const user = users.find(user => user.email === email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check user status
    if (user.status === UserStatusEnum.PENDING) {
      return NextResponse.json(
        { success: false, error: "Your account is under review" },
        { status: 403 }
      );
    }

    if (user.status === UserStatusEnum.REJECTED) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Your account has been rejected",
          reason: user.rejectionReason 
        },
        { status: 403 }
      );
    }

    if (user.status === UserStatusEnum.SUSPENDED) {
      return NextResponse.json(
        { success: false, error: "Your account has been suspended. Please contact support" },
        { status: 403 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    // Set token in HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          businessName: user.businessName,
          email: user.email,
          role: user.role,
          district: user.district,
          sector: user.sector,
        },
      },
    });

    response.cookies.set("umuti_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    response.cookies.set("umuti_role", user.role, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
