"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, ArrowRight, Clock, Zap } from 'lucide-react';
import type { ColumnInfo, DatasetMapping, MappingValidation } from '@/lib/api';

interface ColumnMappingFormProps {
    columns: ColumnInfo[];
    previewRows: any[][];
    onMappingComplete: (mapping: DatasetMapping) => void;
    onValidate?: (mapping: DatasetMapping) => Promise<MappingValidation>;
    initialMapping?: Partial<DatasetMapping>;
    isSubmitting?: boolean;
}

const FREQUENCY_OPTIONS = [
    { value: 60, label: '1 minute' },
    { value: 300, label: '5 minutes' },
    { value: 900, label: '15 minutes' },
    { value: 1800, label: '30 minutes' },
    { value: 3600, label: '1 hour' },
    { value: 7200, label: '2 hours' },
    { value: 14400, label: '4 hours' },
    { value: 86400, label: '1 day' },
    { value: 604800, label: '1 week' },
    { value: 2592000, label: '1 month (30 days)' },
];

const TIMEZONE_OPTIONS = [
    { value: 'UTC', label: 'UTC' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Dubai', label: 'UAE (GST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Asia/Tokyo', label: 'Japan (JST)' },
    { value: 'Europe/London', label: 'UK (GMT/BST)' },
    { value: 'Europe/Paris', label: 'Central Europe (CET)' },
    { value: 'America/New_York', label: 'US Eastern (EST/EDT)' },
    { value: 'America/Los_Angeles', label: 'US Pacific (PST/PDT)' },
    { value: 'Australia/Sydney', label: 'Australia (AEST)' },
];

export function ColumnMappingForm({
    columns,
    previewRows,
    onMappingComplete,
    onValidate,
    initialMapping,
    isSubmitting = false,
}: ColumnMappingFormProps) {
    const [mapping, setMapping] = useState<DatasetMapping>({
        timestamp_column: initialMapping?.timestamp_column || '',
        value_column: initialMapping?.value_column || '',
        unit: initialMapping?.unit || 'kWh',
        value_semantics: initialMapping?.value_semantics || 'ENERGY_PER_INTERVAL',
        frequency_seconds: initialMapping?.frequency_seconds || 3600,
        timezone: initialMapping?.timezone || 'UTC',
    });

    const [validation, setValidation] = useState<MappingValidation | null>(null);
    const [isValidating, setIsValidating] = useState(false);

    // Auto-suggest columns based on type
    const datetimeColumns = columns.filter(c => c.inferred_type === 'datetime');
    const numericColumns = columns.filter(c => c.inferred_type === 'numeric');

    // Auto-select first datetime column
    useEffect(() => {
        if (!mapping.timestamp_column && datetimeColumns.length > 0) {
            setMapping(prev => ({ ...prev, timestamp_column: datetimeColumns[0].name }));
        }
    }, [datetimeColumns, mapping.timestamp_column]);

    // Auto-select first numeric column if not already set
    useEffect(() => {
        if (!mapping.value_column && numericColumns.length > 0) {
            setMapping(prev => ({ ...prev, value_column: numericColumns[0].name }));
        }
    }, [numericColumns, mapping.value_column]);

    const handleValidate = async () => {
        if (!onValidate) return;

        setIsValidating(true);

        // Add timeout to prevent infinite loading state
        const timeoutId = setTimeout(() => {
            setIsValidating(false);
            setValidation({
                valid: false,
                errors: ['Validation timed out. Please try again or continue without validation.'],
                warnings: [],
                sample_conversion: null,
                detected_frequency: null,
            });
        }, 30000); // 30 second timeout

        try {
            const result = await onValidate(mapping);
            clearTimeout(timeoutId);
            setValidation(result);
        } catch (error) {
            clearTimeout(timeoutId);
            setValidation({
                valid: false,
                errors: [(error as Error).message],
                warnings: [],
                sample_conversion: null,
                detected_frequency: null,
            });
        } finally {
            setIsValidating(false);
        }
    };

    const handleSubmit = () => {
        onMappingComplete(mapping);
    };

    const isComplete = mapping.timestamp_column && mapping.value_column;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Configure Column Mapping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Timestamp Column */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        Timestamp Column
                    </Label>
                    <Select
                        value={mapping.timestamp_column}
                        onValueChange={(value) => setMapping(prev => ({ ...prev, timestamp_column: value }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select timestamp column" />
                        </SelectTrigger>
                        <SelectContent>
                            {columns.map(col => (
                                <SelectItem key={col.name} value={col.name}>
                                    <div className="flex items-center gap-2">
                                        <span>{col.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {col.inferred_type}
                                        </Badge>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {datetimeColumns.length > 0 && (
                        <p className="text-xs text-gray-500">
                            Suggested: {datetimeColumns.map(c => c.name).join(', ')}
                        </p>
                    )}
                </div>

                {/* Value Column */}
                <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Generation Data Column
                    </Label>
                    <Select
                        value={mapping.value_column}
                        onValueChange={(value) => setMapping(prev => ({ ...prev, value_column: value }))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select generation data column" />
                        </SelectTrigger>
                        <SelectContent>
                            {columns.map(col => (
                                <SelectItem key={col.name} value={col.name}>
                                    <div className="flex items-center gap-2">
                                        <span>{col.name}</span>
                                        <Badge variant="outline" className="text-xs">
                                            {col.inferred_type}
                                        </Badge>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {numericColumns.length > 0 && (
                        <p className="text-xs text-gray-500">
                            Suggested numeric columns: {numericColumns.map(c => c.name).join(', ')}
                        </p>
                    )}
                </div>

                {/* Unit and Semantics Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Unit</Label>
                        <Select
                            value={mapping.unit}
                            onValueChange={(value: 'kW' | 'MW' | 'kWh' | 'MWh') =>
                                setMapping(prev => ({ ...prev, unit: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="kWh">kWh (kilowatt-hours)</SelectItem>
                                <SelectItem value="MWh">MWh (megawatt-hours)</SelectItem>
                                <SelectItem value="kW">kW (kilowatts)</SelectItem>
                                <SelectItem value="MW">MW (megawatts)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Data Meaning</Label>
                        <Select
                            value={mapping.value_semantics}
                            onValueChange={(value: 'POWER' | 'ENERGY_PER_INTERVAL') =>
                                setMapping(prev => ({ ...prev, value_semantics: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ENERGY_PER_INTERVAL">Energy per interval</SelectItem>
                                <SelectItem value="POWER">Instantaneous power</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Frequency and Timezone Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Data Frequency</Label>
                        <Select
                            value={mapping.frequency_seconds.toString()}
                            onValueChange={(value) =>
                                setMapping(prev => ({ ...prev, frequency_seconds: parseInt(value) }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {FREQUENCY_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value.toString()}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Timezone</Label>
                        <Select
                            value={mapping.timezone}
                            onValueChange={(value) =>
                                setMapping(prev => ({ ...prev, timezone: value }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TIMEZONE_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Validation Results */}
                {validation && (
                    <div className="space-y-2">
                        {validation.errors.length > 0 && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {validation.errors.join('; ')}
                                </AlertDescription>
                            </Alert>
                        )}
                        {validation.warnings.length > 0 && (
                            <Alert>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {validation.warnings.join('; ')}
                                </AlertDescription>
                            </Alert>
                        )}
                        {validation.valid && validation.sample_conversion && (
                            <Alert className="border-green-200 bg-green-50">
                                <CheckCircle className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800">
                                    Sample conversion: {validation.sample_conversion.original_value} {validation.sample_conversion.original_unit} →{' '}
                                    <strong>{validation.sample_conversion.converted_value.toFixed(4)} {validation.sample_conversion.converted_unit}</strong>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between pt-4">
                    {onValidate && (
                        <Button
                            variant="outline"
                            onClick={handleValidate}
                            disabled={!isComplete || isValidating}
                        >
                            {isValidating ? 'Validating...' : 'Validate Mapping'}
                        </Button>
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={!isComplete || isSubmitting}
                        className="ml-auto"
                    >
                        {isSubmitting ? (
                            <>
                                <span className="mr-2 animate-spin">⏳</span>
                                Saving...
                            </>
                        ) : (
                            <>
                                Continue
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
