"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    ArrowLeft,
    FileCheck,
    Clock,
    AlertTriangle,
    FileText,
    MessageSquare,
    User,
    Calendar,
    Save,
    Building2,
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

interface RegistryReview {
    id: number;
    project_id: number;
    project_name: string;
    project_code: string;
    project_type: string;
    developer_name: string;
    registry_name: string;
    status: string;
    checklist: Record<string, string>;
    conditions: string | null;
    rejection_reason: string | null;
    decision_notes: string | null;
    submitted_at: string;
    review_started_at: string | null;
    decision_at: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://credocarbon-api-641001192587.asia-south2.run.app";

const statusColors: Record<string, string> = {
    PENDING: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    IN_PROGRESS: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    CLARIFICATIONS_REQUESTED: "bg-purple-500/10 text-purple-600 border-purple-500/20",
    APPROVED: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
    APPROVED_WITH_CONDITIONS: "bg-teal-500/10 text-teal-600 border-teal-500/20",
    REJECTED: "bg-red-500/10 text-red-600 border-red-500/20",
};

const reviewChecklist = [
    { key: "validation_report", label: "Validation Report Review" },
    { key: "verification_report", label: "Verification Report Review" },
    { key: "methodology_compliance", label: "Methodology Compliance" },
    { key: "emission_calculations", label: "Emission Reduction Calculations" },
    { key: "pdd_completeness", label: "PDD Completeness" },
    { key: "additionality_check", label: "Additionality Demonstration" },
    { key: "stakeholder_consultation", label: "Stakeholder Consultation" },
    { key: "safeguards_check", label: "Environmental & Social Safeguards" },
    { key: "serial_number_allocation", label: "Serial Number Allocation Ready" },
    { key: "final_approval", label: "Final Approval Checklist" },
];

export default function RegistryReviewDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [review, setReview] = useState<RegistryReview | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [checklist, setChecklist] = useState<Record<string, string>>({});
    const [conditions, setConditions] = useState("");
    const [decisionNotes, setDecisionNotes] = useState("");
    const [rejectionReason, setRejectionReason] = useState("");
    const [status, setStatus] = useState("");

    useEffect(() => {
        fetchReview();
    }, [params.id]);

    const fetchReview = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const response = await fetch(`${API_BASE_URL}/api/registry/reviews/${params.id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setReview(data);
                setChecklist(data.checklist || {});
                setConditions(data.conditions || "");
                setDecisionNotes(data.decision_notes || "");
                setRejectionReason(data.rejection_reason || "");
                setStatus(data.status);
            } else {
                setError("Failed to load review");
            }
        } catch (err) {
            setError("Failed to load review");
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
            const response = await fetch(`${API_BASE_URL}/api/registry/reviews/${params.id}`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    status,
                    checklist,
                    conditions,
                    decision_notes: decisionNotes,
                    rejection_reason: rejectionReason,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setReview(data);
                alert("Review saved successfully!");
            } else {
                const errorData = await response.json();
                setError(errorData.detail || "Failed to save");
            }
        } catch (err) {
            setError("Failed to save review");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error || !review) {
        return (
            <div className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {error || "Review not found"}
                </h2>
                <Link href="/registry/dashboard/projects">
                    <Button className="mt-4">Back to Projects</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/registry/dashboard/projects">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Review: {review.project_name}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        {review.project_code} • {review.registry_name || "Registry TBD"}
                    </p>
                </div>
                <Badge className={statusColors[review.status] || statusColors.PENDING}>
                    {review.status.replace(/_/g, " ")}
                </Badge>
            </div>

            {/* Project Info */}
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
                                    {review.developer_name || "N/A"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-500">Submitted</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {new Date(review.submitted_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm text-slate-500">Registry</p>
                                <p className="font-medium text-slate-900 dark:text-white">
                                    {review.registry_name || "Not assigned"}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status Update */}
            <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg">Review Status</CardTitle>
                    <CardDescription>Update the review status</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger className="w-full md:w-64">
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="PENDING">Pending</SelectItem>
                            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                            <SelectItem value="CLARIFICATIONS_REQUESTED">Clarifications Requested</SelectItem>
                            <SelectItem value="APPROVED">Approved</SelectItem>
                            <SelectItem value="APPROVED_WITH_CONDITIONS">Approved with Conditions</SelectItem>
                            <SelectItem value="REJECTED">Rejected</SelectItem>
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Review Checklist */}
            <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileCheck className="h-5 w-5 text-blue-500" />
                        Registry Review Checklist
                    </CardTitle>
                    <CardDescription>Review each item and mark status</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {reviewChecklist.map((item) => (
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

            {/* Conditions & Notes */}
            <Card className="border-slate-200 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-purple-500" />
                        Decision Details
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <Label htmlFor="conditions">Conditions (if approved with conditions)</Label>
                        <Textarea
                            id="conditions"
                            value={conditions}
                            onChange={(e) => setConditions(e.target.value)}
                            placeholder="Enter any conditions for approval..."
                            className="mt-2"
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label htmlFor="rejection">Rejection Reason (if rejected)</Label>
                        <Textarea
                            id="rejection"
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter rejection reason..."
                            className="mt-2"
                            rows={3}
                        />
                    </div>
                    <div>
                        <Label htmlFor="notes">Decision Notes</Label>
                        <Textarea
                            id="notes"
                            value={decisionNotes}
                            onChange={(e) => setDecisionNotes(e.target.value)}
                            placeholder="Enter any additional notes..."
                            className="mt-2"
                            rows={3}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4">
                <Link href="/registry/dashboard/projects">
                    <Button variant="outline">Cancel</Button>
                </Link>
                {status === "APPROVED" && (
                    <Link href={`/registry/dashboard/issuances/new?project=${review.project_id}`}>
                        <Button className="bg-emerald-600 hover:bg-emerald-700">
                            Proceed to Issuance
                        </Button>
                    </Link>
                )}
                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {saving ? (
                        <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Saving...
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            Save Review
                        </div>
                    )}
                </Button>
            </div>
        </div>
    );
}
