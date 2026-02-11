"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info, CheckCircle, AlertTriangle, Globe, Leaf } from 'lucide-react';
import type { MethodologyInfo } from '@/lib/api';
import type { EligibilityResult } from '@/lib/carbonEligibility';

interface MethodologySelectorProps {
    methodologies: MethodologyInfo[];
    projectType?: string;
    onSelect: (methodology: MethodologyInfo) => void;
    selectedMethodologyId?: string;
    isLoading?: boolean;
    eligibilityResult?: EligibilityResult | null;
}

// REC Standards Data
const REC_STANDARDS: MethodologyInfo[] = [
    {
        id: 'I-REC',
        registry: 'I-REC',
        name: 'I-REC Standard',
        version: '3.0',
        applicable_project_types: ['solar', 'wind', 'hydro', 'biomass', 'geothermal'],
        description: 'International Renewable Energy Certificate - Global standard for renewable energy tracking',
    },
    {
        id: 'GCC-I-REC',
        registry: 'I-REC',
        name: 'GCC I-REC (Regional)',
        version: '1.0',
        applicable_project_types: ['solar', 'wind'],
        description: 'Qatar / MENA regional I-REC certificates',
    },
    {
        id: 'TIGR',
        registry: 'APX',
        name: 'TIGR (Tradable Instruments for Global Renewables)',
        version: '2.0',
        applicable_project_types: ['solar', 'wind', 'hydro', 'biomass'],
        description: 'USA (APX) - Renewable energy tracking system',
    },
    {
        id: 'EAC-EU-GO',
        registry: 'EU',
        name: 'EACs (Energy Attribute Certificates – EU GO)',
        version: '1.0',
        applicable_project_types: ['solar', 'wind', 'hydro', 'biomass', 'geothermal'],
        description: 'EU Guarantees of Origin for renewable energy',
    },
    {
        id: 'GREEN-E',
        registry: 'Green-e',
        name: 'Green-e®',
        version: '3.0',
        applicable_project_types: ['solar', 'wind', 'hydro', 'biomass', 'geothermal'],
        description: 'USA - Leading renewable energy certification program',
    },
    {
        id: 'REC-INDIA',
        registry: 'India',
        name: 'National REC India – CERC / POSOCO',
        version: '1.0',
        applicable_project_types: ['solar', 'wind', 'hydro', 'biomass'],
        description: 'India - Central Electricity Regulatory Commission RECs',
    },
    {
        id: 'CHINA-GEC',
        registry: 'China',
        name: 'China Green Electricity Certificate (GEC)',
        version: '2.0',
        applicable_project_types: ['solar', 'wind'],
        description: 'China - National green electricity certificate system',
    },
    {
        id: 'MALAYSIA-TREC',
        registry: 'Malaysia',
        name: 'Malaysia T-REC',
        version: '1.0',
        applicable_project_types: ['solar', 'wind', 'hydro', 'biomass'],
        description: 'Malaysia - Tradable Renewable Energy Certificates',
    },
    {
        id: 'JAPAN-JCREDIT',
        registry: 'Japan',
        name: 'Japan J-Credit Renewable Energy',
        version: '1.0',
        applicable_project_types: ['solar', 'wind', 'hydro', 'biomass', 'geothermal'],
        description: 'Japan - J-Credit scheme for renewable energy',
    },
    {
        id: 'AUSTRALIA-LGC',
        registry: 'Australia',
        name: 'Australia LGC/SREC registry',
        version: '1.0',
        applicable_project_types: ['solar', 'wind', 'hydro'],
        description: 'Australia - Large-scale Generation Certificates / Small-scale Renewable Energy Certificates',
    },
    {
        id: 'UK-REGO',
        registry: 'UK',
        name: 'UK REGOs (Renewable Energy Guarantees of Origin)',
        version: '1.0',
        applicable_project_types: ['solar', 'wind', 'hydro', 'biomass'],
        description: 'UK - Renewable Energy Guarantees of Origin',
    },
    {
        id: 'TURKEY-YEKG',
        registry: 'Turkey',
        name: 'Turkey YEK-G Renewable Energy Certificates',
        version: '1.0',
        applicable_project_types: ['solar', 'wind', 'hydro', 'geothermal'],
        description: 'Turkey - YEK-G renewable energy certificate system',
    },
    {
        id: 'COLOMBIA-CER',
        registry: 'Colombia',
        name: 'Colombia CER Renewable Certificates',
        version: '1.0',
        applicable_project_types: ['solar', 'wind', 'hydro', 'biomass'],
        description: 'Colombia - Renewable energy certificate system',
    },
];

