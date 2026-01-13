"use client";

import { useEffect, useState } from "react";
import { FileText, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { superadminApi } from "@/lib/api";

interface AuditLog {
    id: number;
    actor_id: number | null;
    actor_email: string | null;
    action: string;
    entity_type: string;
    entity_id: string;
    details: any;
    timestamp: string;
}

export default function AuditPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionFilter, setActionFilter] = useState("all");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => { fetchLogs(); }, [page, actionFilter]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const data = await superadminApi.getAuditLogs({
                page,
                page_size: 20,
                action: actionFilter !== "all" ? actionFilter : undefined,
            });
            setLogs(data.items);
            setTotalPages(data.total_pages);
            setTotal(data.total);
        } catch (err) {
            console.error("Failed to fetch audit logs", err);
        } finally {
            setLoading(false);
        }
    };

    const getActionBadge = (action: string) => {
        const colors: Record<string, string> = {
            CREATE: "bg-green-100 text-green-700",
            UPDATE: "bg-blue-100 text-blue-700",
            DELETE: "bg-red-100 text-red-700",
            LOGIN: "bg-purple-100 text-purple-700",
        };
        const prefix = action.split("_")[0];
        return <Badge className={colors[prefix] || "bg-slate-100 text-slate-700"}>{action.replace(/_/g, " ")}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Audit Logs</h1>
                <p className="text-slate-500 dark:text-slate-400">{total} total entries</p>
            </div>

            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-4">
                    <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
                        <SelectTrigger className="w-full sm:w-48 dark:bg-slate-700 dark:border-slate-600">
                            <SelectValue placeholder="Action" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Actions</SelectItem>
                            <SelectItem value="CREATE_PROJECT">Create Project</SelectItem>
                            <SelectItem value="UPDATE_PROJECT">Update Project</SelectItem>
                            <SelectItem value="CREATE_TASK">Create Task</SelectItem>
                            <SelectItem value="LOGIN">Login</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">No audit logs found</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-700/50">
                                    <tr>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Action</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Entity</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Actor</th>
                                        <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                    {logs.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                            <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                                            <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                                                {log.entity_type} #{log.entity_id}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-500">{log.actor_email || "System"}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500">
                                                {new Date(log.timestamp).toLocaleString()}
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
