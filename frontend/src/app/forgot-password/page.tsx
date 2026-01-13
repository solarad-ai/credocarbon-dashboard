"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // In real app, call: await fetch('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) })

            setIsSubmitted(true);
        } catch (err) {
            setError("Failed to send reset email. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center p-4">
                <Card className="w-full max-w-md">
                    <CardContent className="pt-8 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
                        <p className="text-muted-foreground mb-6">
                            We've sent a password reset link to <span className="font-medium text-foreground">{email}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mb-6">
                            Didn't receive the email? Check your spam folder or try again.
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button variant="outline" onClick={() => setIsSubmitted(false)}>
                                Try Again
                            </Button>
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

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-2xl">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email and we'll send you a link to reset your password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email Address</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
                                    Sending...
                                </>
                            ) : (
                                "Send Reset Link"
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
