"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { isSessionValidAsync } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://credocarbon-api-641001192587.asia-south2.run.app';

export default function DeveloperLoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    });

    // Check if user is already logged in, redirect to dashboard
    useEffect(() => {
        const checkSession = async () => {
            const valid = await isSessionValidAsync();
            if (valid) {
                router.push("/dashboard/developer");
            } else {
                setIsCheckingSession(false);
            }
        };
        checkSession();
    }, [router]);

    // Force light mode on login page
    useEffect(() => {
        document.documentElement.classList.remove("dark");
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Calculate token expiry based on rememberMe
                const expiryDays = formData.rememberMe ? 30 : 1;
                const expiryDate = new Date();
                expiryDate.setDate(expiryDate.getDate() + expiryDays);

                localStorage.setItem("token", data.access_token);
                localStorage.setItem("refreshToken", data.refresh_token); // Store refresh token
                localStorage.setItem("tokenExpiry", expiryDate.toISOString());
                localStorage.setItem("user", JSON.stringify(data.user));
                localStorage.setItem("rememberMe", String(formData.rememberMe));
                router.push("/dashboard/developer");
            } else {
                setError(data.detail || "Invalid email or password");
            }
        } catch (err) {
            setError("Unable to connect to server. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    // Show loading while checking session
    if (isCheckingSession) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex">
            {/* Brand Panel - Left Side */}
            <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
                {/* Animated background */}
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-carbon-500/20 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-ocean-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
                </div>

                <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16">
                    {/* Logo */}
                    <Link href="/" className="flex items-center mb-12">
                        <Image src="/logo.png" alt="CredoCarbon" width={280} height={70} className="object-contain" priority />
                    </Link>

                    <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
                        Developer Portal
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-md">
                        Register and manage carbon projects across all major registries from a single unified interface.
                    </p>

                    {/* Features */}
                    <ul className="space-y-4">
                        {[
                            "End-to-end workflow: PDD → Validation → Issuance → Market",
                            "Supports Solar, Wind, A/R, REDD+, Biochar, DAC & more",
                            "Multi-registry compatible: GS, VCS, ACR, GCC, ART-TREES",
                        ].map((feature, index) => (
                            <li key={index} className="flex items-center gap-3 text-muted-foreground">
                                <div className="w-6 h-6 rounded-full bg-carbon-100 dark:bg-carbon-900/50 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-carbon-600" />
                                </div>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Login Form - Right Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md">
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <Link href="/" className="inline-flex items-center">
                            <Image src="/logo.png" alt="CredoCarbon" width={180} height={45} className="object-contain" priority />
                        </Link>
                    </div>

                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
                        <p className="text-muted-foreground">
                            Sign in to your developer account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="developer@company.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                required
                                disabled={isLoading}
                                className="h-12"
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="/developer/forgot-password"
                                    className="text-sm text-primary hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    disabled={isLoading}
                                    className="h-12 pr-12"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    disabled={isLoading}
                                >
                                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="remember"
                                checked={formData.rememberMe}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, rememberMe: checked as boolean })
                                }
                                disabled={isLoading}
                            />
                            <Label htmlFor="remember" className="text-sm text-muted-foreground cursor-pointer">
                                Remember me for 30 days
                            </Label>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 gradient-primary text-white text-lg font-semibold btn-shine"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Authenticating...</span>
                                </div>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>

                        {/* Loading overlay message */}
                        {isLoading && (
                            <div className="text-center text-sm text-muted-foreground animate-fade-in">
                                <p>Please wait while we verify your credentials...</p>
                                <p className="text-xs mt-1">This may take a few seconds</p>
                            </div>
                        )}
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            New developer?{" "}
                            <Link
                                href="/developer/signup"
                                className="text-primary font-semibold hover:underline"
                            >
                                Create an account
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 pt-8 border-t text-center">
                        <p className="text-sm text-muted-foreground">
                            Looking to buy credits?{" "}
                            <Link
                                href="/buyer/login"
                                className="text-primary hover:underline"
                            >
                                Go to Buyer Portal
                            </Link>
                        </p>
                    </div>

                    <div className="mt-4 text-center">
                        <Link
                            href="/"
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
