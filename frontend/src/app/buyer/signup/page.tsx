"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Leaf, Eye, EyeOff, ArrowRight, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_COUNTRIES } from "@/lib/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://credocarbon-api-641001192587.asia-south2.run.app';

const industrySectors = [
    { value: "ENERGY", label: "Energy & Utilities" },
    { value: "FMCG", label: "FMCG / Consumer Goods" },
    { value: "FINANCE", label: "Finance & Banking" },
    { value: "PHARMA", label: "Pharmaceutical & Healthcare" },
    { value: "LOGISTICS", label: "Logistics & Transportation" },
    { value: "MANUFACTURING", label: "Manufacturing" },
    { value: "TECH", label: "Technology & IT" },
    { value: "RETAIL", label: "Retail & E-commerce" },
    { value: "REAL_ESTATE", label: "Real Estate & Construction" },
    { value: "OTHER", label: "Other" },
];

const intendedUsage = [
    { value: "COMPLIANCE", label: "Compliance / Regulatory" },
    { value: "VOLUNTARY_ESG", label: "Voluntary ESG Offsetting" },
    { value: "CARBON_NEUTRAL", label: "Carbon Neutrality Goals" },
    { value: "INTERNAL", label: "Internal Trading / Portfolio" },
    { value: "INVESTMENT", label: "Investment / Trading" },
    { value: "CSR", label: "CSR / Community Initiatives" },
];



