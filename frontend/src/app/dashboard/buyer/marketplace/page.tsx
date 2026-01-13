"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    Search, Filter, Grid3X3, List, Sun, Wind, Droplets, Trees, Leaf,
    MapPin, Calendar, TrendingUp, ShoppingCart, Heart, ChevronDown, ArrowLeft, Loader2
} from "lucide-react";
import { marketplaceApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface CreditListing {
    id: number;
    project_name: string;
    project_type: string;
    registry: string;
    vintage: number;
    quantity_available: number;
    price_per_ton: number;
    location: string;
    seller_name: string;
    seller_id: number;
    min_quantity: number;
    is_favorite?: boolean;
}

const projectTypeIcons: Record<string, React.ElementType> = {
    solar: Sun,
    wind: Wind,
    hydro: Droplets,
    redd: Trees,
    biogas: Leaf,
    ar: Trees,
    biomass: Leaf,
};

const projectTypeColors: Record<string, string> = {
    solar: "text-yellow-500 bg-yellow-100",
    wind: "text-blue-500 bg-blue-100",
    hydro: "text-cyan-500 bg-cyan-100",
    redd: "text-green-700 bg-green-100",
    biogas: "text-emerald-600 bg-emerald-100",
    ar: "text-emerald-600 bg-emerald-100",
    biomass: "text-orange-500 bg-orange-100",
};

export default function MarketplacePage() {
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [projectTypeFilter, setProjectTypeFilter] = useState("all");
    const [registryFilter, setRegistryFilter] = useState("all");
    const [priceRange, setPriceRange] = useState([0, 30]);
    const [sortBy, setSortBy] = useState("price_asc");
    const [favorites, setFavorites] = useState<number[]>([]);
    const [listings, setListings] = useState<CreditListing[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        try {
            setLoading(true);
            const data = await marketplaceApi.getListings();
            setListings(data);
        } catch (err) {
            console.error("Error fetching listings:", err);
        } finally {
            setLoading(false);
        }
    };

    const toggleFavorite = (id: number) => {
        setFavorites(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const filteredListings = listings
        .filter(listing => {
            if (searchQuery && !listing.project_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
            if (projectTypeFilter !== "all" && listing.project_type !== projectTypeFilter) return false;
            if (registryFilter !== "all" && listing.registry !== registryFilter) return false;
            if (listing.price_per_ton < priceRange[0] || listing.price_per_ton > priceRange[1]) return false;
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "price_asc": return a.price_per_ton - b.price_per_ton;
                case "price_desc": return b.price_per_ton - a.price_per_ton;
                case "quantity_desc": return b.quantity_available - a.quantity_available;
                default: return 0;
            }
        });

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading marketplace...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-card border-b ">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard/buyer">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="font-semibold text-xl">Carbon Credit Marketplace</h1>
                            <p className="text-sm text-muted-foreground">
                                {filteredListings.length} credits available
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant={viewMode === "grid" ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode("grid")}
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={viewMode === "list" ? "secondary" : "ghost"}
                            size="icon"
                            onClick={() => setViewMode("list")}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="flex gap-8">
                    {/* Filters Sidebar */}
                    <aside className="hidden lg:block w-64 flex-shrink-0">
                        <Card className="sticky top-24">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Filter className="h-4 w-4" />
                                    Filters
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Project Type */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Project Type</label>
                                    <Select value={projectTypeFilter} onValueChange={setProjectTypeFilter}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Types</SelectItem>
                                            <SelectItem value="solar">Solar</SelectItem>
                                            <SelectItem value="wind">Wind</SelectItem>
                                            <SelectItem value="hydro">Hydro</SelectItem>
                                            <SelectItem value="biogas">Biogas</SelectItem>
                                            <SelectItem value="redd">REDD+</SelectItem>
                                            <SelectItem value="ar">Afforestation</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Registry */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Registry</label>
                                    <Select value={registryFilter} onValueChange={setRegistryFilter}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Registries</SelectItem>
                                            <SelectItem value="VCS">Verra VCS</SelectItem>
                                            <SelectItem value="Gold Standard">Gold Standard</SelectItem>
                                            <SelectItem value="ACR">ACR</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Price Range */}
                                <div className="space-y-4">
                                    <label className="text-sm font-medium">Price Range ($/tCO₂e)</label>
                                    <Slider
                                        value={priceRange}
                                        onValueChange={setPriceRange}
                                        max={30}
                                        step={1}
                                        className="mt-2"
                                    />
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>${priceRange[0]}</span>
                                        <span>${priceRange[1]}</span>
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full" onClick={() => {
                                    setProjectTypeFilter("all");
                                    setRegistryFilter("all");
                                    setPriceRange([0, 30]);
                                }}>
                                    Reset Filters
                                </Button>
                            </CardContent>
                        </Card>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1 space-y-6">
                        {/* Search and Sort */}
                        <div className="flex gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search projects..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={sortBy} onValueChange={setSortBy}>
                                <SelectTrigger className="w-48">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="price_asc">Price: Low to High</SelectItem>
                                    <SelectItem value="price_desc">Price: High to Low</SelectItem>
                                    <SelectItem value="quantity_desc">Quantity: High to Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Listings Grid */}
                        <div className={cn(
                            "grid gap-6",
                            viewMode === "grid"
                                ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3"
                                : "grid-cols-1"
                        )}>
                            {filteredListings.map((listing) => {
                                const Icon = projectTypeIcons[listing.project_type] || Leaf;
                                const colorClasses = projectTypeColors[listing.project_type] || "text-gray-500 bg-gray-100";
                                const isFavorite = favorites.includes(listing.id);

                                return (
                                    <Card key={listing.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                        <CardHeader className="pb-3">
                                            <div className="flex items-start justify-between">
                                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", colorClasses.split(" ")[1])}>
                                                    <Icon className={cn("h-6 w-6", colorClasses.split(" ")[0])} />
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => toggleFavorite(listing.id)}
                                                    className={isFavorite ? "text-red-500" : "text-muted-foreground"}
                                                >
                                                    <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
                                                </Button>
                                            </div>
                                            <CardTitle className="text-lg mt-3">{listing.project_name}</CardTitle>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <MapPin className="h-3 w-3" />
                                                {listing.location}
                                                <span className="mx-1">•</span>
                                                <Calendar className="h-3 w-3" />
                                                Vintage {listing.vintage}
                                            </div>
                                        </CardHeader>
                                        <CardContent className="pb-3">
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                <Badge variant="secondary">{listing.registry}</Badge>
                                                <Badge variant="outline">{listing.project_type}</Badge>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Available</p>
                                                    <p className="font-semibold">{listing.quantity_available.toLocaleString()} tCO₂e</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Price</p>
                                                    <p className="font-semibold text-ocean-600">${listing.price_per_ton.toFixed(2)}/tCO₂e</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                        <CardFooter className="pt-3 border-t">
                                            <div className="flex items-center justify-between w-full">
                                                <div className="text-sm text-muted-foreground">
                                                    {listing.seller_name}
                                                </div>
                                                <Button className="bg-gradient-to-r from-ocean-500 to-ocean-600 text-white">
                                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                                    Buy Now
                                                </Button>
                                            </div>
                                        </CardFooter>
                                    </Card>
                                );
                            })}
                        </div>

                        {filteredListings.length === 0 && (
                            <Card>
                                <CardContent className="py-12 text-center">
                                    <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-muted-foreground">No credits match your filters</p>
                                    <Button variant="outline" className="mt-4" onClick={() => {
                                        setSearchQuery("");
                                        setProjectTypeFilter("all");
                                        setRegistryFilter("all");
                                        setPriceRange([0, 30]);
                                    }}>
                                        Clear Filters
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
