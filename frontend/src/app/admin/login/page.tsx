"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserCog, Lock, Mail, Eye, EyeOff, AlertCircle, Home } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminApi } from "@/lib/api";

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await adminApi.login(email, password);
            router.push("/admin/dashboard");
        } catch (err: any) {
            setError(err.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-fuchsia-900/30 to-slate-900 flex items-center justify-center p-4">
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-fuchsia-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-1000"></div>
            </div>

            {/* Home Button */}
            <Link
                href="/"
                className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
                <Home className="h-5 w-5" />
                <span className="text-sm font-medium">Back to Home</span>
            </Link>

            <Card className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl border-slate-700/50 shadow-2xl relative z-10">
                <CardHeader className="text-center pb-6">
                    <div className="mx-auto w-16 h-16 bg-gradient-to-br from-fuchsia-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-fuchsia-500/30">
                        <UserCog className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Platform Admin</CardTitle>
                    <CardDescription className="text-slate-400">
                        Access to administration dashboard
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {/* Info Badge */}
                    <div className="flex items-center gap-2 p-3 bg-slate-800/50 rounded-lg mb-6 border border-slate-700/50">
                        <Lock className="h-4 w-4 text-fuchsia-400" />
                        <span className="text-xs text-slate-400">
                            Admin accounts are created by SuperAdmin
                        </span>
                    </div>

                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
                            <AlertCircle className="h-4 w-4 text-red-400" />
                            <span className="text-sm text-red-400">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-slate-300">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@credocarbon.com"
                                    required
                                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-fuchsia-500 focus:ring-fuchsia-500"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-slate-300">Password</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••••"
                                    required
                                    className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus:border-fuchsia-500 focus:ring-fuchsia-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-medium py-5 rounded-lg transition-all duration-300 shadow-lg shadow-fuchsia-500/20"
                        >
                            {loading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Authenticating...
                                </div>
                            ) : (
                                "Access Dashboard"
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
                        <p className="text-xs text-slate-500">
                            Platform administrators manage day-to-day operations.
                            <br />
                            Contact SuperAdmin if you need account access.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
