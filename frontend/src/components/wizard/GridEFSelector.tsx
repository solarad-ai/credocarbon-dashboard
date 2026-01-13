"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Search, Globe, ExternalLink, Info } from 'lucide-react';
import type { GridEmissionFactor } from '@/lib/api';

interface GridEFSelectorProps {
    emissionFactors: GridEmissionFactor[];
    onSelect: (ef: GridEmissionFactor, customValue?: number) => void;
    selectedCountryCode?: string;
    customEFValue?: number;
    allowCustom?: boolean;
    isLoading?: boolean;
}

export function GridEFSelector({
    emissionFactors,
    onSelect,
    selectedCountryCode,
    customEFValue,
    allowCustom = true,
    isLoading = false,
}: GridEFSelectorProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [useCustom, setUseCustom] = useState(false);
    const [customValue, setCustomValue] = useState<string>(customEFValue?.toString() || '');

    // Filter emission factors by search
    const filteredEFs = useMemo(() => {
        if (!searchQuery) return emissionFactors;

        const query = searchQuery.toLowerCase();
        return emissionFactors.filter(ef =>
            ef.country_name.toLowerCase().includes(query) ||
            ef.country_code.toLowerCase().includes(query) ||
            ef.region_name?.toLowerCase().includes(query)
        );
    }, [emissionFactors, searchQuery]);

    // Group by region
    const groupedEFs = useMemo(() => {
        const groups: Record<string, GridEmissionFactor[]> = {};

        filteredEFs.forEach(ef => {
            // Determine region based on country code
            let region = 'Other';
            if (['IN', 'PK', 'BD', 'LK', 'NP'].includes(ef.country_code)) region = 'South Asia';
            else if (['VN', 'TH', 'ID', 'PH', 'MY', 'SG', 'MM', 'KH'].includes(ef.country_code)) region = 'Southeast Asia';
            else if (['CN', 'JP', 'KR', 'TW', 'MN'].includes(ef.country_code)) region = 'East Asia';
            else if (['AE', 'SA', 'EG', 'QA', 'KW', 'OM', 'BH', 'JO', 'LB', 'MA', 'TN', 'TR'].includes(ef.country_code)) region = 'Middle East / North Africa';
            else if (['ZA', 'KE', 'NG', 'GH', 'ET', 'TZ', 'UG', 'SN'].includes(ef.country_code)) region = 'Africa';
            else if (['DE', 'FR', 'GB', 'ES', 'IT', 'PL', 'NL', 'BE', 'AT', 'CH', 'SE', 'NO', 'DK', 'FI', 'PT', 'GR', 'CZ', 'RO', 'HU', 'SK', 'BG', 'IE', 'UA', 'RU'].includes(ef.country_code)) region = 'Europe';
            else if (['US', 'CA', 'MX', 'BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'PA', 'CR', 'UY'].includes(ef.country_code)) region = 'Americas';
            else if (['AU', 'NZ', 'FJ'].includes(ef.country_code)) region = 'Oceania';

            if (!groups[region]) groups[region] = [];
            groups[region].push(ef);
        });

        // Sort countries within each group
        Object.keys(groups).forEach(region => {
            groups[region].sort((a, b) => a.country_name.localeCompare(b.country_name));
        });

        return groups;
    }, [filteredEFs]);

    const selectedEF = emissionFactors.find(ef => ef.country_code === selectedCountryCode);

    const handleSelect = (countryCode: string) => {
        const ef = emissionFactors.find(e => e.country_code === countryCode);
        if (ef) {
            setUseCustom(false);
            onSelect(ef);
        }
    };

    const handleCustomValueChange = (value: string) => {
        setCustomValue(value);
        const numValue = parseFloat(value);
        if (!isNaN(numValue) && selectedEF) {
            onSelect(selectedEF, numValue);
        }
    };

    const getEFColor = (ef: number): string => {
        if (ef > 0.7) return 'text-red-600';
        if (ef > 0.4) return 'text-orange-600';
        if (ef > 0.2) return 'text-yellow-600';
        return 'text-green-600';
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Grid Emission Factor
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search country..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Country Selection */}
                <div className="space-y-2">
                    <Label>Country / Grid Region</Label>
                    {isLoading ? (
                        <div className="animate-pulse bg-gray-100 h-10 rounded-md" />
                    ) : (
                        <Select
                            value={selectedCountryCode}
                            onValueChange={handleSelect}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent className="max-h-80">
                                {Object.entries(groupedEFs).map(([region, efs]) => (
                                    <div key={region}>
                                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                                            {region}
                                        </div>
                                        {efs.map((ef, index) => (
                                            <SelectItem key={`${ef.country_code}-${ef.region_code || index}`} value={ef.country_code}>
                                                <div className="flex items-center justify-between w-full">
                                                    <span>{ef.country_name}</span>
                                                    <span className={`ml-4 font-mono text-sm ${getEFColor(ef.combined_margin || 0)}`}>
                                                        {ef.combined_margin?.toFixed(3) || '-'}
                                                    </span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Selected EF Details */}
                {selectedEF && (
                    <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-medium">{selectedEF.country_name}</span>
                                {selectedEF.region_name && (
                                    <span className="text-gray-500 ml-2">({selectedEF.region_name})</span>
                                )}
                            </div>
                            <Badge variant="outline">{selectedEF.data_year}</Badge>
                        </div>

                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500">Combined Margin</p>
                                <p className={`text-lg font-bold ${getEFColor(selectedEF.combined_margin || 0)}`}>
                                    {selectedEF.combined_margin?.toFixed(4) || '-'} <span className="text-xs font-normal">tCO₂/MWh</span>
                                </p>
                            </div>
                            {selectedEF.operating_margin && (
                                <div>
                                    <p className="text-gray-500">Operating Margin</p>
                                    <p className="font-medium">{selectedEF.operating_margin.toFixed(4)}</p>
                                </div>
                            )}
                            {selectedEF.build_margin && (
                                <div>
                                    <p className="text-gray-500">Build Margin</p>
                                    <p className="font-medium">{selectedEF.build_margin.toFixed(4)}</p>
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-gray-500 flex items-center gap-1">
                            <span>Source: {selectedEF.source_name}</span>
                            {selectedEF.source_url && (
                                <a
                                    href={selectedEF.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline inline-flex items-center"
                                >
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* Custom EF Option */}
                {allowCustom && selectedEF && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="use-custom"
                                checked={useCustom}
                                onChange={(e) => setUseCustom(e.target.checked)}
                                className="rounded border-gray-300"
                            />
                            <Label htmlFor="use-custom" className="text-sm cursor-pointer">
                                Use custom emission factor value
                            </Label>
                        </div>

                        {useCustom && (
                            <div className="flex items-center gap-2">
                                <Input
                                    type="number"
                                    step="0.001"
                                    placeholder="0.000"
                                    value={customValue}
                                    onChange={(e) => handleCustomValueChange(e.target.value)}
                                    className="w-32"
                                />
                                <span className="text-sm text-gray-500">tCO₂/MWh</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Info Alert */}
                <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 text-sm">
                        The Combined Margin (CM) emission factor is used to calculate emission reductions.
                        For solar/wind projects: CM = 75% × OM + 25% × BM.
                    </AlertDescription>
                </Alert>
            </CardContent>
        </Card>
    );
}
