"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Lock, CheckCircle2, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");
    const [tokenValid, setTokenValid] = useState(true);

    useEffect(() => {
        // In real app, validate token with API
        if (!token) {
            setTokenValid(false);
        }
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters");
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // In real app: await fetch('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, password }) })

            setIsSubmitted(true);
        } catch (err) {
            setError("Failed to reset password. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (!tokenValid) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Invalid or Expired Link</h2>
                        <p className="text-muted-foreground mb-6">
                            This password reset link is invalid or has expired. Please request a new one.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Link href="/forgot-password">
                                <Button className="w-full gradient-primary text-white">
                                    Request New Link
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button variant="ghost" className="w-full">
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Back to Login
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Password Reset!</h2>
                        <p className="text-muted-foreground mb-6">
                            Your password has been successfully reset. You can now log in with your new password.
                        </p>
                        <Link href="/login">
                            <Button className="w-full gradient-primary text-white">
                                Go to Login
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Lock className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Reset Password</CardTitle>
                    <CardDescription>
                        Enter your new password below
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Must be at least 8 characters
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full gradient-primary text-white" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                "Reset Password"
                            )}
                        </Button>

                        <div className="text-center">
                            <Link href="/login" className="text-sm text-muted-foreground hover:text-primary">
                                <ArrowLeft className="inline-block mr-1 h-3 w-3" />
                                Back to Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
