"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft, Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2,
    ChevronDown, Calendar, MapPin, Building2, Loader2, RefreshCw
} from "lucide-react";
import { projectApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { FeatureGate } from "@/components/FeatureGate";

interface Project {
    id: number;
    name: string;
    code: string;
    type: string;
    status: string;
    registry: string;
    country: string;
    credits_issued: number;
    created_at: string;
    updated_at: string;
    project_type?: string;
}

const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: "Draft", color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" },
    submitted: { label: "Submitted to VVB", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
    validation: { label: "Under Validation", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" },
    verification: { label: "Under Verification", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
    registry_review: { label: "Registry Review", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
    issued: { label: "Issued", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
};

const projectTypeColors: Record<string, string> = {
    "solar": "text-yellow-600",
    "wind": "text-blue-500",
    "redd": "text-green-700",
    "afforestation": "text-emerald-600",
    "biogas": "text-stone-600",
    "hydro": "text-cyan-600",
};

export default function ProjectsListPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [typeFilter, setTypeFilter] = useState<string>("all");
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Multi-select deletion state
    const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteProgress, setDeleteProgress] = useState("");

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const data = await projectApi.list();
            setProjects(data as Project[]);
        } catch (err) {
            console.error("Error fetching projects:", err);

            // Check if error is due to authentication
            const errorMessage = err instanceof Error ? err.message : String(err);
            if (errorMessage.includes('401') || errorMessage.includes('Unauthorized') || errorMessage.includes('403')) {
                console.warn("Authentication failed while fetching projects. Session may be invalid.");

                // Clear invalid session
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('tokenExpiry');
                localStorage.removeItem('user');
                localStorage.removeItem('rememberMe');

                // Redirect to login
                alert('Your session has expired. Please log in again.');
                router.push('/developer/login');
            } else {
                // Show error message for other types of errors
                alert(`Failed to load projects: ${errorMessage}. Please try refreshing the page.`);
            }
        } finally {
            setLoading(false);
        }
    };

    // Toggle selection of a single project
    const toggleProjectSelection = (projectId: number) => {
        setSelectedProjects(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) {
                newSet.delete(projectId);
            } else {
                newSet.add(projectId);
            }
            return newSet;
        });
    };

    // Toggle select all (for filtered projects)
    const toggleSelectAll = () => {
        if (selectedProjects.size === filteredProjects.length) {
            setSelectedProjects(new Set());
        } else {
            setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
        }
    };

    // Bulk delete handler
    const handleBulkDelete = async () => {
        const count = selectedProjects.size;
        if (count === 0) return;

        if (!confirm(`Are you sure you want to delete ${count} project${count > 1 ? 's' : ''}? This action cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        const projectIds = Array.from(selectedProjects);
        let deletedCount = 0;
        const failedIds: number[] = [];

        for (const id of projectIds) {
            try {
                setDeleteProgress(`Deleting ${deletedCount + 1} of ${count}...`);
                await projectApi.delete(id);
                deletedCount++;
            } catch (error) {
                console.error(`Failed to delete project ${id}:`, error);
                failedIds.push(id);
            }
        }

        setIsDeleting(false);
        setDeleteProgress("");
        setSelectedProjects(new Set());

        if (failedIds.length > 0) {
            alert(`Deleted ${deletedCount} project(s). Failed to delete ${failedIds.length} project(s).`);
        }

        fetchProjects();
    };

    const handleDelete = async (e: React.MouseEvent, projectId: number) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this project? This action cannot be undone.")) {
            try {
                await projectApi.delete(projectId);
                fetchProjects();
            } catch (error) {
                console.error("Failed to delete project:", error);
                alert("Failed to delete project");
            }
        }
    };

    const handleEdit = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        const type = project.project_type || project.type || "solar";
        router.push(`/dashboard/developer/project/${project.id}/wizard/basic-info?type=${type.toLowerCase()}`);
    };

    const handleView = (e: React.MouseEvent, project: Project) => {
        e.stopPropagation();
        // Redirect to new progress view page
        router.push(`/dashboard/developer/project/${project.id}/progress`);
    };

    const filteredProjects = projects.filter(project => {
        const matchesSearch = (project.name && project.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (project.code && project.code.toLowerCase().includes(searchQuery.toLowerCase()));

        const projectStatus = project.status ? project.status.toLowerCase() : "";
        const matchesStatus = statusFilter === "all" || projectStatus === statusFilter.toLowerCase();

        const projectType = (project.project_type || project.type || "").toLowerCase();
        const matchesType = typeFilter === "all" || projectType === typeFilter.toLowerCase();

        return matchesSearch && matchesStatus && matchesType;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading projects...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">


            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Projects</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{projects.length} projects total</p>
                </div>
                <FeatureGate feature="dev.registry_onboarding">
                    <Link href="/dashboard/developer/project/create">
                        <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-lg">
                            <Plus className="mr-2 h-4 w-4" />
                            New Project
                        </Button>
                    </Link>
                </FeatureGate>
            </div>

            {/* Bulk Actions Bar - appears when items selected */}
            {selectedProjects.size > 0 && (
                <div className="flex items-center justify-between p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            checked={filteredProjects.length > 0 && selectedProjects.size === filteredProjects.length}
                            onCheckedChange={toggleSelectAll}
                            aria-label="Select all"
                        />
                        <span className="text-sm font-medium text-destructive">
                            {selectedProjects.size} project{selectedProjects.size > 1 ? 's' : ''} selected
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProjects(new Set())}
                            className="text-muted-foreground"
                        >
                            Clear selection
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {deleteProgress}
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete Selected
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}

            {/* Filters */}
            <Card>
                <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative md:col-span-2">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                className="pl-9"
                                placeholder="Search by name or code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <div className="flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    <SelectValue placeholder="Status" />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="submitted">Submitted</SelectItem>
                                <SelectItem value="validation">Under Validation</SelectItem>
                                <SelectItem value="verification">Under Verification</SelectItem>
                                <SelectItem value="registry_review">Registry Review</SelectItem>
                                <SelectItem value="issued">Issued</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Project Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="solar">Solar</SelectItem>
                                <SelectItem value="wind">Wind</SelectItem>
                                <SelectItem value="biogas">Biogas</SelectItem>
                                <SelectItem value="afforestation">Afforestation</SelectItem>
                                <SelectItem value="redd">REDD+</SelectItem>
                                <SelectItem value="hydro">Hydro</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>



            {/* Projects Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={filteredProjects.length > 0 && selectedProjects.size === filteredProjects.length}
                                    onCheckedChange={toggleSelectAll}
                                    aria-label="Select all"
                                />
                            </TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Project Name</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProjects.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                                    No projects found matching your filters.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredProjects.map((project) => (
                                <TableRow
                                    key={project.id}
                                    className={cn(
                                        "hover:bg-muted/50 group",
                                        selectedProjects.has(project.id) && "bg-primary/5"
                                    )}
                                >
                                    <TableCell className="w-12">
                                        <Checkbox
                                            checked={selectedProjects.has(project.id)}
                                            onCheckedChange={() => toggleProjectSelection(project.id)}
                                            onClick={(e) => e.stopPropagation()}
                                            aria-label={`Select ${project.name}`}
                                        />
                                    </TableCell>
                                    <TableCell
                                        className="font-mono text-xs text-muted-foreground cursor-pointer"
                                        onClick={(e) => handleView(e, project)}
                                    >
                                        {project.code || "-"}
                                    </TableCell>
                                    <TableCell
                                        className="cursor-pointer"
                                        onClick={(e) => handleView(e, project)}
                                    >
                                        <div className="font-medium text-base text-card-foreground">{project.name || "Untitled Project"}</div>
                                        {project.country && (
                                            <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <MapPin className="h-3 w-3" /> {project.country}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell
                                        className="cursor-pointer"
                                        onClick={(e) => handleView(e, project)}
                                    >
                                        <div className={cn("capitalize flex items-center gap-1.5 font-medium",
                                            projectTypeColors[(project.project_type || project.type || "").toLowerCase()] || "text-gray-600"
                                        )}>
                                            {/* Icon could change based on type */}
                                            {(project.project_type || project.type || "").replace('_', ' ')}
                                        </div>
                                    </TableCell>
                                    <TableCell
                                        className="cursor-pointer"
                                        onClick={(e) => handleView(e, project)}
                                    >
                                        {(() => {
                                            const statusKey = (project.status || "draft").toLowerCase();
                                            const config = statusConfig[statusKey] || { label: statusKey, color: "bg-gray-100 dark:bg-gray-800" };
                                            return (
                                                <Badge variant="secondary" className={cn("font-normal border-0", config.color)}>
                                                    {config.label}
                                                </Badge>
                                            );
                                        })()}
                                    </TableCell>
                                    <TableCell
                                        className="text-muted-foreground text-sm cursor-pointer"
                                        onClick={(e) => handleView(e, project)}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(project.created_at).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => handleView(e, project)}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    View Details
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => handleEdit(e, project)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit Project
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive"
                                                    onClick={(e) => handleDelete(e, project.id)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}

