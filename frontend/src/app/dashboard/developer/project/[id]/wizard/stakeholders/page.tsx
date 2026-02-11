"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
    ArrowLeft, ArrowRight, Save, ChevronDown, ChevronUp,
    Users, MessageSquare, FileCheck, Calendar, Mail, Phone, MapPin, Plus, Trash2, CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { projectApi } from "@/lib/api";

const wizardSteps = [
    { id: 1, name: "Basic Info", completed: true },
    { id: 2, name: "Registry Selection", completed: true },
    { id: 3, name: "Stakeholders", active: true },
    { id: 4, name: "Compliance", active: false },
    { id: 5, name: "Registry Package", active: false },
    { id: 6, name: "Review & Submit", active: false },
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

interface Stakeholder {
    id: number;
    name: string;
    type: string;
    contact: string;
    consultationDate: string;
    notes: string;
}


export default function StakeholdersWizardPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const projectType = searchParams.get("type") || "solar";

    // Get project ID from URL params
    const rawProjectId = params?.id as string;
    const projectId = rawProjectId && rawProjectId !== 'new' ? parseInt(rawProjectId, 10) : null;

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [stakeholders, setStakeholders] = useState<Stakeholder[]>([
        { id: 1, name: "", type: "", contact: "", consultationDate: "", notes: "" }
    ]);
    const [grievanceData, setGrievanceData] = useState({
        contactPerson: "",
        contactEmail: "",
        resolutionProcess: ""
    });

    // Load existing data on mount
    useEffect(() => {
        const loadProjectData = async () => {
            if (!projectId) return;
            try {
                const project = await projectApi.getById(projectId);
                if (project.wizard_data?.stakeholders) {
                    setStakeholders(project.wizard_data.stakeholders);
                }
                if (project.wizard_data?.grievance) {
                    setGrievanceData(project.wizard_data.grievance);
                }
            } catch (error) {
                console.error("Error loading project data:", error);
            }
        };
        loadProjectData();
    }, [projectId]);

    // Save draft to database
    const saveDraftToStorage = useCallback(async () => {
        if (!projectId) {
            console.log("No project ID, cannot save draft");
            return;
        }

        try {
            const apiData = {
                wizard_step: "stakeholders",
                wizard_data: {
                    stakeholders,
                    grievance: grievanceData,
                },
            };

            await projectApi.update(projectId, apiData);
            setLastSaved(new Date());
        } catch (error) {
            console.error("Error saving draft:", error);
        }
    }, [stakeholders, grievanceData, projectId]);

    const handleSaveDraft = async () => {
        setIsSaving(true);
        await saveDraftToStorage();
        setIsSaving(false);
    };

    const handleNext = () => {
        saveDraftToStorage(); // Save before navigating
        router.push(`/dashboard/developer/project/${projectId || 'new'}/wizard/compliance?type=${projectType}`);
    };

    const addStakeholder = () => {
        setStakeholders([
            ...stakeholders,
            { id: Date.now(), name: "", type: "", contact: "", consultationDate: "", notes: "" }
        ]);
    };

    const removeStakeholder = (id: number) => {
        if (stakeholders.length > 1) {
            setStakeholders(stakeholders.filter(s => s.id !== id));
        }
    };

    const updateStakeholder = (id: number, field: keyof Stakeholder, value: string) => {
        setStakeholders(stakeholders.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ));
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-card border-b">
                <div className="container mx-auto px-4">
                    <div className="h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/developer/project/new/wizard/credit-estimation">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="font-semibold">Stakeholder Consultation</h1>
                                <p className="text-sm text-muted-foreground">Step 3 of 6</p>
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
                                        step.id === 3
                                            ? "bg-primary text-primary-foreground"
                                            : step.id < 3
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted text-muted-foreground"
                                    )}>
                                        <span className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                            step.id === 3 ? "bg-white/20" : "bg-transparent border border-current"
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

                    {/* Introduction */}
                    <Card className="bg-blue-50/50 border-blue-100">
                        <CardContent className="pt-6">
                            <div className="flex gap-3">
                                <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-blue-900">Stakeholder Consultation Requirements</h4>
                                    <p className="text-sm text-blue-700 mt-1">
                                        Document all consultations with local communities, government authorities, and other affected parties.
                                        This is a mandatory requirement for most carbon registries and demonstrates project legitimacy.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stakeholder List */}
                    <CollapsibleBlock
                        title="Stakeholder Registry"
                        icon={<Users className="h-5 w-5 text-primary" />}
                        defaultOpen={true}
                        required
                    >
                        <div className="space-y-6">
                            {stakeholders.map((stakeholder, index) => (
                                <div key={stakeholder.id} className="p-4 border rounded-lg space-y-4 relative">
                                    <div className="flex items-center justify-between">
                                        <Badge variant="outline">Stakeholder {index + 1}</Badge>
                                        {stakeholders.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeStakeholder(stakeholder.id)}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Stakeholder Name / Organization *</Label>
                                            <Input
                                                placeholder="e.g., Village Panchayat, Local NGO"
                                                value={stakeholder.name}
                                                onChange={(e) => updateStakeholder(stakeholder.id, "name", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Stakeholder Type *</Label>
                                            <Select
                                                value={stakeholder.type}
                                                onValueChange={(val) => updateStakeholder(stakeholder.id, "type", val)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="LOCAL_COMMUNITY">Local Community</SelectItem>
                                                    <SelectItem value="GOVERNMENT">Government Authority</SelectItem>
                                                    <SelectItem value="NGO">NGO / Civil Society</SelectItem>
                                                    <SelectItem value="INDIGENOUS">Indigenous Peoples</SelectItem>
                                                    <SelectItem value="LANDOWNER">Landowner</SelectItem>
                                                    <SelectItem value="OTHER">Other</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Contact Information</Label>
                                            <Input
                                                placeholder="Email or Phone"
                                                value={stakeholder.contact}
                                                onChange={(e) => updateStakeholder(stakeholder.id, "contact", e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Consultation Date *</Label>
                                            <Input
                                                type="date"
                                                value={stakeholder.consultationDate}
                                                onChange={(e) => updateStakeholder(stakeholder.id, "consultationDate", e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Consultation Notes / Outcomes</Label>
                                        <Textarea
                                            placeholder="Summarize the key points discussed and any agreements made..."
                                            rows={3}
                                            value={stakeholder.notes}
                                            onChange={(e) => updateStakeholder(stakeholder.id, "notes", e.target.value)}
                                        />
                                    </div>
                                </div>
                            ))}

                            <Button variant="outline" onClick={addStakeholder} className="w-full">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Another Stakeholder
                            </Button>
                        </div>
                    </CollapsibleBlock>

                    {/* Document Upload */}
                    <CollapsibleBlock
                        title="Supporting Documents"
                        icon={<FileCheck className="h-5 w-5 text-primary" />}
                        defaultOpen={true}
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { label: "Meeting Minutes / Records", required: true },
                                { label: "Attendance Sheets", required: false },
                                { label: "Photographs", required: false },
                                { label: "Consent Letters", required: true },
                            ].map((doc, idx) => (
                                <div key={idx} className="border-2 border-dashed rounded-xl p-6 hover:bg-muted/30 transition-colors cursor-pointer">
                                    <div className="flex flex-col items-center text-center gap-2">
                                        <FileCheck className="h-8 w-8 text-muted-foreground" />
                                        <p className="font-medium">
                                            {doc.label}
                                            {doc.required && <span className="text-destructive ml-1">*</span>}
                                        </p>
                                        <Button variant="ghost" size="sm" className="text-primary">
                                            Upload File
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleBlock>

                    {/* Grievance Mechanism */}
                    <CollapsibleBlock
                        title="Grievance Redressal Mechanism"
                        icon={<MessageSquare className="h-5 w-5 text-primary" />}
                        defaultOpen={false}
                    >
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">
                                Describe how stakeholders can raise concerns or complaints about the project.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Contact Person</Label>
                                    <Input placeholder="Name of grievance officer" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Contact Email</Label>
                                    <Input type="email" placeholder="grievance@company.com" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Grievance Resolution Process</Label>
                                <Textarea
                                    placeholder="Describe the steps taken to address and resolve stakeholder grievances..."
                                    rows={4}
                                />
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
                        <Link href={`/dashboard/developer/project/${projectId}/wizard/credit-estimation`}>
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
                                {isSaving ? (
                                    <>
                                        <span className="mr-2 animate-pulse">●</span>
                                        Saving...
                                    </>
                                ) : lastSaved ? (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                        Saved {lastSaved.toLocaleTimeString()}
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
                            Next: Compliance
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
