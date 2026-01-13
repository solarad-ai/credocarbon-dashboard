"use client";

import { useEffect, useState } from "react";
import {
    ListTodo,
    Plus,
    Search,
    FileText,
    Link as LinkIcon,
    Tag,
    CheckCircle2,
    Clock,
    AlertCircle,
    Edit,
    Trash2,
    X,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { superadminApi } from "@/lib/api";

interface Task {
    id: number;
    type: string;
    title: string;
    description: string | null;
    link: string | null;
    status: string;
    priority: string;
    documents: string[];
    created_by: number | null;
    creator_email: string | null;
    created_at: string;
    updated_at: string;
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [formData, setFormData] = useState({
        type: "feature",
        title: "",
        description: "",
        link: "",
        priority: "medium",
    });

    useEffect(() => {
        fetchTasks();
    }, [page, typeFilter, statusFilter]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const data = await superadminApi.getTasks({
                page,
                page_size: 20,
                task_type: typeFilter !== "all" ? typeFilter : undefined,
                status: statusFilter !== "all" ? statusFilter : undefined,
            });
            setTasks(data.items);
            setTotalPages(data.total_pages);
            setTotal(data.total);
        } catch (err) {
            console.error("Failed to fetch tasks", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await superadminApi.createTask(formData);
            setShowForm(false);
            setFormData({ type: "feature", title: "", description: "", link: "", priority: "medium" });
            fetchTasks();
        } catch (err: any) {
            alert(err.message || "Failed to create task");
        }
    };

    const handleDelete = async (taskId: number) => {
        if (!confirm("Are you sure you want to delete this task?")) return;
        try {
            await superadminApi.deleteTask(taskId);
            fetchTasks();
        } catch (err) {
            console.error("Failed to delete task", err);
        }
    };

    const handleStatusChange = async (taskId: number, newStatus: string) => {
        try {
            await superadminApi.updateTask(taskId, { status: newStatus });
            fetchTasks();
        } catch (err) {
            console.error("Failed to update task", err);
        }
    };

    const getTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            feature: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            registry: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            methodology: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            other: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
        };
        return <Badge className={colors[type] || "bg-slate-100"}>{type}</Badge>;
    };

    const getStatusBadge = (status: string) => {
        const config: Record<string, { color: string; icon: React.ReactNode }> = {
            pending: { color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: <Clock className="h-3 w-3" /> },
            in_progress: { color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <AlertCircle className="h-3 w-3" /> },
            completed: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: <CheckCircle2 className="h-3 w-3" /> },
        };
        const { color, icon } = config[status] || { color: "bg-slate-100", icon: null };
        return <Badge className={`${color} flex items-center gap-1`}>{icon}{status.replace("_", " ")}</Badge>;
    };

    const getPriorityColor = (priority: string) => {
        const colors: Record<string, string> = {
            low: "text-slate-500",
            medium: "text-amber-500",
            high: "text-red-500",
        };
        return colors[priority] || "text-slate-500";
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Task Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {total} tasks for features, registries, and methodologies
                    </p>
                </div>
                <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Task
                </Button>
            </div>

            {/* New Task Form */}
            {showForm && (
                <Card className="dark:bg-slate-800 dark:border-slate-700 border-2 border-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-slate-900 dark:text-white">Create New Task</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                        <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="feature">Feature</SelectItem>
                                            <SelectItem value="registry">Registry</SelectItem>
                                            <SelectItem value="methodology">Methodology</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Priority</Label>
                                    <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                                        <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="low">Low</SelectItem>
                                            <SelectItem value="medium">Medium</SelectItem>
                                            <SelectItem value="high">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Task title"
                                    required
                                    className="dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Detailed description of the task"
                                    rows={3}
                                    className="dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Link (Documentation/Reference)</Label>
                                <Input
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    placeholder="https://..."
                                    type="url"
                                    className="dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                                    Create Task
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Filters */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-full sm:w-40 dark:bg-slate-700 dark:border-slate-600">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="feature">Feature</SelectItem>
                                <SelectItem value="registry">Registry</SelectItem>
                                <SelectItem value="methodology">Methodology</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-full sm:w-40 dark:bg-slate-700 dark:border-slate-600">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Tasks List */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : tasks.length === 0 ? (
                        <div className="p-8 text-center">
                            <ListTodo className="h-12 w-12 mx-auto text-slate-400 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">No tasks found</p>
                            <Button onClick={() => setShowForm(true)} className="mt-4 bg-purple-600 hover:bg-purple-700">
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Task
                            </Button>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {tasks.map((task) => (
                                <div key={task.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getTypeBadge(task.type)}
                                                {getStatusBadge(task.status)}
                                                <Tag className={`h-4 w-4 ${getPriorityColor(task.priority)}`} />
                                            </div>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                                                {task.title}
                                            </h3>
                                            {task.description && (
                                                <p className="text-slate-500 dark:text-slate-400 text-sm mb-3">
                                                    {task.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 text-sm">
                                                {task.link && (
                                                    <a
                                                        href={task.link}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:underline"
                                                    >
                                                        <LinkIcon className="h-4 w-4" />
                                                        Reference Link
                                                    </a>
                                                )}
                                                {task.creator_email && (
                                                    <span className="text-slate-500">
                                                        Created by {task.creator_email}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Select
                                                value={task.status}
                                                onValueChange={(v) => handleStatusChange(task.id, v)}
                                            >
                                                <SelectTrigger className="w-32 h-8 text-xs dark:bg-slate-700">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="pending">Pending</SelectItem>
                                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                                    <SelectItem value="completed">Completed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500"
                                                onClick={() => handleDelete(task.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
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
        </div>
    );
}
