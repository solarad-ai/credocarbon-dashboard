"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, GitBranch, Search, Filter, Eye, ChevronRight, Clock,
    CheckCircle2, AlertCircle, XCircle, FileText, Loader2, ArrowRight
} from "lucide-react";
import { projectApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Project {
    id: number;
    name: string;
    code: string;
    type: string;
    status: string;
    registry: string;
    credits_issued: number;
    created_at: string;
}

const stageOrder = ["DRAFT", "SUBMITTED_TO_VVB", "VALIDATION_PENDING", "VALIDATION_APPROVED", "VERIFICATION_PENDING", "VERIFICATION_APPROVED", "REGISTRY_REVIEW", "ISSUED"];
const stageConfig: Record<string, { label: string; number: number }> = {
    DRAFT: { label: "Draft", number: 1 },
    SUBMITTED_TO_VVB: { label: "Submitted", number: 2 },
    VALIDATION_PENDING: { label: "Validating", number: 3 },
    VALIDATION_APPROVED: { label: "Validated", number: 4 },
    VERIFICATION_PENDING: { label: "Verifying", number: 5 },
    VERIFICATION_APPROVED: { label: "Verified", number: 6 },
    REGISTRY_REVIEW: { label: "Registry", number: 7 },
    ISSUED: { label: "Issued", number: 8 },
};

const currentStageConfig: Record<string, { color: string; label: string }> = {
    DRAFT: { color: "bg-gray-100 text-gray-700", label: "Draft" },
    SUBMITTED_TO_VVB: { color: "bg-blue-100 text-blue-700", label: "Submitted to VVB" },
    VALIDATION_PENDING: { color: "bg-yellow-100 text-yellow-700", label: "Under Validation" },
    VALIDATION_APPROVED: { color: "bg-green-100 text-green-700", label: "Validation Approved" },
    VERIFICATION_PENDING: { color: "bg-purple-100 text-purple-700", label: "Under Verification" },
    VERIFICATION_APPROVED: { color: "bg-indigo-100 text-indigo-700", label: "Verification Approved" },
    REGISTRY_REVIEW: { color: "bg-orange-100 text-orange-700", label: "Registry Review" },
    ISSUED: { color: "bg-emerald-100 text-emerald-700", label: "Issued" },
};


export default function LifecycleOverviewPage() {
    const [searchQuery, setSearchQuery] = useState("");
    const [stageFilter, setStageFilter] = useState<string>("all");
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const data = await projectApi.list();
            setProjects(data);
        } catch (err) {
            console.error("Error fetching projects:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (project.code && project.code.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesStage = stageFilter === "all" || project.status === stageFilter;
        return matchesSearch && matchesStage;
    });

    const getProgress = (status: string) => {
        const index = stageOrder.indexOf(status);
        return index >= 0 ? ((index + 1) / stageOrder.length) * 100 : 0;
    };

    const getStageStatus = (currentStatus: string, checkStatus: string) => {
        const currentIndex = stageOrder.indexOf(currentStatus);
        const checkIndex = stageOrder.indexOf(checkStatus);

        if (checkIndex < currentIndex) return "completed";
        if (checkIndex === currentIndex) return "active";
        return "pending";
    };


    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading lifecycle data...</p>
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
                        <GitBranch className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Project Lifecycle</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Track validation and verification progress</p>
                    </div>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                {Object.entries(currentStageConfig).map(([key, config]) => {
                    const count = projects.filter(p => p.status === key).length;
                    return (
                        <Card
                            key={key}
                            className={cn(
                                "card-hover cursor-pointer",
                                stageFilter === key && "ring-2 ring-primary"
                            )}
                            onClick={() => setStageFilter(stageFilter === key ? "all" : key)}
                        >
                            <CardContent className="pt-6 text-center">
                                <div className="text-2xl font-bold">{count}</div>
                                <p className="text-xs text-muted-foreground">{config.label}</p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search projects..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 h-11"
                            />
                        </div>
                        <Select value={stageFilter} onValueChange={setStageFilter}>
                            <SelectTrigger className="w-full md:w-48 h-11">
                                <SelectValue placeholder="All Stages" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Stages</SelectItem>
                                {Object.entries(currentStageConfig).map(([key, config]) => (
                                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Projects List */}
            <div className="space-y-4">

                {filteredProjects.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <GitBranch className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No projects found in this lifecycle stage</p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredProjects.map((project) => {
                        const progress = getProgress(project.status);
                        const stageStatus = currentStageConfig[project.status] || currentStageConfig.DRAFT;

                        return (
                            <Card key={project.id} className="hover:shadow-md transition-shadow overflow-hidden">
                                <CardContent className="p-0">
                                    <div className="p-6">
                                        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-6">
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <h3 className="font-semibold text-lg">{project.name}</h3>
                                                    <Badge variant="outline">{project.registry || "N/A"}</Badge>
                                                    <Badge className={cn(stageStatus.color)}>
                                                        {stageStatus.label}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {project.code || "No code"} • {project.type}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3">
                                                <Link href={`/dashboard/developer/project/${project.id}/progress`}>
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>

                                        {/* Stage Pipeline */}
                                        <div className="flex items-center gap-2">
                                            {stageOrder.map((stage, index) => {
                                                const config = stageConfig[stage];
                                                const isLast = index === stageOrder.length - 1;
                                                const status = getStageStatus(project.status, stage);

                                                return (
                                                    <div key={stage} className="flex items-center flex-1">
                                                        <div className="flex flex-col items-center flex-1">
                                                            <div className={cn(
                                                                "w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium",
                                                                status === "completed" && "bg-green-500",
                                                                status === "active" && "bg-blue-500 animate-pulse",
                                                                status === "pending" && "bg-gray-300 dark:bg-gray-600"
                                                            )}>
                                                                {status === "completed" ? (
                                                                    <CheckCircle2 className="h-5 w-5" />
                                                                ) : status === "active" ? (
                                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                                ) : (
                                                                    config.number
                                                                )}
                                                            </div>
                                                            <p className="text-xs text-muted-foreground mt-1 text-center">
                                                                {config.label}
                                                            </p>
                                                        </div>
                                                        {!isLast && (
                                                            <div className={cn(
                                                                "h-0.5 flex-1",
                                                                status === "completed" ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"
                                                            )} />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="bg-muted px-6 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <Progress value={progress} className="flex-1 h-2" />
                                            <span className="text-sm font-medium w-12">{progress.toFixed(0)}%</span>
                                        </div>
                                        {project.credits_issued > 0 && (
                                            <div className="ml-4 text-sm">
                                                <span className="text-muted-foreground">Credits Issued: </span>
                                                <span className="font-semibold text-gradient">{project.credits_issued.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
