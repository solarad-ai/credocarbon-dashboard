"use client";

import { useEffect, useState } from "react";
import { Flag, Plus, Edit2, Trash2, ArrowLeft, ToggleLeft, ToggleRight } from "lucide-react";
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

interface FeatureFlag {
    id: number;
    key: string;
    name: string;
    description: string | null;
    is_enabled: boolean;
    target_roles: string[];
    created_at: string;
}

export default function FeatureFlagsPage() {
    const [flags, setFlags] = useState<FeatureFlag[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingFlag, setEditingFlag] = useState<FeatureFlag | null>(null);
    const [formData, setFormData] = useState({ key: "", name: "", description: "", is_enabled: false, target_roles: [] as string[] });

    useEffect(() => { fetchFlags(); }, []);

    const fetchFlags = async () => {
        try {
            const data = await superadminApi.getFeatureFlags();
            setFlags(data);
        } catch (err) {
            console.error("Failed to fetch feature flags", err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateDialog = () => {
        setEditingFlag(null);
        setFormData({ key: "", name: "", description: "", is_enabled: false, target_roles: [] });
        setShowDialog(true);
    };

    const openEditDialog = (flag: FeatureFlag) => {
        setEditingFlag(flag);
        setFormData({
            key: flag.key,
            name: flag.name,
            description: flag.description || "",
            is_enabled: flag.is_enabled,
            target_roles: flag.target_roles || [],
        });
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingFlag) {
                await superadminApi.updateFeatureFlag(editingFlag.id, formData);
            } else {
                await superadminApi.createFeatureFlag(formData);
            }
            setShowDialog(false);
            fetchFlags();
        } catch (err) {
            console.error("Failed to save feature flag", err);
        }
    };

    const handleToggle = async (flag: FeatureFlag) => {
        try {
            await superadminApi.updateFeatureFlag(flag.id, { is_enabled: !flag.is_enabled });
            fetchFlags();
        } catch (err) {
            console.error("Failed to toggle flag", err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this feature flag?")) return;
        try {
            await superadminApi.deleteFeatureFlag(id);
            fetchFlags();
        } catch (err) {
            console.error("Failed to delete feature flag", err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/superadmin/dashboard/config"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Feature Flags</h1>
                        <p className="text-slate-500 dark:text-slate-400">Toggle platform features</p>
                    </div>
                </div>
                <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />Add Flag</Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div></div>
            ) : flags.length === 0 ? (
                <Card className="dark:bg-slate-800"><CardContent className="py-12 text-center text-slate-500">No feature flags configured</CardContent></Card>
            ) : (
                <div className="space-y-3">
                    {flags.map((flag) => (
                        <Card key={flag.id} className="dark:bg-slate-800 dark:border-slate-700">
                            <CardContent className="py-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <button onClick={() => handleToggle(flag)} className="focus:outline-none">
                                        {flag.is_enabled ? (
                                            <ToggleRight className="h-8 w-8 text-green-500" />
                                        ) : (
                                            <ToggleLeft className="h-8 w-8 text-slate-400" />
                                        )}
                                    </button>
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">{flag.name}</p>
                                        <p className="text-sm text-slate-500">{flag.key}</p>
                                        {flag.description && <p className="text-xs text-slate-400 mt-1">{flag.description}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge className={flag.is_enabled ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}>
                                        {flag.is_enabled ? "ON" : "OFF"}
                                    </Badge>
                                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(flag)}><Edit2 className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(flag.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="dark:bg-slate-800">
                    <DialogHeader><DialogTitle className="dark:text-white">{editingFlag ? "Edit Feature Flag" : "Add Feature Flag"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Key</Label><Input value={formData.key} onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s/g, "_") })} placeholder="new_feature" disabled={!!editingFlag} className="dark:bg-slate-700" /></div>
                            <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="New Feature" className="dark:bg-slate-700" /></div>
                        </div>
                        <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="dark:bg-slate-700" /></div>
                        <div className="flex items-center gap-2"><Switch checked={formData.is_enabled} onCheckedChange={(c) => setFormData({ ...formData, is_enabled: c })} /><Label>Enabled</Label></div>
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
