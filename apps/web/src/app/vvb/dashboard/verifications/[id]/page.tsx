"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    FileSearch,
    Clock,
    AlertTriangle,
    FileText,
    MessageSquare,
    User,
    Calendar,
    Save,
    BarChart3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface VerificationTask {
    id: number;
    project_id: number;
    project_name: string;
    project_code: string;
    project_type: string;
    developer_name: string;
    status: string;
    monitoring_period_start: string | null;
    monitoring_period_end: string | null;
    claimed_reductions: number | null;
    verified_reductions: number | null;
    checklist: Record<string, string>;
    remarks: string | null;
    decision_notes: string | null;
    assigned_at: string;
    started_at: string | null;
    completed_at: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://credocarbon-api-641001192587.asia-south2.run.app";

const statusColors: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    QUERIES_RAISED: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
};

const verificationChecklist = [
    { key: "monitoring_data", label: "Monitoring Data Review" },
    { key: "emission_calculations", label: "Emission Reduction Calculations" },
    { key: "data_quality", label: "Data Quality Assessment" },
    { key: "calibration_records", label: "Calibration Records" },
    { key: "operational_compliance", label: "Operational Compliance" },
    { key: "deviation_check", label: "Deviation from PDD Check" },
    { key: "site_visit", label: "Site Visit Completed" },
    { key: "stakeholder_feedback", label: "Stakeholder Feedback Review" },
    { key: "documentation_complete", label: "Documentation Completeness" },
    { key: "technical_review", label: "Technical Review" },
];

export default function VerificationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [task, setTask] = useState<VerificationTask | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [checklist, setChecklist] = useState<Record<string, string>>({});
    const [remarks, setRemarks] = useState("");
    const [decisionNotes, setDecisionNotes] = useState("");
    const [status, setStatus] = useState("");
    const [verifiedReductions, setVerifiedReductions] = useState<string>("");

    useEffect(() => {
        fetchVerificationTask();
    }, [params.id]);

    const fetchVerificationTask = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE_URL}/api/vvb/verifications/${params.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTask(data);
                setChecklist(data.checklist || {});
                setRemarks(data.remarks || "");
                setDecisionNotes(data.decision_notes || "");
                setStatus(data.status);
                setVerifiedReductions(data.verified_reductions?.toString() || "");
            } else {
                setError("Failed to load verification task");
            }
        } catch (err) {
            setError("Failed to load verification task");
        } finally {
            setLoading(false);
        }
    };

    const handleChecklistChange = (key: string, value: string) => {
        setChecklist((prev) => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE_URL}/api/vvb/verifications/${params.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status,
                    checklist,
                    remarks,
                    decision_notes: decisionNotes,
                    verified_reductions: verifiedReductions ? parseInt(verifiedReductions) : null,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setTask(data);
                alert("Verification saved successfully!");
            } else {
                const errorData = await response.json();
                setError(errorData.detail || "Failed to save");
            }
        } catch (err) {
            setError("Failed to save verification");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    if (error || !task) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {error || "Task not found"}
                </h2>
                <Link href="/vvb/dashboard/projects">
                    <Button className="mt-4">Back to Projects</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/vvb/dashboard/projects">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Verification: {task.project_name}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {task.project_code} • {task.project_type}
                    </p>
                </div>
                <Badge className={statusColors[task.status] || statusColors.PENDING}>
                    {task.status.replace("_", " ")}
                </Badge>
            </div>

            {/* Validation vs Verification Info */}
            <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
                <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-blue-800 dark:text-blue-300">What is Verification?</p>
                            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                                <strong>Verification</strong> is a periodic assessment conducted <strong>AFTER</strong> project operation begins.
                                It confirms that the actual emission reductions claimed match the monitoring data and methodology requirements.
                                Verification occurs annually or at defined monitoring periods throughout the crediting period.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-slate-200 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg">Project Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-500">Developer</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {task.developer_name || "N/A"}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-slate-400" />
                                <div>
                                    <p className="text-sm text-slate-500">Monitoring Period</p>
                                    <p className="font-medium text-slate-900 dark:text-white">
                                        {task.monitoring_period_start && task.monitoring_period_end
                                            ? `${new Date(task.monitoring_period_start).toLocaleDateString()} - ${new Date(task.monitoring_period_end).toLocaleDateString()}`
                                            : "Not specified"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-slate-200 dark:border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-emerald-500" />
                            Emission Reductions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-slate-500">Claimed Reductions (tCO2e)</p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {task.claimed_reductions?.toLocaleString() || "N/A"}
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="verified">Verified Reductions (tCO2e)</Label>
                                <Input
                                    id="verified"
                                    type="number"
                                    value={verifiedReductions}
                                    onChange={(e) => setVerifiedReductions(e.target.value)}
                                    placeholder="Enter verified amount"
                                    className="mt-2"
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Status Update */}
            <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg">Verification Status</CardTitle>
                    <CardDescription>Update the verification status</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full md:w-64">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="QUERIES_RAISED">Queries Raised</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Verification Checklist */}
            <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileSearch className="h-5 w-5 text-blue-500" />
                        Verification Checklist
                    </CardTitle>
                    <CardDescription>Review each item and mark status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {verificationChecklist.map((item) => (
                            <div
                                key={item.key}
                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg"
                            >
                                <span className="text-slate-700 dark:text-slate-300">
                                    {item.label}
                                </span>
                                <Select
                                    value={checklist[item.key] || "not_reviewed"}
                                    onValueChange={(value) => handleChecklistChange(item.key, value)}
                                >
                                    <SelectTrigger className="w-40">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="not_reviewed">Not Reviewed</SelectItem>
                                        <SelectItem value="passed">Passed</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                        <SelectItem value="needs_clarification">Needs Clarification</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Remarks */}
            <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        Remarks & Notes
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="remarks">Verification Remarks</Label>
                        <Textarea
                            id="remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Enter any remarks about the verification..."
                            className="mt-2"
                            rows={4}
                        />
                    </div>
                    <div>
                        <Label htmlFor="decision">Decision Notes</Label>
                        <Textarea
                            id="decision"
                            value={decisionNotes}
                            onChange={(e) => setDecisionNotes(e.target.value)}
                            placeholder="Enter decision notes (required for approval/rejection)..."
                            className="mt-2"
                            rows={4}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
                <Link href="/vvb/dashboard/projects">
                    <Button variant="outline">Cancel</Button>
                </Link>
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700"
                >
                    {saving ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Saving...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Save Verification
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
}
