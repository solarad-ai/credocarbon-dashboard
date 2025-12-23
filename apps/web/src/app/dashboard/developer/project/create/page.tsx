"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Sun, Wind, Droplets, Flame, Factory, Zap, Leaf, Trees, TreeDeciduous, Lightbulb,
    ArrowLeft, ArrowRight, Check, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://credocarbon-api-641001192587.asia-south2.run.app';

const projectTypes = [
    {
        id: "solar",
        icon: Sun,
        name: "Solar PV",
        description: "Grid-connected or off-grid solar photovoltaic power plants",
        registries: ["GS", "VCS", "ACR", "GCC"],
        color: "text-yellow-500",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
        hoverBorder: "hover:border-yellow-500",
    },
    {
        id: "wind",
        icon: Wind,
        name: "Wind Power",
        description: "Onshore and offshore wind energy generation projects",
        registries: ["GS", "VCS", "ACR", "GCC"],
        color: "text-blue-500",
        bgColor: "bg-blue-100 dark:bg-blue-900/30",
        hoverBorder: "hover:border-blue-500",
    },
    {
        id: "hydro",
        icon: Droplets,
        name: "Hydropower",
        description: "Run-of-river and small reservoir hydroelectric projects",
        registries: ["GS", "VCS", "ACR"],
        color: "text-cyan-500",
        bgColor: "bg-cyan-100 dark:bg-cyan-900/30",
        hoverBorder: "hover:border-cyan-500",
    },
    {
        id: "biomass",
        icon: Flame,
        name: "Biomass",
        description: "Biomass-based power and heat generation projects",
        registries: ["GS", "VCS", "ACR"],
        color: "text-orange-500",
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
        hoverBorder: "hover:border-orange-500",
    },
    {
        id: "biochar",
        icon: Factory,
        name: "Biochar",
        description: "Carbon removal through biochar production and sequestration",
        registries: ["VCS", "ACR"],
        color: "text-stone-600",
        bgColor: "bg-stone-100 dark:bg-stone-900/30",
        hoverBorder: "hover:border-stone-500",
    },
    {
        id: "waste_to_energy",
        icon: Zap,
        name: "Waste-to-Energy",
        description: "Energy recovery from municipal or industrial waste",
        registries: ["GS", "VCS", "ACR"],
        color: "text-purple-500",
        bgColor: "bg-purple-100 dark:bg-purple-900/30",
        hoverBorder: "hover:border-purple-500",
    },
    {
        id: "biogas",
        icon: Leaf,
        name: "Biogas",
        description: "Methane capture and utilization from organic waste",
        registries: ["GS", "VCS", "ACR", "GCC"],
        color: "text-green-500",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        hoverBorder: "hover:border-green-500",
    },
    {
        id: "ar",
        icon: TreeDeciduous,
        name: "A/R (Afforestation/Reforestation)",
        description: "Tree planting on non-forested land for carbon sequestration",
        registries: ["GS", "VCS", "ACR", "ART-TREES"],
        color: "text-emerald-600",
        bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
        hoverBorder: "hover:border-emerald-500",
    },
    {
        id: "redd",
        icon: Trees,
        name: "REDD+",
        description: "Avoided deforestation and forest degradation projects",
        registries: ["VCS", "ART-TREES", "GCC"],
        color: "text-green-700",
        bgColor: "bg-green-100 dark:bg-green-900/30",
        hoverBorder: "hover:border-green-700",
    },
    {
        id: "energy_efficiency",
        icon: Lightbulb,
        name: "Energy Efficiency",
        description: "Industrial, commercial, or residential energy efficiency improvements",
        registries: ["GS", "VCS", "ACR"],
        color: "text-amber-500",
        bgColor: "bg-amber-100 dark:bg-amber-900/30",
        hoverBorder: "hover:border-amber-500",
    },
];

export default function CreateProjectPage() {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreateProject = async () => {
        if (!selectedType) return;

        setIsCreating(true);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/api/projects`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: `New ${projectTypes.find(t => t.id === selectedType)?.name} Project`,
                    project_type: selectedType.toUpperCase(),
                    status: "DRAFT",
                }),
            });

            if (response.ok) {
                const data = await response.json();
                router.push(`/dashboard/developer/project/${data.id}/wizard/basic-info`);
            } else {
                console.error("Failed to create project");
                // For demo, navigate anyway
                router.push(`/dashboard/developer/project/new/wizard/basic-info?type=${selectedType}`);
            }
        } catch (error) {
            console.error("Error creating project:", error);
            // For demo, navigate anyway
            router.push(`/dashboard/developer/project/new/wizard/basic-info?type=${selectedType}`);
        } finally {
            setIsCreating(false);
        }
    };

    const selectedProjectType = projectTypes.find(t => t.id === selectedType);

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                    <Leaf className="h-6 w-6 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create New Project</h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Step 1 of 6: Select Project Type</p>
                </div>
            </div>

            {/* Instructions */}
            <div>
                <h2 className="text-xl font-bold mb-2">What type of project are you registering?</h2>
                <p className="text-muted-foreground">
                    Select the project category that best describes your carbon credit project.
                    This will determine the required data fields and applicable methodologies.
                </p>
            </div>

            {/* Project Type Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">

                {projectTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;

                    return (
                        <Card
                            key={type.id}
                            className={cn(
                                "cursor-pointer transition-all duration-300 border-2",
                                isSelected
                                    ? "border-primary shadow-lg scale-[1.02]"
                                    : "border-transparent hover:border-border",
                                type.hoverBorder
                            )}
                            onClick={() => setSelectedType(type.id)}
                        >
                            <CardContent className="p-4">
                                <div className="flex flex-col items-center text-center gap-2">
                                    <div className={cn(
                                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                        type.bgColor
                                    )}>
                                        <Icon className={cn("h-5 w-5", type.color)} />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-center gap-1 mb-1">
                                            <h3 className="font-medium text-sm">{type.name}</h3>
                                            {isSelected && (
                                                <div className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="h-2.5 w-2.5 text-primary-foreground" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap justify-center gap-1">
                                            {type.registries.slice(0, 2).map((reg) => (
                                                <span
                                                    key={reg}
                                                    className="px-1.5 py-0.5 text-[10px] rounded-full bg-muted text-muted-foreground"
                                                >
                                                    {reg}
                                                </span>
                                            ))}
                                            {type.registries.length > 2 && (
                                                <span className="text-[10px] text-muted-foreground">+{type.registries.length - 2}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Selected Type Details */}
            {selectedProjectType && (
                <Card className="mb-8 animate-fade-in border-primary/20 bg-primary/5">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Info className="h-5 w-5 text-primary" />
                            {selectedProjectType.name} Project
                        </CardTitle>
                        <CardDescription>
                            {selectedProjectType.description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-medium mb-2 text-sm">Compatible Registries</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedProjectType.registries.map((reg) => (
                                        <span
                                            key={reg}
                                            className="px-3 py-1 text-sm rounded-full bg-card border"
                                        >
                                            {reg}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <h4 className="font-medium mb-2 text-sm">Next Steps</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• Enter basic project information</li>
                                    <li>• Upload generation/activity data</li>
                                    <li>• Document stakeholder consultation</li>
                                    <li>• Complete compliance checklist</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
                <Link href="/dashboard/developer">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Cancel
                    </Button>
                </Link>
                <Button
                    onClick={handleCreateProject}
                    disabled={!selectedType || isCreating}
                    className="gradient-primary text-white btn-shine"
                >
                    {isCreating ? (
                        "Creating..."
                    ) : (
                        <>
                            Continue to Project Details
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

