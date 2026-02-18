import { NextRequest, NextResponse } from "next/server";
import { forgotPasswordSchema } from "@/lib/auth/schemas";
import { generateResetToken } from "@/lib/auth/utils";

// Simulated database
let users: any[] = [];

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate input
    const validation = forgotPasswordSchema.safeParse({ email });
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
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Generate reset token
    const resetToken = generateResetToken(email);

    // Simulate sending password reset email
    console.log(`Password reset email sent to ${email} with token: ${resetToken}`);

    return NextResponse.json({
      success: true,
      message: "Password reset email sent",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Something went wrong" },
      { status: 500 }
    );
  }
}
