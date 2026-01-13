"use client";

import { useEffect, useState } from "react";
import {
    Building2,
    Plus,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { superadminApi } from "@/lib/api";

interface RegistryUser {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    profile_data: any;
}

interface FormMessage {
    type: 'success' | 'error';
    text: string;
}

export default function RegistryUsersPage() {
    const [registryUsers, setRegistryUsers] = useState<RegistryUser[]>([]);
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
        registry_name: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState<FormMessage | null>(null);

    useEffect(() => {
        fetchRegistryUsers();
    }, [page]);

    const fetchRegistryUsers = async () => {
        setLoading(true);
        try {
            const data = await superadminApi.getRegistryUsers();
            setRegistryUsers(data.items || []);
            setTotalPages(data.total_pages || 1);
            setTotal(data.total || 0);
        } catch (err) {
            console.error("Failed to fetch Registry users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchRegistryUsers();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormMessage(null);
        try {
            await superadminApi.createRegistryUser({
                email: formData.email,
                password: formData.password,
                profile_data: {
                    name: formData.name,
                    registry_name: formData.registry_name
                },
            });
            setFormMessage({ type: 'success', text: 'Registry user created successfully!' });
            setFormData({ email: "", password: "", name: "", registry_name: "" });
            fetchRegistryUsers();
            // Auto-close form after success
            setTimeout(() => {
                setShowForm(false);
                setFormMessage(null);
            }, 2000);
        } catch (err: any) {
            const errorMessage = err.message || "Failed to create Registry user";
            setFormMessage({ type: 'error', text: errorMessage });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Registry User Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">{total} total Registry users</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="bg-teal-600 hover:bg-teal-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New Registry User
                </Button>
            </div>

            {/* New Registry User Form */}
            {showForm && (
                <Card className="dark:bg-slate-800 dark:border-slate-700 border-2 border-teal-500">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-slate-900 dark:text-white">Create New Registry User</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Form Message */}
                            {formMessage && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg ${formMessage.type === 'success'
                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {formMessage.type === 'success' ? (
                                        <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
                                    ) : (
                                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                                    )}
                                    <span className="text-sm">{formMessage.text}</span>
                                </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Registry user name"
                                        required
                                        disabled={submitting}
                                        className="dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Registry Name</Label>
                                    <Input
                                        value={formData.registry_name}
                                        onChange={(e) => setFormData({ ...formData, registry_name: e.target.value })}
                                        placeholder="e.g., Gold Standard, Verra"
                                        required
                                        disabled={submitting}
                                        className="dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Email</Label>
                                <Input
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="registry@example.com"
                                    type="email"
                                    required
                                    disabled={submitting}
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
                                    disabled={submitting}
                                    className="dark:bg-slate-700 dark:border-slate-600"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => { setShowForm(false); setFormMessage(null); }} disabled={submitting}>Cancel</Button>
                                <Button type="submit" disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : "Create Registry User"}
                                </Button>
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
                                placeholder="Search Registry users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <Button type="submit" className="bg-teal-600 hover:bg-teal-700">Search</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Registry Users List */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-500"></div>
                        </div>
                    ) : registryUsers.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">No Registry users found</div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {registryUsers.map((user) => (
                                <div key={user.id} className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
                                            <Building2 className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                {user.profile_data?.name || "Registry User"}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                                            {user.profile_data?.registry_name && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500">{user.profile_data.registry_name}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge className={user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                            {user.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                        <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">Registry</Badge>
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
