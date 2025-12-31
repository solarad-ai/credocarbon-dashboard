"use client";

import { useState, useEffect, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    LayoutDashboard, PlusCircle, Settings, LogOut, Menu, User,
    FolderKanban, TrendingUp, Bell, FileText, Wallet, Package, Leaf, X, ChevronDown,
    PanelLeftClose, PanelLeft
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    role: "DEVELOPER" | "BUYER" | "ADMIN";
    closeMobile?: () => void;
    collapsed?: boolean;
}

// Role-specific accent colors
const roleColors = {
    DEVELOPER: {
        accent: "emerald",
        gradient: "from-emerald-500 to-teal-600",
        bgLight: "bg-emerald-500/10",
        bgHover: "hover:bg-emerald-500/5",
        textAccent: "text-emerald-600 dark:text-emerald-400",
        border: "border-emerald-500",
        ring: "ring-emerald-500/20",
    },
    BUYER: {
        accent: "blue",
        gradient: "from-blue-500 to-cyan-600",
        bgLight: "bg-blue-500/10",
        bgHover: "hover:bg-blue-500/5",
        textAccent: "text-blue-600 dark:text-blue-400",
        border: "border-blue-500",
        ring: "ring-blue-500/20",
    },
    ADMIN: {
        accent: "purple",
        gradient: "from-purple-500 to-pink-600",
        bgLight: "bg-purple-500/10",
        bgHover: "hover:bg-purple-500/5",
        textAccent: "text-purple-600 dark:text-purple-400",
        border: "border-purple-500",
        ring: "ring-purple-500/20",
    },
};

