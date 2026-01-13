"use client";

import { useEffect, useState } from "react";
import {
    UserCog,
    Plus,
    Search,
    Shield,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { superadminApi } from "@/lib/api";

interface Admin {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    profile_data: any;
}

export default function AdminsPage() {
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        permission_level: "READ_ONLY",
    });

    useEffect(() => {
        fetchAdmins();
    }, [page]);

    const fetchAdmins = async () => {
        setLoading(true);
        try {
            const data = await superadminApi.getAdmins({
                page,
                page_size: 20,
                search: search || undefined,
            });
            setAdmins(data.items);
            setTotalPages(data.total_pages);
            setTotal(data.total);
        } catch (err) {
            console.error("Failed to fetch admins", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchAdmins();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await superadminApi.createAdmin({
                email: formData.email,
                password: formData.password,
                permission_level: formData.permission_level,
                profile_data: { name: formData.name },
            });
            setShowForm(false);
            setFormData({ email: "", password: "", name: "", permission_level: "READ_ONLY" });
            fetchAdmins();
        } catch (err: any) {
            alert(err.message || "Failed to create admin");
        }
    };

    const getPermissionBadge = (profileData: any) => {
        const level = profileData?.permission_level || "UNKNOWN";
        const colors: Record<string, string> = {
            READ_ONLY: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
            EDITOR: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            FULL_ACCESS: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
        };
        return <Badge className={colors[level] || "bg-slate-100"}>{level.replace("_", " ")}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">{total} total admins</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Admin
                </Button>
            </div>

            {/* New Admin Form */}
            {showForm && (
                <Card className="dark:bg-slate-800 dark:border-slate-700 border-2 border-purple-500">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-slate-900 dark:text-white">Create New Admin</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Admin name"
                                        required
                                        className="dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Permission Level</Label>
                                    <Select
                                        value={formData.permission_level}
                                        onValueChange={(v) => setFormData({ ...formData, permission_level: v })}
                                    >
                                        <SelectTrigger className="dark:bg-slate-700 dark:border-slate-600">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="READ_ONLY">Read Only</SelectItem>
                                            <SelectItem value="EDITOR">Editor</SelectItem>
                                            <SelectItem value="FULL_ACCESS">Full Access</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="admin@credocarbon.com"
                                    type="email"
                                    required
                                    className="dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Password</Label>
                                <Input
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Strong password"
                                    type="password"
                                    required
                                    className="dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
                                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Create Admin</Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Search */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search admins..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Search</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Admins List */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : admins.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">No admins found</div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {admins.map((admin) => (
                                <div key={admin.id} className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                                            <Shield className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                {admin.profile_data?.name || "Admin"}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{admin.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {getPermissionBadge(admin.profile_data)}
                                        <Badge className={admin.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                            {admin.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                        <Badge variant="outline">{admin.role}</Badge>
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
