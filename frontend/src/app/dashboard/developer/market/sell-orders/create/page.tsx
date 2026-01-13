"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Package, Save, Loader2, Info, DollarSign, Hash, Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Project {
    id: number;
    name: string;
    type: string;
    registry: string;
    available_credits: number;
}

// Mock projects data - in production, fetch from API
const mockProjects: Project[] = [
    { id: 1, name: "Green Forest Initiative", type: "Forestry", registry: "Verra", available_credits: 5000 },
    { id: 2, name: "Solar Farm Alpha", type: "Renewable Energy", registry: "Gold Standard", available_credits: 3000 },
    { id: 3, name: "Wind Power Beta", type: "Renewable Energy", registry: "ACR", available_credits: 8000 },
];

export default function CreateSellOrderPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [projects, setProjects] = useState<Project[]>(mockProjects);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);

    const [formData, setFormData] = useState({
        projectId: "",
        quantity: "",
        pricePerTon: "",
        minQuantity: "1",
        vintage: new Date().getFullYear().toString(),
        description: "",
        expiryDays: "30",
    });

    const handleProjectChange = (projectId: string) => {
        const project = projects.find(p => p.id === parseInt(projectId));
        setSelectedProject(project || null);
        setFormData({ ...formData, projectId });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // In production, call the API to create sell order
            // await marketplaceApi.createListing({...formData});

            alert("Sell order created successfully!");
            router.push("/dashboard/developer/market/sell-orders");
        } catch (error) {
            console.error("Error creating sell order:", error);
            alert("Failed to create sell order. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFormValid = formData.projectId &&
        formData.quantity &&
        parseInt(formData.quantity) > 0 &&
        formData.pricePerTon &&
        parseFloat(formData.pricePerTon) > 0;

    return (
        <div className="space-y-6">
            {/* Page Title */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <Package className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Sell Order</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">List your carbon credits for sale</p>
                    </div>
                </div>
                <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isFormValid}
                    className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:opacity-90 shadow-lg"
                >
                    {isSubmitting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Save className="mr-2 h-4 w-4" />
                    )}
                    {isSubmitting ? "Creating..." : "Create Order"}
                </Button>
            </div>

            {/* Project Selection */}
            <Card>

                <CardHeader>
                    <CardTitle className="text-lg">Select Project</CardTitle>
                    <CardDescription>
                        Choose a carbon credit project to list for sale
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="project">Project *</Label>
                        <Select
                            value={formData.projectId}
                            onValueChange={handleProjectChange}
                        >
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((project) => (
                                    <SelectItem key={project.id} value={project.id.toString()}>
                                        <div className="flex items-center gap-2">
                                            <span>{project.name}</span>
                                            <span className="text-muted-foreground">
                                                ({project.available_credits.toLocaleString()} credits)
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedProject && (
                        <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Type:</span>
                                <span className="font-medium">{selectedProject.type}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Registry:</span>
                                <span className="font-medium">{selectedProject.registry}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Available Credits:</span>
                                <span className="font-medium text-green-600">
                                    {selectedProject.available_credits.toLocaleString()} tCO₂e
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pricing & Quantity */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Pricing & Quantity</CardTitle>
                    <CardDescription>
                        Set your listing price and quantity
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quantity">Quantity (tCO₂e) *</Label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    max={selectedProject?.available_credits || 999999}
                                    placeholder="1000"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                                    className="pl-9 h-11"
                                />
                            </div>
                            {selectedProject && formData.quantity && parseInt(formData.quantity) > selectedProject.available_credits && (
                                <p className="text-xs text-destructive">
                                    Exceeds available credits ({selectedProject.available_credits.toLocaleString()})
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="pricePerTon">Price per tCO₂e (USD) *</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="pricePerTon"
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    placeholder="25.00"
                                    value={formData.pricePerTon}
                                    onChange={(e) => setFormData({ ...formData, pricePerTon: e.target.value })}
                                    className="pl-9 h-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="minQuantity">Minimum Order Quantity</Label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="minQuantity"
                                    type="number"
                                    min="1"
                                    placeholder="1"
                                    value={formData.minQuantity}
                                    onChange={(e) => setFormData({ ...formData, minQuantity: e.target.value })}
                                    className="pl-9 h-11"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vintage">Vintage Year</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="vintage"
                                    type="number"
                                    min="2000"
                                    max={new Date().getFullYear()}
                                    placeholder="2024"
                                    value={formData.vintage}
                                    onChange={(e) => setFormData({ ...formData, vintage: e.target.value })}
                                    className="pl-9 h-11"
                                />
                            </div>
                        </div>
                    </div>

                    {formData.quantity && formData.pricePerTon && (
                        <div className="p-4 bg-gradient-to-r from-carbon-500/10 to-carbon-700/10 rounded-lg border border-carbon-500/20">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Total Listing Value:</span>
                                <span className="text-2xl font-bold text-gradient">
                                    ${(parseFloat(formData.quantity) * parseFloat(formData.pricePerTon)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Additional Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Additional Details</CardTitle>
                    <CardDescription>
                        Optional information for buyers
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="expiryDays">Listing Expiry</Label>
                        <Select
                            value={formData.expiryDays}
                            onValueChange={(value) => setFormData({ ...formData, expiryDays: value })}
                        >
                            <SelectTrigger className="h-11">
                                <SelectValue placeholder="Select expiry" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="7">7 days</SelectItem>
                                <SelectItem value="14">14 days</SelectItem>
                                <SelectItem value="30">30 days</SelectItem>
                                <SelectItem value="60">60 days</SelectItem>
                                <SelectItem value="90">90 days</SelectItem>
                                <SelectItem value="0">No expiry</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Textarea
                            id="description"
                            placeholder="Add any additional details about this listing..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={4}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 flex gap-3">
                <Info className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-700 dark:text-blue-300">
                    <p className="font-medium mb-1">Before you list:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-600 dark:text-blue-400">
                        <li>Make sure your credits are verified and registered</li>
                        <li>You can pause or cancel your listing at any time</li>
                        <li>Buyers can make offers below your listed price</li>
                        <li>Transaction fees apply upon successful sale</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

