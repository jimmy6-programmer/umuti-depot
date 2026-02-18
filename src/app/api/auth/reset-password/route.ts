import { NextRequest, NextResponse } from "next/server";
import { resetPasswordSchema } from "@/lib/auth/schemas";
import { hashPassword, verifyToken } from "@/lib/auth/utils";

// Simulated database
let users: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const { token, password, confirmPassword } = await request.json();

    // Validate input
    const validation = resetPasswordSchema.safeParse({
      token,
      password,
      confirmPassword,
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

    // Verify token
    let decodedToken;
    try {
      decodedToken = verifyToken(token);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Find user
    const user = users.find(user => user.email === decodedToken.email);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Hash new password
    const hashedPassword = await hashPassword(password);

    // Update user's password
    const userIndex = users.findIndex(u => u.email === decodedToken.email);
    users[userIndex] = {
      ...user,
      password: hashedPassword,
      updatedAt: new Date(),
    };

    return NextResponse.json({
      success: true,
      message: "Password reset successful. You can now login with your new password.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
