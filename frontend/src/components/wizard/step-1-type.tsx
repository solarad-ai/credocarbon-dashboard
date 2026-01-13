"use client";

import { useProjectWizardStore } from "@/lib/stores/project-wizard-store";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Step1Type() {
    const { data, updateData } = useProjectWizardStore();

    return (
        <div className="space-y-6">
            <div className="grid gap-6">
                <div className="space-y-4">
                    <Label className="text-lg font-semibold">Project Type</Label>
                    <RadioGroup
                        onValueChange={(val) => updateData({ projectType: val })}
                        defaultValue={data.projectType}
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                        <Label className="cursor-pointer">
                            <Card className={`border-2 ${data.projectType === "Renewable Energy" ? "border-primary" : "border-transparent"}`}>
                                <CardContent className="flex items-center space-x-4 p-4">
                                    <RadioGroupItem value="Renewable Energy" id="type-renewable" />
                                    <div className="space-y-1">
                                        <span className="font-medium">Renewable Energy</span>
                                        <p className="text-sm text-muted-foreground">Solar, Wind, Hydro, Geothermal</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Label>
                        <Label className="cursor-pointer">
                            <Card className={`border-2 ${data.projectType === "Afforestation" ? "border-primary" : "border-transparent"}`}>
                                <CardContent className="flex items-center space-x-4 p-4">
                                    <RadioGroupItem value="Afforestation" id="type-forest" />
                                    <div className="space-y-1">
                                        <span className="font-medium">Afforestation / Reforestation</span>
                                        <p className="text-sm text-muted-foreground">Tree planting, Forest conservation</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </Label>
                        {/* Add more types as per spec */}
                    </RadioGroup>
                </div>

                <div className="space-y-4">
                    <Label>Target Registry & Methodology</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <Select onValueChange={(val) => updateData({ registry: val })} defaultValue={data.registry}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Registry" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Verra">Verra (VCS)</SelectItem>
                                <SelectItem value="Gold Standard">Gold Standard</SelectItem>
                                <SelectItem value="ACR">ACR</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select onValueChange={(val) => updateData({ methodology: val })} defaultValue={data.methodology}>
                            <SelectTrigger>
                                <SelectValue placeholder="Methodology" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="VM0007">VM0007 (REDD+)</SelectItem>
                                <SelectItem value="ACM0002">ACM0002 (Grid-connected renewables)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}
