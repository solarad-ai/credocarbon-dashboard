"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    LayoutDashboard, ShoppingCart, Wallet, FileCheck, Settings, Bell, User, LogOut,
    TrendingUp, Search, Filter, ArrowRight, ChevronRight, Package, Loader2, Leaf
} from "lucide-react";
import { dashboardApi, marketplaceApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface BuyerStats {
    total_credits: number;
    total_value: number;
    retired_credits: number;
    pending_purchases: number;
    available_credits: number;
}

interface MarketListing {
    id: number;
    project_name: string;
    project_type: string;
    registry: string;
    vintage: number;
    quantity_available: number;
    price_per_ton: number;
    location: string;
    seller_name: string;
}

const projectTypeColors: Record<string, string> = {
    "solar": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    "wind": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    "biogas": "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    "redd": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    "hydro": "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
};

export default function BuyerDashboardPage() {
    const [user, setUser] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [registryFilter, setRegistryFilter] = useState<string>("all");
    const [stats, setStats] = useState<BuyerStats | null>(null);
    const [listings, setListings] = useState<MarketListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Authentication guard - check if user is logged in
        const token = localStorage.getItem("token");
        if (!token) {
            // No token, redirect to buyer login
            window.location.replace("/buyer/login");
            return;
        }

        const userData = localStorage.getItem("user");
        if (userData) {
            setUser(JSON.parse(userData));
        }
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [statsData, listingsData] = await Promise.all([
                dashboardApi.getBuyerStats(),
                marketplaceApi.getListings()
            ]);
            setStats(statsData);
            setListings(listingsData);
        } catch (err) {
            console.error("Error fetching dashboard data:", err);
            // If API call fails due to auth, logout
            const error = err as any;
            if (error?.status === 401 || error?.message?.includes('Unauthorized')) {
                handleLogout();
            }
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        // Clear all authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("access_token");

        // Use replace to prevent back button navigation
        window.location.replace("/buyer/login");
    };

    const filteredListings = listings.filter(listing => {
        const matchesSearch = listing.project_name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRegistry = registryFilter === "all" || listing.registry === registryFilter;
        return matchesSearch && matchesRegistry;
    });

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            {/* Sidebar */}
            <aside className="hidden lg:flex flex-col w-64 border-r bg-card">
                {/* Logo */}
                <div className="h-16 flex items-center gap-3 px-6 border-b">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-ocean-500 to-ocean-600 flex items-center justify-center">
                        <Leaf className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-lg text-gradient">CredoCarbon</span>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    <div className="mb-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                            Marketplace
                        </p>
                        <Link href="/dashboard/buyer" className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-primary/10 text-primary font-medium">
                            <LayoutDashboard className="h-5 w-5" />
                            Overview
                        </Link>
                        <Link href="/dashboard/buyer/marketplace" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <ShoppingCart className="h-5 w-5" />
                            Browse Credits
                        </Link>
                        <Link href="/dashboard/buyer/offers" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <TrendingUp className="h-5 w-5" />
                            My Offers
                        </Link>
                    </div>

                    <div className="mb-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                            Portfolio
                        </p>
                        <Link href="/dashboard/buyer/wallet" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <Wallet className="h-5 w-5" />
                            My Wallet
                        </Link>
                        <Link href="/dashboard/buyer/retirements" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                            <FileCheck className="h-5 w-5" />
                            Retirements
                        </Link>
                    </div>
                </nav>

                {/* Bottom Section */}
                <div className="p-4 border-t space-y-1">
                    <Link href="/dashboard/buyer/notifications" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Bell className="h-5 w-5" />
                        Notifications
                    </Link>
                    <Link href="/dashboard/buyer/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
                        <Settings className="h-5 w-5" />
                        Settings
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 bg-muted/30">
                {/* Header */}
                <header className="h-16 border-b bg-card flex items-center justify-between px-6">
                    <div>
                        <h1 className="text-xl font-semibold">Buyer Dashboard</h1>
                        <p className="text-sm text-muted-foreground">
                            Welcome back{user?.profile_data?.name ? `, ${user.profile_data.name}` : ""}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-ocean-500 rounded-full"></span>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user?.profile_data?.profilePhoto || undefined} alt={user?.profile_data?.name || "Buyer"} />
                                        <AvatarFallback className="bg-gradient-to-br from-ocean-500 to-ocean-600 text-white text-sm">
                                            {user?.profile_data?.name?.charAt(0) || "B"}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden md:inline text-sm">{user?.profile_data?.name || "Buyer"}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/dashboard/buyer/profile">
                                        <User className="mr-2 h-4 w-4" />
                                        Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="cursor-pointer text-destructive"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Dashboard Content */}
                <div className="p-6 space-y-6">
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="card-hover">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Credits Owned</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-gradient">
                                    {(stats?.total_credits || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">tCO₂e in portfolio</p>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Portfolio Value</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-green-600">
                                    ${((stats?.total_value || 0) / 1000).toFixed(1)}K
                                </div>
                                <p className="text-xs text-muted-foreground">Total investment value</p>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Credits Retired</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-purple-600">
                                    {(stats?.retired_credits || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">For carbon neutrality</p>
                            </CardContent>
                        </Card>
                        <Card className="card-hover">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-orange-600">
                                    {stats?.pending_purchases || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">Purchases pending</p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Marketplace Browse */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Browse Marketplace</CardTitle>
                                    <CardDescription>Discover carbon credits from verified projects</CardDescription>
                                </div>
                                <Link href="/dashboard/buyer/marketplace">
                                    <Button variant="outline" size="sm">
                                        View All
                                        <ChevronRight className="ml-1 h-4 w-4" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* Search and Filter */}
                            <div className="flex gap-4 mb-6">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search projects..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9"
                                    />
                                </div>
                                <Select value={registryFilter} onValueChange={setRegistryFilter}>
                                    <SelectTrigger className="w-40">
                                        <SelectValue placeholder="Registry" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Registries</SelectItem>
                                        <SelectItem value="VCS">VCS</SelectItem>
                                        <SelectItem value="GS">Gold Standard</SelectItem>
                                        <SelectItem value="ACR">ACR</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Listings Grid */}
                            {filteredListings.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No listings available</p>
                                    <p className="text-sm text-muted-foreground mt-1">Check back later for new carbon credits</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredListings.map((listing) => (
                                        <Card key={listing.id} className="hover:shadow-md transition-shadow">
                                            <CardHeader className="pb-2">
                                                <div className="flex items-start justify-between">
                                                    <Badge className={cn(projectTypeColors[listing.project_type] || "bg-gray-100 text-gray-700")}>
                                                        {listing.project_type}
                                                    </Badge>
                                                    <Badge variant="outline">{listing.registry}</Badge>
                                                </div>
                                                <CardTitle className="text-base mt-2">{listing.project_name}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground">Available</p>
                                                        <p className="font-medium">{listing.quantity_available.toLocaleString()} tCO₂e</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground">Price</p>
                                                        <p className="font-medium text-ocean-600">${listing.price_per_ton.toFixed(2)}/tCO₂e</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                            <CardFooter className="pt-0">
                                                <Button className="w-full" size="sm">
                                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                                    Buy Credits
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
