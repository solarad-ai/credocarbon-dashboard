"use client";

import { useState } from "react";
import { Settings, Save, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        platformName: "CredoCarbon",
        supportEmail: "support@credocarbon.com",
        maintenanceMode: false,
        newRegistrations: true,
        marketplaceEnabled: true,
        minListingPrice: "5",
        maxListingPrice: "500",
        transactionFeePercent: "2.5",
    });
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // In production, this would call the API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSaving(false);
        alert("Settings saved successfully!");
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">System Settings</h1>
                <p className="text-slate-500 dark:text-slate-400">Configure platform settings and preferences</p>
            </div>

            {/* General Settings */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">General Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Platform Name</Label>
                            <Input
                                value={settings.platformName}
                                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                                className="dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Support Email</Label>
                            <Input
                                value={settings.supportEmail}
                                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                type="email"
                                className="dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Feature Toggles */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">Feature Toggles</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">Maintenance Mode</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Disable access for non-admin users</p>
                        </div>
                        <Switch
                            checked={settings.maintenanceMode}
                            onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">New Registrations</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Allow new users to sign up</p>
                        </div>
                        <Switch
                            checked={settings.newRegistrations}
                            onCheckedChange={(checked) => setSettings({ ...settings, newRegistrations: checked })}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-slate-900 dark:text-white">Marketplace</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Enable marketplace trading</p>
                        </div>
                        <Switch
                            checked={settings.marketplaceEnabled}
                            onCheckedChange={(checked) => setSettings({ ...settings, marketplaceEnabled: checked })}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Pricing Settings */}
            <Card className="dark:bg-slate-800 dark:border-slate-700">
                <CardHeader>
                    <CardTitle className="text-slate-900 dark:text-white">Pricing & Fees</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Min Listing Price ($)</Label>
                            <Input
                                value={settings.minListingPrice}
                                onChange={(e) => setSettings({ ...settings, minListingPrice: e.target.value })}
                                type="number"
                                className="dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Listing Price ($)</Label>
                            <Input
                                value={settings.maxListingPrice}
                                onChange={(e) => setSettings({ ...settings, maxListingPrice: e.target.value })}
                                type="number"
                                className="dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Transaction Fee (%)</Label>
                            <Input
                                value={settings.transactionFeePercent}
                                onChange={(e) => setSettings({ ...settings, transactionFeePercent: e.target.value })}
                                type="number"
                                step="0.1"
                                className="dark:bg-slate-700 dark:border-slate-600"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button onClick={handleSave} disabled={saving} className="bg-purple-600 hover:bg-purple-700">
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? "Saving..." : "Save Settings"}
                </Button>
            </div>
        </div>
    );
}
