"use client";

import { useEffect, useState } from "react";
import { Database, Plus, Edit2, Trash2, ExternalLink, ArrowLeft } from "lucide-react";
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

interface Registry {
    id: number;
    code: string;
    name: string;
    description: string | null;
    website_url: string | null;
    is_active: boolean;
    display_order: number;
    created_at: string;
}

export default function RegistriesPage() {
    const [registries, setRegistries] = useState<Registry[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingRegistry, setEditingRegistry] = useState<Registry | null>(null);
    const [formData, setFormData] = useState({ code: "", name: "", description: "", website_url: "", is_active: true, display_order: 0 });

    useEffect(() => { fetchRegistries(); }, []);

    const fetchRegistries = async () => {
        try {
            const data = await superadminApi.getRegistries(true);
            setRegistries(data);
        } catch (err) {
            console.error("Failed to fetch registries", err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateDialog = () => {
        setEditingRegistry(null);
        setFormData({ code: "", name: "", description: "", website_url: "", is_active: true, display_order: registries.length });
        setShowDialog(true);
    };

    const openEditDialog = (registry: Registry) => {
        setEditingRegistry(registry);
        setFormData({
            code: registry.code,
            name: registry.name,
            description: registry.description || "",
            website_url: registry.website_url || "",
            is_active: registry.is_active,
            display_order: registry.display_order,
        });
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingRegistry) {
                await superadminApi.updateRegistry(editingRegistry.id, formData);
            } else {
                await superadminApi.createRegistry(formData);
            }
            setShowDialog(false);
            fetchRegistries();
        } catch (err) {
            console.error("Failed to save registry", err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this registry?")) return;
        try {
            await superadminApi.deleteRegistry(id);
            fetchRegistries();
        } catch (err) {
            console.error("Failed to delete registry", err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/superadmin/dashboard/config">
                        <Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Registries</h1>
                        <p className="text-slate-500 dark:text-slate-400">Manage carbon credit registries</p>
                    </div>
                </div>
                <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="h-4 w-4 mr-2" />Add Registry
                </Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {registries.map((reg) => (
                        <Card key={reg.id} className={`dark:bg-slate-800 dark:border-slate-700 ${!reg.is_active ? "opacity-60" : ""}`}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Database className="h-5 w-5 text-blue-500" />
                                        <CardTitle className="text-lg text-slate-900 dark:text-white">{reg.name}</CardTitle>
                                    </div>
                                    <Badge className={reg.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}>{reg.code}</Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 line-clamp-2">
                                    {reg.description || "No description"}
                                </p>
                                <div className="flex items-center justify-between">
                                    {reg.website_url && (
                                        <a href={reg.website_url} target="_blank" rel="noopener" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                                            <ExternalLink className="h-3 w-3" />Website
                                        </a>
                                    )}
                                    <div className="flex gap-2 ml-auto">
                                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(reg)}><Edit2 className="h-4 w-4" /></Button>
                                        <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(reg.id)}><Trash2 className="h-4 w-4" /></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="dark:bg-slate-800">
                    <DialogHeader>
                        <DialogTitle className="dark:text-white">{editingRegistry ? "Edit Registry" : "Add Registry"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Code</Label>
                                <Input value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} placeholder="VCS" disabled={!!editingRegistry} className="dark:bg-slate-700" />
                            </div>
                            <div>
                                <Label>Name</Label>
                                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Verified Carbon Standard" className="dark:bg-slate-700" />
                            </div>
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Registry description..." className="dark:bg-slate-700" />
                        </div>
                        <div>
                            <Label>Website URL</Label>
                            <Input value={formData.website_url} onChange={(e) => setFormData({ ...formData, website_url: e.target.value })} placeholder="https://..." className="dark:bg-slate-700" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch checked={formData.is_active} onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })} />
                            <Label>Active</Label>
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
