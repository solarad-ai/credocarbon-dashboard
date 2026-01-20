"use client";

import { useEffect, useState } from "react";
import { User, Building2, Shield, Key, Save, Phone, Award, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { vvbApi } from "@/lib/api";

interface VVBProfile {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    name: string | null;
    organization: string | null;
    phone: string | null;
    accreditation_id: string | null;
    certifications: string[] | null;
    profile_photo: string | null;
}

export default function VVBProfilePage() {
    const [profile, setProfile] = useState<VVBProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [changingPassword, setChangingPassword] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [passwordSuccess, setPasswordSuccess] = useState("");

    // Form state
    const [name, setName] = useState("");
    const [organization, setOrganization] = useState("");
    const [phone, setPhone] = useState("");
    const [accreditationId, setAccreditationId] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await vvbApi.getProfile();
            setProfile(data);
            setName(data.name || "");
            setOrganization(data.organization || "");
            setPhone(data.phone || "");
            setAccreditationId(data.accreditation_id || "");
        } catch (err: any) {
            console.error("Failed to load profile:", err);
            setError("Failed to load profile. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setError("");
        setSuccess("");
        try {
            const updatedProfile = await vvbApi.updateProfile({
                name,
                organization,
                phone,
                accreditation_id: accreditationId,
            });
            setProfile(updatedProfile);
            setSuccess("Profile updated successfully!");

            // Update localStorage cache
            const userData = localStorage.getItem("user");
            if (userData) {
                const parsed = JSON.parse(userData);
                parsed.profile_data = {
                    ...parsed.profile_data,
                    name,
                    organization,
                    phone,
                    accreditation_id: accreditationId,
                };
                localStorage.setItem("user", JSON.stringify(parsed));
            }
        } catch (err: any) {
            setError(err.message || "Failed to save profile");
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordError("");
        setPasswordSuccess("");

        if (newPassword !== confirmPassword) {
            setPasswordError("Passwords do not match");
            return;
        }
        if (newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            return;
        }

        setChangingPassword(true);
        try {
            await vvbApi.changePassword({
                current_password: currentPassword,
                new_password: newPassword,
            });
            setPasswordSuccess("Password changed successfully!");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            setPasswordError(err.message || "Failed to change password");
        } finally {
            setChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
                    <p className="text-slate-500">Loading profile...</p>
                </div>
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
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center overflow-hidden">
                            {profile?.profile_photo ? (
                                <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-2xl font-bold text-white">
                                    {profile?.name?.charAt(0).toUpperCase() || "V"}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {profile?.name || "VVB User"}
                            </p>
                            <p className="text-sm text-slate-500">{profile?.email}</p>
                            <div className="flex gap-2 mt-1">
                                <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                    {profile?.role}
                                </Badge>
                                {profile?.is_verified && (
                                    <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                        ✓ Verified
                                    </Badge>
                                )}
                            </div>
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
                    {error && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600 dark:text-green-400">{success}</span>
                        </div>
                    )}

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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="organization" className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Organization
                            </Label>
                            <Input
                                id="organization"
                                value={organization}
                                onChange={(e) => setOrganization(e.target.value)}
                                placeholder="Enter your organization name"
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="phone" className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                Phone
                            </Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+1 234 567 8900"
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="accreditationId" className="flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            Accreditation ID
                        </Label>
                        <Input
                            id="accreditationId"
                            value={accreditationId}
                            onChange={(e) => setAccreditationId(e.target.value)}
                            placeholder="Enter your VVB accreditation ID"
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
                                <Loader2 className="h-4 w-4 animate-spin" />
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
                    {passwordError && (
                        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-600 dark:text-red-400">{passwordError}</span>
                        </div>
                    )}
                    {passwordSuccess && (
                        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600 dark:text-green-400">{passwordSuccess}</span>
                        </div>
                    )}

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
                        disabled={!currentPassword || !newPassword || !confirmPassword || changingPassword}
                    >
                        {changingPassword ? (
                            <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Updating...
                            </div>
                        ) : (
                            "Update Password"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
