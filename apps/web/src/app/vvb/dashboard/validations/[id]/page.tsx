"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    AlertTriangle,
    FileText,
    MessageSquare,
    User,
    Calendar,
    Save,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import Link from "next/link";

interface ValidationTask {
    id: number;
    project_id: number;
    project_name: string;
    project_code: string;
    project_type: string;
    developer_name: string;
    status: string;
    lead_auditor: string | null;
    reviewer: string | null;
    accreditation_id: string | null;
    checklist: Record<string, string>;
    remarks: string | null;
    decision_notes: string | null;
    assigned_at: string;
    started_at: string | null;
    completed_at: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const statusColors: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    QUERIES_RAISED: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
};

const validationChecklist = [
    { key: "project_boundary", label: "Project Boundary Definition" },
    { key: "baseline_scenario", label: "Baseline Scenario Analysis" },
    { key: "additionality", label: "Additionality Demonstration" },
    { key: "methodology_compliance", label: "Methodology Compliance" },
    { key: "stakeholder_consultation", label: "Stakeholder Consultation" },
    { key: "environmental_safeguards", label: "Environmental Safeguards" },
    { key: "social_safeguards", label: "Social Safeguards" },
    { key: "monitoring_plan", label: "Monitoring Plan Review" },
    { key: "documentation_complete", label: "Documentation Completeness" },
    { key: "technical_review", label: "Technical Review" },
];

export default function ValidationDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [task, setTask] = useState<ValidationTask | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [checklist, setChecklist] = useState<Record<string, string>>({});
    const [remarks, setRemarks] = useState("");
    const [decisionNotes, setDecisionNotes] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        fetchValidationTask();
    }, [params.id]);

    const fetchValidationTask = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE_URL}/api/vvb/validations/${params.id}`, {
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
            } else {
                setError("Failed to load validation task");
            }
        } catch (err) {
            setError("Failed to load validation task");
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
            const response = await fetch(`${API_BASE_URL}/api/vvb/validations/${params.id}`, {
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
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setTask(data);
                alert("Validation saved successfully!");
            } else {
                const errorData = await response.json();
                setError(errorData.detail || "Failed to save");
            }
        } catch (err) {
            setError("Failed to save validation");
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
                        Validation: {task.project_name}
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
            <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
                <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-300">What is Validation?</p>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                <strong>Validation</strong> is the initial assessment conducted <strong>BEFORE</strong> project implementation.
                                It confirms that the project design, baseline, and monitoring plan meet the registry's requirements.
                                Validation typically occurs once at the start of the project lifecycle.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
            <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg">Project Information</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <p className="text-sm text-slate-500">Assigned</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {new Date(task.assigned_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-500">Project Type</p>
                                <p className="font-medium text-slate-900 dark:text-white capitalize">
                                    {task.project_type}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status Update */}
            <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg">Validation Status</CardTitle>
                    <CardDescription>Update the validation status</CardDescription>
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

            {/* Validation Checklist */}
            <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        Validation Checklist
                    </CardTitle>
                    <CardDescription>Review each item and mark status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {validationChecklist.map((item) => (
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
                        <MessageSquare className="h-5 w-5 text-blue-500" />
                        Remarks & Notes
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="remarks">Validation Remarks</Label>
                        <Textarea
                            id="remarks"
                            value={remarks}
                            onChange={(e) => setRemarks(e.target.value)}
                            placeholder="Enter any remarks about the validation..."
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
                            Save Validation
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
}
