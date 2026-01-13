"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    LayoutDashboard, FolderKanban, TrendingUp, Settings, Bell, User, LogOut,
    PlusCircle, FileText, CheckCircle2, Clock, AlertCircle, ArrowRight,
    Leaf, BarChart3, Wallet, Package, ChevronRight, Loader2
} from "lucide-react";
import { dashboardApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DeveloperStats {
    total_projects: number;
    active_projects: number;
    total_credits_issued: number;
    credits_available: number;
    credits_sold: number;
    revenue_mtd: number;
    pending_verifications: number;
}

interface ActivityItem {
    id: number;
    type: string;
    title: string;
    description: string;
    timestamp: string;
    icon: string;
}

interface ProjectSummary {
    id: number;
    name: string;
    code: string;
    status: string;
    project_type: string;
    progress: number;
    credits_issued: number | null;
    next_action: string;
}

const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    DRAFT: { bg: "bg-gray-100 dark:bg-gray-800", text: "text-gray-600 dark:text-gray-400", label: "Draft" },
    SUBMITTED_TO_VVB: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", label: "Submitted" },
    VALIDATION_PENDING: { bg: "bg-yellow-100 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-400", label: "Validation" },
    VALIDATION_APPROVED: { bg: "bg-lime-100 dark:bg-lime-900/30", text: "text-lime-600 dark:text-lime-400", label: "Validated" },
    VERIFICATION_PENDING: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", label: "Verification" },
    VERIFICATION_APPROVED: { bg: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", label: "Verified" },
    REGISTRY_REVIEW: { bg: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", label: "Registry Review" },
    ISSUED: { bg: "bg-green-100 dark:bg-green-900/30", text: "text-green-600 dark:text-green-400", label: "Issued" },
};

export default function DeveloperDashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [stats, setStats] = useState<DeveloperStats | null>(null);
    const [activity, setActivity] = useState<ActivityItem[]>([]);
    const [projects, setProjects] = useState<ProjectSummary[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsData, activityData, projectsData] = await Promise.all([
                dashboardApi.getDeveloperStats(),
                dashboardApi.getActivity(10),
                dashboardApi.getProjectsSummary()
            ]);
            setStats(statsData);
            setActivity(activityData);
            setProjects(projectsData);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Developer Dashboard</h2>
                <div className="flex items-center space-x-2">
                    <Button>Download Report</Button>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="space-y-4">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="card-hover">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Credits Issued</CardTitle>
                            <BarChart3 className="h-4 w-4 text-carbon-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-gradient">
                                {(stats?.total_credits_issued || 0).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">tCO₂e lifetime</p>
                        </CardContent>
                    </Card>
                    <Card className="card-hover">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Credits Available</CardTitle>
                            <Package className="h-4 w-4 text-ocean-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(stats?.credits_available || 0).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">For sale in marketplace</p>
                        </CardContent>
                    </Card>
                    <Card className="card-hover">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Credits Sold (MTD)</CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {(stats?.credits_sold || 0).toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Revenue: ${((stats?.revenue_mtd || 0) / 1000).toFixed(1)}K
                            </p>
                        </CardContent>
                    </Card>
                    <Card className="card-hover">
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Active Projects</CardTitle>
                            <FolderKanban className="h-4 w-4 text-purple-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats?.active_projects || 0}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats?.pending_verifications || 0} pending verification
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* My Projects Summary & Create Button */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Projects Summary */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                <span>My Projects</span>
                                <Link href="/dashboard/developer/projects">
                                    <Button variant="ghost" size="sm">
                                        View All <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {projects.length === 0 ? (
                                <div className="text-center py-8">
                                    <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No projects yet</p>
                                    <Link href="/dashboard/developer/project/create">
                                        <Button className="mt-4">
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Create Your First Project
                                        </Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {projects.slice(0, 5).map((project) => {
                                        const status = statusColors[project.status] || statusColors.DRAFT;
                                        return (
                                            <div key={project.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h4 className="font-medium">{project.name}</h4>
                                                        <Badge className={cn(status.bg, status.text)}>
                                                            {status.label}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {project.code} • {project.project_type}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Progress value={project.progress} className="flex-1 h-2" />
                                                        <span className="text-xs text-muted-foreground">{project.progress}%</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    {project.credits_issued && (
                                                        <p className="text-sm font-medium text-gradient">
                                                            {project.credits_issued.toLocaleString()} VCUs
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-muted-foreground">{project.next_action}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href="/dashboard/developer/project/create" className="block">
                                <Button className="w-full justify-start" variant="outline">
                                    <PlusCircle className="mr-2 h-4 w-4" />
                                    Create New Project
                                </Button>
                            </Link>
                            <Link href="/dashboard/developer/market/sell-orders" className="block">
                                <Button className="w-full justify-start" variant="outline">
                                    <Package className="mr-2 h-4 w-4" />
                                    List Credits for Sale
                                </Button>
                            </Link>
                            <Link href="/dashboard/developer/lifecycle/verification" className="block">
                                <Button className="w-full justify-start" variant="outline">
                                    <FileText className="mr-2 h-4 w-4" />
                                    Submit Monitoring Report
                                </Button>
                            </Link>
                            <Link href="/dashboard/developer/notifications" className="block">
                                <Button className="w-full justify-start" variant="outline">
                                    <Bell className="mr-2 h-4 w-4" />
                                    View Notifications
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activity.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">No recent activity</p>
                        ) : (
                            <div className="space-y-4">
                                {activity.map((item) => (
                                    <div key={item.id} className="flex items-start gap-4 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <LayoutDashboard className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium">{item.title}</p>
                                            <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                                        </div>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {item.timestamp}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
