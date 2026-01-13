"use client";

import { useProjectWizardStore } from "@/lib/stores/project-wizard-store";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

export default function Step4Stakeholders() {
    const { data, updateData } = useProjectWizardStore();
    // We'll manage local state for the list before pushing to store or just push directly
    // For simplicity, let's assume data.stakeholders exists in store (we need to add it)

    // adding placeholder state for now
    const [stakeholders, setStakeholders] = useState([
        { name: "Local Community Leader", role: "Community Representative", contact: "contact@local.org" }
    ]);

    const addStakeholder = () => {
        setStakeholders([...stakeholders, { name: "", role: "", contact: "" }]);
    };

    const removeStakeholder = (index: number) => {
        const newList = [...stakeholders];
        newList.splice(index, 1);
        setStakeholders(newList);
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Stakeholder Consultation</h3>
                <p className="text-sm text-muted-foreground">
                    List all key stakeholders consulted during the project design phase (Section 10).
                </p>

                {stakeholders.map((s, index) => (
                    <Card key={index}>
                        <CardContent className="pt-6 grid gap-4 grid-cols-1 md:grid-cols-3 items-end">
                            <div className="space-y-2">
                                <Label>Name / Organization</Label>
                                <Input
                                    value={s.name}
                                    onChange={(e) => {
                                        const newList = [...stakeholders];
                                        newList[index].name = e.target.value;
                                        setStakeholders(newList);
                                    }}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Role</Label>
                                <Input
                                    value={s.role}
                                    onChange={(e) => {
                                        const newList = [...stakeholders];
                                        newList[index].role = e.target.value;
                                        setStakeholders(newList);
                                    }}
                                />
                            </div>
                            <div className="space-y-2 flex gap-2">
                                <div className="flex-1">
                                    <Label>Contact Info</Label>
                                    <Input
                                        value={s.contact}
                                        onChange={(e) => {
                                            const newList = [...stakeholders];
                                            newList[index].contact = e.target.value;
                                            setStakeholders(newList);
                                        }}
                                    />
                                </div>
                                <Button variant="ghost" size="icon" className="mb-0.5" onClick={() => removeStakeholder(index)}>
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                <Button variant="outline" onClick={addStakeholder} className="w-full">
                    <Plus className="mr-2 h-4 w-4" /> Add Stakeholder
                </Button>

                <div className="space-y-2 pt-4">
                    <Label>Summary of Feedback</Label>
                    <Textarea placeholder="Summarize key concerns raised and how they were addressed..." className="h-24"></Textarea>
                </div>
            </div>
        </div>
    );
}
