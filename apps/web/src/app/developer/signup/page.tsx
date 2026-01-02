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
import { ALL_COUNTRIES, COUNTRY_PHONE_CODES } from "@/lib/constants";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://credocarbon-api-641001192587.asia-south2.run.app';

const developerTypes = [
    { value: "IPP", label: "Independent Power Producer (IPP)" },
    { value: "EPC", label: "EPC Contractor" },
    { value: "CORPORATE", label: "Corporate Developer" },
    { value: "SME", label: "SME / Startup" },
    { value: "GOVT", label: "Government Entity" },
    { value: "NGO", label: "NGO / Non-Profit" },
];



export default function DeveloperSignupPage() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        password: "",
        confirmPassword: "",
        phoneCode: "+91",
        phone: "",
        companyName: "",
        country: "",
        state: "",
        developerType: "",
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
            const response = await fetch(`${API_URL}/api/auth/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: formData.fullName,
                    email: formData.email,
                    password: formData.password,
                    role: "DEVELOPER",
                    company_name: formData.companyName,
                    country: formData.country,
                    state: formData.state || undefined,
                    developer_type: formData.developerType,
                    phone: `${formData.phoneCode} ${formData.phone}`,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.access_token);
                localStorage.setItem("user", JSON.stringify(data.user));
                router.push("/dashboard/developer");
            } else {
                setError(data.detail || "Registration failed. Please try again.");
            }
        } catch (err) {
            setError("Unable to connect to server. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const strength = passwordStrength();

    return (
        <div className="min-h-screen flex">
            {/* Brand Panel - Left Side */}
            <div className="hidden lg:flex lg:w-2/5 gradient-hero relative overflow-hidden">
                <div className="absolute inset-0">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-carbon-500/20 rounded-full blur-3xl animate-float" />
                    <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-ocean-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
                </div>

                <div className="relative z-10 flex flex-col justify-center p-12">
                    <Link href="/" className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                            <Leaf className="h-6 w-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold text-gradient">CredoCarbon</span>
                    </Link>

                    <h1 className="text-4xl font-bold mb-6 text-foreground">
                        Join as a Developer
                    </h1>
                    <p className="text-lg text-muted-foreground mb-8">
                        Start registering your carbon projects today and access buyers worldwide.
                    </p>

                    <ul className="space-y-4">
                        {[
                            "Free project registration",
                            "Automated PDD generation",
                            "Credit estimation engine",
                            "Direct market access",
                        ].map((feature, index) => (
                            <li key={index} className="flex items-center gap-3 text-muted-foreground">
                                <div className="w-6 h-6 rounded-full bg-carbon-500 flex items-center justify-center flex-shrink-0">
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
                    {/* Mobile Logo */}
                    <div className="lg:hidden mb-8 text-center">
                        <Link href="/" className="inline-flex items-center gap-2">
                            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                                <Leaf className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold text-gradient">CredoCarbon</span>
                        </Link>
                    </div>

                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-bold mb-2">Create Developer Account</h2>
                        <p className="text-muted-foreground">
                            Fill in your details to get started
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
                                    <div className="flex gap-2">
                                        <Select
                                            value={formData.phoneCode}
                                            onValueChange={(value) => setFormData({ ...formData, phoneCode: value })}
                                        >
                                            <SelectTrigger className="h-11 w-[110px]">
                                                <SelectValue placeholder="Code" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {COUNTRY_PHONE_CODES.map((item) => (
                                                    <SelectItem key={item.code} value={item.code}>
                                                        {item.flag} {item.code}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="98765 43210"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                            className="h-11 flex-1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Work Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="developer@company.com"
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
                                <Label htmlFor="companyName">Company Name *</Label>
                                <Input
                                    id="companyName"
                                    placeholder="Enter Company Name"
                                    value={formData.companyName}
                                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
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
                                    <Label htmlFor="state">State / Province</Label>
                                    <Input
                                        id="state"
                                        placeholder="Enter State/Province"
                                        value={formData.state}
                                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="developerType">Developer Type *</Label>
                                <Select
                                    value={formData.developerType}
                                    onValueChange={(value) => setFormData({ ...formData, developerType: value })}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {developerTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
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
                                    I want to receive product updates, news, and promotional emails
                                </Label>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 gradient-primary text-white text-lg font-semibold btn-shine"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Create Developer Account
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            Already have an account?{" "}
                            <Link
                                href="/developer/login"
                                className="text-primary font-semibold hover:underline"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
