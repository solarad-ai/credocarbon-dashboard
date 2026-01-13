"use client";

import { useProjectWizardStore } from "@/lib/stores/project-wizard-store";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";

export default function Step5Compliance() {
    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Compliance & Safeguards (Section 11)</h3>

                <div className="grid gap-4">
                    <div className="flex items-start space-x-3 p-4 border rounded-md">
                        <Checkbox id="env-impact" />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="env-impact" className="text-base font-semibold">
                                Environmental Impact Assessment (EIA)
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Confirm that an EIA has been conducted and negative impacts mitigated.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3 p-4 border rounded-md">
                        <Checkbox id="rights" />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="rights" className="text-base font-semibold">
                                Human Rights & Labor Standards
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Project adheres to ILO standards and respects local land rights.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-start space-x-3 p-4 border rounded-md">
                        <Checkbox id="sdgs" />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="sdgs" className="text-base font-semibold">
                                SDG Contributions
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Project contributes to at least 3 UN Sustainable Development Goals.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Risk Management Strategy</Label>
                    <Textarea placeholder="Describe potential risks (reversal, leakage) and mitigation plans..." className="h-24" />
                </div>
            </div>
        </div>
    );
}
