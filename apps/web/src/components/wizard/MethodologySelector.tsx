"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Info, CheckCircle } from 'lucide-react';
import type { MethodologyInfo } from '@/lib/api';

interface MethodologySelectorProps {
    methodologies: MethodologyInfo[];
    projectType?: string;
    onSelect: (methodology: MethodologyInfo) => void;
    selectedMethodologyId?: string;
    isLoading?: boolean;
}

const REGISTRIES = [
    { id: 'CDM', name: 'CDM/UNFCCC', description: 'Clean Development Mechanism' },
    { id: 'VERRA', name: 'Verra VCS', description: 'Verified Carbon Standard' },
    { id: 'GOLD_STANDARD', name: 'Gold Standard', description: 'Gold Standard for the Global Goals' },
    { id: 'GCC', name: 'Global Carbon Council', description: 'MENA Region Registry' },
];

export function MethodologySelector({
    methodologies,
    projectType,
    onSelect,
    selectedMethodologyId,
    isLoading = false,
}: MethodologySelectorProps) {
    const [selectedRegistry, setSelectedRegistry] = useState<string>('');
    const [filteredMethodologies, setFilteredMethodologies] = useState<MethodologyInfo[]>(methodologies);

    // Filter methodologies by registry
    useEffect(() => {
        if (selectedRegistry) {
            setFilteredMethodologies(
                methodologies.filter(m => m.registry.toUpperCase() === selectedRegistry.toUpperCase())
            );
        } else {
            setFilteredMethodologies(methodologies);
        }
    }, [selectedRegistry, methodologies]);

    // Get unique registries from available methodologies
    const availableRegistries = Array.from(
        new Set(methodologies.map(m => m.registry.toUpperCase()))
    );

    const selectedMethodology = methodologies.find(m => m.id === selectedMethodologyId);

    const getRegistryBadgeColor = (registry: string): string => {
        switch (registry.toUpperCase()) {
            case 'CDM':
                return 'bg-blue-100 text-blue-800';
            case 'VERRA':
                return 'bg-green-100 text-green-800';
            case 'GOLD_STANDARD':
                return 'bg-yellow-100 text-yellow-800';
            case 'GCC':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Select Carbon Credit Methodology</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Methodology Explanation */}
                <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                        <strong>What is a Carbon Credit Methodology?</strong><br />
                        A methodology defines the rules and procedures used to calculate carbon credits for your project.
                        It specifies how to calculate baseline emissions, project emissions, and the resulting emission reductions.
                        Different registries (CDM, Verra, Gold Standard) have approved methodologies for different project types.
                    </AlertDescription>
                </Alert>

                {/* Registry Filter */}
                <div className="space-y-2">
                    <Label>Registry (Optional Filter)</Label>
                    <Select
                        value={selectedRegistry}
                        onValueChange={(value) => setSelectedRegistry(value === 'ALL' ? '' : value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="All registries" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ALL">All registries</SelectItem>
                            {REGISTRIES.filter(r => availableRegistries.includes(r.id)).map(registry => (
                                <SelectItem key={registry.id} value={registry.id}>
                                    <div className="flex flex-col">
                                        <span>{registry.name}</span>
                                        <span className="text-xs text-gray-500">{registry.description}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Methodology Selection */}
                <div className="space-y-2">
                    <Label>Methodology</Label>
                    {isLoading ? (
                        <div className="animate-pulse bg-gray-100 h-10 rounded-md" />
                    ) : filteredMethodologies.length === 0 ? (
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                No methodologies available for this project type and registry combination.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="space-y-2">
                            {filteredMethodologies.map(methodology => (
                                <div
                                    key={methodology.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedMethodologyId === methodology.id
                                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    onClick={() => onSelect(methodology)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{methodology.name}</span>
                                                <Badge
                                                    variant="outline"
                                                    className={getRegistryBadgeColor(methodology.registry)}
                                                >
                                                    {methodology.registry}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    v{methodology.version}
                                                </Badge>
                                            </div>
                                            {methodology.description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {methodology.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span>ID: {methodology.id}</span>
                                                {methodology.max_capacity_mw && (
                                                    <span>Max: {methodology.max_capacity_mw} MW</span>
                                                )}
                                                <span>
                                                    Types: {methodology.applicable_project_types.join(', ')}
                                                </span>
                                            </div>
                                        </div>
                                        {selectedMethodologyId === methodology.id && (
                                            <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Selected Methodology Details */}
                {selectedMethodology && (
                    <Alert className="border-blue-200 bg-blue-50">
                        <Info className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800">
                            <strong>Selected:</strong> {selectedMethodology.name} ({selectedMethodology.id})
                            <br />
                            <span className="text-sm">
                                This methodology will be used to calculate your carbon credit estimation.
                            </span>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
