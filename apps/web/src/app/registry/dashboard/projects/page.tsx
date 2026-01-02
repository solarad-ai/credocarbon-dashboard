"use client";

import { useEffect, useState } from "react";
import {
    FolderKanban,
    Clock,
    CheckCircle2,
    AlertTriangle,
    Search,
    ChevronRight,
    Coins,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface Project {
    project_id: number;
    project_name: string;
    project_code: string;
    project_type: string;
    developer_name: string;
    review_id: number;
    review_status: string;
    submitted_at: string;
    open_queries: number;
    has_pending_issuance: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://credocarbon-api-641001192587.asia-south2.run.app";

const statusColors: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    CLARIFICATIONS_REQUESTED: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    APPROVED_WITH_CONDITIONS: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
};

export default function RegistryProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<string>("all");

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE_URL}/api/registry/dashboard/projects`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            } else {
                setProjects([]);
            }
        } catch (err) {
            setProjects([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = projects.filter((project) => {
        const matchesSearch =
            project.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.project_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
            project.developer_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === "all" || project.review_status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <FolderKanban className="h-7 w-7 text-blue-500" />
                        Projects for Review
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Projects submitted for registry review and issuance
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search projects..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={filterStatus === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterStatus("all")}
                        className={filterStatus === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                        All
                    </Button>
                    <Button
                        variant={filterStatus === "PENDING" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterStatus("PENDING")}
                        className={filterStatus === "PENDING" ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                        Pending
                    </Button>
                    <Button
                        variant={filterStatus === "APPROVED" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFilterStatus("APPROVED")}
                        className={filterStatus === "APPROVED" ? "bg-blue-600 hover:bg-blue-700" : ""}
                    >
                        Approved
                    </Button>
                </div>
            </div>

            {/* Projects List */}
            <div className="space-y-4">
                {filteredProjects.length === 0 ? (
                    <Card className="border-slate-200 dark:border-slate-700">
                        <CardContent className="py-12 text-center">
                            <FolderKanban className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                No projects found
                            </h3>
                            <p className="text-slate-500 mt-1">
                                {searchTerm ? "Try adjusting your search terms" : "No projects assigned yet"}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredProjects.map((project) => (
                        <Link
                            key={project.review_id}
                            href={`/registry/dashboard/reviews/${project.review_id}`}
                        >
                            <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-slate-200 dark:border-slate-700 hover:border-blue-500/50 dark:hover:border-blue-500/50">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                                                    {project.project_name}
                                                </h3>
                                                <Badge variant="outline" className="text-xs">
                                                    {project.project_code}
                                                </Badge>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                                                <span className="capitalize">{project.project_type}</span>
                                                <span>•</span>
                                                <span>{project.developer_name}</span>
                                                <span>•</span>
                                                <span>
                                                    Submitted: {new Date(project.submitted_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <Badge className={`${statusColors[project.review_status] || statusColors.PENDING}`}>
                                                    {project.review_status.replace(/_/g, " ")}
                                                </Badge>
                                                <div className="mt-2 flex items-center gap-2">
                                                    {project.open_queries > 0 && (
                                                        <div className="flex items-center gap-1 text-amber-600">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            <span className="text-xs">{project.open_queries} queries</span>
                                                        </div>
                                                    )}
                                                    {project.has_pending_issuance && (
                                                        <div className="flex items-center gap-1 text-blue-600">
                                                            <Coins className="h-4 w-4" />
                                                            <span className="text-xs">Pending issuance</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-slate-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    );
}
