"use client";

import { useEffect, useState } from "react";
import { Megaphone, Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { superadminApi } from "@/lib/api";

interface Announcement {
    id: number;
    title: string;
    message: string;
    type: string;
    is_active: boolean;
    is_dismissible: boolean;
    created_at: string;
}

const TYPES = ["info", "warning", "success", "error"];

export default function AnnouncementsPage() {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingAnn, setEditingAnn] = useState<Announcement | null>(null);
    const [formData, setFormData] = useState({ title: "", message: "", type: "info", is_active: true, is_dismissible: true });

    useEffect(() => { fetchAnnouncements(); }, []);

    const fetchAnnouncements = async () => {
        try {
            const data = await superadminApi.getAnnouncements(true);
            setAnnouncements(data);
        } catch (err) {
            console.error("Failed to fetch announcements", err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateDialog = () => {
        setEditingAnn(null);
        setFormData({ title: "", message: "", type: "info", is_active: true, is_dismissible: true });
        setShowDialog(true);
    };

    const openEditDialog = (ann: Announcement) => {
        setEditingAnn(ann);
        setFormData({ title: ann.title, message: ann.message, type: ann.type, is_active: ann.is_active, is_dismissible: ann.is_dismissible });
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingAnn) {
                await superadminApi.updateAnnouncement(editingAnn.id, formData);
            } else {
                await superadminApi.createAnnouncement(formData);
            }
            setShowDialog(false);
            fetchAnnouncements();
        } catch (err) {
            console.error("Failed to save announcement", err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this announcement?")) return;
        try {
            await superadminApi.deleteAnnouncement(id);
            fetchAnnouncements();
        } catch (err) {
            console.error("Failed to delete announcement", err);
        }
    };

    const getTypeBadge = (type: string) => {
        const colors: Record<string, string> = {
            info: "bg-blue-100 text-blue-700",
            warning: "bg-amber-100 text-amber-700",
            success: "bg-green-100 text-green-700",
            error: "bg-red-100 text-red-700",
        };
        return <Badge className={colors[type] || "bg-slate-100"}>{type}</Badge>;
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/superadmin/dashboard/config"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Announcements</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage platform announcements</p>
                    </div>
                </div>
                <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />New Announcement</Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div></div>
            ) : announcements.length === 0 ? (
                <Card className="dark:bg-slate-800"><CardContent className="py-12 text-center text-slate-500">No announcements</CardContent></Card>
            ) : (
                <div className="space-y-4">
                    {announcements.map((ann) => (
                        <Card key={ann.id} className={`dark:bg-slate-800 dark:border-slate-700 ${!ann.is_active ? "opacity-60" : ""}`}>
                            <CardContent className="py-4">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <Megaphone className="h-5 w-5 text-amber-500 mt-1" />
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-medium text-slate-900 dark:text-white">{ann.title}</p>
                                                {getTypeBadge(ann.type)}
                                                {!ann.is_active && <Badge className="bg-slate-100 text-slate-500">Inactive</Badge>}
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{ann.message}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(ann)}><Edit2 className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(ann.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="dark:bg-slate-800">
                    <DialogHeader><DialogTitle className="dark:text-white">{editingAnn ? "Edit Announcement" : "New Announcement"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div><Label>Title</Label><Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="dark:bg-slate-700" /></div>
                        <div><Label>Message</Label><Textarea value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} className="dark:bg-slate-700" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Type</Label>
                                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
                                    <SelectTrigger className="dark:bg-slate-700"><SelectValue /></SelectTrigger>
                                    <SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-4 pt-6">
                                <Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} /><Label>Active</Label>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} className="bg-purple-600 hover:bg-purple-700">Save</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
