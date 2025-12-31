"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    Building2,
    LayoutDashboard,
    FolderKanban,
    FileCheck,
    Coins,
    MessageSquare,
    Bell,
    User,
    LogOut,
    Menu,
    X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
}

const navItems: NavItem[] = [
    { label: "Dashboard", href: "/registry/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { label: "Projects", href: "/registry/dashboard/projects", icon: <FolderKanban className="h-5 w-5" /> },
    { label: "Reviews", href: "/registry/dashboard/reviews", icon: <FileCheck className="h-5 w-5" /> },
    { label: "Issuances", href: "/registry/dashboard/issuances", icon: <Coins className="h-5 w-5" /> },
    { label: "Credits", href: "/registry/dashboard/credits", icon: <Coins className="h-5 w-5" /> },
    { label: "Queries", href: "/registry/dashboard/queries", icon: <MessageSquare className="h-5 w-5" /> },
    { label: "Notifications", href: "/registry/dashboard/notifications", icon: <Bell className="h-5 w-5" /> },
    { label: "Profile", href: "/registry/dashboard/profile", icon: <User className="h-5 w-5" /> },
];


export default function RegistryDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Check authentication
        const token = localStorage.getItem("access_token");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
            router.replace("/registry/login");
            return;
        }

        try {
            const parsedUser = JSON.parse(userData);
            if (parsedUser.role !== "REGISTRY") {
                router.replace("/registry/login");
                return;
            }
            setUser(parsedUser);
        } catch {
            router.replace("/registry/login");
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        localStorage.removeItem("token");

        // Use window.location.replace to prevent back button navigation
        window.location.replace("/registry/login");
    };

    if (!mounted || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    }`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
                    <Link href="/registry/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                            <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-lg text-slate-900 dark:text-white">Registry</span>
                    </Link>
                    <button
                        className="lg:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5 text-slate-500" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-8rem)]">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href ||
                            (item.href !== "/registry/dashboard" && pathname.startsWith(item.href));
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${isActive
                                    ? "bg-gradient-to-r from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                    }`}
                            >
                                {item.icon}
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Logout</span>
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-64">
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
                                <AvatarImage src={user?.profile_data?.profilePhoto || undefined} alt={user?.profile_data?.name || "Registry Officer"} />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white">
                                    {(user?.profile_data?.name || user?.email || "R")[0].toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-sm">
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {user?.profile_data?.name || "Registry Officer"}
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
