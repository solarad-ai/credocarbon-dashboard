"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    ArrowLeft, User, Building2, Shield, Key, Bell, Save, Upload, Check,
    AlertCircle, ChevronDown, ChevronUp, Loader2, Eye, EyeOff, Camera, Trash2,
    ZoomIn, ZoomOut, RotateCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// Available avatars
const avatars = [
    { id: 1, src: "/avatars/avatar-1.png", name: "Avatar 1" },
    { id: 2, src: "/avatars/avatar-2.png", name: "Avatar 2" },
    { id: 3, src: "/avatars/avatar-3.png", name: "Avatar 3" },
    { id: 4, src: "/avatars/avatar-4.png", name: "Avatar 4" },
];

interface CollapsibleSectionProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    badge?: React.ReactNode;
}

function CollapsibleSection({ title, icon, children, defaultOpen = false, badge }: CollapsibleSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card>
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-ocean-100 flex items-center justify-center">
                        {icon}
                    </div>
                    <h3 className="font-semibold">{title}</h3>
                    {badge}
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
            {isOpen && (
                <CardContent className="border-t pt-6 animate-fade-in">
                    {children}
                </CardContent>
            )}
        </Card>
    );
}

function ProfileContent() {
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get("tab") || "profile";
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);

    // Photo dialog states
    const [showPhotoDialog, setShowPhotoDialog] = useState(false);
    const [tempPhoto, setTempPhoto] = useState<string | null>(null);
    const [photoScale, setPhotoScale] = useState(1);
    const [photoRotation, setPhotoRotation] = useState(0);
    const [photoDialogTab, setPhotoDialogTab] = useState<"upload" | "avatar">("upload");

    const [profileData, setProfileData] = useState({
        fullName: "",
        email: "",
        phone: "",
        organizationName: "",
        industrySector: "",
        intendedUsage: "",
        country: "",
        address: "",
        kycStatus: "PENDING",
        taxId: "",
        emailNotifications: true,
        lifecycleAlerts: true,
        marketAlerts: true,
        retirementsAlerts: true,
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Load user data from API
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                const response = await fetch("https://credocarbon-api-641001192587.asia-south2.run.app/api/auth/profile", {
                    headers: { "Authorization": `Bearer ${token}` },
                });

                if (response.ok) {
                    const user = await response.json();
                    const profile = user.profile_data || {};

                    localStorage.setItem("user", JSON.stringify(user));

                    setProfileData(prev => ({
                        ...prev,
                        fullName: profile.name || "",
                        email: user.email || "",
                        phone: profile.phone || "",
                        organizationName: profile.organizationName || profile.companyName || "",
                        industrySector: profile.industrySector || "",
                        intendedUsage: profile.intendedUsage || "",
                        country: profile.country || "",
                        address: profile.address || "",
                        kycStatus: user.is_verified ? "VERIFIED" : "PENDING",
                        taxId: profile.taxId || "",
                    }));

                    if (profile.profilePhoto) {
                        setProfilePhoto(profile.profilePhoto);
                    }
                }
            } catch (error) {
                console.error("Error loading user data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadUserData();
    }, []);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const token = localStorage.getItem("token");
            const response = await fetch("https://credocarbon-api-641001192587.asia-south2.run.app/api/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: profileData.fullName,
                    phone: profileData.phone,
                    organizationName: profileData.organizationName,
                    industrySector: profileData.industrySector,
                    intendedUsage: profileData.intendedUsage,
                    country: profileData.country,
                    address: profileData.address,
                    taxId: profileData.taxId,
                    marketAlerts: profileData.marketAlerts,
                    profilePhoto: profilePhoto,
                }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                localStorage.setItem("user", JSON.stringify(updatedUser));
                window.dispatchEvent(new Event("profileUpdated"));
            }
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setIsSaving(false);
        }
    };

    // Photo upload handler - opens dialog instead of saving immediately
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

    // Save photo with transformations
    const handleSavePhoto = async () => {
        if (!tempPhoto) {
            setShowPhotoDialog(false);
            return;
        }

        const isAvatar = tempPhoto.startsWith("/avatars/");
        let finalImage = tempPhoto;

        if (isAvatar) {
            setProfilePhoto(tempPhoto);
        } else {
            // Apply transformations with canvas
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            await new Promise<void>((resolve) => {
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

                        finalImage = canvas.toDataURL("image/jpeg", 0.9);
                        setProfilePhoto(finalImage);
                    }
                    resolve();
                };
                img.src = tempPhoto;
            });
        }

        // Save to backend
        const token = localStorage.getItem("token");
        try {
            const response = await fetch("https://credocarbon-api-641001192587.asia-south2.run.app/api/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ profilePhoto: finalImage }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                localStorage.setItem("user", JSON.stringify(updatedUser));
                window.dispatchEvent(new Event("profileUpdated"));
            }
        } catch (error) {
            console.error("Error saving photo:", error);
        }

        setShowPhotoDialog(false);
        setTempPhoto(null);
    };

    const handleRemovePhoto = async () => {
        setProfilePhoto(null);
        const token = localStorage.getItem("token");
        try {
            const response = await fetch("https://credocarbon-api-641001192587.asia-south2.run.app/api/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ profilePhoto: "" }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                localStorage.setItem("user", JSON.stringify(updatedUser));
                window.dispatchEvent(new Event("profileUpdated"));
            }
        } catch (error) {
            console.error("Error removing photo:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-ocean-500" />
            </div>
        );
    }

    const kycStatusConfig: Record<string, { color: string; label: string }> = {
        VERIFIED: { color: "bg-green-100 text-green-700", label: "Verified" },
        PENDING: { color: "bg-yellow-100 text-yellow-700", label: "Pending Review" },
        REJECTED: { color: "bg-red-100 text-red-700", label: "Rejected" },
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-card border-b ">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/buyer">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-ocean-100 flex items-center justify-center">
                                <User className="h-5 w-5 text-ocean-600" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-xl">Buyer Profile</h1>
                                <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
                            </div>
                        </div>
                    </div>
                    <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-ocean-500 to-ocean-600 text-white hover:opacity-90">
                        {isSaving ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Save className="mr-2 h-4 w-4" />
                        )}
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto space-y-6">
                    <Tabs defaultValue={defaultTab} className="space-y-6">
                        <TabsList className="w-full justify-start">
                            <TabsTrigger value="profile">Profile</TabsTrigger>
                            <TabsTrigger value="kyc">KYC & Compliance</TabsTrigger>
                            <TabsTrigger value="security">Security</TabsTrigger>
                            <TabsTrigger value="notifications">Notifications</TabsTrigger>
                        </TabsList>

                        {/* Profile Tab */}
                        <TabsContent value="profile" className="space-y-6">
                            <CollapsibleSection
                                title="Personal Details"
                                icon={<User className="h-5 w-5 text-ocean-600" />}
                                defaultOpen={true}
                            >
                                <div className="space-y-4">
                                    {/* Photo Upload Section */}
                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="relative group">
                                            <div className="w-24 h-24 rounded-full bg-ocean-100 flex items-center justify-center overflow-hidden border-2 border-ocean-200">
                                                {profilePhoto ? (
                                                    <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                                ) : (
                                                    <User className="h-12 w-12 text-ocean-600" />
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
                                            <div className="flex flex-wrap gap-2">
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
                                                        className="text-destructive hover:text-destructive"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                JPG, PNG. Max 2MB.
                                            </p>
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/jpg"
                                                onChange={handleFileSelect}
                                                className="hidden"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Full Name</Label>
                                            <Input
                                                value={profileData.fullName}
                                                onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Phone Number</Label>
                                            <Input
                                                value={profileData.phone}
                                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input value={profileData.email} disabled className="bg-muted" />
                                    </div>
                                </div>
                            </CollapsibleSection>

                            <CollapsibleSection
                                title="Organization"
                                icon={<Building2 className="h-5 w-5 text-ocean-600" />}
                                defaultOpen={true}
                            >
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Organization Name</Label>
                                        <Input
                                            value={profileData.organizationName}
                                            onChange={(e) => setProfileData({ ...profileData, organizationName: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Industry Sector</Label>
                                            <Select
                                                value={profileData.industrySector}
                                                onValueChange={(val) => setProfileData({ ...profileData, industrySector: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ENERGY">Energy & Utilities</SelectItem>
                                                    <SelectItem value="MANUFACTURING">Manufacturing</SelectItem>
                                                    <SelectItem value="FINANCE">Finance</SelectItem>
                                                    <SelectItem value="Other">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Intended Usage</Label>
                                            <Select
                                                value={profileData.intendedUsage}
                                                onValueChange={(val) => setProfileData({ ...profileData, intendedUsage: val })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="COMPLIANCE">Compliance</SelectItem>
                                                    <SelectItem value="VOLUNTARY_ESG">Voluntary ESG</SelectItem>
                                                    <SelectItem value="INVESTMENT">Investment</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </CollapsibleSection>
                        </TabsContent>

                        {/* KYC Tab */}
                        <TabsContent value="kyc" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>KYC Verification</CardTitle>
                                            <CardDescription>Required for trading access</CardDescription>
                                        </div>
                                        <Badge className={cn(kycStatusConfig[profileData.kycStatus]?.color || "bg-gray-100")}>
                                            {kycStatusConfig[profileData.kycStatus]?.label || "Unknown"}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="space-y-2">
                                        <Label>Tax ID / VAT Number</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={profileData.taxId}
                                                onChange={(e) => setProfileData({ ...profileData, taxId: e.target.value })}
                                            />
                                            {profileData.taxId && (
                                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                                    <Check className="h-5 w-5 text-green-600" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Security Tab */}
                        <TabsContent value="security" className="space-y-6">
                            <CollapsibleSection title="Password" icon={<Key className="h-5 w-5 text-ocean-600" />} defaultOpen>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>New Password</Label>
                                        <Input type="password" />
                                    </div>
                                    <Button className="bg-ocean-600 text-white">Update Password</Button>
                                </div>
                            </CollapsibleSection>
                        </TabsContent>

                        {/* Notifications Tab */}
                        <TabsContent value="notifications" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Notification Preferences</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <Label>Market Alerts</Label>
                                        <Switch
                                            checked={profileData.marketAlerts}
                                            onCheckedChange={(checked) => setProfileData({ ...profileData, marketAlerts: checked })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </main>

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
                                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-ocean-500 transition-colors"
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
                                            className="w-40 h-40 rounded-full overflow-hidden border-4 border-ocean-500/30"
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
                                                ? "border-ocean-500 ring-2 ring-ocean-500 ring-offset-2"
                                                : "border-transparent hover:border-ocean-500/50"
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
                                            <div className="absolute inset-0 bg-ocean-500/20 flex items-center justify-center">
                                                <Check className="h-6 w-6 text-ocean-600" />
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
                            className="bg-ocean-600 hover:bg-ocean-700"
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

export default function BuyerProfilePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProfileContent />
        </Suspense>
    );
}