export function DashboardSidebar({ className, role, closeMobile, collapsed }: SidebarProps) {
    const pathname = usePathname();
    const colors = roleColors[role];

    const developerRoutes = [
        {
            group: "Project Setup",
            items: [
                { href: "/dashboard/developer", label: "Overview", icon: LayoutDashboard },
                { href: "/dashboard/developer/project/create", label: "New Project", icon: PlusCircle },
                { href: "/dashboard/developer/projects", label: "My Projects", icon: FolderKanban },
            ]
        },
        {
            group: "Project Lifecycle",
            items: [
                { href: "/dashboard/developer/lifecycle", label: "Lifecycle Overview", icon: FileText },
                { href: "/dashboard/developer/lifecycle/validation", label: "Validation", icon: FileText },
                { href: "/dashboard/developer/lifecycle/verification", label: "Verification", icon: FileText },
                { href: "/dashboard/developer/lifecycle/registry-review", label: "Registry Review", icon: FileText },
                { href: "/dashboard/developer/lifecycle/issuance", label: "Credit Issuance", icon: FileText },
            ]
        },
        {
            group: "Market Operations",
            items: [
                { href: "/dashboard/developer/market", label: "Market Overview", icon: TrendingUp },
                { href: "/dashboard/developer/market/portfolio", label: "Portfolio", icon: Wallet },
                { href: "/dashboard/developer/market/sell-orders", label: "Sell Orders", icon: Package },
                { href: "/dashboard/developer/market/transfers", label: "Transfers", icon: TrendingUp },
                { href: "/dashboard/developer/market/retirements", label: "Retirements", icon: Wallet },
            ]
        },
        {
            group: "Utility",
            items: [
                { href: "/dashboard/developer/notifications", label: "Notifications", icon: Bell },
                { href: "/dashboard/developer/profile", label: "Profile & KYC", icon: User },
            ]
        }
    ];

    const buyerRoutes = [
        {
            group: "Marketplace",
            items: [
                { href: "/dashboard/buyer", label: "Overview", icon: LayoutDashboard },
                { href: "/dashboard/buyer/marketplace", label: "Browse Credits", icon: TrendingUp },
            ]
        },
        {
            group: "Portfolio",
            items: [
                { href: "/dashboard/buyer/wallet", label: "My Wallet", icon: Wallet },
                { href: "/dashboard/buyer/retirements", label: "Retirements", icon: FileText },
                { href: "/dashboard/buyer/offers", label: "Offers & Negotiations", icon: FileText },
            ]
        },
        {
            group: "Utility",
            items: [
                { href: "/dashboard/buyer/notifications", label: "Notifications", icon: Bell },
                { href: "/dashboard/buyer/profile", label: "Profile & KYC", icon: User },
            ]
        }
    ];

    const routeGroups = role === "DEVELOPER" ? developerRoutes : buyerRoutes;

    return (
        <TooltipProvider delayDuration={0}>
            <div className={cn("h-full flex flex-col", className)}>
                {/* Navigation Groups */}
                <nav className={cn(
                    "flex-1 overflow-y-auto py-6 space-y-6",
                    collapsed ? "px-2" : "px-4"
                )}>
                    {routeGroups.map((group) => (
                        <div key={group.group}>
                            {!collapsed && (
                                <h3 className="mb-3 px-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em]">
                                    {group.group}
                                </h3>
                            )}
                            <div className="space-y-1">
                                {group.items.map((route) => {
                                    const isActive = pathname === route.href;
                                    const navItem = (
                                        <Link key={route.href} href={route.href} onClick={closeMobile}>
                                            <div
                                                className={cn(
                                                    "group flex items-center gap-3 rounded-xl font-medium text-sm transition-all duration-200",
                                                    collapsed ? "justify-center px-3 py-3" : "px-4 py-3",
                                                    isActive
                                                        ? `${colors.bgLight} ${colors.textAccent} shadow-sm`
                                                        : `text-slate-600 dark:text-slate-400 ${colors.bgHover} hover:text-slate-900 dark:hover:text-white`
                                                )}
                                            >
                                                <route.icon className={cn(
                                                    "h-5 w-5 flex-shrink-0 transition-colors",
                                                    isActive ? colors.textAccent : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                                                )} />
                                                {!collapsed && (
                                                    <>
                                                        <span className="truncate">{route.label}</span>
                                                        {isActive && (
                                                            <div className={cn("ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r flex-shrink-0", colors.gradient)} />
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        </Link>
                                    );

                                    if (collapsed) {
                                        return (
                                            <Tooltip key={route.href}>
                                                <TooltipTrigger asChild>
                                                    {navItem}
                                                </TooltipTrigger>
                                                <TooltipContent side="right" className="font-medium">
                                                    {route.label}
                                                </TooltipContent>
                                            </Tooltip>
                                        );
                                    }

                                    return navItem;
                                })}
                            </div>
                        </div>
                    ))}
                </nav>
            </div>
        </TooltipProvider>
    );
}

export default function DashboardLayout({
    children,
    role = "DEVELOPER"
}: {
    children: React.ReactNode;
    role?: "DEVELOPER" | "BUYER";
}) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const colors = roleColors[role];

    useEffect(() => {
        // Authentication guard - check if user is logged in
        const token = localStorage.getItem("token");
        if (!token) {
            // No token, redirect to role-specific login
            const loginPath = role === "DEVELOPER" ? "/developer/login" : "/buyer/login";
            router.replace(loginPath);
            return;
        }

        // Load collapsed state from localStorage
        const savedCollapsed = localStorage.getItem("sidebarCollapsed");
        if (savedCollapsed) {
            setSidebarCollapsed(JSON.parse(savedCollapsed));
        }

        const fetchProfile = async () => {
            try {
                const response = await fetch("http://localhost:8000/api/auth/profile", {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser(userData);
                    localStorage.setItem("user", JSON.stringify(userData));
                } else {
                    // Token is invalid, logout
                    handleLogout();
                }
            } catch (error) {
                const cachedUser = localStorage.getItem("user");
                if (cachedUser) {
                    setUser(JSON.parse(cachedUser));
                }
            }
        };

        fetchProfile();

        const handleProfileUpdate = () => {
            const cachedUser = localStorage.getItem("user");
            if (cachedUser) {
                setUser(JSON.parse(cachedUser));
            }
        };

        window.addEventListener("profileUpdated", handleProfileUpdate);
        return () => window.removeEventListener("profileUpdated", handleProfileUpdate);
    }, [router, role]);

    const toggleSidebarCollapse = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
    };

    const getUserName = () => {
        if (user?.profile_data?.name) return user.profile_data.name;
        if (user?.name) return user.name;
        if (user?.email) return user.email.split('@')[0];
        return "User";
    };

    const getInitial = () => {
        const name = getUserName();
        return name.charAt(0).toUpperCase();
    };

    const getProfilePhoto = () => {
        return user?.profile_data?.profilePhoto || null;
    };

    const handleLogout = () => {
        // Clear all authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("access_token");

        // Redirect to role-specific login page
        const loginPath = role === "DEVELOPER" ? "/developer/login" : "/buyer/login";

        // Use replace to prevent back button navigation
        router.replace(loginPath);

        // Force reload to clear any cached state
        setTimeout(() => {
            window.location.replace(loginPath);
        }, 100);
    };

    const roleLabel = role === "DEVELOPER" ? "Developer" : "Buyer";

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
            {/* Sidebar - Desktop */}
            <aside className={cn(
                "hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700/50 shadow-sm transition-all duration-300",
                sidebarCollapsed ? "lg:w-20" : "lg:w-72"
            )}>
                {/* Logo Header */}
                <div className={cn(
                    "h-24 py-4 flex items-center border-b border-slate-100 dark:border-slate-700/50 transition-all duration-300",
                    sidebarCollapsed ? "justify-center px-2" : "gap-4 px-6"
                )}>
                    <div className={cn(
                        "rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg ring-4 transition-all duration-300",
                        colors.gradient,
                        colors.ring,
                        sidebarCollapsed ? "w-10 h-10" : "w-12 h-12"
                    )}>
                        <Leaf className={cn("text-white", sidebarCollapsed ? "h-5 w-5" : "h-6 w-6")} />
                    </div>
                    {!sidebarCollapsed && (
                        <div className="overflow-hidden">
                            <h1 className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">CredoCarbon</h1>
                            <p className={cn("text-xs font-semibold uppercase tracking-wider", colors.textAccent)}>{roleLabel} Portal</p>
                        </div>
                    )}
                </div>

                {/* Sidebar Navigation */}
                <DashboardSidebar role={role} className="flex-1" collapsed={sidebarCollapsed} />

                {/* Collapse Toggle & Logout */}
                <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 space-y-3">
                    {/* Collapse Button */}
                    <Button
                        variant="ghost"
                        className={cn(
                            "w-full h-10 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-xl transition-colors",
                            sidebarCollapsed ? "justify-center px-0" : "justify-start gap-3"
                        )}
                        onClick={toggleSidebarCollapse}
                    >
                        {sidebarCollapsed ? (
                            <PanelLeft className="h-5 w-5" />
                        ) : (
                            <>
                                <PanelLeftClose className="h-5 w-5" />
                                <span className="text-sm font-medium">Collapse</span>
                            </>
                        )}
                    </Button>

                    {/* User Card (only when expanded) */}
                    {!sidebarCollapsed && (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 space-y-4">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-700 shadow-sm">
                                    <AvatarImage src={getProfilePhoto() || undefined} alt={getUserName()} />
                                    <AvatarFallback className={cn("bg-gradient-to-br text-white font-bold", colors.gradient)}>
                                        {getInitial()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{getUserName()}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                className="w-full justify-center gap-2 h-10 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="text-sm font-medium">Sign Out</span>
                            </Button>
                        </div>
                    )}

                    {/* Collapsed logout button */}
                    {sidebarCollapsed && (
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-center h-10 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="right">Sign Out</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </aside>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-50">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
                    <aside className="fixed top-0 left-0 h-full w-72 bg-white dark:bg-slate-800 shadow-2xl">
                        {/* Logo Header */}
                        <div className="h-24 py-4 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
                                    colors.gradient
                                )}>
                                    <Leaf className="h-6 w-6 text-white" />
                                </div>
                                <h1 className="font-bold text-xl text-slate-900 dark:text-white">CredoCarbon</h1>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="rounded-xl">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        <DashboardSidebar role={role} closeMobile={() => setSidebarOpen(false)} className="flex-1" />

                        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-100 dark:border-slate-700/50 bg-white dark:bg-slate-800">
                            <Button
                                variant="ghost"
                                className="w-full justify-center gap-2 h-12 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl"
                                onClick={handleLogout}
                            >
                                <LogOut className="h-4 w-4" />
                                <span className="font-medium">Sign Out</span>
                            </Button>
                        </div>
                    </aside>
                </div>
            )}

            {/* Main Content */}
            <div className={cn(
                "transition-all duration-300",
                sidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
            )}>
                {/* Header */}
                <header className="sticky top-0 z-40 h-24 bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
                    <div className="flex items-center justify-between h-full px-6 lg:px-8">
                        {/* Mobile Menu Button */}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="lg:hidden rounded-xl"
                            onClick={() => setSidebarOpen(true)}
                        >
                            <Menu className="h-5 w-5" />
                        </Button>

                        {/* Spacer for desktop */}
                        <div className="hidden lg:block" />

                        {/* Right side - Theme toggle & User menu */}
                        <div className="flex items-center gap-3">
                            <ThemeToggle />

                            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block" />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        className="flex items-center gap-3 h-auto py-2.5 px-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                                    >
                                        <Avatar className="h-9 w-9 ring-2 ring-slate-100 dark:ring-slate-700">
                                            <AvatarImage src={getProfilePhoto() || undefined} alt={getUserName()} />
                                            <AvatarFallback className={cn("bg-gradient-to-br text-white font-semibold text-sm", colors.gradient)}>
                                                {getInitial()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="hidden sm:block text-left">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{getUserName()}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{roleLabel}</p>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-slate-400 hidden sm:block" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 p-2" align="end">
                                    <DropdownMenuLabel className="px-3 py-2">
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-semibold">{getUserName()}</p>
                                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 cursor-pointer">
                                        <Link href={`/dashboard/${role.toLowerCase()}/profile`}>
                                            <User className="mr-3 h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild className="rounded-lg px-3 py-2.5 cursor-pointer">
                                        <Link href={`/dashboard/${role.toLowerCase()}/profile?tab=security`}>
                                            <Settings className="mr-3 h-4 w-4" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={handleLogout}
                                        className="rounded-lg px-3 py-2.5 cursor-pointer text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-900/20"
                                    >
                                        <LogOut className="mr-3 h-4 w-4" />
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
