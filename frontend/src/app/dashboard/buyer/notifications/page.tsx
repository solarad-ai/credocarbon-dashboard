"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Bell, Check, CheckCheck, Trash2, Filter, Search,
    Package, FileText, TrendingUp, AlertCircle, Info, ShoppingCart, Loader2
} from "lucide-react";
import { notificationApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Notification {
    id: number;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    link?: string;
}

export default function BuyerNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("all");
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationApi.getAll();
            setNotifications(data as any);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = async (id: number) => {
        try {
            await notificationApi.markAsRead(id);
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            await notificationApi.delete(id);
            setNotifications(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "purchase":
                return <ShoppingCart className="h-5 w-5 text-green-600" />;
            case "market":
                return <TrendingUp className="h-5 w-5 text-blue-600" />;
            case "retirement":
                return <FileText className="h-5 w-5 text-purple-600" />;
            case "issuance":
                return <Package className="h-5 w-5 text-teal-600" />;
            case "verification":
            case "validation":
                return <AlertCircle className="h-5 w-5 text-yellow-600" />;
            case "system":
                return <Info className="h-5 w-5 text-gray-600" />;
            default:
                return <Bell className="h-5 w-5" />;
        }
    };

    const getTypeBadge = (type: string) => {
        const styles: Record<string, string> = {
            purchase: "bg-green-100 text-green-700",
            sale: "bg-orange-100 text-orange-700",
            market: "bg-blue-100 text-blue-700",
            retirement: "bg-purple-100 text-purple-700",
            issuance: "bg-teal-100 text-teal-700",
            verification: "bg-yellow-100 text-yellow-700",
            validation: "bg-amber-100 text-amber-700",
            system: "bg-gray-100 text-gray-700",
        };
        return <Badge className={styles[type] || "bg-gray-100 text-gray-700"}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
    };

    const filteredNotifications = notifications.filter(n => {
        if (filter !== "all" && n.type !== filter) return false;
        if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !n.message?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading notifications...</p>
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
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-ocean-100 flex items-center justify-center">
                                <Bell className="h-5 w-5 text-ocean-600" />
                            </div>
                            <div>
                                <h1 className="font-semibold text-xl">Notifications</h1>
                                <p className="text-sm text-muted-foreground">
                                    {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                                </p>
                            </div>
                        </div>
                    </div>
                    {unreadCount > 0 && (
                        <Button variant="outline" onClick={markAllAsRead}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark All Read
                        </Button>
                    )}
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="max-w-3xl mx-auto space-y-6">

                    {/* Search and Filter */}
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search notifications..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Tabs */}
                    <Tabs value={filter} onValueChange={setFilter}>
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="purchase">Purchases</TabsTrigger>
                            <TabsTrigger value="market">Market</TabsTrigger>
                            <TabsTrigger value="retirement">Retirements</TabsTrigger>
                            <TabsTrigger value="system">System</TabsTrigger>
                        </TabsList>

                        <TabsContent value={filter} className="mt-6">
                            {filteredNotifications.length === 0 ? (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">No notifications found</p>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="space-y-3">
                                    {filteredNotifications.map((notification) => (
                                        <Card
                                            key={notification.id}
                                            className={cn(
                                                "transition-all hover:shadow-md",
                                                !notification.read && "border-l-4 border-l-ocean-500 bg-ocean-50/30"
                                            )}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start gap-4">
                                                    <div className={cn(
                                                        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                                                        notification.type === "purchase" && "bg-green-100",
                                                        notification.type === "market" && "bg-blue-100",
                                                        notification.type === "retirement" && "bg-purple-100",
                                                        notification.type === "issuance" && "bg-teal-100",
                                                        notification.type === "verification" && "bg-yellow-100",
                                                        notification.type === "system" && "bg-gray-100",
                                                    )}>
                                                        {getTypeIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h3 className="font-medium">{notification.title}</h3>
                                                            {!notification.read && (
                                                                <span className="w-2 h-2 rounded-full bg-ocean-500" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-muted-foreground">
                                                                {notification.timestamp}
                                                            </span>
                                                            {getTypeBadge(notification.type)}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {notification.link && (
                                                            <Link href={notification.link}>
                                                                <Button variant="outline" size="sm">
                                                                    View
                                                                </Button>
                                                            </Link>
                                                        )}
                                                        {!notification.read && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => markAsRead(notification.id)}
                                                            >
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => deleteNotification(notification.id)}
                                                            className="text-muted-foreground hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}
