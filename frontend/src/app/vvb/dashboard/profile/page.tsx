"use client";

import { useEffect, useState } from "react";
import { User, Mail, Building2, Shield, Key, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface UserProfile {
    id: number;
    email: string;
    name: string;
    organization: string;
    role: string;
    is_verified: boolean;
    created_at: string;
}

export default function VVBProfilePage() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName] = useState("");
    const [organization, setOrganization] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        // Load profile from localStorage
        const userData = localStorage.getItem("user");
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                setProfile({
                    id: parsed.id,
                    email: parsed.email,
                    name: parsed.profile_data?.name || parsed.name || "",
                    organization: parsed.profile_data?.organization || "",
                    role: parsed.role,
                    is_verified: parsed.is_verified || true,
                    created_at: parsed.created_at || new Date().toISOString(),
                });
                setName(parsed.profile_data?.name || parsed.name || "");
                setOrganization(parsed.profile_data?.organization || "");
            } catch (err) {
                console.error("Failed to parse user data");
            }
        }
        setLoading(false);
    }, []);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            // Update localStorage
            const userData = localStorage.getItem("user");
            if (userData) {
                const parsed = JSON.parse(userData);
                parsed.profile_data = {
                    ...parsed.profile_data,
                    name,
                    organization,
                };
                parsed.name = name;
                localStorage.setItem("user", JSON.stringify(parsed));
                setProfile((prev) => prev ? { ...prev, name, organization } : null);
                alert("Profile updated successfully!");
            }
        } catch (err) {
            alert("Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (newPassword !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            alert("Password must be at least 8 characters");
            return;
        }
        alert("Password change functionality would require backend API integration");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <User className="h-7 w-7 text-emerald-500" />
                    Profile Settings
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Manage your VVB account information
                </p>
            </div>

            {/* Account Info */}
            <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-emerald-500" />
                        Account Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                                {profile?.name?.charAt(0).toUpperCase() || "V"}
                            </span>
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {profile?.name || "VVB User"}
                            </p>
                            <p className="text-sm text-slate-500">{profile?.email}</p>
                            <Badge className="mt-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                {profile?.role}
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Details */}
            <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg">Profile Details</CardTitle>
                    <CardDescription>Update your profile information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter your name"
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                value={profile?.email || ""}
                                disabled
                                className="mt-2 bg-slate-100 dark:bg-slate-800"
                            />
                        </div>
                    </div>
                    <div>
                        <Label htmlFor="organization">Organization</Label>
                        <Input
                            id="organization"
                            value={organization}
                            onChange={(e) => setOrganization(e.target.value)}
                            placeholder="Enter your organization name"
                            className="mt-2"
                        />
                    </div>
                    <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-emerald-600 hover:bg-emerald-700"
                    >
                        {saving ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Saving...
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Save className="h-4 w-4" />
                                Save Changes
                            </div>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Change Password */}
            <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Key className="h-5 w-5 text-amber-500" />
                        Change Password
                    </CardTitle>
                    <CardDescription>Update your password for security</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="mt-2"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="confirmPassword">Confirm Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleChangePassword}
                        disabled={!currentPassword || !newPassword || !confirmPassword}
                    >
                        Update Password
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
