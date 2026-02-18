"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupStep1Schema, signupStep2Schema, signupStep3Schema } from "@/lib/auth/schemas";
import { SignupStep1Data, SignupStep2Data, SignupStep3Data } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileUpload } from "@/components/file-upload";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, isLoading } = useAuth();

  const step1Form = useForm<SignupStep1Data>({
    resolver: zodResolver(signupStep1Schema),
    defaultValues: {
      businessName: "",
      email: "",
      phoneNumber: "",
      role: "PHARMACY",
    },
  });

  const step2Form = useForm<SignupStep2Data>({
    resolver: zodResolver(signupStep2Schema),
    defaultValues: {
      district: "",
      sector: "",
      password: "",
      confirmPassword: "",
    },
  });

  const step3Form = useForm<SignupStep3Data>({
    resolver: zodResolver(signupStep3Schema),
    defaultValues: {
      licenseNumber: "",
      licenseDocument: null,
      rdbRegistration: null,
    },
  });

  const handleStep1Submit = async (data: SignupStep1Data) => {
    setIsSubmitting(true);

    try {
      const result = await signup(1, data);
      
      if (result.success) {
        setUserId(result.data?.userId || null);
        setStep(2);
        toast.success("Business information saved! Proceed to location and security.");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }

    setIsSubmitting(false);
  };

  const handleStep2Submit = async (data: SignupStep2Data) => {
    setIsSubmitting(true);

    try {
      const result = await signup(2, {
        userId,
        ...data,
      });

      if (result.success) {
        setStep(3);
        toast.success("Location and security information saved! Proceed to verification.");
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }

    setIsSubmitting(false);
  };

  const handleStep3Submit = async (data: SignupStep3Data) => {
    if (!userId) {
      toast.error("User information missing. Please start over.");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await signup(3, {
        userId,
        ...data,
      });

      if (result.success) {
        toast.success(result.message);
        setStep(4); // Show success screen
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }

    setIsSubmitting(false);
  };

  const handleGoBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  if (step === 4) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Account Created!</h2>
                <p className="text-gray-600 mt-2">
                  Your account is under review. You will be notified once approved.
                </p>
              </div>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700">
                <Link href="/">Go to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[600px] bg-gradient-to-br from-emerald-50 via-white to-emerald-50 p-4">
      <Card className="w-full max-w-md mx-4 shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>
            {step === 1 && "Enter your business information"}
            {step === 2 && "Provide location and security details"}
            {step === 3 && "Complete your verification"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className={`flex items-center space-x-2 ${step >= 1 ? "text-emerald-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                step >= 1 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"
              }`}>
                1
              </div>
              <span className="text-sm font-medium">Business</span>
            </div>
            <div className="h-1 flex-1 mx-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: step >= 2 ? "100%" : "0%" }}
              />
            </div>
            <div className={`flex items-center space-x-2 ${step >= 2 ? "text-emerald-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                step >= 2 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"
              }`}>
                2
              </div>
              <span className="text-sm font-medium">Location</span>
            </div>
            <div className="h-1 flex-1 mx-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-emerald-600 rounded-full transition-all duration-300"
                style={{ width: step >= 3 ? "100%" : "0%" }}
              />
            </div>
            <div className={`flex items-center space-x-2 ${step >= 3 ? "text-emerald-600" : "text-gray-400"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                step >= 3 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-600"
              }`}>
                3
              </div>
              <span className="text-sm font-medium">Verification</span>
            </div>
          </div>

          {step === 1 ? (
            <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input
                  id="businessName"
                  placeholder="Enter your business name"
                  {...step1Form.register("businessName")}
                />
                {step1Form.formState.errors.businessName && (
                  <p className="text-sm text-red-500">{step1Form.formState.errors.businessName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="business@example.com"
                  {...step1Form.register("email")}
                />
                {step1Form.formState.errors.email && (
                  <p className="text-sm text-red-500">{step1Form.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  placeholder="+250 788 123 456"
                  {...step1Form.register("phoneNumber")}
                />
                {step1Form.formState.errors.phoneNumber && (
                  <p className="text-sm text-red-500">{step1Form.formState.errors.phoneNumber.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Account Type</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      id="pharmacy"
                      value="PHARMACY"
                      {...step1Form.register("role")}
                      className="h-4 w-4 text-emerald-600"
                    />
                    <Label htmlFor="pharmacy" className="font-medium">Pharmacy</Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer">
                    <input
                      type="radio"
                      id="depot"
                      value="DEPOT"
                      {...step1Form.register("role")}
                      className="h-4 w-4 text-emerald-600"
                    />
                    <Label htmlFor="depot" className="font-medium">Depot</Label>
                  </div>
                </div>
                {step1Form.formState.errors.role && (
                  <p className="text-sm text-red-500">{step1Form.formState.errors.role.message}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isSubmitting || isLoading}
              >
                {isSubmitting || isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Next: Location & Security"
                )}
              </Button>
            </form>
          ) : step === 2 ? (
            <form onSubmit={step2Form.handleSubmit(handleStep2Submit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="district">District</Label>
                  <Select
                    onValueChange={(value) => step2Form.setValue("district", value)}
                    defaultValue={step2Form.getValues("district")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gasabo">Gasabo</SelectItem>
                      <SelectItem value="nyarugenge">Nyarugenge</SelectItem>
                      <SelectItem value="kicukiro">Kicukiro</SelectItem>
                      <SelectItem value="gatsibo">Gatsibo</SelectItem>
                      <SelectItem value="kayonza">Kayonza</SelectItem>
                      <SelectItem value="rwamagana">Rwamagana</SelectItem>
                      <SelectItem value="nyagatare">Nyagatare</SelectItem>
                      <SelectItem value="bugesera">Bugesera</SelectItem>
                      <SelectItem value="ngoma">Ngoma</SelectItem>
                      <SelectItem value="gakenke">Gakenke</SelectItem>
                      <SelectItem value="rusizi">Rusizi</SelectItem>
                      <SelectItem value="nyamasheke">Nyamasheke</SelectItem>
                    </SelectContent>
                  </Select>
                  {step2Form.formState.errors.district && (
                    <p className="text-sm text-red-500">{step2Form.formState.errors.district.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sector">Sector</Label>
                  <Input
                    id="sector"
                    placeholder="Enter sector"
                    {...step2Form.register("sector")}
                  />
                  {step2Form.formState.errors.sector && (
                    <p className="text-sm text-red-500">{step2Form.formState.errors.sector.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a password"
                  {...step2Form.register("password")}
                />
                {step2Form.formState.errors.password && (
                  <p className="text-sm text-red-500">{step2Form.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  {...step2Form.register("confirmPassword")}
                />
                {step2Form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500">{step2Form.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleGoBack}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Next: Verification"
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={step3Form.handleSubmit(handleStep3Submit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  placeholder="Enter your license number"
                  {...step3Form.register("licenseNumber")}
                />
                {step3Form.formState.errors.licenseNumber && (
                  <p className="text-sm text-red-500">{step3Form.formState.errors.licenseNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="licenseDocument">Government License</Label>
                <FileUpload
                  id="licenseDocument"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onFileSelect={(file) => step3Form.setValue("licenseDocument", file)}
                  error={step3Form.formState.errors.licenseDocument?.message}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rdbRegistration">RDB Registration</Label>
                <FileUpload
                  id="rdbRegistration"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onFileSelect={(file) => step3Form.setValue("rdbRegistration", file)}
                  error={step3Form.formState.errors.rdbRegistration?.message}
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handleGoBack}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting || isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Completing Registration...
                    </>
                  ) : (
                    "Complete Registration"
                  )}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
