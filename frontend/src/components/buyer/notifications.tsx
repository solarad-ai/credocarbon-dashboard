"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

export default function BuyerNotifications() {
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        // Fetch notifications
        const fetchNotifications = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("https://credocarbon-api-641001192587.asia-south2.run.app/api/notifications", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setNotifications(data as any);
                }
            } catch (e) {
                console.error(e);
            }
        };

        fetchNotifications();
    }, []);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold tracking-tight">Notifications</h2>
            <div className="space-y-2">
                {notifications.length === 0 ? (
                    <Card>
                        <CardContent className="p-4 text-muted-foreground text-sm">
                            No new notifications.
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((n, i) => (
                        <Card key={i}>
                            <CardContent className="p-4 flex gap-4 items-start">
                                <Bell className="h-5 w-5 text-blue-500 mt-0.5" />
                                <div>
                                    <p className="font-medium text-sm">Notification Title</p>
                                    <p className="text-xs text-muted-foreground">Notification details...</p>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
