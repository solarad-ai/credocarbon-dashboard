"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
    ArrowLeft, ArrowRight, Save, ChevronDown, ChevronUp,
    Shield, CheckCircle2, AlertTriangle, FileWarning, Leaf, Users, Scale
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { projectApi } from "@/lib/api";

const wizardSteps = [
    { id: 1, name: "Basic Info", completed: true },
    { id: 2, name: "Generation Data", completed: true },
    { id: 3, name: "Stakeholders", completed: true },
    { id: 4, name: "Compliance", active: true },
    { id: 5, name: "Registry Package", active: false },
    { id: 6, name: "Review & Submit", active: false },
];

interface CollapsibleBlockProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

function CollapsibleBlock({ title, icon, children, defaultOpen = false }: CollapsibleBlockProps) {
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
                    <h3 className="font-semibold">{title}</h3>
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

interface ChecklistItem {
    id: string;
    label: string;
    description: string;
    checked: boolean;
}

export default function ComplianceWizardPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const projectType = searchParams.get("type") || "solar";

    // Get project ID from URL params
    const rawProjectId = params?.id as string;
    const projectId = rawProjectId && rawProjectId !== 'new' ? parseInt(rawProjectId, 10) : null;

    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const [environmentalChecklist, setEnvironmentalChecklist] = useState<ChecklistItem[]>([
        { id: "eia", label: "Environmental Impact Assessment (EIA)", description: "EIA clearance obtained if required", checked: false },
        { id: "biodiversity", label: "Biodiversity Assessment", description: "No harm to critical habitats or endangered species", checked: false },
        { id: "water", label: "Water Resources", description: "Project does not adversely affect water availability", checked: false },
        { id: "emissions", label: "Air Quality", description: "No significant increase in local air pollution", checked: false },
    ]);

    const [socialChecklist, setSocialChecklist] = useState<ChecklistItem[]>([
        { id: "fpic", label: "Free, Prior & Informed Consent (FPIC)", description: "Indigenous peoples consent obtained where applicable", checked: false },
        { id: "displacement", label: "No Forced Displacement", description: "Project does not cause involuntary resettlement", checked: false },
        { id: "labor", label: "Labor Standards", description: "Compliance with ILO core labor standards", checked: false },
        { id: "gender", label: "Gender Considerations", description: "Project considers gender equality and women's empowerment", checked: false },
    ]);

    const [legalChecklist, setLegalChecklist] = useState<ChecklistItem[]>([
        { id: "permits", label: "All Required Permits", description: "Operating licenses and permits are valid and current", checked: false },
        { id: "land", label: "Land Rights", description: "Clear legal title or lease agreements for project site", checked: false },
        { id: "ppa", label: "Power Purchase Agreement", description: "Valid PPA or offtake agreement in place", checked: false },
        { id: "additionality", label: "Additionality Declaration", description: "Project would not occur without carbon finance", checked: false },
    ]);

    const [complianceNotes, setComplianceNotes] = useState({
        mitigationMeasures: "",
        monitoringPlan: ""
    });

    // Load existing data on mount
    useEffect(() => {
        const loadProjectData = async () => {
            if (!projectId) return;
            try {
                const project = await projectApi.getById(projectId);
                if (project.wizard_data?.compliance) {
                    const c = project.wizard_data.compliance;
                    if (c.environmentalChecklist) setEnvironmentalChecklist(c.environmentalChecklist);
                    if (c.socialChecklist) setSocialChecklist(c.socialChecklist);
                    if (c.legalChecklist) setLegalChecklist(c.legalChecklist);
                    if (c.notes) setComplianceNotes(c.notes);
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
                wizard_step: "compliance",
                wizard_data: {
                    compliance: {
                        environmentalChecklist,
                        socialChecklist,
                        legalChecklist,
                        notes: complianceNotes,
                    },
                },
            };

            await projectApi.update(projectId, apiData);
            setLastSaved(new Date());
        } catch (error) {
            console.error("Error saving draft:", error);
        }
    }, [environmentalChecklist, socialChecklist, legalChecklist, complianceNotes, projectId]);

    const handleSaveDraft = async () => {
        setIsSaving(true);
        await saveDraftToStorage();
        setIsSaving(false);
    };

    const handleNext = () => {
        saveDraftToStorage(); // Save before navigating
        router.push(`/dashboard/developer/project/${projectId || 'new'}/wizard/registry-submission?type=${projectType}`);
    };

    const toggleCheck = (
        list: ChecklistItem[],
        setList: React.Dispatch<React.SetStateAction<ChecklistItem[]>>,
        id: string
    ) => {
        setList(list.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        ));
    };

    const renderChecklist = (
        items: ChecklistItem[],
        setItems: React.Dispatch<React.SetStateAction<ChecklistItem[]>>
    ) => (
        <div className="space-y-3">
            {items.map((item) => (
                <div
                    key={item.id}
                    className={cn(
                        "flex items-start gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all",
                        item.checked
                            ? "border-green-500 bg-green-50/50"
                            : "border-border hover:border-primary/50"
                    )}
                    onClick={() => toggleCheck(items, setItems, item.id)}
                >
                    <div className={cn(
                        "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5",
                        item.checked
                            ? "border-green-500 bg-green-500"
                            : "border-muted-foreground"
                    )}>
                        {item.checked && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
                    <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                </div>
            ))}
        </div>
    );

    const completionPercentage = Math.round(
        (([...environmentalChecklist, ...socialChecklist, ...legalChecklist].filter(i => i.checked).length) /
            ([...environmentalChecklist, ...socialChecklist, ...legalChecklist].length)) * 100
    );

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-card border-b">
                <div className="container mx-auto px-4">
                    <div className="h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/developer/project/new/wizard/stakeholders">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="font-semibold">Compliance & Safeguards</h1>
                                <p className="text-sm text-muted-foreground">Step 4 of 6</p>
                            </div>
                        </div>
                        <Badge variant={completionPercentage === 100 ? "default" : "secondary"}>
                            {completionPercentage}% Complete
                        </Badge>
                    </div>

                    {/* Step Indicator */}
                    <div className="py-4 overflow-x-auto">
                        <div className="flex items-center gap-2 min-w-max">
                            {wizardSteps.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                                        step.id === 4
                                            ? "bg-primary text-primary-foreground"
                                            : step.id < 4
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted text-muted-foreground"
                                    )}>
                                        <span className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                            step.id === 4 ? "bg-white/20" : "bg-transparent border border-current"
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
                    <Card className="bg-amber-50/50 border-amber-100">
                        <CardContent className="pt-6">
                            <div className="flex gap-3">
                                <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-amber-900">Safeguards Compliance</h4>
                                    <p className="text-sm text-amber-700 mt-1">
                                        Complete the following checklists to demonstrate your project meets environmental, social, and legal safeguards
                                        required by carbon standards. All items must be confirmed before registry submission.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Environmental Safeguards */}
                    <CollapsibleBlock
                        title="Environmental Safeguards"
                        icon={<Leaf className="h-5 w-5 text-primary" />}
                        defaultOpen={true}
                    >
                        {renderChecklist(environmentalChecklist, setEnvironmentalChecklist)}
                    </CollapsibleBlock>

                    {/* Social Safeguards */}
                    <CollapsibleBlock
                        title="Social Safeguards"
                        icon={<Users className="h-5 w-5 text-primary" />}
                        defaultOpen={true}
                    >
                        {renderChecklist(socialChecklist, setSocialChecklist)}
                    </CollapsibleBlock>

                    {/* Legal & Regulatory */}
                    <CollapsibleBlock
                        title="Legal & Regulatory Compliance"
                        icon={<Scale className="h-5 w-5 text-primary" />}
                        defaultOpen={true}
                    >
                        {renderChecklist(legalChecklist, setLegalChecklist)}
                    </CollapsibleBlock>

                    {/* Additional Notes */}
                    <CollapsibleBlock
                        title="Additional Compliance Notes"
                        icon={<FileWarning className="h-5 w-5 text-primary" />}
                        defaultOpen={false}
                    >
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Mitigation Measures</Label>
                                <Textarea
                                    placeholder="Describe any mitigation measures implemented to address potential negative impacts..."
                                    rows={4}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Monitoring Plan</Label>
                                <Textarea
                                    placeholder="Describe how safeguard compliance will be monitored throughout the crediting period..."
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
                        <Link href={`/dashboard/developer/project/${projectId}/wizard/stakeholders`}>
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
                            Next: Registry Package
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
