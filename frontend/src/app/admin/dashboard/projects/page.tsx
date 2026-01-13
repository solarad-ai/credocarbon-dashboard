"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, FolderKanban, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi } from "@/lib/api";

interface Project {
    id: number;
    name: string;
    developer_id: number;
    status: string;
    registry: string;
    project_type: string;
    country: string;
    created_at: string;
    updated_at: string;
}

export default function AdminProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchProjects();
    }, [page, statusFilter]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const params: any = { page, page_size: 20 };
            if (statusFilter !== "all") params.status = statusFilter;
            if (search) params.search = search;
            const data = await adminApi.getProjects(params);
            setProjects(data.projects || []);
            setTotalPages(data.total_pages || 1);
            setTotal(data.total || 0);
        } catch (error) {
            console.error("Failed to fetch projects:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchProjects();
    };

    const getStatusBadgeColor = (status: string) => {
        const colors: Record<string, string> = {
            DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
            SUBMITTED_TO_VVB: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
            VALIDATION_PENDING: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            VALIDATION_APPROVED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
            VERIFICATION_PENDING: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            VERIFICATION_APPROVED: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
            REGISTRY_REVIEW: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            ISSUED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
        };
        return colors[status] || "bg-slate-100 text-slate-700";
    };

    const projectStatuses = [
        "DRAFT",
        "SUBMITTED_TO_VVB",
        "VALIDATION_PENDING",
        "VALIDATION_APPROVED",
        "VERIFICATION_PENDING",
        "VERIFICATION_APPROVED",
        "REGISTRY_REVIEW",
        "ISSUED",
    ];

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Projects
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Monitor all platform projects
                </p>
            </div>

            {/* Filters */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by project name..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full md:w-48 dark:bg-slate-700 dark:border-slate-600">
                                <SelectValue placeholder="All Statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                {projectStatuses.map((status) => (
                                    <SelectItem key={status} value={status}>
                                        {status.replace(/_/g, " ")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="submit" className="bg-fuchsia-600 hover:bg-fuchsia-700">
                            Search
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Results Count */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing {projects.length} of {total} projects
                </p>
            </div>

            {/* Projects Table */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fuchsia-500"></div>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-12">
                            <FolderKanban className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">No projects found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Project</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Type</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Registry</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Status</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Country</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {projects.map((project) => (
                                        <tr key={project.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{project.name || "Unnamed Project"}</p>
                                                    <p className="text-xs text-slate-500">ID: {project.id}</p>
                                                </div>
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                                {project.project_type || "-"}
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                                {project.registry || "-"}
                                            </td>
                                            <td className="p-4">
                                                <Badge className={getStatusBadgeColor(project.status)}>
                                                    {project.status?.replace(/_/g, " ") || "-"}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm text-slate-600 dark:text-slate-400">
                                                {project.country || "-"}
                                            </td>
                                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                                                {project.created_at ? new Date(project.created_at).toLocaleDateString() : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}
