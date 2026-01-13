"use client";

import { useEffect, useState } from "react";
import { Users, Search, ChevronLeft, ChevronRight, Shield, UserX } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { superadminApi } from "@/lib/api";

interface User {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    profile_data: any;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => { fetchUsers(); }, [page, roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const data = await superadminApi.getUsers({
                page,
                page_size: 10,
                role: roleFilter !== "all" ? roleFilter : undefined,
                search: search || undefined,
            });
            setUsers(data.items);
            setTotalPages(data.total_pages);
            setTotal(data.total);
        } catch (err) {
            console.error("Failed to fetch users", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const handleDeactivate = async (userId: number) => {
        if (!confirm("Are you sure you want to deactivate this user?")) return;
        try {
            await superadminApi.deactivateUser(userId);
            fetchUsers();
        } catch (err) {
            console.error("Failed to deactivate user", err);
        }
    };

    const getRoleBadge = (role: string) => {
        const colors: Record<string, string> = {
            SUPER_ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            DEVELOPER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            BUYER: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            VVB: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            REGISTRY: "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
        };
        return <Badge className={colors[role] || "bg-slate-100"}>{role}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>
                <p className="text-slate-500 dark:text-slate-400">{total} total users</p>
            </div>

            {/* Filters */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-full sm:w-40 dark:bg-slate-700 dark:border-slate-600">
                                <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="DEVELOPER">Developer</SelectItem>
                                <SelectItem value="BUYER">Buyer</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
                                <SelectItem value="VVB">VVB</SelectItem>
                                <SelectItem value="REGISTRY">Registry</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button type="submit" className="bg-purple-600 hover:bg-purple-700">Search</Button>
                    </form>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">No users found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">User</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Role</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Status</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Joined</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-6 py-4">
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{user.email}</p>
                                                    <p className="text-xs text-slate-500">ID: {user.id}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">{getRoleBadge(user.role)}</td>
                                            <td className="px-6 py-4">
                                                <Badge className={user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                                    {user.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_active && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeactivate(user.id)}
                                                        className="text-red-500 hover:text-red-700"
                                                    >
                                                        <UserX className="h-4 w-4" />
                                                    </Button>
                                                )}
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
        </div>
    );
}
