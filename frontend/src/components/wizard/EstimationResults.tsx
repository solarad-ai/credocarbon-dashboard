"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Leaf,
    TrendingUp,
    Calendar,
    Download,
    FileText,
    CheckCircle,
    Info,
    Zap
} from 'lucide-react';
import type { EstimationResult, MonthlyBreakdown, AnnualBreakdown } from '@/lib/api';

interface EstimationResultsProps {
    result: EstimationResult;
    onExportExcel?: () => void;
    onExportPDF?: () => void;
}

export function EstimationResults({
    result,
    onExportExcel,
    onExportPDF,
}: EstimationResultsProps) {
    const formatNumber = (num: number, decimals: number = 2): string => {
        return num.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    };

    const getRegistryColor = (registry: string): string => {
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Estimation Results</h2>
                    <p className="text-gray-500 text-sm">
                        Calculated on {new Date(result.calculation_date).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex gap-2">
                    {onExportExcel && (
                        <Button variant="outline" size="sm" onClick={onExportExcel}>
                            <Download className="h-4 w-4 mr-2" />
                            Export Excel
                        </Button>
                    )}
                    {onExportPDF && (
                        <Button variant="outline" size="sm" onClick={onExportPDF}>
                            <FileText className="h-4 w-4 mr-2" />
                            Evidence Pack
                        </Button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Total Emission Reductions */}
                <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-green-100 text-sm font-medium">Total Emission Reductions</p>
                                <p className="text-4xl font-bold mt-2">
                                    {formatNumber(result.total_er_tco2e)}
                                </p>
                                <p className="text-green-100 text-sm">tCO₂e</p>
                            </div>
                            <div className="p-3 bg-green-400/30 rounded-lg">
                                <Leaf className="h-8 w-8" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Total Generation */}
                <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Total Generation</p>
                                <p className="text-4xl font-bold mt-2">
                                    {formatNumber(result.total_generation_mwh)}
                                </p>
                                <p className="text-blue-100 text-sm">MWh</p>
                            </div>
                            <div className="p-3 bg-blue-400/30 rounded-lg">
                                <Zap className="h-8 w-8" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Grid Emission Factor */}
                <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                    <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Grid Emission Factor</p>
                                <p className="text-4xl font-bold mt-2">
                                    {result.ef_value.toFixed(4)}
                                </p>
                                <p className="text-purple-100 text-sm">tCO₂/MWh</p>
                            </div>
                            <div className="p-3 bg-purple-400/30 rounded-lg">
                                <TrendingUp className="h-8 w-8" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Methodology & EF Details */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Calculation Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-sm text-gray-500">Methodology</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="font-medium">{result.methodology_id}</span>
                                <Badge className={getRegistryColor(result.registry)}>
                                    {result.registry}
                                </Badge>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Country</p>
                            <p className="font-medium mt-1">{result.country_code}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">EF Source</p>
                            <p className="font-medium mt-1">{result.ef_source || '-'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">EF Year</p>
                            <p className="font-medium mt-1">{result.ef_year || '-'}</p>
                        </div>
                    </div>

                    {/* Breakdown of ER Calculation */}
                    <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm font-medium text-gray-700 mb-3">Emission Reduction Breakdown</p>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Baseline Emissions (BE)</span>
                                <span className="font-mono">{formatNumber(result.baseline_emissions_tco2e, 4)} tCO₂e</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Project Emissions (PE)</span>
                                <span className="font-mono">- {formatNumber(result.project_emissions_tco2e, 4)} tCO₂e</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Leakage (LE)</span>
                                <span className="font-mono">- {formatNumber(result.leakage_tco2e, 4)} tCO₂e</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-medium">
                                <span>Emission Reductions (ER)</span>
                                <span className="font-mono text-green-600">{formatNumber(result.total_er_tco2e, 4)} tCO₂e</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Formula: ER = BE - PE - LE = (Generation × EF_grid) - PE - LE
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Monthly Breakdown */}
            {result.monthly_breakdown.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Calendar className="h-5 w-5" />
                            Monthly Breakdown
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2 px-4 font-medium text-gray-500">Month</th>
                                        <th className="text-right py-2 px-4 font-medium text-gray-500">Generation (MWh)</th>
                                        <th className="text-right py-2 px-4 font-medium text-gray-500">Emission Reductions (tCO₂e)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {result.monthly_breakdown.map((month, index) => (
                                        <tr key={index} className="border-b hover:bg-gray-50">
                                            <td className="py-2 px-4">{month.month}</td>
                                            <td className="text-right py-2 px-4 font-mono">
                                                {formatNumber(month.generation_mwh)}
                                            </td>
                                            <td className="text-right py-2 px-4 font-mono text-green-600">
                                                {formatNumber(month.emission_reductions_tco2e)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-gray-50 font-medium">
                                        <td className="py-2 px-4">Total</td>
                                        <td className="text-right py-2 px-4 font-mono">
                                            {formatNumber(result.total_generation_mwh)}
                                        </td>
                                        <td className="text-right py-2 px-4 font-mono text-green-600">
                                            {formatNumber(result.total_er_tco2e)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Annual/Vintage Breakdown */}
            {result.annual_breakdown.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <TrendingUp className="h-5 w-5" />
                            Vintage Breakdown (Annual)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {result.annual_breakdown.map((year, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                    <p className="text-2xl font-bold text-gray-900">{year.vintage}</p>
                                    <div className="mt-2 space-y-1 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Generation</span>
                                            <span className="font-mono">{formatNumber(year.generation_mwh)} MWh</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Credits</span>
                                            <span className="font-mono text-green-600">
                                                {formatNumber(year.emission_reductions_tco2e)} tCO₂e
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Assumptions */}
            {result.assumptions && Object.keys(result.assumptions).length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Info className="h-5 w-5" />
                            Calculation Assumptions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            {Object.entries(result.assumptions).map(([key, value]) => (
                                <div key={key} className="p-3 bg-gray-50 rounded">
                                    <p className="text-gray-500 text-xs uppercase tracking-wide">
                                        {key.replace(/_/g, ' ')}
                                    </p>
                                    <p className="font-medium mt-1">
                                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Success Message */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                    <p className="font-medium text-green-800">Estimation Complete</p>
                    <p className="text-sm text-green-700 mt-1">
                        Your project is estimated to generate <strong>{formatNumber(result.total_er_tco2e)} tCO₂e</strong> of
                        carbon credits using the {result.methodology_id} methodology.
                    </p>
                </div>
            </div>
        </div>
    );
}
