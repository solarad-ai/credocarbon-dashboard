"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
    ArrowLeft, ArrowRight, Save, Check, ChevronDown, ChevronUp,
    MapPin, Building2, FileText, Upload, Globe, Zap, Calendar, Loader2, ShieldCheck, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { ALL_COUNTRIES, COUNTRY_STATES, REGISTRATION_TYPES, SOLAR_MODULE_TYPES, COUNTRY_PHONE_CODES } from "@/lib/constants";
import { projectApi } from "@/lib/api";

const wizardSteps = [
    { id: 1, name: "Basic Info", active: true },
    { id: 2, name: "Generation Data", active: false },
    { id: 3, name: "Stakeholders", active: false },
    { id: 4, name: "Compliance", active: false },
    { id: 5, name: "Registry Package", active: false },
    { id: 6, name: "Review & Submit", active: false },
];

const ownerTypes = [
    { value: "IPP", label: "Independent Power Producer (IPP)" },
    { value: "EPC", label: "EPC Contractor" },
    { value: "CORPORATE", label: "Corporate Developer" },
    { value: "SME", label: "SME / Startup" },
    { value: "GOVT", label: "Government Entity" },
    { value: "NGO", label: "NGO / Non-Profit" },
];

const offtakeTypes = [
    { value: "PPA", label: "Power Purchase Agreement (PPA)" },
    { value: "CAPTIVE", label: "Captive Consumption" },
    { value: "OPEN_ACCESS", label: "Open Access" },
    { value: "MERCHANT", label: "Merchant Sale" },
];

interface CollapsibleBlockProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    required?: boolean;
}

