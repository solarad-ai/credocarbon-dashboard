"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    CreditCard,
    LogOut,
    UserCog,
    Menu,
    X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { adminApi } from "@/lib/api";

const menuItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Users", href: "/admin/dashboard/users", icon: Users },
    { label: "Projects", href: "/admin/dashboard/projects", icon: FolderKanban },
    { label: "Transactions", href: "/admin/dashboard/transactions", icon: CreditCard },
];

export default function AdminDashboardLayout({
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
        const token = localStorage.getItem("admin_token");
        const userData = localStorage.getItem("admin_user");

        if (!token || !userData) {
            router.push("/admin/login");
            return;
        }

        try {
            setUser(JSON.parse(userData));
        } catch {
            router.push("/admin/login");
        }
    }, [router]);

    const handleLogout = () => {
        adminApi.logout();
    };

    if (!mounted || !user) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-fuchsia-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Mobile Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 z-50 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0`}
            >
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700">
                    <Link href="/admin/dashboard" className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center">
                            <UserCog className="h-4 w-4 text-white" />
                        </div>
                        <span className="font-bold text-lg text-slate-900 dark:text-white">
                            Admin Panel
                        </span>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${isActive
                                    ? "bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-600 dark:text-fuchsia-400"
                                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50"
                                    }`}
                            >
                                <item.icon className="h-5 w-5" />
                                {item.label}
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
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:pl-64">
                {/* Header */}
                <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-4 lg:px-6">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="lg:hidden"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <div className="flex items-center gap-4 ml-auto">
                        <div className="text-right">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                                {user?.profile_data?.name || user?.email}
                            </p>
                            <p className="text-xs text-slate-500">Platform Admin</p>
                        </div>
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user?.profile_data?.profilePhoto || undefined} alt={user?.profile_data?.name || "Admin"} />
                            <AvatarFallback className="bg-gradient-to-br from-fuchsia-500 to-pink-600 text-white font-medium">
                                {(user?.profile_data?.name || user?.email || "A")[0].toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-6">{children}</main>
            </div>
        </div>
    );
}
