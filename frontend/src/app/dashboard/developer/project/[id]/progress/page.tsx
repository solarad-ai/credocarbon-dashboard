"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { projectApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Circle, Clock, AlertCircle, FileText, Users, Shield, BarChart3, Package } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface Project {
    id: number;
    name: string;
    code: string;
    project_type?: string;
    status: string;
    country?: string;
    created_at: string;
    updated_at: string;
    wizard_data?: any;
    wizard_step?: string;
}

// Wizard steps
const wizardSteps = [
    { id: "basic-info", label: "Basic Info", icon: FileText },
    { id: "credit-estimation", label: "Credit Estimation", icon: BarChart3 },
    { id: "stakeholders", label: "Stakeholders", icon: Users },
    { id: "compliance", label: "Compliance", icon: Shield },
    { id: "registry-submission", label: "Registry Package", icon: Package },
];

// Lifecycle steps
const lifecycleSteps = [
    { id: "DRAFT", label: "Draft" },
    { id: "READY_FOR_SUBMISSION", label: "Ready to Submit" },
    { id: "SUBMITTED", label: "Submitted" },
    { id: "VALIDATION", label: "In Validation" },
    { id: "VERIFICATION", label: "In Verification" },
    { id: "ISSUED", label: "Credits Issued" },
];

// Calculate wizard step completion from actual data
const calculateWizardCompletion = (project: Project) => {
    const wd = project.wizard_data || {};

    const steps = {
        "basic-info": !!(
            (wd.projectName || project.name) &&
            wd.country
        ),
        "credit-estimation": !!(
            wd.estimationResult?.total_er_tco2e ||
            wd.selectedMethodology ||
            wd.uploadedFile
        ),
        "stakeholders": !!(
            (wd.stakeholders && wd.stakeholders.length > 0)
        ),
        "compliance": !!(
            wd.compliance?.environmentalChecklist?.some((c: any) => c.checked) ||
            wd.environmentalChecklist?.some((c: any) => c.checked)
        ),
        "registry-submission": !!(
            wd.registrySubmission?.documents?.some((d: any) => d.status !== 'pending') ||
            wd.documents?.some((d: any) => d.status !== 'pending')
        ),
    };

    const completedCount = Object.values(steps).filter(Boolean).length;
    const percentage = Math.round((completedCount / 5) * 100);

    return { steps, completedCount, total: 5, percentage };
};

// Get lifecycle step index
const getLifecycleIndex = (status: string) => {
    const normalized = status?.toUpperCase() || "DRAFT";
    const index = lifecycleSteps.findIndex(s => s.id === normalized);
    return index >= 0 ? index : 0;
};

