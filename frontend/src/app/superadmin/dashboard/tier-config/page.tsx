"use client";

import { useEffect, useState } from "react";
import { Settings2, Check, X, Plus, Trash2, ChevronRight, Crown, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { superadminApi } from "@/lib/api";

interface TierFeature {
    id: number;
    tier: string;
    feature_key: string;
    feature_name: string;
    feature_description: string | null;
    is_included: boolean;
    limits: Record<string, any>;
}

interface TierDefinition {
    tier: string;
    tier_name: string;
    tier_description: string;
    features: TierFeature[];
    feature_count: number;
}

const TIER_COLORS: Record<string, string> = {
    PKG_0: "bg-slate-500",
    PKG_1: "bg-green-500",
    PKG_2: "bg-blue-500",
    PKG_3: "bg-purple-500",
    PKG_4: "bg-amber-500",
    PKG_5: "bg-cyan-500",
    PKG_6: "bg-pink-500",
    PKG_FULL: "bg-gradient-to-r from-purple-500 to-pink-500",
};

export default function TierConfigPage() {
    const [tiers, setTiers] = useState<TierDefinition[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTier, setSelectedTier] = useState<string>("PKG_0");
    const [saving, setSaving] = useState<number | null>(null);

    // Add feature modal
    const [showAddModal, setShowAddModal] = useState(false);
    const [newFeature, setNewFeature] = useState({
        feature_key: "",
        feature_name: "",
        feature_description: "",
        is_included: true,
    });

    useEffect(() => {
        fetchTiers();
    }, []);

    const fetchTiers = async () => {
        setLoading(true);
        try {
            const data = await superadminApi.getTierDefinitions();
            setTiers(data);
        } catch (err) {
            console.error("Failed to fetch tiers", err);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleFeature = async (featureId: number, isIncluded: boolean) => {
        setSaving(featureId);
        try {
            await superadminApi.updateTierFeature(featureId, { is_included: isIncluded });
            fetchTiers();
        } catch (err) {
            console.error("Failed to update feature", err);
            alert("Failed to update feature");
        } finally {
            setSaving(null);
        }
    };

    const handleDeleteFeature = async (featureId: number) => {
        if (!confirm("Are you sure you want to delete this feature?")) return;
        try {
            await superadminApi.deleteTierFeature(featureId);
            fetchTiers();
        } catch (err) {
            console.error("Failed to delete feature", err);
            alert("Failed to delete feature");
        }
    };

    const handleAddFeature = async () => {
        if (!newFeature.feature_key || !newFeature.feature_name) {
            alert("Feature key and name are required");
            return;
        }
        try {
            await superadminApi.createTierFeature({
                tier: selectedTier,
                feature_key: newFeature.feature_key,
                feature_name: newFeature.feature_name,
                feature_description: newFeature.feature_description || undefined,
                is_included: newFeature.is_included,
            });
            setShowAddModal(false);
            setNewFeature({ feature_key: "", feature_name: "", feature_description: "", is_included: true });
            fetchTiers();
        } catch (err) {
            console.error("Failed to add feature", err);
            alert("Failed to add feature");
        }
    };

    const currentTier = tiers.find(t => t.tier === selectedTier);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Settings2 className="h-6 w-6 text-purple-500" />
                        Tier Configuration
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400">
                        Manage features and limits for each subscription tier
                    </p>
                </div>
            </div>

            {/* Tier Tabs */}
            <Tabs value={selectedTier} onValueChange={setSelectedTier} className="w-full">
                <TabsList className="flex flex-wrap gap-1 h-auto bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    {tiers.map((tier) => (
                        <TabsTrigger
                            key={tier.tier}
                            value={tier.tier}
                            className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 px-3 py-2 text-sm"
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${TIER_COLORS[tier.tier]}`}></div>
                                <span className="hidden sm:inline">{tier.tier_name}</span>
                                <span className="sm:hidden">{tier.tier.replace("PKG_", "")}</span>
                                {tier.tier === "PKG_FULL" && <Crown className="h-3 w-3 text-amber-500" />}
                            </div>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {tiers.map((tier) => (
                    <TabsContent key={tier.tier} value={tier.tier} className="mt-6">
                        {/* Tier Info Card */}
                        <Card className="mb-6 dark:bg-slate-800 dark:border-slate-700">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg ${TIER_COLORS[tier.tier]} flex items-center justify-center`}>
                                            {tier.tier === "PKG_FULL" ? (
                                                <Crown className="h-5 w-5 text-white" />
                                            ) : (
                                                <Package className="h-5 w-5 text-white" />
                                            )}
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{tier.tier_name}</CardTitle>
                                            <CardDescription>{tier.tier_description}</CardDescription>
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="text-sm">
                                        {tier.feature_count} features enabled
                                    </Badge>
                                </div>
                            </CardHeader>
                        </Card>

                        {/* Features List */}
                        <Card className="dark:bg-slate-800 dark:border-slate-700">
                            <CardHeader className="flex flex-row items-center justify-between pb-4">
                                <CardTitle className="text-base">Features</CardTitle>
                                <Button size="sm" onClick={() => setShowAddModal(true)} className="bg-purple-600 hover:bg-purple-700">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Feature
                                </Button>
                            </CardHeader>
                            <CardContent className="p-0">
                                {tier.features.length === 0 ? (
                                    <div className="text-center py-12 text-slate-500">
                                        {tier.tier === "PKG_FULL"
                                            ? "Full Access tier has access to all features by default"
                                            : "No features configured for this tier"}
                                    </div>
                                ) : (
                                    <div className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {tier.features.map((feature) => (
                                            <div
                                                key={feature.id}
                                                className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30"
                                            >
                                                <div className="flex-1 min-w-0 pr-4">
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                                                            {feature.feature_key}
                                                        </code>
                                                    </div>
                                                    <p className="font-medium text-slate-900 dark:text-white mt-1">
                                                        {feature.feature_name}
                                                    </p>
                                                    {feature.feature_description && (
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                                            {feature.feature_description}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm text-slate-500">
                                                            {feature.is_included ? "Enabled" : "Disabled"}
                                                        </span>
                                                        <Switch
                                                            checked={feature.is_included}
                                                            onCheckedChange={(checked) => handleToggleFeature(feature.id, checked)}
                                                            disabled={saving === feature.id}
                                                        />
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDeleteFeature(feature.id)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                ))}
            </Tabs>

            {/* Add Feature Modal */}
            <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
                <DialogContent className="dark:bg-slate-800">
                    <DialogHeader>
                        <DialogTitle>Add Feature to {currentTier?.tier_name}</DialogTitle>
                        <DialogDescription>
                            Add a new feature to this tier. Users on this tier will have access to this feature.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                                Feature Key *
                            </label>
                            <Input
                                placeholder="e.g., dev.pdd_structuring"
                                value={newFeature.feature_key}
                                onChange={(e) => setNewFeature({ ...newFeature, feature_key: e.target.value })}
                                className="dark:bg-slate-700 dark:border-slate-600"
                            />
                            <p className="text-xs text-slate-500 mt-1">Use format: category.feature_name</p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                                Feature Name *
                            </label>
                            <Input
                                placeholder="e.g., PDD Documentation"
                                value={newFeature.feature_name}
                                onChange={(e) => setNewFeature({ ...newFeature, feature_name: e.target.value })}
                                className="dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 block">
                                Description
                            </label>
                            <Input
                                placeholder="Optional description..."
                                value={newFeature.feature_description}
                                onChange={(e) => setNewFeature({ ...newFeature, feature_description: e.target.value })}
                                className="dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={newFeature.is_included}
                                onCheckedChange={(checked) => setNewFeature({ ...newFeature, is_included: checked })}
                            />
                            <span className="text-sm text-slate-700 dark:text-slate-300">Enabled by default</span>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddModal(false)}>
                            <X className="h-4 w-4 mr-1" /> Cancel
                        </Button>
                        <Button onClick={handleAddFeature} className="bg-purple-600 hover:bg-purple-700">
                            <Check className="h-4 w-4 mr-1" /> Add Feature
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
