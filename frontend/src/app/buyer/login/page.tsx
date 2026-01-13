"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Eye, EyeOff, ArrowRight, Loader2, ShoppingCart, TrendingUp, Wallet, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://credocarbon-api-641001192587.asia-south2.run.app';

export default function BuyerLoginPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        rememberMe: false,
    });

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
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("user", JSON.stringify(data.user));
                router.push("/dashboard/buyer");
            } else {
                setError(data.detail || "Invalid email or password");
            }
        } catch (err) {
            setError("Unable to connect to server. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Brand Panel - Left Side */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{
                background: "linear-gradient(135deg, oklch(0.95 0.03 230) 0%, oklch(0.98 0.02 200) 50%, oklch(0.97 0.02 160) 100%)"
            }}>
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ocean-500/20 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-carbon-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
                </div>

                <div className="relative z-10 flex flex-col justify-center p-12 lg:p-16">
                    <Link href="/" className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-600 flex items-center justify-center shadow-lg">
                            <Leaf className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gradient">CredoCarbon</span>
                    </Link>

                    <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-foreground">
                        Buyer Portal
                    </h1>
                    <p className="text-xl text-muted-foreground mb-8 max-w-md">
                        Discover, purchase, manage, and retire carbon credits & RECs from verified global projects.
                    </p>

                    <ul className="space-y-4">
                        {[
                            { icon: ShoppingCart, text: "Browse marketplace with advanced filters" },
                            { icon: TrendingUp, text: "Negotiate offers directly with developers" },
                            { icon: Wallet, text: "Manage your credit wallet & portfolio" },
                            { icon: FileCheck, text: "Generate retirement certificates for ESG" },
                        ].map((feature, index) => (
                            <li key={index} className="flex items-center gap-3 text-muted-foreground">
                                <div className="w-8 h-8 rounded-lg bg-ocean-100 dark:bg-ocean-900/50 flex items-center justify-center flex-shrink-0">
                                    <feature.icon className="h-4 w-4 text-ocean-600" />
                                </div>
                                {feature.text}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Login Form - Right Side */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
                <div className="w-full max-w-md">
                    <div className="lg:hidden mb-8 text-center">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-600 flex items-center justify-center">
                                <Leaf className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gradient">CredoCarbon</span>
                        </Link>
                    </div>

                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-bold mb-2">Welcome back</h2>
                        <p className="text-muted-foreground">
                            Sign in to your buyer account
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
                                placeholder="buyer@company.com"
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
                                    href="/buyer/forgot-password"
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
                            className="w-full h-12 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white text-lg font-semibold btn-shine hover:opacity-90"
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
                            New buyer?{" "}
                            <Link
                                href="/buyer/signup"
                                className="text-primary font-semibold hover:underline"
                            >
                                Create an account
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8 pt-8 border-t text-center">
                        <p className="text-sm text-muted-foreground">
                            Looking to sell credits?{" "}
                            <Link
                                href="/developer/login"
                                className="text-primary hover:underline"
                            >
                                Go to Developer Portal
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
