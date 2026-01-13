"use client";

import { useEffect, useState } from "react";
import {
    UserCheck,
    Plus,
    Search,
    X,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Edit,
    Trash2,
    Key,
    MoreVertical
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { superadminApi } from "@/lib/api";

interface VVBUser {
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

export default function VVBUsersPage() {
    const [vvbUsers, setVvbUsers] = useState<VVBUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<VVBUser | null>(null);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        organization: "",
    });
    const [editData, setEditData] = useState({
        name: "",
        organization: "",
        is_active: true,
    });
    const [newPassword, setNewPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [formMessage, setFormMessage] = useState<FormMessage | null>(null);
    const [actionMenuOpen, setActionMenuOpen] = useState<number | null>(null);

    useEffect(() => {
        fetchVVBUsers();
    }, [page]);

    const fetchVVBUsers = async () => {
        setLoading(true);
        try {
            const data = await superadminApi.getVVBUsers({ page, search: search || undefined });
            setVvbUsers(data.items || []);
            setTotalPages(data.total_pages || 1);
            setTotal(data.total || 0);
        } catch (err) {
            console.error("Failed to fetch VVB users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchVVBUsers();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormMessage(null);
        try {
            await superadminApi.createVVBUser({
                email: formData.email,
                password: formData.password,
                profile_data: {
                    name: formData.name,
                    organization: formData.organization
                },
            });
            setFormMessage({ type: 'success', text: 'VVB user created successfully!' });
            setFormData({ email: "", password: "", name: "", organization: "" });
            fetchVVBUsers();
            setTimeout(() => {
                setShowForm(false);
                setFormMessage(null);
            }, 2000);
        } catch (err: any) {
            const errorMessage = err.message || "Failed to create VVB user";
            setFormMessage({ type: 'error', text: errorMessage });
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (user: VVBUser) => {
        setSelectedUser(user);
        setEditData({
            name: user.profile_data?.name || "",
            organization: user.profile_data?.organization || "",
            is_active: user.is_active,
        });
        setShowEditModal(true);
        setActionMenuOpen(null);
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser) return;
        setSubmitting(true);
        setFormMessage(null);
        try {
            await superadminApi.updateVVBUser(selectedUser.id, {
                is_active: editData.is_active,
                profile_data: {
                    name: editData.name,
                    organization: editData.organization,
                },
            });
            setFormMessage({ type: 'success', text: 'VVB user updated successfully!' });
            fetchVVBUsers();
            setTimeout(() => {
                setShowEditModal(false);
                setFormMessage(null);
                setSelectedUser(null);
            }, 1500);
        } catch (err: any) {
            setFormMessage({ type: 'error', text: err.message || "Failed to update user" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (user: VVBUser) => {
        setSelectedUser(user);
        setShowDeleteModal(true);
        setActionMenuOpen(null);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedUser) return;
        setSubmitting(true);
        try {
            await superadminApi.deleteVVBUser(selectedUser.id);
            setFormMessage({ type: 'success', text: 'VVB user deactivated successfully!' });
            fetchVVBUsers();
            setTimeout(() => {
                setShowDeleteModal(false);
                setFormMessage(null);
                setSelectedUser(null);
            }, 1500);
        } catch (err: any) {
            setFormMessage({ type: 'error', text: err.message || "Failed to deactivate user" });
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetPassword = (user: VVBUser) => {
        setSelectedUser(user);
        setNewPassword("");
        setShowResetModal(true);
        setActionMenuOpen(null);
    };

    const handleResetSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedUser || newPassword.length < 8) return;
        setSubmitting(true);
        setFormMessage(null);
        try {
            await superadminApi.resetVVBPassword(selectedUser.id, newPassword);
            setFormMessage({ type: 'success', text: 'Password reset successfully!' });
            setTimeout(() => {
                setShowResetModal(false);
                setFormMessage(null);
                setSelectedUser(null);
                setNewPassword("");
            }, 1500);
        } catch (err: any) {
            setFormMessage({ type: 'error', text: err.message || "Failed to reset password" });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">VVB User Management</h1>
                    <p className="text-slate-500 dark:text-slate-400">{total} total VVB users</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="bg-amber-600 hover:bg-amber-700">
                    <Plus className="h-4 w-4 mr-2" />
                    New VVB User
                </Button>
            </div>

            {/* New VVB User Form */}
            {showForm && (
                <Card className="dark:bg-slate-800 dark:border-slate-700 border-2 border-amber-500">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-slate-900 dark:text-white">Create New VVB User</CardTitle>
                        <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                            <X className="h-5 w-5" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
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
                                        placeholder="VVB user name"
                                        required
                                        disabled={submitting}
                                        className="dark:bg-slate-700 dark:border-slate-600"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Organization</Label>
                                    <Input
                                        value={formData.organization}
                                        onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                                        placeholder="VVB organization name"
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
                                    placeholder="vvb@example.com"
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
                                <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
                                    {submitting ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : "Create VVB User"}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Edit Modal */}
            {showEditModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4 dark:bg-slate-800 dark:border-slate-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-slate-900 dark:text-white">Edit VVB User</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => { setShowEditModal(false); setFormMessage(null); }}>
                                <X className="h-5 w-5" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleEditSubmit} className="space-y-4">
                                {formMessage && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg ${formMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {formMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                        <span className="text-sm">{formMessage.text}</span>
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <Label>Email (read-only)</Label>
                                    <Input value={selectedUser.email} disabled className="dark:bg-slate-600 dark:border-slate-500" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Name</Label>
                                    <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} disabled={submitting} className="dark:bg-slate-700 dark:border-slate-600" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Organization</Label>
                                    <Input value={editData.organization} onChange={(e) => setEditData({ ...editData, organization: e.target.value })} disabled={submitting} className="dark:bg-slate-700 dark:border-slate-600" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="is_active" checked={editData.is_active} onChange={(e) => setEditData({ ...editData, is_active: e.target.checked })} className="rounded" />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button type="button" variant="outline" onClick={() => { setShowEditModal(false); setFormMessage(null); }} disabled={submitting}>Cancel</Button>
                                    <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700">
                                        {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</> : "Save Changes"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4 dark:bg-slate-800 dark:border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-slate-900 dark:text-white">Deactivate VVB User</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {formMessage && (
                                <div className={`flex items-center gap-2 p-3 rounded-lg ${formMessage.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                    {formMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                    <span className="text-sm">{formMessage.text}</span>
                                </div>
                            )}
                            <p className="text-slate-600 dark:text-slate-400">
                                Are you sure you want to deactivate <strong>{selectedUser.email}</strong>? This will prevent them from logging in.
                            </p>
                            <div className="flex gap-2 justify-end">
                                <Button type="button" variant="outline" onClick={() => { setShowDeleteModal(false); setFormMessage(null); }} disabled={submitting}>Cancel</Button>
                                <Button onClick={handleDeleteConfirm} disabled={submitting} className="bg-red-600 hover:bg-red-700">
                                    {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Deactivating...</> : "Deactivate User"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-md mx-4 dark:bg-slate-800 dark:border-slate-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-slate-900 dark:text-white">Reset Password</CardTitle>
                            <Button variant="ghost" size="icon" onClick={() => { setShowResetModal(false); setFormMessage(null); }}>
                                <X className="h-5 w-5" />
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleResetSubmit} className="space-y-4">
                                {formMessage && (
                                    <div className={`flex items-center gap-2 p-3 rounded-lg ${formMessage.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {formMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                                        <span className="text-sm">{formMessage.text}</span>
                                    </div>
                                )}
                                <p className="text-sm text-slate-600 dark:text-slate-400">Reset password for: <strong>{selectedUser.email}</strong></p>
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Minimum 8 characters" minLength={8} required disabled={submitting} className="dark:bg-slate-700 dark:border-slate-600" />
                                </div>
                                <div className="flex gap-2 justify-end">
                                    <Button type="button" variant="outline" onClick={() => { setShowResetModal(false); setFormMessage(null); }} disabled={submitting}>Cancel</Button>
                                    <Button type="submit" disabled={submitting || newPassword.length < 8} className="bg-amber-600 hover:bg-amber-700">
                                        {submitting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Resetting...</> : "Reset Password"}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Search */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search VVB users..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <Button type="submit" className="bg-amber-600 hover:bg-amber-700">Search</Button>
                    </form>
                </CardContent>
            </Card>

            {/* VVB Users List */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
                        </div>
                    ) : vvbUsers.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">No VVB users found</div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-700">
                            {vvbUsers.map((user) => (
                                <div key={user.id} className="p-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                                            <UserCheck className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-slate-900 dark:text-white">
                                                {user.profile_data?.name || "VVB User"}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                                            {user.profile_data?.organization && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500">{user.profile_data.organization}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className={user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                            {user.is_active ? "Active" : "Inactive"}
                                        </Badge>
                                        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">VVB</Badge>
                                        <div className="relative">
                                            <Button variant="ghost" size="icon" onClick={() => setActionMenuOpen(actionMenuOpen === user.id ? null : user.id)}>
                                                <MoreVertical className="h-5 w-5" />
                                            </Button>
                                            {actionMenuOpen === user.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-700 rounded-md shadow-lg border dark:border-slate-600 z-10">
                                                    <button onClick={() => handleEdit(user)} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2">
                                                        <Edit className="h-4 w-4" /> Edit User
                                                    </button>
                                                    <button onClick={() => handleResetPassword(user)} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2">
                                                        <Key className="h-4 w-4" /> Reset Password
                                                    </button>
                                                    <button onClick={() => handleDelete(user)} className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center gap-2 text-red-600">
                                                        <Trash2 className="h-4 w-4" /> Deactivate
                                                    </button>
                                                </div>
                                            )}
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
