"use client";

import { useProjectWizardStore } from "@/lib/stores/project-wizard-store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ALL_COUNTRIES } from "@/lib/constants";

export default function Step2Basic() {
    const { data, updateData } = useProjectWizardStore();

    return (
        <div className="space-y-6">
            <div className="grid gap-6">
                <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input
                        value={data.name}
                        onChange={(e) => updateData({ name: e.target.value })}
                        placeholder="e.g. Sunny Hills Solar Farm"
                    />
                </div>

                <div className="space-y-2">
                    <Label>Project Description</Label>
                    <Textarea
                        value={data.description}
                        onChange={(e) => updateData({ description: e.target.value })}
                        placeholder="Brief summary of the project activity..."
                        className="h-32"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Country</Label>
                        <Select
                            value={data.location?.country}
                            onValueChange={(val) => updateData({ location: { ...data.location, country: val } })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                                {ALL_COUNTRIES.map((country) => (
                                    <SelectItem key={country} value={country}>
                                        {country}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Coordinates (Lat, Long)</Label>
                        <Input
                            value={data.location?.coordinates}
                            onChange={(e) => updateData({ location: { ...data.location, coordinates: e.target.value } })}
                            placeholder="e.g. 19.0760, 72.8777"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label>Start Date</Label>
                        <Input
                            type="date"
                            value={data.startDate}
                            onChange={(e) => updateData({ startDate: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Crediting Period Start</Label>
                        <Input
                            type="date"
                            value={data.creditingPeriodStart}
                            onChange={(e) => updateData({ creditingPeriodStart: e.target.value })}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Crediting Period End</Label>
                        <Input
                            type="date"
                            value={data.creditingPeriodEnd}
                            onChange={(e) => updateData({ creditingPeriodEnd: e.target.value })}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
