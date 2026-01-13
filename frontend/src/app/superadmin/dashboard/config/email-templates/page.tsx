"use client";

import { useEffect, useState } from "react";
import { Mail, Plus, Edit2, Trash2, ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { superadminApi } from "@/lib/api";

interface EmailTemplate {
    id: number;
    key: string;
    name: string;
    subject: string;
    body_html: string;
    is_active: boolean;
    updated_at: string;
}

export default function EmailTemplatesPage() {
    const [templates, setTemplates] = useState<EmailTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
    const [previewHtml, setPreviewHtml] = useState("");
    const [formData, setFormData] = useState({ key: "", name: "", subject: "", body_html: "", is_active: true });

    useEffect(() => { fetchTemplates(); }, []);

    const fetchTemplates = async () => {
        try {
            const data = await superadminApi.getEmailTemplates();
            setTemplates(data);
        } catch (err) {
            console.error("Failed to fetch templates", err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateDialog = () => {
        setEditingTemplate(null);
        setFormData({ key: "", name: "", subject: "", body_html: "", is_active: true });
        setShowDialog(true);
    };

    const openEditDialog = (template: EmailTemplate) => {
        setEditingTemplate(template);
        setFormData({
            key: template.key,
            name: template.name,
            subject: template.subject,
            body_html: template.body_html,
            is_active: template.is_active,
        });
        setShowDialog(true);
    };

    const handlePreview = (template: EmailTemplate) => {
        setPreviewHtml(template.body_html);
        setShowPreview(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingTemplate) {
                await superadminApi.updateEmailTemplate(editingTemplate.id, formData);
            } else {
                await superadminApi.createEmailTemplate(formData);
            }
            setShowDialog(false);
            fetchTemplates();
        } catch (err) {
            console.error("Failed to save template", err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this email template?")) return;
        try {
            await superadminApi.deleteEmailTemplate(id);
            fetchTemplates();
        } catch (err) {
            console.error("Failed to delete template", err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/superadmin/dashboard/config"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Email Templates</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage notification email templates</p>
                    </div>
                </div>
                <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />Add Template</Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div></div>
            ) : templates.length === 0 ? (
                <Card className="dark:bg-slate-800"><CardContent className="py-12 text-center text-slate-500">No email templates configured</CardContent></Card>
            ) : (
                <div className="space-y-4">
                    {templates.map((template) => (
                        <Card key={template.id} className={`dark:bg-slate-800 dark:border-slate-700 ${!template.is_active ? "opacity-60" : ""}`}>
                            <CardContent className="py-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-5 w-5 text-rose-500 mt-1" />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-slate-900 dark:text-white">{template.name}</p>
                                                <Badge className="bg-slate-100 text-slate-600 dark:bg-slate-700">{template.key}</Badge>
                                                {!template.is_active && <Badge className="bg-red-100 text-red-500">Inactive</Badge>}
                                            </div>
                                            <p className="text-sm text-slate-500">Subject: {template.subject}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => handlePreview(template)}><Eye className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(template)}><Edit2 className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(template.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit/Create Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="dark:bg-slate-800 max-w-2xl">
                    <DialogHeader><DialogTitle className="dark:text-white">{editingTemplate ? "Edit Template" : "Add Template"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Key</Label><Input value={formData.key} onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s/g, "_") })} placeholder="welcome_email" disabled={!!editingTemplate} className="dark:bg-slate-700" /></div>
                            <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Welcome Email" className="dark:bg-slate-700" /></div>
                        </div>
                        <div><Label>Subject</Label><Input value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} placeholder="Welcome to Credo Carbon!" className="dark:bg-slate-700" /></div>
                        <div><Label>HTML Body</Label><Textarea value={formData.body_html} onChange={(e) => setFormData({ ...formData, body_html: e.target.value })} rows={10} className="dark:bg-slate-700 font-mono text-sm" placeholder="<html>..." /></div>
                        <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} /><Label>Active</Label></div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="dark:bg-slate-800 max-w-3xl max-h-[80vh] overflow-auto">
                    <DialogHeader><DialogTitle className="dark:text-white">Email Preview</DialogTitle></DialogHeader>
                    <div className="border rounded-lg p-4 bg-white" dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
