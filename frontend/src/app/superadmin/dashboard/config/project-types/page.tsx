"use client";

import { useEffect, useState } from "react";
import { Layers, Plus, Edit2, Trash2, ArrowLeft, Sun, Wind, Leaf } from "lucide-react";
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

interface ProjectType {
    id: number;
    code: string;
    name: string;
    description: string | null;
    category: string | null;
    icon: string | null;
    applicable_registries: string[];
    is_active: boolean;
    display_order: number;
}

const CATEGORIES = ["energy", "nature", "waste", "industrial", "other"];
const ICONS = [
    { value: "sun", label: "Sun (Solar)", icon: Sun },
    { value: "wind", label: "Wind", icon: Wind },
    { value: "leaf", label: "Leaf (Nature)", icon: Leaf },
];

export default function ProjectTypesPage() {
    const [types, setTypes] = useState<ProjectType[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingType, setEditingType] = useState<ProjectType | null>(null);
    const [formData, setFormData] = useState({ code: "", name: "", description: "", category: "energy", icon: "sun", is_active: true, display_order: 0, applicable_registries: [] as string[] });

    useEffect(() => { fetchTypes(); }, []);

    const fetchTypes = async () => {
        try {
            const data = await superadminApi.getProjectTypes(true);
            setTypes(data);
        } catch (err) {
            console.error("Failed to fetch project types", err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateDialog = () => {
        setEditingType(null);
        setFormData({ code: "", name: "", description: "", category: "energy", icon: "sun", is_active: true, display_order: types.length, applicable_registries: [] });
        setShowDialog(true);
    };

    const openEditDialog = (pt: ProjectType) => {
        setEditingType(pt);
        setFormData({
            code: pt.code,
            name: pt.name,
            description: pt.description || "",
            category: pt.category || "energy",
            icon: pt.icon || "sun",
            is_active: pt.is_active,
            display_order: pt.display_order,
            applicable_registries: pt.applicable_registries || [],
        });
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingType) {
                await superadminApi.updateProjectType(editingType.id, formData);
            } else {
                await superadminApi.createProjectType(formData);
            }
            setShowDialog(false);
            fetchTypes();
        } catch (err) {
            console.error("Failed to save project type", err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this project type?")) return;
        try {
            await superadminApi.deleteProjectType(id);
            fetchTypes();
        } catch (err) {
            console.error("Failed to delete project type", err);
        }
    };

    const getCategoryColor = (cat: string | null) => {
        const colors: Record<string, string> = {
            energy: "bg-amber-100 text-amber-700",
            nature: "bg-green-100 text-green-700",
            waste: "bg-slate-100 text-slate-700",
            industrial: "bg-blue-100 text-blue-700",
        };
        return colors[cat || ""] || "bg-slate-100 text-slate-500";
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/superadmin/dashboard/config"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Project Types</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage project categories</p>
                    </div>
                </div>
                <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />Add Type</Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {types.map((pt) => (
                        <Card key={pt.id} className={`dark:bg-slate-800 dark:border-slate-700 ${!pt.is_active ? "opacity-60" : ""}`}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Layers className="h-5 w-5 text-green-500" />
                                        <CardTitle className="text-lg text-slate-900 dark:text-white">{pt.name}</CardTitle>
                                    </div>
                                    <Badge className={getCategoryColor(pt.category)}>{pt.category || pt.code}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">{pt.description || "No description"}</p>
                                <div className="flex items-center justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(pt)}><Edit2 className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(pt.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="dark:bg-slate-800">
                    <DialogHeader><DialogTitle className="dark:text-white">{editingType ? "Edit Project Type" : "Add Project Type"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Code</Label><Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toLowerCase() })} placeholder="solar" disabled={!!editingType} className="dark:bg-slate-700" /></div>
                            <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Solar Power" className="dark:bg-slate-700" /></div>
                        </div>
                        <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="dark:bg-slate-700" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Category</Label>
                                <Select value={formData.category} onValueChange={(v) => setFormData({ ...formData, category: v })}>
                                    <SelectTrigger className="dark:bg-slate-700"><SelectValue /></SelectTrigger>
                                    <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center gap-2 pt-6"><Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} /><Label>Active</Label></div>
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