export default function BuyerSignupPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phone: "",
        organizationName: "",
        country: "",
        industrySector: "",
        intendedUsage: "",
        termsAccepted: false,
        marketingConsent: false,
    });

    // Password requirement checks
    const passwordChecks = {
        hasUppercase: /[A-Z]/.test(formData.password),
        hasLowercase: /[a-z]/.test(formData.password),
        hasNumber: /\d/.test(formData.password),
        hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(formData.password),
        hasMinLength: formData.password.length >= 8,
    };

    const passwordStrength = () => {
        const { password } = formData;
        if (password.length === 0) return { score: 0, label: "" };
        const checksPassed = Object.values(passwordChecks).filter(Boolean).length;
        if (checksPassed <= 2) return { score: 1, label: "Weak" };
        if (checksPassed === 3) return { score: 2, label: "Fair" };
        if (checksPassed === 4) return { score: 3, label: "Good" };
        return { score: 4, label: "Strong" };
    };

    const strength = passwordStrength();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (!formData.termsAccepted) {
            setError("You must accept the Terms of Service");
            setIsLoading(false);
            return;
        }

        try {
            const response = await fetch(`${API_URL}/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    role: "BUYER",
                    company_name: formData.organizationName,
                    country: formData.country,
                    industry_sector: formData.industrySector,
                    intended_usage: formData.intendedUsage,
                    phone: formData.phone,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("user", JSON.stringify(data.user));
                router.push("/dashboard/buyer");
            } else {
                setError(data.detail || "Registration failed. Please try again.");
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
            <div className="hidden lg:flex lg:w-2/5 relative overflow-hidden" style={{
                background: "linear-gradient(135deg, oklch(0.95 0.03 230) 0%, oklch(0.98 0.02 200) 50%, oklch(0.97 0.02 160) 100%)"
            }}>
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ocean-500/20 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-carbon-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
                </div>

                <div className="relative z-10 flex flex-col justify-center p-12">
                    <Link href="/" className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-600 flex items-center justify-center shadow-lg">
                            <Leaf className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gradient">CredoCarbon</span>
                    </Link>

                    <h1 className="text-4xl font-bold mb-6 text-foreground">
                        Join as a Buyer
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        Access verified carbon credits from projects worldwide to meet your sustainability goals.
                    </p>

                    <ul className="space-y-4">
                        {[
                            "Access to multi-registry marketplace",
                            "Transparent pricing & negotiations",
                            "ESG-compliant retirement certificates",
                            "Portfolio management & reporting",
                        ].map((feature, index) => (
                            <li key={index} className="flex items-center gap-3 text-muted-foreground">
                                <div className="w-6 h-6 rounded-full bg-ocean-500 flex items-center justify-center flex-shrink-0">
                                    <Check className="h-3 w-3 text-white" />
                                </div>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Signup Form - Right Side */}
            <div className="w-full lg:w-3/5 flex items-center justify-center p-8 bg-background overflow-y-auto">
                <div className="w-full max-w-xl">
                    <div className="lg:hidden mb-8 text-center">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean-500 to-ocean-600 flex items-center justify-center">
                                <Leaf className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gradient">CredoCarbon</span>
                        </Link>
                    </div>

                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-bold mb-2">Create Buyer Account</h2>
                        <p className="text-muted-foreground">
                            Fill in your details to access the marketplace
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
                                {error}
                            </div>
                        )}

                        {/* User Details Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground">User Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name *</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="John Doe"
                                        value={formData.fullName}
                                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                        required
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number *</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 123-4567"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        required
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Work Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="buyer@company.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    className="h-11"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password *</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            required
                                            className="h-11 pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {formData.password && (
                                        <div className="space-y-2 mt-2">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${strength.score === 1 ? "w-1/4 bg-red-500" :
                                                            strength.score === 2 ? "w-2/4 bg-yellow-500" :
                                                                strength.score === 3 ? "w-3/4 bg-blue-500" :
                                                                    strength.score === 4 ? "w-full bg-green-500" : "w-0"
                                                            }`}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground">{strength.label}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-1 text-xs">
                                                <span className={passwordChecks.hasUppercase ? "text-green-600" : "text-muted-foreground"}>
                                                    {passwordChecks.hasUppercase ? "✓" : "○"} Uppercase
                                                </span>
                                                <span className={passwordChecks.hasLowercase ? "text-green-600" : "text-muted-foreground"}>
                                                    {passwordChecks.hasLowercase ? "✓" : "○"} Lowercase
                                                </span>
                                                <span className={passwordChecks.hasNumber ? "text-green-600" : "text-muted-foreground"}>
                                                    {passwordChecks.hasNumber ? "✓" : "○"} Number
                                                </span>
                                                <span className={passwordChecks.hasSymbol ? "text-green-600" : "text-muted-foreground"}>
                                                    {passwordChecks.hasSymbol ? "✓" : "○"} Symbol
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password *</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        required
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Organization Details Section */}
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-semibold text-foreground">Organization Details</h3>

                            <div className="space-y-2">
                                <Label htmlFor="organizationName">Organization Name *</Label>
                                <Input
                                    id="organizationName"
                                    placeholder="Enter Organization Name"
                                    value={formData.organizationName}
                                    onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                                    required
                                    className="h-11"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country *</Label>
                                    <Select
                                        value={formData.country}
                                        onValueChange={(value) => setFormData({ ...formData, country: value })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select country" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ALL_COUNTRIES.map((country) => (
                                                <SelectItem key={country} value={country}>
                                                    {country}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="industrySector">Industry Sector *</Label>
                                    <Select
                                        value={formData.industrySector}
                                        onValueChange={(value) => setFormData({ ...formData, industrySector: value })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select industry" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {industrySectors.map((sector) => (
                                                <SelectItem key={sector.value} value={sector.value}>
                                                    {sector.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="intendedUsage">Intended Usage *</Label>
                                <Select
                                    value={formData.intendedUsage}
                                    onValueChange={(value) => setFormData({ ...formData, intendedUsage: value })}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="How will you use carbon credits?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {intendedUsage.map((usage) => (
                                            <SelectItem key={usage.value} value={usage.value}>
                                                {usage.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Consent Section */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="flex items-start space-x-3">
                                <Checkbox
                                    id="terms"
                                    checked={formData.termsAccepted}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, termsAccepted: checked as boolean })
                                    }
                                    className="mt-1"
                                />
                                <Label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                                    I agree to the{" "}
                                    <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                                    {" "}and{" "}
                                    <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
                                    {" "}*
                                </Label>
                            </div>

                            <div className="flex items-start space-x-3">
                                <Checkbox
                                    id="marketing"
                                    checked={formData.marketingConsent}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, marketingConsent: checked as boolean })
                                    }
                                    className="mt-1"
                                />
                                <Label htmlFor="marketing" className="text-sm text-muted-foreground cursor-pointer leading-relaxed">
                                    I want to receive market updates, new listings, and promotional emails
                                </Label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-gradient-to-r from-ocean-500 to-ocean-600 text-white text-lg font-semibold btn-shine hover:opacity-90"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Create Buyer Account
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            Already have an account?{" "}
                            <Link
                                href="/buyer/login"
                                className="text-primary font-semibold hover:underline"
                            >
                                Sign in
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