const CARBON_REGISTRIES = [
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
    eligibilityResult = null,
}: MethodologySelectorProps) {
    // Determine recommended pathway
    const recommendedPath = eligibilityResult?.hardFailTriggered ? 'REC' : 'CARBON';

    // Default to recommended tab
    const [activeTab, setActiveTab] = useState<'carbon' | 'rec'>(
        recommendedPath === 'REC' ? 'rec' : 'carbon'
    );

    // Filter RECs by project type
    const filteredRECs = projectType
        ? REC_STANDARDS.filter(rec => rec.applicable_project_types.includes(projectType))
        : REC_STANDARDS;

    // Filter carbon methodologies by project type
    const filteredCarbonMethodologies = projectType
        ? methodologies.filter(m => m.applicable_project_types.includes(projectType))
        : methodologies;

    const selectedMethodology = [...methodologies, ...REC_STANDARDS].find(
        m => m.id === selectedMethodologyId
    );

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
            // REC badges
            case 'I-REC':
                return 'bg-emerald-100 text-emerald-800';
            case 'APX':
            case 'GREEN-E':
                return 'bg-teal-100 text-teal-800';
            case 'EU':
            case 'UK':
                return 'bg-indigo-100 text-indigo-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Leaf className="h-5 w-5 text-green-600" />
                    Select Certification Pathway
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Eligibility-based Recommendation */}
                {eligibilityResult && (
                    <Alert className={
                        eligibilityResult.hardFailTriggered
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-green-50 border-green-200'
                    }>
                        {eligibilityResult.hardFailTriggered ? (
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                        ) : (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                        <AlertDescription className={
                            eligibilityResult.hardFailTriggered
                                ? 'text-amber-800'
                                : 'text-green-800'
                        }>
                            {eligibilityResult.hardFailTriggered ? (
                                <>
                                    <strong>Recommended: Renewable Energy Certificates (RECs)</strong>
                                    <br />
                                    Your project profile indicates high risk for carbon credit registration.
                                    RECs are a more suitable and reliable pathway for this project.
                                </>
                            ) : (
                                <>
                                    <strong>Both pathways available</strong>
                                    <br />
                                    Your project shows good eligibility for carbon credits. You can choose either
                                    carbon credits or RECs based on your business objectives.
                                </>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Tabs for Carbon vs REC */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'carbon' | 'rec')}>
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="carbon" className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Carbon Credits
                            {eligibilityResult?.hardFailTriggered && (
                                <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 text-xs">
                                    High Risk
                                </Badge>
                            )}
                            {recommendedPath === 'CARBON' && (
                                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 text-xs">
                                    Recommended
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="rec" className="flex items-center gap-2">
                            <Leaf className="h-4 w-4" />
                            RECs
                            {recommendedPath === 'REC' && (
                                <Badge variant="outline" className="ml-2 bg-green-100 text-green-800 text-xs">
                                    Recommended
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Carbon Credits Tab */}
                    <TabsContent value="carbon" className="space-y-4 mt-4">
                        <Alert className="border-blue-200 bg-blue-50">
                            <Info className="h-4 w-4 text-blue-600" />
                            <AlertDescription className="text-blue-800">
                                <strong>Carbon Credit Methodologies</strong>
                                <br />
                                Approved methodologies from international registries (CDM, Verra, Gold Standard, GCC).
                                Requires additionality demonstration and third-party verification.
                            </AlertDescription>
                        </Alert>

                        {isLoading ? (
                            <div className="animate-pulse bg-gray-100 h-40 rounded-md" />
                        ) : filteredCarbonMethodologies.length === 0 ? (
                            <Alert>
                                <Info className="h-4 w-4" />
                                <AlertDescription>
                                    No carbon credit methodologies available for this project type.
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <div className="space-y-2">
                                {filteredCarbonMethodologies.map(methodology => (
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
                    </TabsContent>

                    {/* RECs Tab */}
                    <TabsContent value="rec" className="space-y-4 mt-4">
                        <Alert className="border-emerald-200 bg-emerald-50">
                            <Info className="h-4 w-4 text-emerald-600" />
                            <AlertDescription className="text-emerald-800">
                                <strong>Renewable Energy Certificates (RECs)</strong>
                                <br />
                                Track and trade the environmental attributes of renewable energy generation.
                                No additionality testing required. Faster issuance and lower transaction costs.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            {filteredRECs.map(rec => (
                                <div
                                    key={rec.id}
                                    className={`p-4 border rounded-lg cursor-pointer transition-all ${selectedMethodologyId === rec.id
                                            ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                    onClick={() => onSelect(rec)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{rec.name}</span>
                                                <Badge
                                                    variant="outline"
                                                    className={getRegistryBadgeColor(rec.registry)}
                                                >
                                                    {rec.registry}
                                                </Badge>
                                                <Badge variant="outline" className="text-xs">
                                                    v{rec.version}
                                                </Badge>
                                            </div>
                                            {rec.description && (
                                                <p className="text-sm text-gray-600 mt-1">
                                                    {rec.description}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                                <span>ID: {rec.id}</span>
                                            </div>
                                        </div>
                                        {selectedMethodologyId === rec.id && (
                                            <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Selected Methodology Confirmation */}
                {selectedMethodology && (
                    <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                            <strong>Selected:</strong> {selectedMethodology.name} ({selectedMethodology.id})
                            <br />
                            <span className="text-sm">
                                This {REC_STANDARDS.some(r => r.id === selectedMethodology.id) ? 'REC standard' : 'carbon credit methodology'} will be used for your certification pathway.
                            </span>
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
