"use client";

import { useProjectWizardStore } from "@/lib/stores/project-wizard-store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Step3Technical() {
    const { data, updateData } = useProjectWizardStore();

    const isRenewable = data.projectType === "Renewable Energy";
    const isForestry = data.projectType === "Afforestation";

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Technical Parameters: {data.projectType || "General"}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6">
                    {isRenewable && (
                        <>
                            <div className="space-y-2">
                                <Label>Installed Capacity (MW)</Label>
                                <Input
                                    value={data.installedCapacity}
                                    onChange={(e) => updateData({ installedCapacity: e.target.value })}
                                    placeholder="e.g. 50"
                                    type="number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Est. Annual Generation (MWh)</Label>
                                <Input
                                    value={data.estimatedGeneration}
                                    onChange={(e) => updateData({ estimatedGeneration: e.target.value })}
                                    placeholder="e.g. 75000"
                                    type="number"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Technology Provider / Turbine Model</Label>
                                <Input placeholder="e.g. Vestas V150" />
                            </div>
                        </>
                    )}

                    {isForestry && (
                        <>
                            <div className="space-y-2">
                                <Label>Total Area (Hectares)</Label>
                                <Input placeholder="e.g. 500" type="number" />
                            </div>
                            <div className="space-y-2">
                                <Label>Species Planted</Label>
                                <Input placeholder="e.g. Teak, Mahogany" />
                            </div>
                            <div className="space-y-2">
                                <Label>Est. Carbon Sequestration (tCO2e/year)</Label>
                                <Input placeholder="e.g. 2000" type="number" />
                            </div>
                        </>
                    )}

                    {!isRenewable && !isForestry && (
                        <div className="text-muted-foreground p-4 text-center">
                            Please select a project type in Step 1 to see specific technical fields.
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        <h4 className="font-semibold mb-2">Emission Reductions Calculation</h4>
                        <div className="bg-muted p-4 rounded text-sm font-mono">
                            {/* Placeholder for real-time estimation engine result */}
                            WARNING: This is a preliminary estimate.
                            <br />
                            Engine Status: <span className="text-green-600">Connected</span>
                            <br />
                            Formula: {data.methodology || "N/A"}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