function CollapsibleBlock({ title, icon, children, defaultOpen = false, required = false }: CollapsibleBlockProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card className="overflow-hidden">
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {icon}
                    </div>
                    <div>
                        <h3 className="font-semibold flex items-center gap-2">
                            {title}
                            {required && <span className="text-destructive text-sm">*</span>}
                        </h3>
                    </div>
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

export default function BasicInfoWizardPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const projectType = searchParams.get("type") || "solar";
    const isReadOnly = searchParams.get("mode") === "view";

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [draftStatus, setDraftStatus] = useState<"saved" | "saving" | "unsaved">("saved");
    const [projectId, setProjectId] = useState<number | null>(null);
    const [availableStates, setAvailableStates] = useState<string[]>([]);

    // Document types for file upload
    const documentTypes = [
        { id: "landProof", label: "Land Ownership Proof / Lease", required: true },
        { id: "govApprovals", label: "Government Approvals", required: true },
        { id: "envClearance", label: "Environmental Impact Clearance", required: true },
        { id: "gridApproval", label: "Grid Connectivity Approval", required: true },
        { id: "carbonRights", label: "Rights to claim carbon credit & environmental attributes", required: true },
        { id: "ppaCopy", label: "PPA Copy", required: false },
        { id: "companyReg", label: "Company Registration Document", required: true },
        { id: "techCerts", label: "Technology Supplier Certificates", required: false },
        { id: "sitePlan", label: "Power Plant Layout / Site Plan", required: false },
    ];

    // File input refs for each document
    const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

    // Uploaded documents state
    const [uploadedDocs, setUploadedDocs] = useState<{ [key: string]: { name: string; size: number } | null }>({});

    const [formData, setFormData] = useState({
        // Block A - Project Identity
        projectName: "",
        projectCode: `CC-${Date.now().toString(36).toUpperCase()}`,
        description: "",
        startDate: "",
        creditingPeriodStart: "",
        creditingPeriodEnd: "",

        // Block B - Location
        country: "",
        stateProvince: "",
        district: "",
        siteAddress: "",
        latitude: "",
        longitude: "",

        // Block C - Technical (Solar specific shown)
        installedCapacityDC: "",
        installedCapacityAC: "",
        moduleType: "",
        inverterType: "",
        expectedGeneration: "",

        // Block D - Ownership
        legalEntityName: "",
        registrationType: "",
        registrationNumber: "",
        ownerType: "",
        signatoryName: "",
        signatoryEmail: "",
        signatoryCountryCode: "+44",
        signatoryPhone: "",
        ownerAddress: "",

        // Block E - Regulatory
        offtakeType: "",
        gridConnected: true,
        offtakerName: "",
        ppaDuration: "",

        // Block F - Carbon Credit Eligibility Assessment
        commissioningDate: "",
        offtakerType: "", // 'GOVERNMENT' | 'UTILITY' | 'PRIVATE' | 'OTHER'
        isPolicyDriven: false,
        carbonRegistrationIntent: "", // 'BEFORE_COMMISSIONING' | 'WITHIN_2_YEARS' | 'AFTER_2_YEARS' | 'NOT_DECIDED'
        additionalityJustification: "",
        hostCountryArticle6Status: "", // 'CLEAR' | 'AMBIGUOUS' | 'HIGH_RISK'
        isMerchant: false,
        carbonRevenueMaterial: false,
    });

    // Load or Create Project on Mount
    useEffect(() => {
        const initProject = async () => {
            // Check if user is logged in
            const token = localStorage.getItem("token");
            if (!token) {
                alert("Please log in to create or edit a project");
                router.push("/developer/login");
                return;
            }

            // CASE 1: Editing existing project
            if (params.id && params.id !== 'new') {
                const id = parseInt(params.id as string);
                if (!isNaN(id)) {
                    setProjectId(id);
                    try {
                        const project = await projectApi.getById(id);
                        if (project) {
                            // Populate form with existing data
                            setFormData(prev => ({
                                ...prev,
                                projectName: project.name || prev.projectName,
                                projectCode: project.code || prev.projectCode,
                                country: project.wizard_data?.country || prev.country,
                                // Merge other wizard data if available
                                ...project.wizard_data
                            }));
                            if (project.wizard_data?.uploadedDocs) {
                                setUploadedDocs(project.wizard_data.uploadedDocs);
                            }
                        }
                    } catch (error) {
                        console.error("Error loading project:", error);
                        // Don't alert here, maybe just log, as it might be a new ID that failed
                    }
                    return;
                }
            }

            // CASE 2: Creating new project (only if we need to - e.g. direct access to /new or fallback)
            // But wait, if the URL is /project/new/..., next.js treats 'new' as the ID.

            // If ID is numeric but fetch failed, we shouldn't create a new one to replace it unless user asks.
            // If ID is 'new', we DO create one.

            if (params.id === 'new' || !params.id) {
                try {
                    // Create a new draft project immediately
                    const newProject = await projectApi.create({
                        projectType: projectType,
                        name: `New ${projectType.charAt(0).toUpperCase() + projectType.slice(1)} Project`,
                    });
                    setProjectId(newProject.id);
                    // Update the project code to match
                    setFormData(prev => ({
                        ...prev,
                        projectCode: newProject.code || prev.projectCode,
                    }));
                } catch (error: any) {
                    console.error("Error creating project:", error);
                    if (error.message?.includes("401") || error.message?.includes("Unauthorized") || error.message?.includes("credentials")) {
                        alert("Session expired. Please log in again.");
                        router.push("/developer/login");
                    }
                }
            }
        };

        initProject();
    }, [projectType, router, params.id]);

    // Save draft to database (project already created on mount)
    const saveDraftToStorage = useCallback(async () => {
        if (!projectId) {
            // Project not created yet, skip save but reset status
            setDraftStatus("saved");
            return;
        }

        try {
            // Prepare project data for API update
            // Note: Using 'projectType' to match backend schema
            const apiData = {
                name: formData.projectName || `New ${projectType.charAt(0).toUpperCase() + projectType.slice(1)} Project`,
                projectType: projectType,
                status: "draft",
                wizard_step: "basic-info",
                wizard_data: {
                    ...formData,
                    uploadedDocs,
                    country: formData.country,
                    projectCode: formData.projectCode,
                },
            };

            // Update the existing project
            await projectApi.update(projectId, apiData);

            setLastSaved(new Date());
            setDraftStatus("saved");
        } catch (error) {
            console.error("Error saving draft:", error);
            // Log more details for debugging
            if (error instanceof Error) {
                console.error("Draft save error details:", error.message);
            }
            setDraftStatus("saved"); // Don't block user even if save fails
        }
    }, [formData, uploadedDocs, projectType, projectId]);

    // Debounced auto-save
    useEffect(() => {
        // Don't trigger save on initial mount
        const timeoutId = setTimeout(() => {
            setDraftStatus("saving");
            saveDraftToStorage();
        }, 1500); // Increased to 1.5 seconds for better debouncing

        return () => clearTimeout(timeoutId);
    }, [formData, saveDraftToStorage]);

    // Auto-load states when country changes
    useEffect(() => {
        if (formData.country && COUNTRY_STATES[formData.country]) {
            setAvailableStates(COUNTRY_STATES[formData.country]);
            // Clear state if it doesn't exist in new country's states
            if (formData.stateProvince && !COUNTRY_STATES[formData.country].includes(formData.stateProvince)) {
                setFormData(prev => ({ ...prev, stateProvince: "" }));
            }
        } else {
            setAvailableStates([]);
        }
    }, [formData.country]);

    // Handle file upload
    const handleFileUpload = (docId: string, file: File) => {
        if (file.size > 25 * 1024 * 1024) {
            alert("File size must be less than 25MB");
            return;
        }
        setUploadedDocs(prev => ({
            ...prev,
            [docId]: { name: file.name, size: file.size }
        }));
    };

    // Handle file remove
    const handleFileRemove = (docId: string) => {
        setUploadedDocs(prev => ({
            ...prev,
            [docId]: null
        }));
        if (fileInputRefs.current[docId]) {
            fileInputRefs.current[docId]!.value = "";
        }
    };

    const handleSaveDraft = async () => {
        setIsSaving(true);
        setDraftStatus("saving");
        await saveDraftToStorage();
        setIsSaving(false);
    };

    const handleNext = () => {
        saveDraftToStorage(); // Save before navigating
        // Use the actual project ID if available, otherwise show error
        if (projectId) {
            router.push(`/dashboard/developer/project/${projectId}/wizard/credit-estimation?type=${projectType}`);
        } else {
            alert('Please save the project first before proceeding.');
        }
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-card border-b">
                <div className="container mx-auto px-4">
                    <div className="h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/developer/project/create">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="font-semibold">New {projectType.charAt(0).toUpperCase() + projectType.slice(1)} Project</h1>
                                <p className="text-sm text-muted-foreground">Basic Project Information</p>
                            </div>
                        </div>
                    </div>

                    {/* Step Indicator */}
                    <div className="py-4 overflow-x-auto">
                        <div className="flex items-center gap-2 min-w-max">
                            {wizardSteps.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                                        step.active
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-muted-foreground"
                                    )}>
                                        <span className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                            step.active ? "bg-white/20" : "bg-muted-foreground/20"
                                        )}>
                                            {step.id}
                                        </span>
                                        {step.name}
                                    </div>
                                    {index < wizardSteps.length - 1 && (
                                        <div className="w-8 h-0.5 bg-border mx-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Block A: Project Identity & Metadata */}
                    <CollapsibleBlock
                        title="Project Identity & Metadata"
                        icon={<FileText className="h-5 w-5 text-primary" />}
                        defaultOpen={true}
                        required
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="projectName">Project Name *</Label>
                                    <Input
                                        id="projectName"
                                        placeholder="e.g., Solar 50 MW Rajasthan Phase 1"
                                        value={formData.projectName}
                                        onChange={(e) => setFormData({ ...formData, projectName: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="projectCode">Project Code</Label>
                                    <Input
                                        id="projectCode"
                                        value={formData.projectCode}
                                        disabled
                                        className="h-11 bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">Auto-generated, can be edited</p>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Project Description *</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Provide a detailed description of your project including technology, capacity, and expected impact..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                />
                                <p className="text-xs text-muted-foreground">Max 2000 characters</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="startDate">Project Start Date *</Label>
                                    <Input
                                        id="startDate"
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="creditingStart">Crediting Period Start *</Label>
                                    <Input
                                        id="creditingStart"
                                        type="date"
                                        value={formData.creditingPeriodStart}
                                        onChange={(e) => setFormData({ ...formData, creditingPeriodStart: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="creditingEnd">Crediting Period End *</Label>
                                    <Input
                                        id="creditingEnd"
                                        type="date"
                                        value={formData.creditingPeriodEnd}
                                        onChange={(e) => setFormData({ ...formData, creditingPeriodEnd: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                            </div>
                        </div>
                    </CollapsibleBlock>

                    {/* Block B: Location & Geospatial Data */}
                    <CollapsibleBlock
                        title="Location & Geospatial Data"
                        icon={<MapPin className="h-5 w-5 text-primary" />}
                        required
                    >
                        <div className="space-y-4">
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
                                    <Label htmlFor="stateProvince">State / Province *</Label>
                                    {availableStates.length > 0 ? (
                                        <Select
                                            value={formData.stateProvince}
                                            onValueChange={(value) => setFormData({ ...formData, stateProvince: value })}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select state/province" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableStates.map((state) => (
                                                    <SelectItem key={state} value={state}>
                                                        {state}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    ) : (
                                        <Input
                                            id="stateProvince"
                                            placeholder="Enter state/province"
                                            value={formData.stateProvince}
                                            onChange={(e) => setFormData({ ...formData, stateProvince: e.target.value })}
                                            className="h-11"
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="district">District / City *</Label>
                                    <Input
                                        id="district"
                                        placeholder="e.g., London"
                                        value={formData.district}
                                        onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="siteAddress">Site Address *</Label>
                                    <Input
                                        id="siteAddress"
                                        placeholder="Full site address"
                                        value={formData.siteAddress}
                                        onChange={(e) => setFormData({ ...formData, siteAddress: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                            </div>


                            <div
                                className="p-6 rounded-lg border-2 border-dashed bg-muted/30 hover:border-primary/50 transition-colors cursor-pointer"
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.classList.add('border-primary', 'bg-primary/5');
                                }}
                                onDragLeave={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    e.currentTarget.classList.remove('border-primary', 'bg-primary/5');
                                    const file = e.dataTransfer.files?.[0];
                                    if (file && (file.name.endsWith('.kml') || file.name.endsWith('.geojson') || file.name.endsWith('.json'))) {
                                        handleFileUpload('projectBoundary', file);
                                    }
                                }}
                                onClick={() => !uploadedDocs['projectBoundary'] && fileInputRefs.current['projectBoundary']?.click()}
                            >
                                <div className="text-center">
                                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                    <p className="font-medium text-base">Upload Project Boundary (KML/GeoJSON)</p>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        Drag & drop your file here, or click to browse
                                    </p>
                                    <p className="text-xs text-muted-foreground mb-3">
                                        Required for A/R, REDD+, and large-scale projects
                                    </p>
                                    <input
                                        type="file"
                                        ref={(el) => { fileInputRefs.current['projectBoundary'] = el; }}
                                        className="hidden"
                                        accept=".kml,.geojson,.json"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileUpload('projectBoundary', file);
                                        }}
                                    />
                                    {uploadedDocs['projectBoundary'] ? (
                                        <div className="flex items-center justify-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                                            <Check className="h-4 w-4 text-green-600" />
                                            <span className="text-sm text-green-600 font-medium">{uploadedDocs['projectBoundary'].name}</span>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 px-2 text-destructive hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleFileRemove('projectBoundary');
                                                }}
                                            >
                                                ✕
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fileInputRefs.current['projectBoundary']?.click();
                                            }}
                                        >
                                            Choose File
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <p className="text-xs text-muted-foreground text-center mt-3">
                                Need help creating a GeoJSON file?{" "}
                                <a
                                    href="https://support.planet.com/hc/en-us/articles/360016337117-Creating-a-GeoJSON-file"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    Learn how to create one here
                                </a>
                            </p>
                        </div>
                    </CollapsibleBlock>

                    {/* Block C: Technical Specifications (Dynamic based on project type) */}
                    <CollapsibleBlock
                        title="Technical Specifications"
                        icon={<Zap className="h-5 w-5 text-primary" />}
                        required
                    >
                        {projectType === "solar" && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="capacityDC">Installed DC Capacity (MWp) *</Label>
                                        <Input
                                            id="capacityDC"
                                            type="number"
                                            step="any"
                                            placeholder="e.g., 50"
                                            value={formData.installedCapacityDC}
                                            onChange={(e) => setFormData({ ...formData, installedCapacityDC: e.target.value })}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="capacityAC">Installed AC Capacity (MW) *</Label>
                                        <Input
                                            id="capacityAC"
                                            type="number"
                                            step="any"
                                            placeholder="e.g., 45"
                                            value={formData.installedCapacityAC}
                                            onChange={(e) => setFormData({ ...formData, installedCapacityAC: e.target.value })}
                                            className="h-11"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="moduleType">Module Type *</Label>
                                        <Select
                                            value={formData.moduleType}
                                            onValueChange={(value) => setFormData({ ...formData, moduleType: value })}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select module type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {SOLAR_MODULE_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="inverterType">Inverter Type *</Label>
                                        <Select
                                            value={formData.inverterType}
                                            onValueChange={(value) => setFormData({ ...formData, inverterType: value })}
                                        >
                                            <SelectTrigger className="h-11">
                                                <SelectValue placeholder="Select inverter type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="STRING">String Inverter</SelectItem>
                                                <SelectItem value="CENTRAL">Central Inverter</SelectItem>
                                                <SelectItem value="MICRO">Micro Inverter</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expectedGen">Expected Annual Generation (MWh/year) *</Label>
                                    <Input
                                        id="expectedGen"
                                        type="number"
                                        step="any"
                                        placeholder="e.g., 85000"
                                        value={formData.expectedGeneration}
                                        onChange={(e) => setFormData({ ...formData, expectedGeneration: e.target.value })}
                                        className="h-11"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Based on P50 estimate or feasibility study
                                    </p>
                                </div>
                            </div>
                        )}
                    </CollapsibleBlock>

                    {/* Block D: Ownership & Contact Details */}
                    <CollapsibleBlock
                        title="Ownership & Contact Details"
                        icon={<Building2 className="h-5 w-5 text-primary" />}
                        required
                    >
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="legalEntity">Legal Entity Name</Label>
                                    <Input
                                        id="legalEntity"
                                        placeholder="Enter Legal Entity Name"
                                        value={formData.legalEntityName}
                                        onChange={(e) => setFormData({ ...formData, legalEntityName: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="regType">Registration Type</Label>
                                    <Select
                                        value={formData.registrationType}
                                        onValueChange={(value) => setFormData({ ...formData, registrationType: value })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {REGISTRATION_TYPES.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="regNumber">Registration Number</Label>
                                <Input
                                    id="regNumber"
                                    placeholder="Enter Registration Number"
                                    value={formData.registrationNumber}
                                    onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                                    className="h-11"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ownerType">Owner Type *</Label>
                                <Select
                                    value={formData.ownerType}
                                    onValueChange={(value) => setFormData({ ...formData, ownerType: value })}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Select owner type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ownerTypes.map((type) => (
                                            <SelectItem key={type.value} value={type.value}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="pt-4 border-t">
                                <h4 className="font-medium mb-4">Authorized Signatory</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="sigName">Full Name *</Label>
                                        <Input
                                            id="sigName"
                                            placeholder="John Doe"
                                            value={formData.signatoryName}
                                            onChange={(e) => setFormData({ ...formData, signatoryName: e.target.value })}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sigEmail">Email *</Label>
                                        <Input
                                            id="sigEmail"
                                            type="email"
                                            placeholder="john@company.com"
                                            value={formData.signatoryEmail}
                                            onChange={(e) => setFormData({ ...formData, signatoryEmail: e.target.value })}
                                            className="h-11"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="sigPhone">Phone *</Label>
                                        <div className="flex gap-2">
                                            <Select
                                                value={formData.signatoryCountryCode}
                                                onValueChange={(value) => setFormData({ ...formData, signatoryCountryCode: value })}
                                            >
                                                <SelectTrigger className="h-11 w-32">
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
                                                id="sigPhone"
                                                type="tel"
                                                placeholder="98765 43210"
                                                value={formData.signatoryPhone}
                                                onChange={(e) => setFormData({ ...formData, signatoryPhone: e.target.value })}
                                                className="h-11 flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ownerAddress">Registered Address *</Label>
                                <Textarea
                                    id="ownerAddress"
                                    placeholder="Full registered address of the company"
                                    value={formData.ownerAddress}
                                    onChange={(e) => setFormData({ ...formData, ownerAddress: e.target.value })}
                                    rows={3}
                                />
                            </div>
                        </div>
                    </CollapsibleBlock>

                    {/* Block E: Regulatory & Grid Information */}
                    <CollapsibleBlock
                        title="Regulatory & Grid Information"
                        icon={<Globe className="h-5 w-5 text-primary" />}
                    >
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <Checkbox
                                    id="gridConnected"
                                    checked={formData.gridConnected}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, gridConnected: checked as boolean })
                                    }
                                />
                                <Label htmlFor="gridConnected" className="cursor-pointer">
                                    Project is grid-connected
                                </Label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="offtakeType">Power Offtake Type *</Label>
                                    <Select
                                        value={formData.offtakeType}
                                        onValueChange={(value) => setFormData({ ...formData, offtakeType: value })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select offtake type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {offtakeTypes.map((type) => (
                                                <SelectItem key={type.value} value={type.value}>
                                                    {type.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="offtaker">Offtaker Name</Label>
                                    <Input
                                        id="offtaker"
                                        placeholder="e.g., State Grid Corporation"
                                        value={formData.offtakerName}
                                        onChange={(e) => setFormData({ ...formData, offtakerName: e.target.value })}
                                        className="h-11"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="ppaDuration">PPA Duration (years)</Label>
                                <Input
                                    id="ppaDuration"
                                    type="number"
                                    min="0"
                                    placeholder="e.g., 25"
                                    value={formData.ppaDuration}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || parseInt(value) >= 0) {
                                            setFormData({ ...formData, ppaDuration: value });
                                        }
                                    }}
                                    className="h-11 w-full md:w-1/3"
                                />
                                <p className="text-xs text-muted-foreground">Enter PPA duration in years</p>
                            </div>
                        </div>
                    </CollapsibleBlock>

                    {/* Block F: Carbon Credit Eligibility Assessment */}
                    <CollapsibleBlock
                        title="Carbon Credit Eligibility Assessment"
                        icon={<ShieldCheck className="h-5 w-5 text-primary" />}
                        required
                    >
                        <div className="space-y-6">
                            <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Important Assessment</p>
                                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                            This information helps determine your project's eligibility for carbon credit registration.
                                            Please answer accurately as it affects the credit estimation results.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="commissioningDate">Project Commissioning Date *</Label>
                                    <Input
                                        id="commissioningDate"
                                        type="date"
                                        value={formData.commissioningDate}
                                        onChange={(e) => setFormData({ ...formData, commissioningDate: e.target.value })}
                                        className="h-11"
                                    />
                                    <p className="text-xs text-muted-foreground">Date when the project started/will start operations</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="offtakerType">Offtaker Type *</Label>
                                    <Select
                                        value={formData.offtakerType}
                                        onValueChange={(value) => setFormData({ ...formData, offtakerType: value })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select offtaker type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="GOVERNMENT">Government Entity</SelectItem>
                                            <SelectItem value="UTILITY">Regulated Utility</SelectItem>
                                            <SelectItem value="PRIVATE">Private Corporate</SelectItem>
                                            <SelectItem value="OTHER">Other / No Offtaker</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Type of entity purchasing the power</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="carbonRegistrationIntent">Carbon Registration Intent *</Label>
                                    <Select
                                        value={formData.carbonRegistrationIntent}
                                        onValueChange={(value) => setFormData({ ...formData, carbonRegistrationIntent: value })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select timing" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BEFORE_COMMISSIONING">Before project commissioning</SelectItem>
                                            <SelectItem value="WITHIN_2_YEARS">Within 2 years of commissioning</SelectItem>
                                            <SelectItem value="AFTER_2_YEARS">More than 2 years after commissioning</SelectItem>
                                            <SelectItem value="NOT_DECIDED">Not yet decided</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">When did/will carbon registration intent become documented?</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="hostCountryArticle6Status">Host Country Article 6 Status *</Label>
                                    <Select
                                        value={formData.hostCountryArticle6Status}
                                        onValueChange={(value) => setFormData({ ...formData, hostCountryArticle6Status: value })}
                                    >
                                        <SelectTrigger className="h-11">
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="CLEAR">Clear framework - Low double-counting risk</SelectItem>
                                            <SelectItem value="AMBIGUOUS">Ambiguous framework - Some uncertainty</SelectItem>
                                            <SelectItem value="HIGH_RISK">High risk of double counting</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-xs text-muted-foreground">Paris Agreement Article 6 compliance status</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                                    <Checkbox
                                        id="isPolicyDriven"
                                        checked={formData.isPolicyDriven}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isPolicyDriven: checked as boolean })}
                                    />
                                    <div>
                                        <Label htmlFor="isPolicyDriven" className="cursor-pointer">Policy-Driven Program</Label>
                                        <p className="text-xs text-muted-foreground">Is this project part of a government renewable mandate, auction, or policy-driven program?</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                                    <Checkbox
                                        id="isMerchant"
                                        checked={formData.isMerchant}
                                        onCheckedChange={(checked) => setFormData({ ...formData, isMerchant: checked as boolean })}
                                    />
                                    <div>
                                        <Label htmlFor="isMerchant" className="cursor-pointer">Merchant / Partially Merchant Project</Label>
                                        <p className="text-xs text-muted-foreground">Does this project have no guaranteed offtake or sell power on the open market?</p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3 p-3 rounded-lg border">
                                    <Checkbox
                                        id="carbonRevenueMaterial"
                                        checked={formData.carbonRevenueMaterial}
                                        onCheckedChange={(checked) => setFormData({ ...formData, carbonRevenueMaterial: checked as boolean })}
                                    />
                                    <div>
                                        <Label htmlFor="carbonRevenueMaterial" className="cursor-pointer">Carbon Revenue is Material</Label>
                                        <p className="text-xs text-muted-foreground">Is carbon credit revenue material to the project's financial viability or IRR?</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="additionalityJustification">Additionality Justification *</Label>
                                <Textarea
                                    id="additionalityJustification"
                                    placeholder="Describe why this project would not have been viable without carbon credit revenue. Include financial, regulatory, or barrier analysis..."
                                    value={formData.additionalityJustification}
                                    onChange={(e) => setFormData({ ...formData, additionalityJustification: e.target.value })}
                                    className="min-h-[120px]"
                                />
                                <p className="text-xs text-muted-foreground">
                                    Minimum 50 characters required. Explain financial barriers, technology barriers, institutional barriers, or regulatory challenges.
                                </p>
                            </div>
                        </div>
                    </CollapsibleBlock>

                    {/* Block G: Supporting Documents */}
                    <CollapsibleBlock
                        title="Supporting Documents"
                        icon={<Upload className="h-5 w-5 text-primary" />}
                    >
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Upload all required supporting documents. Supported formats: PDF, JPG, PNG (Max 25 MB each)
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {documentTypes.map((doc) => {
                                    const uploaded = uploadedDocs[doc.id];
                                    return (
                                        <div
                                            key={doc.id}
                                            className={cn(
                                                "p-4 rounded-lg border-2 transition-colors",
                                                uploaded
                                                    ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                                                    : "border-dashed hover:border-primary/50 cursor-pointer"
                                            )}
                                            onClick={() => !uploaded && fileInputRefs.current[doc.id]?.click()}
                                        >
                                            <input
                                                type="file"
                                                ref={(el) => { fileInputRefs.current[doc.id] = el; }}
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleFileUpload(doc.id, file);
                                                }}
                                            />
                                            <div className="flex items-center gap-3">
                                                {uploaded ? (
                                                    <Check className="h-5 w-5 text-green-600" />
                                                ) : (
                                                    <Upload className="h-5 w-5 text-muted-foreground" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-sm">
                                                        {doc.label}
                                                        {doc.required && <span className="text-destructive ml-1">*</span>}
                                                    </p>
                                                    {uploaded ? (
                                                        <p className="text-xs text-green-600 truncate">
                                                            {uploaded.name} ({(uploaded.size / 1024 / 1024).toFixed(2)} MB)
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-muted-foreground">Click to upload</p>
                                                    )}
                                                </div>
                                                {uploaded && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 px-2 text-destructive hover:text-destructive"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleFileRemove(doc.id);
                                                        }}
                                                    >
                                                        ✕
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </CollapsibleBlock>

                </div>
            </main>

            {/* Sticky Footer */}
            <footer className="fixed bottom-0 left-0 right-0 lg:left-72 bg-card border-t shadow-lg z-50">
                <div className="container mx-auto px-4">
                    <div className="h-16 flex items-center justify-between">
                        {/* Left: Back button */}
                        <Link href="/dashboard/developer/project/create">
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>

                        {/* Center: Save status */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                {draftStatus === "saving" ? (
                                    <>
                                        <span className="mr-2 animate-pulse">●</span>
                                        Saving...
                                    </>
                                ) : draftStatus === "saved" && lastSaved ? (
                                    <>
                                        <Check className="mr-2 h-4 w-4 text-green-500" />
                                        Saved {lastSaved.toLocaleTimeString()}
                                    </>
                                ) : draftStatus === "unsaved" ? (
                                    <>
                                        <span className="mr-2 h-2 w-2 rounded-full bg-yellow-500" />
                                        Unsaved changes
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Draft
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Right: Primary action */}
                        <Button onClick={handleNext} className="gradient-primary text-white btn-shine">
                            Next: Generation Data
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </footer>

            {/* Spacer to prevent content from being hidden behind sticky footer */}
            <div className="h-20" />
        </div>
    );
}
