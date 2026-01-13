"use client";

import { useEffect, useState, useCallback } from "react";
import { Activity, Server, Database, Clock, RefreshCw, CheckCircle2, XCircle, AlertCircle, Zap, Globe, Shield, Users, FileText, ShoppingCart, Wallet, Bell, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { superadminApi } from "@/lib/api";

interface HealthStatus {
    status: string;
    database: string;
    uptime_seconds: number;
    response_time_ms: number;
    timestamp: string;
}

interface EndpointStatus {
    name: string;
    path: string;
    method: string;
    status: "healthy" | "unhealthy" | "checking";
    responseTime: number;
    icon: React.ReactNode;
    category: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://credocarbon-api-641001192587.asia-south2.run.app/api";

export default function ApiHealthPage() {
    const [health, setHealth] = useState<HealthStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [endpoints, setEndpoints] = useState<EndpointStatus[]>([]);
    const [checkingEndpoints, setCheckingEndpoints] = useState(false);

    // Define API endpoints to check - comprehensive list of all dashboard functionality
    const endpointDefinitions = [
        // System Endpoints
        { name: "Health Check", path: "/health", method: "GET", icon: <Activity className="h-4 w-4" />, category: "System", requiresAuth: false },
        { name: "Root API", path: "/", method: "GET", icon: <Globe className="h-4 w-4" />, category: "System", requiresAuth: false },

        // Core Admin Endpoints
        { name: "Super Admin Health", path: "/superadmin/health", method: "GET", icon: <Shield className="h-4 w-4" />, category: "Core Admin", requiresAuth: true },
        { name: "Dashboard Stats", path: "/superadmin/stats", method: "GET", icon: <BarChart3 className="h-4 w-4" />, category: "Core Admin", requiresAuth: true },
        { name: "Recent Activity", path: "/superadmin/activity", method: "GET", icon: <Activity className="h-4 w-4" />, category: "Core Admin", requiresAuth: true },
        { name: "Platform Analytics", path: "/superadmin/analytics", method: "GET", icon: <BarChart3 className="h-4 w-4" />, category: "Core Admin", requiresAuth: true },

        // User Management
        { name: "Users List", path: "/superadmin/users", method: "GET", icon: <Users className="h-4 w-4" />, category: "User Management", requiresAuth: true },
        { name: "Admins List", path: "/superadmin/admins", method: "GET", icon: <Shield className="h-4 w-4" />, category: "User Management", requiresAuth: true },

        // Project Management
        { name: "Projects List", path: "/superadmin/projects", method: "GET", icon: <FileText className="h-4 w-4" />, category: "Project Management", requiresAuth: true },

        // Transaction Management
        { name: "Transactions", path: "/superadmin/transactions", method: "GET", icon: <Wallet className="h-4 w-4" />, category: "Transactions", requiresAuth: true },

        // Marketplace Management
        { name: "Marketplace Listings", path: "/superadmin/marketplace", method: "GET", icon: <ShoppingCart className="h-4 w-4" />, category: "Marketplace", requiresAuth: true },

        // Retirement Management
        { name: "Retirements", path: "/superadmin/retirements", method: "GET", icon: <FileText className="h-4 w-4" />, category: "Retirements", requiresAuth: true },

        // Task Management
        { name: "Tasks", path: "/superadmin/tasks", method: "GET", icon: <FileText className="h-4 w-4" />, category: "Tasks", requiresAuth: true },

        // Audit
        { name: "Audit Logs", path: "/superadmin/audit-logs", method: "GET", icon: <FileText className="h-4 w-4" />, category: "Audit", requiresAuth: true },

        // Configuration - Registries
        { name: "Registries", path: "/superadmin/config/registries", method: "GET", icon: <Database className="h-4 w-4" />, category: "Configuration", requiresAuth: true },

        // Configuration - Project Types
        { name: "Project Types", path: "/superadmin/config/project-types", method: "GET", icon: <FileText className="h-4 w-4" />, category: "Configuration", requiresAuth: true },

        // Configuration - Feature Flags
        { name: "Feature Flags", path: "/superadmin/config/feature-flags", method: "GET", icon: <Zap className="h-4 w-4" />, category: "Configuration", requiresAuth: true },

        // Configuration - Announcements
        { name: "Announcements", path: "/superadmin/config/announcements", method: "GET", icon: <Bell className="h-4 w-4" />, category: "Configuration", requiresAuth: true },

        // Configuration - Platform Fees
        { name: "Platform Fees", path: "/superadmin/config/fees", method: "GET", icon: <Wallet className="h-4 w-4" />, category: "Configuration", requiresAuth: true },

        // Configuration - Email Templates
        { name: "Email Templates", path: "/superadmin/config/email-templates", method: "GET", icon: <FileText className="h-4 w-4" />, category: "Configuration", requiresAuth: true },
    ];

    const checkEndpoint = async (endpoint: typeof endpointDefinitions[0]): Promise<EndpointStatus> => {
        const startTime = performance.now();
        const token = localStorage.getItem("superadmin_token");

        try {
            const headers: Record<string, string> = {};
            if (endpoint.requiresAuth && token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const baseUrl = API_BASE_URL.replace("/api", "");
            const url = endpoint.path.startsWith("/superadmin")
                ? `${API_BASE_URL}${endpoint.path}`
                : `${baseUrl}${endpoint.path}`;

            const response = await fetch(url, {
                method: endpoint.method,
                headers,
            });

            const responseTime = performance.now() - startTime;

            return {
                name: endpoint.name,
                path: endpoint.path,
                method: endpoint.method,
                status: response.ok ? "healthy" : "unhealthy",
                responseTime,
                icon: endpoint.icon,
                category: endpoint.category,
            };
        } catch {
            return {
                name: endpoint.name,
                path: endpoint.path,
                method: endpoint.method,
                status: "unhealthy",
                responseTime: performance.now() - startTime,
                icon: endpoint.icon,
                category: endpoint.category,
            };
        }
    };

    const checkAllEndpoints = useCallback(async () => {
        setCheckingEndpoints(true);
        const results = await Promise.all(endpointDefinitions.map(checkEndpoint));
        setEndpoints(results);
        setCheckingEndpoints(false);
    }, []);

    useEffect(() => {
        fetchHealth();
        checkAllEndpoints();
        if (autoRefresh) {
            const interval = setInterval(() => {
                fetchHealth();
                checkAllEndpoints();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [autoRefresh, checkAllEndpoints]);

    const fetchHealth = async () => {
        try {
            const data = await superadminApi.getHealth();
            setHealth(data);
        } catch (err) {
            console.error("Failed to fetch health", err);
        } finally {
            setLoading(false);
        }
    };

    const formatUptime = (seconds: number) => {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        return `${days}d ${hours}h ${mins}m`;
    };

    const getStatusIcon = (status: string) => {
        if (status === "healthy") return <CheckCircle2 className="h-5 w-5 text-green-500" />;
        if (status === "checking") return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
        return <XCircle className="h-5 w-5 text-red-500" />;
    };

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            healthy: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
            unhealthy: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            degraded: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            checking: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        };
        return <Badge className={colors[status] || "bg-slate-100"}>{status.toUpperCase()}</Badge>;
    };

    const getResponseTimeColor = (ms: number) => {
        if (ms < 100) return "text-green-500";
        if (ms < 300) return "text-yellow-500";
        return "text-red-500";
    };

    // Group endpoints by category
    const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
        if (!acc[endpoint.category]) {
            acc[endpoint.category] = [];
        }
        acc[endpoint.category].push(endpoint);
        return acc;
    }, {} as Record<string, EndpointStatus[]>);

    // Calculate overall health stats
    const healthyCount = endpoints.filter(e => e.status === "healthy").length;
    const totalCount = endpoints.length;
    const avgResponseTime = endpoints.length > 0
        ? endpoints.reduce((sum, e) => sum + e.responseTime, 0) / endpoints.length
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">API Health</h1>
                    <p className="text-slate-500 dark:text-slate-400">Real-time system status & endpoint monitoring</p>
                </div>
                <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 text-sm text-slate-500">
                        <input
                            type="checkbox"
                            checked={autoRefresh}
                            onChange={(e) => setAutoRefresh(e.target.checked)}
                            className="rounded"
                        />
                        Auto-refresh (10s)
                    </label>
                    <Button variant="outline" size="sm" onClick={() => { fetchHealth(); checkAllEndpoints(); }} disabled={checkingEndpoints}>
                        <RefreshCw className={`h-4 w-4 mr-2 ${checkingEndpoints ? "animate-spin" : ""}`} />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Overall Status */}
            <Card className={`dark:bg-slate-800 dark:border-slate-700 border-2 ${health?.status === "healthy" ? "border-green-500" : "border-red-500"}`}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            {getStatusIcon(health?.status || "unhealthy")}
                            <div>
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">API Status</h2>
                                <p className="text-sm text-slate-500">
                                    Last checked: {health ? new Date(health.timestamp).toLocaleString('en-IN', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit',
                                        hour12: true
                                    }) : "-"} ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                                </p>
                            </div>
                        </div>
                        {getStatusBadge(health?.status || "unhealthy")}
                    </div>
                </CardContent>
            </Card>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Database</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white capitalize">{health?.database || "-"}</p>
                            </div>
                            <Database className={`h-8 w-8 ${health?.database === "healthy" ? "text-green-500" : "text-red-500"}`} />
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Uptime</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">{formatUptime(health?.uptime_seconds || 0)}</p>
                            </div>
                            <Clock className="h-8 w-8 text-blue-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Avg Response</p>
                                <p className={`text-lg font-semibold ${getResponseTimeColor(avgResponseTime)}`}>{avgResponseTime.toFixed(0)} ms</p>
                            </div>
                            <Activity className="h-8 w-8 text-purple-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">Endpoints</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                    <span className="text-green-500">{healthyCount}</span>
                                    <span className="text-slate-400">/{totalCount}</span>
                                </p>
                            </div>
                            <Server className="h-8 w-8 text-green-500" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-800 dark:border-slate-700">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">API Server</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">Running</p>
                            </div>
                            <Zap className="h-8 w-8 text-yellow-500" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Endpoint Info */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">API Configuration</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500">Base URL:</span>
                        <code className="px-3 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm font-mono text-slate-900 dark:text-white">
                            {API_BASE_URL}
                        </code>
                    </div>
                </CardContent>
            </Card>

            {/* Endpoint Status by Category */}
            {Object.entries(groupedEndpoints).map(([category, categoryEndpoints]) => (
                <Card key={category} className="dark:bg-slate-800 dark:border-slate-700">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            {category === "System" && <Globe className="h-5 w-5 text-blue-500" />}
                            {category === "Admin" && <Shield className="h-5 w-5 text-purple-500" />}
                            {category === "Config" && <Database className="h-5 w-5 text-green-500" />}
                            {category} Endpoints
                            <Badge variant="outline" className="ml-2">
                                {categoryEndpoints.filter(e => e.status === "healthy").length}/{categoryEndpoints.length}
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {categoryEndpoints.map((endpoint, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center justify-between p-3 rounded-lg border transition-all ${endpoint.status === "healthy"
                                        ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                                        : endpoint.status === "checking"
                                            ? "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800"
                                            : "bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800"
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${endpoint.status === "healthy"
                                            ? "bg-green-100 dark:bg-green-900/30 text-green-600"
                                            : "bg-red-100 dark:bg-red-900/30 text-red-600"
                                            }`}>
                                            {endpoint.icon}
                                        </div>
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white">{endpoint.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                <Badge variant="outline" className="text-xs px-1.5 py-0">
                                                    {endpoint.method}
                                                </Badge>
                                                <code className="text-xs">{endpoint.path}</code>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <p className={`font-mono text-sm ${getResponseTimeColor(endpoint.responseTime)}`}>
                                                {endpoint.responseTime.toFixed(0)} ms
                                            </p>
                                        </div>
                                        <div className="w-6">
                                            {endpoint.status === "healthy" ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                            ) : endpoint.status === "checking" ? (
                                                <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                                            ) : (
                                                <XCircle className="h-5 w-5 text-red-500" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
