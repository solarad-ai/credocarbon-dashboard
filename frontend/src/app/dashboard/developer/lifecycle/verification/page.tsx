"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, CheckCircle2, Clock, AlertCircle, FileText, Upload,
    Calendar, ClipboardCheck, BarChart3, Send, Eye, RefreshCw, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function VerificationModulePage() {
    const [verificationData, setVerificationData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call - in future this would fetch from backend
        const fetchData = async () => {
            setLoading(true);
            // No backend API exists for verification yet, so we return empty
            await new Promise(resolve => setTimeout(resolve, 500));
            setVerificationData([]);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading verification data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center shadow-lg">
                        <ClipboardCheck className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verification Module</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Monitoring period verification tracking</p>
                    </div>
                </div>
                <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-lg">
                    <FileText className="mr-2 h-4 w-4" />
                    Submit Monitoring Report
                </Button>
            </div>

            {/* Summary Cards - Empty state */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">0</p>
                                <p className="text-sm text-muted-foreground">ERs Verified</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                <RefreshCw className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">0</p>
                                <p className="text-sm text-muted-foreground">ERs In Verification</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                                <BarChart3 className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <p className="text-2xl font-bold">0</p>
                                <p className="text-sm text-muted-foreground">Monitoring Periods</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Empty State */}
            <Card>
                <CardContent className="py-16 text-center">
                    <ClipboardCheck className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Verification Data</h3>
                    <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                        No monitoring periods have been submitted for verification yet.
                        Once your project is validated, you can submit monitoring reports for verification.
                    </p>
                    <Button className="gradient-primary text-white">
                        <FileText className="mr-2 h-4 w-4" />
                        Submit Monitoring Report
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

