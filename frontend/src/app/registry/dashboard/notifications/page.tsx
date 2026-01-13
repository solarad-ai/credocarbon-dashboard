"use client";

import { useEffect, useState } from "react";
import {
    Bell,
    Clock,
    CheckCircle,
    AlertTriangle,
    Info,
    FileText,
    CheckCheck,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    is_read: boolean;
    created_at: string;
    link?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://credocarbon-api-641001192587.asia-south2.run.app";

const typeIcons: Record<string, React.ReactNode> = {
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-500" />,
    success: <CheckCircle className="h-5 w-5 text-emerald-500" />,
    task: <FileText className="h-5 w-5 text-purple-500" />,
};

export default function RegistryNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "unread">("all");

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE_URL}/api/notifications`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setNotifications(data as any);
            } else {
                setNotifications([]);
            }
        } catch (err) {
            setNotifications([]);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId: number) => {
        try {
            const token = localStorage.getItem("access_token");
            await fetch(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            fetchNotifications();
        } catch (err) {
            console.error("Failed to mark as read");
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem("access_token");
            await fetch(`${API_BASE_URL}/api/notifications/read-all`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            fetchNotifications();
        } catch (err) {
            console.error("Failed to mark all as read");
        }
    };

    const filteredNotifications = notifications.filter((n) => {
        if (filter === "unread") return !n.is_read;
        return true;
    });

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <Bell className="h-7 w-7 text-blue-500" />
                        Notifications
                        {unreadCount > 0 && (
                            <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
                        )}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Stay updated with registry reviews and issuances
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button variant="outline" onClick={markAllAsRead} className="gap-2">
                        <CheckCheck className="h-4 w-4" />
                        Mark all as read
                    </Button>
                )}
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                    className={filter === "all" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                    All ({notifications.length})
                </Button>
                <Button
                    variant={filter === "unread" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("unread")}
                    className={filter === "unread" ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                    Unread ({unreadCount})
                </Button>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
                {filteredNotifications.length === 0 ? (
                    <Card className="border-slate-200 dark:border-slate-700">
                        <CardContent className="py-12 text-center">
                            <Bell className="h-12 w-12 mx-auto mb-4 text-slate-400" />
                            <h3 className="text-lg font-medium text-slate-900 dark:text-white">
                                No notifications
                            </h3>
                            <p className="text-slate-500 mt-1">
                                {filter === "unread"
                                    ? "All caught up!"
                                    : "You don't have any notifications yet."}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredNotifications.map((notification) => (
                        <Card
                            key={notification.id}
                            className={`border-slate-200 dark:border-slate-700 transition-all ${!notification.is_read
                                ? "bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500"
                                : ""
                                }`}
                        >
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="mt-1">
                                        {typeIcons[notification.type] || typeIcons.info}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-semibold text-slate-900 dark:text-white">
                                            {notification.title}
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-slate-500 mt-2">
                                            {new Date(notification.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    {!notification.is_read && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => markAsRead(notification.id)}
                                        >
                                            Mark read
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
