"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, CheckCircle2, Clock, AlertCircle, FileText, Upload,
    MessageSquare, Calendar, User, Building2, Send, Eye, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const vvbList = [
    { id: "sgs", name: "SGS Carbon Services", accreditation: "VCS, GS" },
    { id: "dnv", name: "DNV GL", accreditation: "VCS, GS, ACR" },
    { id: "tuv", name: "TÜV SÜD", accreditation: "VCS, GS" },
    { id: "eko", name: "EKO Energy", accreditation: "GS, I-REC" },
    { id: "bureau", name: "Bureau Veritas", accreditation: "VCS, ACR" },
];

export default function ValidationModulePage() {
    const [selectedVVB, setSelectedVVB] = useState("");
    const [showNewRequest, setShowNewRequest] = useState(false);
    const [validationRequests, setValidationRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate API call - in future this would fetch from backend
        const fetchData = async () => {
            setLoading(true);
            // No backend API exists for validation yet, so we return empty
            await new Promise(resolve => setTimeout(resolve, 500));
            setValidationRequests([]);
            setLoading(false);
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                    <p className="mt-2 text-muted-foreground">Loading validation data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                        <CheckCircle2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Validation Module</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">VVB interaction & validation tracking</p>
                    </div>
                </div>
                <Button
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-lg"
                    onClick={() => setShowNewRequest(true)}
                >
                    <Send className="mr-2 h-4 w-4" />
                    Request Validation
                </Button>
            </div>

            {/* New Validation Request Form */}
            {showNewRequest && (

                <Card className="border-primary/20 bg-primary/5 animate-fade-in">
                    <CardHeader>
                        <CardTitle>Request New Validation</CardTitle>
                        <CardDescription>Select a VVB and submit your project for validation</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Select VVB *</Label>
                                <Select value={selectedVVB} onValueChange={setSelectedVVB}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Choose a VVB" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {vvbList.map(vvb => (
                                            <SelectItem key={vvb.id} value={vvb.id}>
                                                <div>
                                                    <p>{vvb.name}</p>
                                                    <p className="text-xs text-muted-foreground">{vvb.accreditation}</p>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Project</Label>
                                <Select>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">No projects available</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Additional Notes for VVB</Label>
                            <Textarea placeholder="Any specific instructions or context for the validation body..." rows={3} />
                        </div>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowNewRequest(false)}>Cancel</Button>
                            <Button className="gradient-primary text-white">
                                <Send className="mr-2 h-4 w-4" />
                                Submit Request
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {validationRequests.length === 0 && !showNewRequest && (
                <Card>
                    <CardContent className="py-16 text-center">
                        <CheckCircle2 className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">No Validation Requests</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            You haven't submitted any projects for validation yet.
                            Start by requesting validation from a certified VVB.
                        </p>
                        <Button
                            className="gradient-primary text-white"
                            onClick={() => setShowNewRequest(true)}
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Request Validation
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

