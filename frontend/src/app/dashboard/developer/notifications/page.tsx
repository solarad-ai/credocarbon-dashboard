"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, Bell, Check, CheckCheck, Filter, MoreHorizontal,
    FileText, TrendingUp, AlertCircle, Settings, Trash2, Mail, MailOpen, Loader2
} from "lucide-react";
import { notificationApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const typeConfig: Record<string, { icon: typeof Bell; color: string; label: string }> = {
    lifecycle: { icon: FileText, color: "text-blue-500", label: "Lifecycle" },
    validation: { icon: FileText, color: "text-blue-500", label: "Validation" },
    verification: { icon: FileText, color: "text-indigo-500", label: "Verification" },
    issuance: { icon: FileText, color: "text-green-500", label: "Issuance" },
    market: { icon: TrendingUp, color: "text-green-500", label: "Market" },
    sale: { icon: TrendingUp, color: "text-green-500", label: "Sale" },
    purchase: { icon: TrendingUp, color: "text-emerald-500", label: "Purchase" },
    system: { icon: Settings, color: "text-purple-500", label: "System" },
    document: { icon: AlertCircle, color: "text-orange-500", label: "Document" },
};

export default function NotificationsPage() {
    const [activeTab, setActiveTab] = useState("all");
    const [notificationList, setNotificationList] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationApi.getAll();
            setNotificationList(data as any);
        } catch (err) {
            console.error("Error fetching notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    const filteredNotifications = notificationList.filter(n => {
        if (activeTab === "all") return true;
        if (activeTab === "unread") return !n.read;
        return n.type === activeTab;
    });

    const unreadCount = notificationList.filter(n => !n.read).length;

    const markAsRead = async (id: number) => {
        try {
            await notificationApi.markAsRead(id);
            setNotificationList(prev =>
                prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
        } catch (err) {
            console.error("Error marking as read:", err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationApi.markAllAsRead();
            setNotificationList(prev => prev.map(n => ({ ...n, read: true })));
        } catch (err) {
            console.error("Error marking all as read:", err);
        }
    };

    const deleteNotification = async (id: number) => {
        try {
            await notificationApi.delete(id);
            setNotificationList(prev => prev.filter(n => n.id !== id));
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

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
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <Bell className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Notifications</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
                        </p>
                    </div>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" size="sm" onClick={markAllAsRead}>
                        <CheckCheck className="mr-2 h-4 w-4" />
                        Mark All Read
                    </Button>
                )}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="w-full justify-start">
                    <TabsTrigger value="all" className="relative">
                        All
                        {unreadCount > 0 && (
                            <Badge className="ml-2 bg-primary text-primary-foreground text-xs">
                                {unreadCount}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="unread">Unread</TabsTrigger>
                    <TabsTrigger value="issuance">Issuance</TabsTrigger>
                    <TabsTrigger value="sale">Sales</TabsTrigger>
                    <TabsTrigger value="system">System</TabsTrigger>
                </TabsList>
            </Tabs>



            {/* Notifications List */}
            <Card>
                <CardContent className="p-0 divide-y">
                    {filteredNotifications.length === 0 ? (
                        <div className="text-center py-12">
                            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <p className="text-muted-foreground">No notifications in this category</p>
                        </div>
                    ) : (
                        filteredNotifications.map((notification) => {
                            const typeInfo = typeConfig[notification.type] || typeConfig.system;
                            const Icon = typeInfo.icon;

                            return (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "flex gap-4 p-4 hover:bg-muted/50 transition-colors cursor-pointer",
                                        !notification.read && "bg-primary/5"
                                    )}
                                    onClick={() => markAsRead(notification.id)}
                                >
                                    {/* Icon */}
                                    <div className="flex flex-col items-center gap-2">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center",
                                            notification.read ? "bg-muted" : "bg-primary/10"
                                        )}>
                                            <Icon className={cn("h-5 w-5", typeInfo.color)} />
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className={cn(
                                                    "font-medium",
                                                    !notification.read && "text-primary"
                                                )}>
                                                    {notification.title}
                                                </h3>
                                                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <Badge variant="outline" className="text-xs">
                                                        {typeInfo.label}
                                                    </Badge>
                                                    <span className="text-xs text-muted-foreground">
                                                        {notification.timestamp}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {!notification.read && (
                                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                                )}
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={(e) => {
                                                            e.stopPropagation();
                                                            markAsRead(notification.id);
                                                        }}>
                                                            <MailOpen className="mr-2 h-4 w-4" />
                                                            Mark as Read
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteNotification(notification.id);
                                                            }}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

