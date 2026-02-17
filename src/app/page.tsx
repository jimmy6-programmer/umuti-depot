"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Pill, ArrowRight, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";

export default function Home() {
  const { isAuthenticated, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("depot@umuti.rw");
  const [password, setPassword] = useState("depot123");

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    if (success) {
      router.push("/dashboard");
    } else {
      toast.error("Invalid credentials");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Pill className="h-6 w-6" />
            </div>
          </div>
          <CardTitle className="text-2xl">Umuti Depot</CardTitle>
          <CardDescription>Sign in to your depot dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="depot@umuti.rw"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
            <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
              Sign In
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
              <ShieldCheck className="h-3 w-3" />
              <span>Secure access for verified depot operators</span>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
