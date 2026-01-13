"use client";

import { useEffect, useState } from "react";
import { FolderOpen, Search, ChevronLeft, ChevronRight, UserCheck, Building2, MoreHorizontal } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { superadminApi } from "@/lib/api";

interface Project {
    id: number;
    name: string | null;
    code: string | null;
    project_type: string | null;
    status: string;
    developer_id: number;
    developer_email: string | null;
    country: string | null;
    created_at: string;
    updated_at: string;
}

interface User {
    id: number;
    email: string;
    profile_data: any;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Assignment dialog state
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const [assignType, setAssignType] = useState<"vvb" | "registry">("vvb");
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [availableUsers, setAvailableUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>("");
    const [taskType, setTaskType] = useState("validation");
    const [assigning, setAssigning] = useState(false);
    const [assignSuccess, setAssignSuccess] = useState("");
    const [assignError, setAssignError] = useState("");

    useEffect(() => { fetchProjects(); }, [page, statusFilter]);

    const fetchProjects = async () => {
        setLoading(true);
        try {
            const data = await superadminApi.getProjects({
                page,
                page_size: 10,
                status: statusFilter !== "all" ? statusFilter : undefined,
                search: search || undefined,
            });
            setProjects(data.items);
            setTotalPages(data.total_pages);
            setTotal(data.total);
        } catch (err) {
            console.error("Failed to fetch projects", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchProjects();
    };

    const openAssignDialog = async (project: Project, type: "vvb" | "registry") => {
        setSelectedProject(project);
        setAssignType(type);
        setSelectedUserId("");
        setAssignSuccess("");
        setAssignError("");
        setAssignDialogOpen(true);

        // Fetch available users
        try {
            const data = type === "vvb"
                ? await superadminApi.getVVBUsers()
                : await superadminApi.getRegistryUsers();
            setAvailableUsers(data.users || []);
        } catch (err) {
            console.error("Failed to fetch users", err);
            setAvailableUsers([]);
        }
    };

    const handleAssign = async () => {
        if (!selectedProject || !selectedUserId) return;

        setAssigning(true);
        setAssignError("");
        setAssignSuccess("");

        try {
            if (assignType === "vvb") {
                await superadminApi.assignProjectToVVB(selectedProject.id, parseInt(selectedUserId), taskType);
                setAssignSuccess(`Project assigned to VVB for ${taskType}`);
            } else {
                await superadminApi.assignProjectToRegistry(selectedProject.id, parseInt(selectedUserId));
                setAssignSuccess("Project assigned to Registry for review");
            }
            setTimeout(() => {
                setAssignDialogOpen(false);
                fetchProjects();
            }, 1500);
        } catch (err: any) {
            setAssignError(err.message || "Assignment failed");
        } finally {
            setAssigning(false);
        }
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            DRAFT: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
            SUBMITTED_TO_VVB: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            VALIDATION_PENDING: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            VALIDATION_APPROVED: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            VERIFICATION_PENDING: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            VERIFICATION_APPROVED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400",
            REGISTRY_REVIEW: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            ISSUED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            REJECTED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
        };
        return <Badge className={colors[status] || "bg-slate-100"}>{status.replace(/_/g, " ")}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Project Management</h1>
                <p className="text-slate-500 dark:text-slate-400">{total} total projects · Assign projects to VVB or Registry</p>
            </div>

            {/* Filters */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search projects..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-full sm:w-48 dark:bg-slate-700 dark:border-slate-600">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="DRAFT">Draft</SelectItem>
                                <SelectItem value="SUBMITTED_TO_VVB">Submitted to VVB</SelectItem>
                                <SelectItem value="VALIDATION_PENDING">Validation Pending</SelectItem>
                                <SelectItem value="VALIDATION_APPROVED">Validation Approved</SelectItem>
                                <SelectItem value="VERIFICATION_PENDING">Verification Pending</SelectItem>
                                <SelectItem value="REGISTRY_REVIEW">Registry Review</SelectItem>
                                <SelectItem value="ISSUED">Issued</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Search</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Projects Table */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">No projects found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Project</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Developer</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Updated</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {projects.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{p.name || "Untitled"}</p>
                                                    <p className="text-xs text-slate-500">{p.code || `#${p.id}`}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{p.project_type || "-"}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{p.developer_email}</td>
                                            <td className="px-6 py-4">{getStatusBadge(p.status)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(p.updated_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => openAssignDialog(p, "vvb")}>
                                                            <UserCheck className="h-4 w-4 mr-2" />
                                                            Assign to VVB
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => openAssignDialog(p, "registry")}>
                                                            <Building2 className="h-4 w-4 mr-2" />
                                                            Assign to Registry
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-500">Page {page} of {totalPages}</p>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Assignment Dialog */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent className="dark:bg-slate-800">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {assignType === "vvb" ? (
                                <>
                                    <UserCheck className="h-5 w-5 text-purple-500" />
                                    Assign to VVB
                                </>
                            ) : (
                                <>
                                    <Building2 className="h-5 w-5 text-blue-500" />
                                    Assign to Registry
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedProject?.name || "Untitled Project"} ({selectedProject?.code || `#${selectedProject?.id}`})
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Select User */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Select {assignType === "vvb" ? "VVB" : "Registry"} User
                            </label>
                            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                                <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                                    <SelectValue placeholder={`Choose a ${assignType === "vvb" ? "VVB" : "Registry"} user`} />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableUsers.length === 0 ? (
                                        <SelectItem value="-" disabled>No users available</SelectItem>
                                    ) : (
                                        availableUsers.map((user) => (
                                            <SelectItem key={user.id} value={user.id.toString()}>
                                                {user.profile_data?.name || user.email}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Task Type (VVB only) */}
                        {assignType === "vvb" && (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Task Type
                                </label>
                                <Select value={taskType} onValueChange={setTaskType}>
                                    <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="validation">Validation</SelectItem>
                                        <SelectItem value="verification">Verification</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}

                        {/* Success/Error Messages */}
                        {assignSuccess && (
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
                                {assignSuccess}
                            </div>
                        )}
                        {assignError && (
                            <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm">
                                {assignError}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedUserId || assigning}
                            className={assignType === "vvb" ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}
                        >
                            {assigning ? "Assigning..." : "Assign Project"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
