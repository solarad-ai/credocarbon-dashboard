"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
    Shield,
    LayoutDashboard,
    Users,
    FolderKanban,
    ArrowLeftRight,
    Store,
    FileCheck,
    ScrollText,
    Activity,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X,
    UserCog,
    UserCheck,
    Building2,
    ListTodo,
    Settings2,
    CreditCard,
    PanelLeftClose,
    PanelLeft
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { label: "Dashboard", href: "/superadmin/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Users", href: "/superadmin/dashboard/users", icon: <Users className="h-5 w-5" /> },
    { label: "Subscriptions", href: "/superadmin/dashboard/subscriptions", icon: <CreditCard className="h-5 w-5" /> },
    { label: "Tier Config", href: "/superadmin/dashboard/tier-config", icon: <Settings2 className="h-5 w-5" /> },
    { label: "Admins", href: "/superadmin/dashboard/admins", icon: <UserCog className="h-5 w-5" /> },
    { label: "VVB Users", href: "/superadmin/dashboard/vvb-users", icon: <UserCheck className="h-5 w-5" /> },
    { label: "Registry Users", href: "/superadmin/dashboard/registry-users", icon: <Building2 className="h-5 w-5" /> },
    { label: "Projects", href: "/superadmin/dashboard/projects", icon: <FolderKanban className="h-5 w-5" /> },
    { label: "Transactions", href: "/superadmin/dashboard/transactions", icon: <ArrowLeftRight className="h-5 w-5" /> },
    { label: "Marketplace", href: "/superadmin/dashboard/marketplace", icon: <Store className="h-5 w-5" /> },
    { label: "Retirements", href: "/superadmin/dashboard/retirements", icon: <FileCheck className="h-5 w-5" /> },
    { label: "Configuration", href: "/superadmin/dashboard/config", icon: <Settings2 className="h-5 w-5" /> },
    { label: "Audit Logs", href: "/superadmin/dashboard/audit", icon: <ScrollText className="h-5 w-5" /> },
    { label: "API Health", href: "/superadmin/dashboard/api-health", icon: <Activity className="h-5 w-5" /> },
    { label: "Analytics", href: "/superadmin/dashboard/analytics", icon: <BarChart3 className="h-5 w-5" /> },
    { label: "Tasks", href: "/superadmin/dashboard/tasks", icon: <ListTodo className="h-5 w-5" /> },
];


export default function SuperAdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedCollapsed = localStorage.getItem("superadminSidebarCollapsed");
        if (savedCollapsed) setSidebarCollapsed(JSON.parse(savedCollapsed));
        // Check authentication
        const token = localStorage.getItem("superadmin_token");
        const userData = localStorage.getItem("superadmin_user");

        if (!token || !userData) {
            router.replace("/superadmin/login");
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.role !== "SUPER_ADMIN") {
                router.replace("/superadmin/login");
                return;
            }
            setUser(parsedUser);
        } catch {
            router.replace("/superadmin/login");
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("superadmin_token");
        localStorage.removeItem("superadmin_user");
        router.replace("/superadmin/login");
    };

    const toggleSidebarCollapse = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem("superadminSidebarCollapsed", JSON.stringify(newState));
    };

    if (!mounted || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Desktop Sidebar */}
            <TooltipProvider delayDuration={0}>
                <aside className={`hidden lg:block fixed top-0 left-0 h-full bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 transition-all duration-300 ${sidebarCollapsed ? "w-20" : "w-64"}`}>
                    <div className={`h-16 flex items-center border-b border-slate-200 dark:border-slate-700 ${sidebarCollapsed ? "justify-center px-2" : "justify-between px-4"}`}>
                        <Link href="/superadmin/dashboard">
                            {sidebarCollapsed ? (
                                <Image src="/logo.png" alt="CredoCarbon" width={48} height={48} className="object-contain" priority />
                            ) : (
                                <Image src="/logo.png" alt="CredoCarbon" width={160} height={60} className="object-contain" priority />
                            )}
                        </Link>
                    </div>
                    <nav className={`p-2 space-y-1 overflow-y-auto h-[calc(100%-10rem)] ${sidebarCollapsed ? "px-2" : "px-4"}`}>
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || (item.href !== "/superadmin/dashboard" && pathname.startsWith(item.href));
                            const navLink = (
                                <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-lg transition-all duration-200 ${sidebarCollapsed ? "justify-center px-3 py-3" : "px-3 py-2.5"} ${isActive ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"}`}>
                                    {item.icon}
                                    {!sidebarCollapsed && <span className="font-medium">{item.label}</span>}
                                </Link>
                            );
                            if (sidebarCollapsed) return <Tooltip key={item.href}><TooltipTrigger asChild>{navLink}</TooltipTrigger><TooltipContent side="right">{item.label}</TooltipContent></Tooltip>;
                            return navLink;
                        })}
                    </nav>
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
                        <Button variant="ghost" className={`w-full text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg ${sidebarCollapsed ? "justify-center px-0" : "justify-start gap-3"}`} onClick={toggleSidebarCollapse}>
                            {sidebarCollapsed ? <PanelLeft className="h-5 w-5" /> : <><PanelLeftClose className="h-5 w-5" /><span className="text-sm font-medium">Collapse</span></>}
                        </Button>
                        {sidebarCollapsed ? (
                            <Tooltip><TooltipTrigger asChild><Button variant="ghost" className="w-full justify-center text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleLogout}><LogOut className="h-5 w-5" /></Button></TooltipTrigger><TooltipContent side="right">Logout</TooltipContent></Tooltip>
                        ) : (
                            <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleLogout}><LogOut className="h-5 w-5" /><span>Logout</span></Button>
                        )}
                    </div>
                </aside>
            </TooltipProvider>

            {/* Mobile Sidebar */}
            <aside className={`lg:hidden fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
                    <Link href="/superadmin/dashboard">
                        <Image src="/logo.png" alt="CredoCarbon" width={140} height={50} className="object-contain" priority />
                    </Link>
                    <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5 text-slate-500" /></button>
                </div>
                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-8rem)]">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.href !== "/superadmin/dashboard" && pathname.startsWith(item.href));
                        return (<Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive ? "bg-gradient-to-r from-purple-500/10 to-blue-500/10 text-purple-600 dark:text-purple-400 border-l-4 border-purple-500" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"}`}>{item.icon}<span className="font-medium">{item.label}</span></Link>);
                    })}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
                    <Button variant="ghost" className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={handleLogout}><LogOut className="h-5 w-5" /><span>Logout</span></Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
                {/* Header */}
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
                    <button
                        className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-6 w-6 text-slate-600 dark:text-slate-400" />
                    </button>

                    <div className="flex-1 lg:flex-none" />

                    <div className="flex items-center gap-4">
                        <ThemeToggle />

                        <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-100 dark:bg-slate-700/50">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={user?.profile_data?.profilePhoto || undefined} alt={user?.profile_data?.name || "Super Admin"} />
                                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-sm font-bold text-white">
                                    {(user?.profile_data?.name || user?.email || "A")[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {user?.profile_data?.name || "Super Admin"}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
