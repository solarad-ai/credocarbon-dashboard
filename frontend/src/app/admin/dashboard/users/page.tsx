"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { adminApi } from "@/lib/api";

interface User {
    id: number;
    email: string;
    role: string;
    is_active: boolean;
    is_verified: boolean;
    created_at: string;
    profile_data: any;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        fetchUsers();
    }, [page, roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params: any = { page, page_size: 20 };
            if (roleFilter !== "all") params.role = roleFilter;
            const data = await adminApi.getUsers(params);
            setUsers(data.users || []);
            setTotalPages(data.total_pages || 1);
            setTotal(data.total || 0);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
        fetchUsers();
    };

    const getRoleBadgeColor = (role: string) => {
        const colors: Record<string, string> = {
            DEVELOPER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
            BUYER: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
            VVB: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
            REGISTRY: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
            ADMIN: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/30 dark:text-fuchsia-400",
        };
        return colors[role] || "bg-slate-100 text-slate-700";
    };

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Users
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    View all platform users (read-only)
                </p>
            </div>

            {/* Filters */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-4">
                    <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <Input
                                placeholder="Search by email..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="pl-10 dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-full md:w-40 dark:bg-slate-700 dark:border-slate-600">
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                <SelectItem value="DEVELOPER">Developer</SelectItem>
                                <SelectItem value="BUYER">Buyer</SelectItem>
                                <SelectItem value="VVB">VVB</SelectItem>
                                <SelectItem value="REGISTRY">Registry</SelectItem>
                                <SelectItem value="ADMIN">Admin</SelectItem>
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
                    Showing {users.length} of {total} users
                </p>
            </div>

            {/* Users Table */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fuchsia-500"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="h-12 w-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                            <p className="text-slate-500 dark:text-slate-400">No users found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Email</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Role</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Status</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Verified</th>
                                        <th className="text-left p-4 font-medium text-slate-600 dark:text-slate-300">Created</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                    {users.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="p-4">
                                                <div>
                                                    <p className="font-medium text-slate-900 dark:text-white">{user.email}</p>
                                                    <p className="text-xs text-slate-500">{user.profile_data?.name || "No name"}</p>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge className={getRoleBadgeColor(user.role)}>{user.role}</Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge className={user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                                                    {user.is_active ? "Active" : "Inactive"}
                                                </Badge>
                                            </td>
                                            <td className="p-4">
                                                <Badge className={user.is_verified ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"}>
                                                    {user.is_verified ? "Verified" : "Unverified"}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm text-slate-500 dark:text-slate-400">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
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
