"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, MapPin, Calendar, FileText, Users, Shield, Leaf, DollarSign, Activity, Edit, BarChart3, Building2, Settings } from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { projectApi } from "@/lib/api";

// Helper to display a field
const DetailRow = ({ label, value }: { label: string; value: any }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 py-3 border-b last:border-0">
        <dt className="font-medium text-muted-foreground">{label}</dt>
        <dd className="col-span-2 font-medium">{value || "-"}</dd>
    </div>
);

const StatusBadge = ({ status }: { status: string }) => {
    const config: Record<string, { color: string; label: string }> = {
        DRAFT: { color: "bg-gray-100 text-gray-700", label: "Draft" },
        SUBMITTED: { color: "bg-blue-100 text-blue-700", label: "Submitted" },
        VALIDATION: { color: "bg-yellow-100 text-yellow-700", label: "In Validation" },
        VERIFICATION: { color: "bg-purple-100 text-purple-700", label: "In Verification" },
        REGISTRY_REVIEW: { color: "bg-orange-100 text-orange-700", label: "Registry Review" },
        ISSUED: { color: "bg-green-100 text-green-700", label: "Issued" },
    };
    const { color, label } = config[status] || { color: "bg-gray-100", label: status };
    return <Badge className={color}>{label}</Badge>;
};

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [project, setProject] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProject = async () => {
            try {
                const data = await projectApi.getById(Number(params.id));
                setProject(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        if (params.id) fetchProject();
    }, [params.id]);

    if (loading) return (
        <div className="flex justify-center items-center p-12 min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );

    if (!project) return (
        <div className="p-8 text-center">
            <h2 className="text-xl font-semibold mb-2">Project not found</h2>
            <Link href="/dashboard/developer/projects">
                <Button variant="outline">Back to Projects</Button>
            </Link>
        </div>
    );

    const wd = project.wizard_data || {};
    const stakeholders = wd.stakeholders || [];
    const compliance = wd.compliance || {};
    const estimation = wd.estimationResult || {};

    // Calculate wizard completion percentage
    const wizardSteps = [
        wd.projectName || project.name,
        wd.country,
        estimation.total_er_tco2e,
        stakeholders.length > 0,
        compliance.environmentalChecklist?.length > 0,
    ];
    const completedSteps = wizardSteps.filter(Boolean).length;
    const completionPercentage = Math.round((completedSteps / wizardSteps.length) * 100);

    return (
        <div className="space-y-6 max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Link href="/dashboard/developer/projects">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
                        <div className="flex items-center space-x-2 text-muted-foreground mt-1">
                            <Badge variant="outline" className="font-mono">{project.code}</Badge>
                            <span>•</span>
                            <span className="capitalize">{project.project_type}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <StatusBadge status={project.status} />
                    <Button variant="outline" onClick={() => router.push(`/dashboard/developer/project/${project.id}/wizard/basic-info`)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Project
                    </Button>
                </div>
            </div>

            {/* Progress Bar */}
            <Card>
                <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Wizard Completion</span>
                        <span className="text-sm text-muted-foreground">{completionPercentage}%</span>
                    </div>
                    <Progress value={completionPercentage} className="h-2" />
                </CardContent>
            </Card>

            {/* Main Grid */}
            <div className="grid gap-6 md:grid-cols-3">
                {/* Left Column - Main Details */}
                <div className="md:col-span-2 space-y-6">
                    {/* Project Overview */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Project Overview
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {wd.description || "No description provided."}
                            </p>
                            <Separator />
                            <dl className="text-sm">
                                <DetailRow label="Project Name" value={project.name} />
                                <DetailRow label="Project Code" value={project.code} />
                                <DetailRow label="Project Type" value={project.project_type} />
                                <DetailRow label="Country" value={wd.country} />
                                <DetailRow label="Status" value={project.status} />
                                <DetailRow label="Registry" value={wd.registry || "Verra VCS"} />
                                <DetailRow label="Methodology" value={wd.methodology || estimation.methodology_id} />
                            </dl>
                        </CardContent>
                    </Card>

                    {/* Credit Estimation */}
                    {estimation.total_er_tco2e && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5" />
                                    Carbon Credit Estimation
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <p className="text-2xl font-bold text-green-700">
                                            {estimation.total_er_tco2e?.toLocaleString() || 0}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Total Credits (tCO₂e)</p>
                                    </div>
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <p className="text-2xl font-bold text-blue-700">
                                            {estimation.total_generation_mwh?.toLocaleString() || 0}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Generation (MWh)</p>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                                        <p className="text-2xl font-bold text-purple-700">
                                            {estimation.ef_value || 0}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Grid EF (tCO₂/MWh)</p>
                                    </div>
                                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                                        <p className="text-2xl font-bold text-orange-700">
                                            {estimation.baseline_emissions_tco2e?.toLocaleString() || 0}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Baseline (tCO₂e)</p>
                                    </div>
                                </div>
                                <dl className="text-sm">
                                    <DetailRow label="Methodology" value={estimation.methodology_id} />
                                    <DetailRow label="Registry" value={estimation.registry} />
                                    <DetailRow label="Country" value={estimation.country_code} />
                                    <DetailRow label="EF Source" value={estimation.ef_source} />
                                </dl>
                            </CardContent>
                        </Card>
                    )}

                    {/* Stakeholders */}
                    {stakeholders.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Stakeholders ({stakeholders.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {stakeholders.slice(0, 5).map((s: any, i: number) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                            <div>
                                                <p className="font-medium">{s.name}</p>
                                                <p className="text-sm text-muted-foreground">{s.type} • {s.email}</p>
                                            </div>
                                            <Badge variant="outline">{s.role}</Badge>
                                        </div>
                                    ))}
                                    {stakeholders.length > 5 && (
                                        <p className="text-sm text-muted-foreground text-center">
                                            +{stakeholders.length - 5} more stakeholders
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Compliance Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5" />
                                Compliance & Safeguards
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <Leaf className="h-6 w-6 mx-auto text-green-600 mb-2" />
                                    <p className="font-medium">Environmental</p>
                                    <p className="text-sm text-muted-foreground">
                                        {compliance.environmentalChecklist?.filter((c: any) => c.checked).length || 0} / {compliance.environmentalChecklist?.length || 5} Complete
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <Users className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                                    <p className="font-medium">Social</p>
                                    <p className="text-sm text-muted-foreground">
                                        {compliance.socialChecklist?.filter((c: any) => c.checked).length || 0} / {compliance.socialChecklist?.length || 5} Complete
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-purple-50 rounded-lg">
                                    <FileText className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                                    <p className="font-medium">Legal</p>
                                    <p className="text-sm text-muted-foreground">
                                        {compliance.legalChecklist?.filter((c: any) => c.checked).length || 0} / {compliance.legalChecklist?.length || 5} Complete
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Side Cards */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Credits Issued</span>
                                <span className="font-bold">{project.credits_issued || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Wizard Step</span>
                                <span className="font-bold capitalize">{project.wizard_step || "basic-info"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Created</span>
                                <span className="font-bold">{new Date(project.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Last Updated</span>
                                <span className="font-bold">{new Date(project.updated_at).toLocaleDateString()}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Location */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Location
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="font-medium">{wd.country || "Not specified"}</p>
                            <p className="text-sm text-muted-foreground">{wd.state || wd.region}</p>
                            {wd.coordinates && (
                                <p className="text-xs text-muted-foreground">{wd.coordinates}</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Timeline
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium">Start Date</p>
                                <p className="text-sm text-muted-foreground">{wd.startDate || "Not set"}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Crediting Period</p>
                                <p className="text-sm text-muted-foreground">
                                    {wd.creditingPeriodStart && wd.creditingPeriodEnd
                                        ? `${wd.creditingPeriodStart} to ${wd.creditingPeriodEnd}`
                                        : "Not set"}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                                <Settings className="h-4 w-4" />
                                Quick Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href={`/dashboard/developer/project/${project.id}/wizard/basic-info`}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Basic Info
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href={`/dashboard/developer/project/${project.id}/wizard/credit-estimation`}>
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Credit Estimation
                                </Link>
                            </Button>
                            <Button variant="outline" className="w-full justify-start" asChild>
                                <Link href={`/dashboard/developer/project/${project.id}/wizard/registry-submission`}>
                                    <FileText className="h-4 w-4 mr-2" />
                                    Registry Package
                                </Link>
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
