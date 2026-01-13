"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
    ArrowLeft, User, Building2, Shield, Key, Bell, Save, Upload, Check,
    AlertCircle, ChevronDown, ChevronUp, Loader2, Eye, EyeOff, RotateCw,
    ZoomIn, ZoomOut, X, Camera, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

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
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
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

    // Photo upload states
    const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
    const [showPhotoDialog, setShowPhotoDialog] = useState(false);
    const [tempPhoto, setTempPhoto] = useState<string | null>(null);
    const [photoScale, setPhotoScale] = useState(1);
    const [photoRotation, setPhotoRotation] = useState(0);
    const [photoPositionX, setPhotoPositionX] = useState(50); // 0-100, center is 50
    const [photoPositionY, setPhotoPositionY] = useState(50); // 0-100, center is 50
    const [photoDialogTab, setPhotoDialogTab] = useState<"upload" | "avatar">("upload");

    // Available avatars
    const avatars = [
        { id: 1, src: "/avatars/avatar-1.png", name: "Professional Blue" },
        { id: 2, src: "/avatars/avatar-2.png", name: "Professional Green" },
        { id: 3, src: "/avatars/avatar-3.png", name: "Professional Purple" },
        { id: 4, src: "/avatars/avatar-4.png", name: "Professional Orange" },
    ];

    const [profileData, setProfileData] = useState({
        // Personal Info
        fullName: "",
        email: "",
        phone: "",

        // Organization
        companyName: "",
        registrationNumber: "",
        country: "",
        state: "",
        address: "",
        developerType: "",

        // KYC
        kycStatus: "NOT_SUBMITTED",
        panNumber: "",
        gstNumber: "",

        // Notifications
        emailNotifications: true,
        smsNotifications: false,
        lifecycleAlerts: true,
        marketAlerts: true,
        documentReminders: true,
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Load user data from API on mount
    useEffect(() => {
        const loadUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                // Fetch fresh profile data from API
                const response = await fetch("https://credocarbon-api-641001192587.asia-south2.run.app/api/auth/profile", {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const user = await response.json();
                    const profile = user.profile_data || {};

                    // Update localStorage cache
                    localStorage.setItem("user", JSON.stringify(user));

                    setProfileData(prev => ({
                        ...prev,
                        // Personal Info
                        fullName: profile.name || profile.fullName || "",
                        email: user.email || "",
                        phone: profile.phone || "",

                        // Organization
                        companyName: profile.companyName || profile.company_name || "",
                        // Auto-generate registration number from user ID
                        registrationNumber: `CC-DEV-${String(user.id).padStart(6, '0')}`,
                        country: profile.country || "",
                        state: profile.state || "",
                        address: profile.address || "",
                        developerType: profile.developerType || profile.developer_type || "",

                        // KYC - these would typically come from a separate API call
                        kycStatus: profile.kycStatus || profile.kyc_status || "NOT_SUBMITTED",
                        panNumber: profile.panNumber || profile.pan_number || "",
                        gstNumber: profile.gstNumber || profile.gst_number || "",

                        // Notification preferences
                        emailNotifications: profile.emailNotifications ?? true,
                        smsNotifications: profile.smsNotifications ?? false,
                        lifecycleAlerts: profile.lifecycleAlerts ?? true,
                        marketAlerts: profile.marketAlerts ?? true,
                        documentReminders: profile.documentReminders ?? true,
                    }));

                    // Load profile photo
                    if (profile.profilePhoto) {
                        setProfilePhoto(profile.profilePhoto);
                    }
                } else {
                    console.error("Failed to fetch profile:", await response.text());
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

            // Save to backend API
            const response = await fetch("https://credocarbon-api-641001192587.asia-south2.run.app/api/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: profileData.fullName,
                    phone: profileData.phone,
                    companyName: profileData.companyName,
                    country: profileData.country,
                    state: profileData.state,
                    address: profileData.address,
                    developerType: profileData.developerType,
                    panNumber: profileData.panNumber,
                    gstNumber: profileData.gstNumber,
                    emailNotifications: profileData.emailNotifications,
                    smsNotifications: profileData.smsNotifications,
                    lifecycleAlerts: profileData.lifecycleAlerts,
                    marketAlerts: profileData.marketAlerts,
                    documentReminders: profileData.documentReminders,
                    profilePhoto: profilePhoto,
                }),
            });

            if (response.ok) {
                const updatedUser = await response.json();
                // Update localStorage cache with new data
                localStorage.setItem("user", JSON.stringify(updatedUser));
            } else {
                console.error("Failed to save profile:", await response.text());
            }
        } catch (error) {
            console.error("Error saving profile:", error);
        } finally {
            setIsSaving(false);
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
                setPhotoPositionX(50);
                setPhotoPositionY(50);
                setShowPhotoDialog(true);
            };
            reader.readAsDataURL(file);
        }
        // Reset input
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSavePhoto = async () => {
        if (!tempPhoto) {
            setShowPhotoDialog(false);
            return;
        }

        // Check if it's an avatar (starts with /avatars/)
        const isAvatar = tempPhoto.startsWith("/avatars/");

        if (isAvatar) {
            // For avatars, save the URL directly
            setProfilePhoto(tempPhoto);

            // Save to backend API
            const token = localStorage.getItem("token");
            try {
                const response = await fetch("https://credocarbon-api-641001192587.asia-south2.run.app/api/auth/profile", {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    },
                    body: JSON.stringify({ profilePhoto: tempPhoto }),
                });

                if (response.ok) {
                    const updatedUser = await response.json();
                    localStorage.setItem("user", JSON.stringify(updatedUser));
                    // Notify dashboard layout to update avatar
                    window.dispatchEvent(new Event("profileUpdated"));
                }
            } catch (error) {
                console.error("Error saving avatar:", error);
            }
        } else {
            // For uploaded photos, apply transformations with canvas
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            img.onload = async () => {
                // Set canvas size (200x200 circular avatar)
                const size = 200;
                canvas.width = size;
                canvas.height = size;

                if (ctx) {
                    // Clear and setup
                    ctx.clearRect(0, 0, size, size);
                    ctx.save();

                    // Move to center and apply rotation
                    ctx.translate(size / 2, size / 2);
                    ctx.rotate((photoRotation * Math.PI) / 180);

                    // Calculate scaling to cover the canvas
                    const scale = Math.max(size / img.width, size / img.height) * photoScale;
                    const scaledWidth = img.width * scale;
                    const scaledHeight = img.height * scale;

                    // Calculate position offset based on user's position settings
                    // photoPositionX/Y: 0-100, where 50 is center
                    const maxOffsetX = (scaledWidth - size) / 2;
                    const maxOffsetY = (scaledHeight - size) / 2;
                    const offsetX = ((photoPositionX - 50) / 50) * maxOffsetX;
                    const offsetY = ((photoPositionY - 50) / 50) * maxOffsetY;

                    // Draw image with position offset
                    ctx.drawImage(
                        img,
                        -scaledWidth / 2 - offsetX,
                        -scaledHeight / 2 - offsetY,
                        scaledWidth,
                        scaledHeight
                    );

                    ctx.restore();

                    // Get final image
                    const finalImage = canvas.toDataURL("image/jpeg", 0.9);
                    setProfilePhoto(finalImage);

                    // Save to backend API
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
                            // Notify dashboard layout to update avatar
                            window.dispatchEvent(new Event("profileUpdated"));
                        }
                    } catch (error) {
                        console.error("Error saving photo:", error);
                    }
                }
            };
            img.src = tempPhoto;
        }

        setShowPhotoDialog(false);
        setTempPhoto(null);
    };

    const handleRemovePhoto = async () => {
        setProfilePhoto(null);

        // Remove from backend
        const token = localStorage.getItem("token");
        try {
            const response = await fetch("https://credocarbon-api-641001192587.asia-south2.run.app/api/auth/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({ profilePhoto: "" }), // Empty string to clear
            });

            if (response.ok) {
                const updatedUser = await response.json();
                localStorage.setItem("user", JSON.stringify(updatedUser));
                // Notify dashboard layout to update avatar
                window.dispatchEvent(new Event("profileUpdated"));
            }
        } catch (error) {
            console.error("Error removing photo:", error);
        }
    };

    const kycStatusConfig: Record<string, { color: string; label: string }> = {
        VERIFIED: { color: "bg-green-100 text-green-700", label: "Verified" },
        PENDING: { color: "bg-yellow-100 text-yellow-700", label: "Pending Review" },
        REJECTED: { color: "bg-red-100 text-red-700", label: "Rejected" },
        NOT_SUBMITTED: { color: "bg-gray-100 text-gray-700", label: "Not Submitted" },
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <User className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile & KYC</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account settings</p>
                    </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-lg">
                    {isSaving ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSaving ? "Saving..." : "Save Changes"}
                </Button>
            </div>

            {/* Tab Navigation */}
            <Tabs defaultValue={defaultTab} className="space-y-6">
                <TabsList className="w-full justify-start">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="kyc">KYC Verification</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>


                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-6">
                    {/* Personal Information */}
                    <CollapsibleSection
                        title="Personal Information"
                        icon={<User className="h-5 w-5 text-primary" />}
                        defaultOpen={true}
                    >
                        <div className="space-y-4">
                            {/* Photo Upload Section */}
                            <div className="flex items-center gap-6 mb-6">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
                                        {profilePhoto ? (
                                            <img
                                                src={profilePhoto}
                                                alt="Profile"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <User className="h-12 w-12 text-primary" />
                                        )}
                                    </div>
                                    {/* Hover overlay for photo */}
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
                                            <>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setTempPhoto(profilePhoto);
                                                        setPhotoScale(1);
                                                        setPhotoRotation(0);
                                                        setPhotoPositionX(50);
                                                        setPhotoPositionY(50);
                                                        setPhotoDialogTab("upload");
                                                        setShowPhotoDialog(true);
                                                    }}
                                                >
                                                    <ZoomIn className="mr-2 h-4 w-4" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleRemovePhoto}
                                                    className="text-destructive hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground">
                                        Upload your own photo or choose from our avatars
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
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        value={profileData.fullName}
                                        onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        value={profileData.phone}
                                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={profileData.email}
                                    disabled
                                    className="h-11 bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Contact support to change your email address
                                </p>
                            </div>
                        </div>
                    </CollapsibleSection>

                    {/* Organization Details */}
                    <CollapsibleSection
                        title="Organization Details"
                        icon={<Building2 className="h-5 w-5 text-primary" />}
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="companyName">Company Name</Label>
                                    <Input
                                        id="companyName"
                                        value={profileData.companyName}
                                        onChange={(e) => setProfileData({ ...profileData, companyName: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="regNumber">Registration Number</Label>
                                    <Input
                                        id="regNumber"
                                        value={profileData.registrationNumber}
                                        disabled
                                        className="h-11 bg-muted font-mono"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Auto-assigned by system
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="country">Country</Label>
                                    <Select
                                        value={profileData.country}
                                        onValueChange={(value) => setProfileData({ ...profileData, country: value })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="India">India</SelectItem>
                                            <SelectItem value="United States">United States</SelectItem>
                                            <SelectItem value="Brazil">Brazil</SelectItem>
                                            <SelectItem value="Kenya">Kenya</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="state">State</Label>
                                    <Input
                                        id="state"
                                        value={profileData.state}
                                        onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                                        placeholder="e.g., Maharashtra"
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="developerType">Developer Type</Label>
                                <Select
                                    value={profileData.developerType}
                                    onValueChange={(value) => setProfileData({ ...profileData, developerType: value })}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="IPP">Independent Power Producer</SelectItem>
                                        <SelectItem value="EPC">EPC Contractor</SelectItem>
                                        <SelectItem value="CORPORATE">Corporate Developer</SelectItem>
                                        <SelectItem value="SME">SME / Startup</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="address">Registered Address</Label>
                                <Textarea
                                    id="address"
                                    value={profileData.address}
                                    onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                                    rows={3}
                                />
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
                                    <CardTitle>KYC Verification Status</CardTitle>
                                    <CardDescription>Complete KYC to enable marketplace transactions</CardDescription>
                                </div>
                                <Badge className={cn(kycStatusConfig[profileData.kycStatus].color)}>
                                    {kycStatusConfig[profileData.kycStatus].label}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Identity Documents */}
                            <div>
                                <h4 className="font-medium mb-4">Identity Documents</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="pan">PAN Number</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="pan"
                                                value={profileData.panNumber}
                                                onChange={(e) => setProfileData({ ...profileData, panNumber: e.target.value })}
                                                className="h-11"
                                            />
                                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-5 w-5 text-green-600" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="gst">GST Number</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="gst"
                                                value={profileData.gstNumber}
                                                onChange={(e) => setProfileData({ ...profileData, gstNumber: e.target.value })}
                                                className="h-11"
                                            />
                                            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                                                <Check className="h-5 w-5 text-green-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Documents Upload */}
                            <div>
                                <h4 className="font-medium mb-4">Required Documents</h4>
                                <div className="space-y-3">
                                    {[
                                        { name: "Company Registration Certificate", status: "verified" },
                                        { name: "Director ID Proof", status: "verified" },
                                        { name: "Address Proof", status: "verified" },
                                        { name: "Bank Account Statement", status: "pending" },
                                    ].map((doc, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 rounded-lg border">
                                            <div className="flex items-center gap-3">
                                                {doc.status === "verified" ? (
                                                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    </div>
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                                                    </div>
                                                )}
                                                <span className="font-medium">{doc.name}</span>
                                            </div>
                                            <Button variant="outline" size="sm">
                                                {doc.status === "verified" ? "View" : "Upload"}
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6">
                    <CollapsibleSection
                        title="Change Password"
                        icon={<Key className="h-5 w-5 text-primary" />}
                        defaultOpen={true}
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="currentPassword">Current Password</Label>
                                <div className="relative">
                                    <Input
                                        id="currentPassword"
                                        type={showCurrentPassword ? "text" : "password"}
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="h-11 pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                                    >
                                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="h-11 pr-12"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <Button className="gradient-primary text-white">Update Password</Button>
                        </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                        title="Two-Factor Authentication"
                        icon={<Shield className="h-5 w-5 text-primary" />}
                        badge={<Badge variant="outline" className="ml-2">Recommended</Badge>}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Enable 2FA</p>
                                <p className="text-sm text-muted-foreground">
                                    Add an extra layer of security to your account
                                </p>
                            </div>
                            <Switch />
                        </div>
                    </CollapsibleSection>

                    <Card className="border-destructive/50">
                        <CardHeader>
                            <CardTitle className="text-destructive">Danger Zone</CardTitle>
                            <CardDescription>Irreversible actions</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Delete Account</p>
                                    <p className="text-sm text-muted-foreground">
                                        Permanently delete your account and all data
                                    </p>
                                </div>
                                <Button variant="destructive">Delete Account</Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Choose how you want to receive updates</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Channels */}
                            <div>
                                <h4 className="font-medium mb-4">Notification Channels</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Email Notifications</p>
                                            <p className="text-sm text-muted-foreground">Receive updates via email</p>
                                        </div>
                                        <Switch
                                            checked={profileData.emailNotifications}
                                            onCheckedChange={(checked: boolean) => setProfileData({ ...profileData, emailNotifications: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">SMS Notifications</p>
                                            <p className="text-sm text-muted-foreground">Receive critical alerts via SMS</p>
                                        </div>
                                        <Switch
                                            checked={profileData.smsNotifications}
                                            onCheckedChange={(checked: boolean) => setProfileData({ ...profileData, smsNotifications: checked })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Alert Types */}
                            <div className="border-t pt-6">
                                <h4 className="font-medium mb-4">Alert Types</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Project Lifecycle Updates</p>
                                            <p className="text-sm text-muted-foreground">VVB requests, status changes, issuance</p>
                                        </div>
                                        <Switch
                                            checked={profileData.lifecycleAlerts}
                                            onCheckedChange={(checked: boolean) => setProfileData({ ...profileData, lifecycleAlerts: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Market Activity</p>
                                            <p className="text-sm text-muted-foreground">Offers, purchases, transfers</p>
                                        </div>
                                        <Switch
                                            checked={profileData.marketAlerts}
                                            onCheckedChange={(checked: boolean) => setProfileData({ ...profileData, marketAlerts: checked })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">Document Reminders</p>
                                            <p className="text-sm text-muted-foreground">Expiring documents, pending uploads</p>
                                        </div>
                                        <Switch
                                            checked={profileData.documentReminders}
                                            onCheckedChange={(checked: boolean) => setProfileData({ ...profileData, documentReminders: checked })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Photo Edit Dialog */}
            <Dialog open={showPhotoDialog} onOpenChange={setShowPhotoDialog}>
                <DialogContent className="sm:max-w-lg">

                    <DialogHeader>
                        <DialogTitle>Profile Photo</DialogTitle>
                    </DialogHeader>

                    {/* Tab Navigation */}
                    <div className="flex border-b mb-4">
                        <button
                            className={cn(
                                "flex-1 py-2 text-sm font-medium border-b-2 transition-colors",
                                photoDialogTab === "upload"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setPhotoDialogTab("upload")}
                        >
                            <Upload className="h-4 w-4 inline mr-2" />
                            Upload Photo
                        </button>
                        <button
                            className={cn(
                                "flex-1 py-2 text-sm font-medium border-b-2 transition-colors",
                                photoDialogTab === "avatar"
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setPhotoDialogTab("avatar")}
                        >
                            <User className="h-4 w-4 inline mr-2" />
                            Choose Avatar
                        </button>
                    </div>

                    {/* Upload Tab Content */}
                    {photoDialogTab === "upload" && (
                        <div className="space-y-4">
                            {/* Upload Area or Preview */}
                            <div className="flex justify-center">
                                {tempPhoto ? (
                                    <div className="w-48 h-48 rounded-full bg-muted overflow-hidden border-4 border-primary/20">
                                        <img
                                            src={tempPhoto}
                                            alt="Preview"
                                            className="w-full h-full"
                                            style={{
                                                objectFit: "cover",
                                                objectPosition: `${photoPositionX}% ${photoPositionY}%`,
                                                transform: `scale(${photoScale}) rotate(${photoRotation}deg)`,
                                                transition: "all 0.2s ease"
                                            }}
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className="w-48 h-48 rounded-full bg-muted border-4 border-dashed border-primary/30 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                        <span className="text-sm text-muted-foreground">Click to upload</span>
                                        <span className="text-xs text-muted-foreground">JPG, PNG (max 2MB)</span>
                                    </div>
                                )}
                            </div>

                            {tempPhoto && (
                                <>
                                    {/* Position Controls */}
                                    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                                        <Label className="text-sm font-medium">Position</Label>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-muted-foreground w-16">Horizontal</span>
                                                <Slider
                                                    value={[photoPositionX]}
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    onValueChange={(value) => setPhotoPositionX(value[0])}
                                                    className="flex-1"
                                                />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-muted-foreground w-16">Vertical</span>
                                                <Slider
                                                    value={[photoPositionY]}
                                                    min={0}
                                                    max={100}
                                                    step={1}
                                                    onValueChange={(value) => setPhotoPositionY(value[0])}
                                                    className="flex-1"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full text-xs"
                                            onClick={() => {
                                                setPhotoPositionX(50);
                                                setPhotoPositionY(50);
                                            }}
                                        >
                                            Center Image
                                        </Button>
                                    </div>

                                    {/* Zoom Control */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-sm font-medium">Zoom</Label>
                                            <span className="text-sm text-muted-foreground">{(photoScale * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <ZoomOut className="h-4 w-4 text-muted-foreground" />
                                            <Slider
                                                value={[photoScale]}
                                                min={0.5}
                                                max={2}
                                                step={0.1}
                                                onValueChange={(value) => setPhotoScale(value[0])}
                                                className="flex-1"
                                            />
                                            <ZoomIn className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                    </div>

                                    {/* Rotate Control */}
                                    <div className="flex items-center justify-between">
                                        <Label className="text-sm font-medium">Rotate</Label>
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

                                    {/* Change Photo Button */}
                                    <Button
                                        variant="outline"
                                        className="w-full"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <Upload className="mr-2 h-4 w-4" />
                                        Choose Different Photo
                                    </Button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Avatar Tab Content */}
                    {photoDialogTab === "avatar" && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground text-center">
                                Select a professional avatar for your profile
                            </p>
                            <div className="grid grid-cols-4 gap-4">
                                {avatars.map((avatar) => (
                                    <button
                                        key={avatar.id}
                                        className={cn(
                                            "relative rounded-full overflow-hidden border-4 transition-all hover:scale-105",
                                            tempPhoto === avatar.src
                                                ? "border-primary ring-2 ring-primary ring-offset-2"
                                                : "border-transparent hover:border-primary/50"
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
                                            <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                <Check className="h-6 w-6 text-primary" />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
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
                            className="gradient-primary text-white"
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

export default function ProfilePage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ProfileContent />
        </Suspense>
    );
}
