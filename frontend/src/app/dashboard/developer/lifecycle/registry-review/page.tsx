"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, CheckCircle2, Clock, AlertCircle, FileText, MessageSquare,
    Calendar, Building2, Eye, RefreshCw, ExternalLink, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function RegistryReviewPage() {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call - in future this would fetch from backend
        const fetchData = async () => {
            setLoading(true);
            // No backend API exists for registry review yet, so we return empty
            await new Promise(resolve => setTimeout(resolve, 500));
            setSubmissions([]);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading registry review data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shadow-lg">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Registry Review</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Track registration status with carbon registries</p>
                    </div>
                </div>
            </div>

            {/* Empty State */}
            <Card>

                <CardContent className="py-16 text-center">
                    <Building2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Registry Submissions</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        No projects have been submitted for registry review yet.
                        Projects are submitted to the registry after successful validation and verification.
                    </p>
                    <Link href="/dashboard/developer/lifecycle">
                        <Button variant="outline">
                            View Project Lifecycle
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}

