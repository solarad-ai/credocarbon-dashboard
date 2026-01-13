"use client";

import { useEffect, useState } from "react";
import { DollarSign, Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";
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

interface PlatformFee {
    id: number;
    fee_type: string;
    name: string;
    description: string | null;
    percentage: number;
    flat_amount_cents: number;
    is_active: boolean;
}

export default function FeesPage() {
    const [fees, setFees] = useState<PlatformFee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingFee, setEditingFee] = useState<PlatformFee | null>(null);
    const [formData, setFormData] = useState({ fee_type: "", name: "", description: "", percentage: 0, flat_amount_cents: 0, is_active: true });

    useEffect(() => { fetchFees(); }, []);

    const fetchFees = async () => {
        try {
            const data = await superadminApi.getPlatformFees();
            setFees(data);
        } catch (err) {
            console.error("Failed to fetch fees", err);
        } finally {
            setLoading(false);
        }
    };

    const openCreateDialog = () => {
        setEditingFee(null);
        setFormData({ fee_type: "", name: "", description: "", percentage: 0, flat_amount_cents: 0, is_active: true });
        setShowDialog(true);
    };

    const openEditDialog = (fee: PlatformFee) => {
        setEditingFee(fee);
        setFormData({
            fee_type: fee.fee_type,
            name: fee.name,
            description: fee.description || "",
            percentage: fee.percentage,
            flat_amount_cents: fee.flat_amount_cents,
            is_active: fee.is_active,
        });
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingFee) {
                await superadminApi.updatePlatformFee(editingFee.id, formData);
            } else {
                await superadminApi.createPlatformFee(formData);
            }
            setShowDialog(false);
            fetchFees();
        } catch (err) {
            console.error("Failed to save fee", err);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this fee?")) return;
        try {
            await superadminApi.deletePlatformFee(id);
            fetchFees();
        } catch (err) {
            console.error("Failed to delete fee", err);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/superadmin/dashboard/config"><Button variant="ghost" size="sm"><ArrowLeft className="h-4 w-4 mr-2" />Back</Button></Link>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Fees</h1>
                        <p className="text-slate-500 dark:text-slate-400">Configure transaction fees and pricing</p>
                    </div>
                </div>
                <Button onClick={openCreateDialog} className="bg-purple-600 hover:bg-purple-700"><Plus className="h-4 w-4 mr-2" />Add Fee</Button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div></div>
            ) : fees.length === 0 ? (
                <Card className="dark:bg-slate-800"><CardContent className="py-12 text-center text-slate-500">No fees configured</CardContent></Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {fees.map((fee) => (
                        <Card key={fee.id} className={`dark:bg-slate-800 dark:border-slate-700 ${!fee.is_active ? "opacity-60" : ""}`}>
                            <CardHeader className="pb-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-emerald-500" />
                                        <CardTitle className="text-lg text-slate-900 dark:text-white">{fee.name}</CardTitle>
                                    </div>
                                    <Badge className={fee.is_active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}>
                                        {fee.fee_type}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Percentage:</span>
                                        <span className="font-medium text-slate-900 dark:text-white">{(fee.percentage / 100).toFixed(2)}%</span>
                                    </div>
                                    {fee.flat_amount_cents > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Flat Fee:</span>
                                            <span className="font-medium text-slate-900 dark:text-white">${(fee.flat_amount_cents / 100).toFixed(2)}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2">
                                    <Button variant="ghost" size="sm" onClick={() => openEditDialog(fee)}><Edit2 className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="sm" className="text-red-500" onClick={() => handleDelete(fee.id)}><Trash2 className="h-4 w-4" /></Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="dark:bg-slate-800">
                    <DialogHeader><DialogTitle className="dark:text-white">{editingFee ? "Edit Fee" : "Add Fee"}</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Fee Type</Label><Input value={formData.fee_type} onChange={(e) => setFormData({ ...formData, fee_type: e.target.value })} placeholder="transaction" disabled={!!editingFee} className="dark:bg-slate-700" /></div>
                            <div><Label>Name</Label><Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Transaction Fee" className="dark:bg-slate-700" /></div>
                        </div>
                        <div><Label>Description</Label><Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="dark:bg-slate-700" /></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><Label>Percentage (basis points, 100=1%)</Label><Input type="number" value={formData.percentage} onChange={(e) => setFormData({ ...formData, percentage: parseInt(e.target.value) || 0 })} className="dark:bg-slate-700" /></div>
                            <div><Label>Flat Fee (cents)</Label><Input type="number" value={formData.flat_amount_cents} onChange={(e) => setFormData({ ...formData, flat_amount_cents: parseInt(e.target.value) || 0 })} className="dark:bg-slate-700" /></div>
                        </div>
                        <div className="flex items-center gap-2"><Switch checked={formData.is_active} onCheckedChange={(c) => setFormData({ ...formData, is_active: c })} /><Label>Active</Label></div>
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
