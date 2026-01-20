"use client";

import { useEffect, useState, useRef } from "react";
import { User, Building2, Shield, Key, Save, Phone, Globe, Loader2, AlertCircle, CheckCircle, Camera, Upload, ZoomIn, ZoomOut, RotateCw, Check, X, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { registryApi } from "@/lib/api";
import { cn } from "@/lib/utils";

interface RegistryProfile {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    name: string | null;
    organization: string | null;
    phone: string | null;
    registry_name: string | null;
    jurisdiction: string | null;
    profile_photo: string | null;
}

// Available avatars
const avatars = [
    { id: 1, src: "/avatars/avatar-1.png", name: "Avatar 1" },
    { id: 2, src: "/avatars/avatar-2.png", name: "Avatar 2" },
    { id: 3, src: "/avatars/avatar-3.png", name: "Avatar 3" },
    { id: 4, src: "/avatars/avatar-4.png", name: "Avatar 4" },
];

export default function RegistryProfilePage() {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [profile, setProfile] = useState<RegistryProfile | null>(null);
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
    const [registryName, setRegistryName] = useState("");
    const [jurisdiction, setJurisdiction] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    // Photo upload states
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [showPhotoDialog, setShowPhotoDialog] = useState(false);
    const [tempPhoto, setTempPhoto] = useState<string | null>(null);
    const [photoScale, setPhotoScale] = useState(1);
    const [photoRotation, setPhotoRotation] = useState(0);
    const [photoDialogTab, setPhotoDialogTab] = useState<"upload" | "avatar">("upload");

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const data = await registryApi.getProfile();
            setProfile(data);
            setName(data.name || "");
            setOrganization(data.organization || "");
            setPhone(data.phone || "");
            setRegistryName(data.registry_name || "");
            setJurisdiction(data.jurisdiction || "");
            setProfilePhoto(data.profile_photo || null);
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
            const updatedProfile = await registryApi.updateProfile({
                name,
                organization,
                phone,
                registry_name: registryName,
                jurisdiction,
                profile_photo: profilePhoto || undefined,
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
                    registry_name: registryName,
                    jurisdiction,
                    profilePhoto: profilePhoto,
                };
                localStorage.setItem("user", JSON.stringify(parsed));
                window.dispatchEvent(new Event("profileUpdated"));
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
            await registryApi.changePassword({
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

    // Photo upload handlers
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("File size must be less than 2MB");
                return;
            }
            if (!file.type.startsWith("image/")) {
                alert("Please select an image file");
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                setTempPhoto(event.target?.result as string);
                setPhotoScale(1);
                setPhotoRotation(0);
            };
            reader.readAsDataURL(file);
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSavePhoto = async () => {
        if (!tempPhoto) {
            setShowPhotoDialog(false);
            return;
        }

        const isAvatar = tempPhoto.startsWith("/avatars/");

        if (isAvatar) {
            setProfilePhoto(tempPhoto);
        } else {
            // Apply transformations with canvas
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            img.onload = () => {
                const size = 200;
                canvas.width = size;
                canvas.height = size;

                if (ctx) {
                    ctx.clearRect(0, 0, size, size);
                    ctx.save();
                    ctx.translate(size / 2, size / 2);
                    ctx.rotate((photoRotation * Math.PI) / 180);

                    const scale = Math.max(size / img.width, size / img.height) * photoScale;
                    const scaledWidth = img.width * scale;
                    const scaledHeight = img.height * scale;

                    ctx.drawImage(
                        img,
                        -scaledWidth / 2,
                        -scaledHeight / 2,
                        scaledWidth,
                        scaledHeight
                    );
                    ctx.restore();

                    const finalImage = canvas.toDataURL("image/jpeg", 0.9);
                    setProfilePhoto(finalImage);
                }
            };
            img.src = tempPhoto;
        }

        setShowPhotoDialog(false);
        setTempPhoto(null);
    };

    const handleRemovePhoto = () => {
        setProfilePhoto(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                    <p className="text-slate-500">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-3xl">
            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileSelect}
                className="hidden"
            />

            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <User className="h-7 w-7 text-blue-500" />
                    Profile Settings
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Manage your Registry account information
                </p>
            </div>

            {/* Account Info with Photo */}
            <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        Account Information
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center gap-6">
                        {/* Photo with hover overlay */}
                        <div className="relative group">
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center overflow-hidden border-2 border-blue-500/20">
                                {profilePhoto ? (
                                    <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-2xl font-bold text-white">
                                        {profile?.name?.charAt(0).toUpperCase() || "R"}
                                    </span>
                                )}
                            </div>
                            <div
                                className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                                onClick={() => {
                                    setPhotoDialogTab("upload");
                                    setShowPhotoDialog(true);
                                }}
                            >
                                <Camera className="h-6 w-6 text-white" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="font-semibold text-slate-900 dark:text-white">
                                {profile?.name || "Registry Officer"}
                            </p>
                            <p className="text-sm text-slate-500">{profile?.email}</p>
                            <div className="flex gap-2">
                                <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                                    {profile?.role}
                                </Badge>
                                {profile?.is_verified && (
                                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                        ✓ Verified
                                    </Badge>
                                )}
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setPhotoDialogTab("upload");
                                        setTempPhoto(null);
                                        setShowPhotoDialog(true);
                                    }}
                                >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Upload Photo
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setPhotoDialogTab("avatar");
                                        setShowPhotoDialog(true);
                                    }}
                                >
                                    <User className="mr-2 h-4 w-4" />
                                    Choose Avatar
                                </Button>
                                {profilePhoto && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleRemovePhoto}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="registryName" className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Registry Name
                            </Label>
                            <Input
                                id="registryName"
                                value={registryName}
                                onChange={(e) => setRegistryName(e.target.value)}
                                placeholder="e.g., Gold Standard, Verra"
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label htmlFor="jurisdiction" className="flex items-center gap-2">
                                <Globe className="h-4 w-4" />
                                Jurisdiction
                            </Label>
                            <Input
                                id="jurisdiction"
                                value={jurisdiction}
                                onChange={(e) => setJurisdiction(e.target.value)}
                                placeholder="e.g., Global, EU, India"
                                className="mt-2"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-700"
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

            {/* Photo Upload Dialog */}
            <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Update Profile Photo</DialogTitle>
                    </DialogHeader>

                    <Tabs value={photoDialogTab} onValueChange={(v) => setPhotoDialogTab(v as any)}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="upload">Upload Photo</TabsTrigger>
                            <TabsTrigger value="avatar">Choose Avatar</TabsTrigger>
                        </TabsList>

                        <TabsContent value="upload" className="space-y-4">
                            {!tempPhoto ? (
                                <div
                                    className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Upload className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                                    <p className="text-sm text-slate-500">Click to upload a photo</p>
                                    <p className="text-xs text-slate-400 mt-1">JPG or PNG, max 2MB</p>
                                </div>
                            ) : (
                                <>
                                    {/* Preview */}
                                    <div className="flex justify-center">
                                        <div
                                            className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-500/30"
                                            style={{
                                                transform: `scale(${photoScale}) rotate(${photoRotation}deg)`,
                                            }}
                                        >
                                            <img
                                                src={tempPhoto}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm">Zoom</Label>
                                                <span className="text-sm text-slate-500">{(photoScale * 100).toFixed(0)}%</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <ZoomOut className="h-4 w-4 text-slate-400" />
                                                <Slider
                                                    value={[photoScale]}
                                                    min={0.5}
                                                    max={2}
                                                    step={0.1}
                                                    onValueChange={(value) => setPhotoScale(value[0])}
                                                    className="flex-1"
                                                />
                                                <ZoomIn className="h-4 w-4 text-slate-400" />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm">Rotate</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPhotoRotation((prev) => (prev - 90 + 360) % 360)}
                                                >
                                                    <RotateCw className="h-4 w-4 rotate-180" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setPhotoRotation((prev) => (prev + 90) % 360)}
                                                >
                                                    <RotateCw className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>

                                        <Button
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => fileInputRef.current?.click()}
                                        >
                                            <Upload className="mr-2 h-4 w-4" />
                                            Choose Different Photo
                                        </Button>
                                    </div>
                                </>
                            )}
                        </TabsContent>

                        <TabsContent value="avatar" className="space-y-4">
                            <p className="text-sm text-slate-500 text-center">
                                Select a professional avatar
                            </p>
                            <div className="grid grid-cols-4 gap-4">
                                {avatars.map((avatar) => (
                                    <button
                                        key={avatar.id}
                                        className={cn(
                                            "relative rounded-full overflow-hidden border-4 transition-all hover:scale-105",
                                            tempPhoto === avatar.src
                                                ? "border-blue-500 ring-2 ring-blue-500 ring-offset-2"
                                                : "border-transparent hover:border-blue-500/50"
                                        )}
                                        onClick={() => {
                                            setTempPhoto(avatar.src);
                                            setPhotoScale(1);
                                            setPhotoRotation(0);
                                        }}
                                    >
                                        <img
                                            src={avatar.src}
                                            alt={avatar.name}
                                            className="w-full aspect-square object-cover"
                                        />
                                        {tempPhoto === avatar.src && (
                                            <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                <Check className="h-6 w-6 text-blue-600" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowPhotoDialog(false);
                                setTempPhoto(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSavePhoto}
                            disabled={!tempPhoto}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Check className="mr-2 h-4 w-4" />
                            Save Photo
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