export default function ProjectProgressPage() {
    const params = useParams();
    const router = useRouter();
    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            if (!params.id) return;
            try {
                const data = await projectApi.getById(parseInt(params.id as string));
                setProject(data);
            } catch (error) {
                console.error("Error fetching project:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProject();
    }, [params.id]);

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading project details...</div>;
    }

    if (!project) {
        return <div className="p-8 text-center text-destructive">Project not found</div>;
    }

    const wizardCompletion = calculateWizardCompletion(project);
    const lifecycleIndex = getLifecycleIndex(project.status);

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-card border-b">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/developer/projects">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-semibold text-xl">{project.name}</h1>
                            <p className="text-sm text-muted-foreground font-mono">{project.code}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Badge className={cn(
                            lifecycleIndex >= 5 ? "bg-green-500" :
                                lifecycleIndex >= 2 ? "bg-blue-500" : "bg-gray-500"
                        )}>
                            {lifecycleSteps[lifecycleIndex]?.label || "Draft"}
                        </Badge>
                        <Link href={`/dashboard/developer/project/${project.id}/wizard/basic-info?type=${(project.project_type || "solar").toLowerCase()}`}>
                            <Button variant="outline">Edit Project</Button>
                        </Link>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-5xl mx-auto space-y-8">

                    {/* Wizard Completion Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>Wizard Completion</span>
                                <span className="text-2xl font-bold text-primary">{wizardCompletion.percentage}%</span>
                            </CardTitle>
                            <CardDescription>
                                {wizardCompletion.completedCount} of {wizardCompletion.total} steps completed
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Progress value={wizardCompletion.percentage} className="h-3 mb-6" />

                            <div className="grid grid-cols-5 gap-4">
                                {wizardSteps.map((step) => {
                                    const isComplete = wizardCompletion.steps[step.id as keyof typeof wizardCompletion.steps];
                                    const Icon = step.icon;

                                    return (
                                        <Link
                                            key={step.id}
                                            href={`/dashboard/developer/project/${project.id}/wizard/${step.id}?type=${project.project_type || "solar"}`}
                                            className="block"
                                        >
                                            <div className={cn(
                                                "p-4 rounded-lg border-2 text-center transition-all hover:shadow-md cursor-pointer",
                                                isComplete
                                                    ? "border-green-500 bg-green-50"
                                                    : "border-muted bg-muted/30 hover:border-primary/50"
                                            )}>
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center",
                                                    isComplete ? "bg-green-500 text-white" : "bg-muted"
                                                )}>
                                                    {isComplete ? (
                                                        <CheckCircle2 className="h-5 w-5" />
                                                    ) : (
                                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <p className={cn(
                                                    "text-xs font-medium",
                                                    isComplete ? "text-green-700" : "text-muted-foreground"
                                                )}>
                                                    {step.label}
                                                </p>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Registry Lifecycle Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Registry Lifecycle</CardTitle>
                            <CardDescription>Project status in the carbon credit issuance process</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative flex justify-between items-center py-8 px-4">
                                {/* Progress Bar Background */}
                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-muted -z-10" />
                                {/* Progress Bar Fill */}
                                <div
                                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary -z-10 transition-all"
                                    style={{ width: `${(lifecycleIndex / (lifecycleSteps.length - 1)) * 100}%` }}
                                />

                                {/* Steps */}
                                {lifecycleSteps.map((step, index) => {
                                    let variant = "upcoming";
                                    if (index < lifecycleIndex) variant = "completed";
                                    else if (index === lifecycleIndex) variant = "current";

                                    return (
                                        <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2 z-10">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                                                variant === "completed" && "bg-primary border-primary text-primary-foreground",
                                                variant === "current" && "bg-background border-primary text-primary shadow-lg scale-110",
                                                variant === "upcoming" && "bg-muted border-muted-foreground/30 text-muted-foreground"
                                            )}>
                                                {variant === "completed" && <CheckCircle2 className="h-6 w-6" />}
                                                {variant === "current" && <Clock className="h-5 w-5 animate-pulse" />}
                                                {variant === "upcoming" && <Circle className="h-5 w-5" />}
                                            </div>
                                            <span className={cn(
                                                "text-xs font-medium whitespace-nowrap",
                                                variant === "current" ? "text-primary" : "text-muted-foreground"
                                            )}>
                                                {step.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Action Item */}
                            <div className="mt-6 bg-muted/50 p-6 rounded-lg border">
                                <h3 className="font-semibold mb-2 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4 text-blue-500" />
                                    Next Steps
                                </h3>
                                {wizardCompletion.percentage < 100 ? (
                                    <>
                                        <p className="text-sm text-muted-foreground">
                                            Complete all wizard steps to submit your project for validation.
                                            You have {5 - wizardCompletion.completedCount} step(s) remaining.
                                        </p>
                                        <Link href={`/dashboard/developer/project/${project.id}/wizard/basic-info?type=${project.project_type || "solar"}`}>
                                            <Button className="mt-4" size="sm">Continue Wizard</Button>
                                        </Link>
                                    </>
                                ) : lifecycleIndex === 0 ? (
                                    <>
                                        <p className="text-sm text-muted-foreground">
                                            All wizard steps complete! Submit your project to the registry for validation.
                                        </p>
                                        <Link href={`/dashboard/developer/project/${project.id}/wizard/registry-submission?type=${project.project_type || "solar"}`}>
                                            <Button className="mt-4" size="sm">Submit to Registry</Button>
                                        </Link>
                                    </>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Your project is currently under review. No specific actions are required at this time.
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Project Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Project Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Type</span>
                                    <span className="font-medium capitalize">{(project.project_type || "Unknown").replace('_', ' ')}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Country</span>
                                    <span className="font-medium">{project.wizard_data?.country || project.country || "-"}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Capacity</span>
                                    <span className="font-medium">
                                        {project.wizard_data?.installedCapacityDC || project.wizard_data?.installedCapacity
                                            ? `${project.wizard_data?.installedCapacityDC || project.wizard_data?.installedCapacity} MWp`
                                            : "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2 border-b">
                                    <span className="text-muted-foreground">Est. Credits</span>
                                    <span className="font-medium">
                                        {project.wizard_data?.estimationResult?.total_er_tco2e
                                            ? `${project.wizard_data.estimationResult.total_er_tco2e.toLocaleString()} tCO₂e`
                                            : "-"}
                                    </span>
                                </div>
                                <div className="flex justify-between py-2">
                                    <span className="text-muted-foreground">Last Updated</span>
                                    <span className="font-medium">{new Date(project.updated_at || project.created_at).toLocaleDateString()}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {project.wizard_data?.uploadedDocs && Object.keys(project.wizard_data.uploadedDocs).length > 0 ? (
                                    <ul className="space-y-2">
                                        {Object.entries(project.wizard_data.uploadedDocs).map(([key, file]: [string, any]) => (
                                            file && (
                                                <li key={key} className="flex items-center justify-between text-sm py-2 px-3 bg-muted/40 rounded">
                                                    <span className="truncate max-w-[200px]">{file.name}</span>
                                                    <Badge variant="secondary" className="text-xs">Uploaded</Badge>
                                                </li>
                                            )
                                        ))}
                                    </ul>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground text-sm">
                                        No documents uploaded yet.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}

