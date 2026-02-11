"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
    ArrowLeft, ArrowRight, Save, Check, ChevronDown, ChevronUp,
    Upload, FileText, Database, BarChart3, AlertCircle, Loader2, Globe, CheckCircle2,
    ShieldAlert, ShieldCheck, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import * as XLSX from "xlsx";

// Import wizard components
import { FileUploadZone } from "@/components/wizard/FileUploadZone";
import { ColumnMappingForm } from "@/components/wizard/ColumnMappingForm";
import { MethodologySelector } from "@/components/wizard/MethodologySelector";
import { GridEFSelector } from "@/components/wizard/GridEFSelector";
import { EstimationResults } from "@/components/wizard/EstimationResults";

// Import API
import {
    generationApi,
    projectApi,
    type UploadedFile,
    type FilePreview,
    type ColumnInfo,
    type DatasetMapping,
    type MethodologyInfo,
    type GridEmissionFactor,
    type EstimationResult
} from "@/lib/api";
import { evaluateEligibility, type EligibilityResult, type ProjectEligibilityData } from "@/lib/carbonEligibility";

const wizardSteps = [
    { id: 1, name: "Basic Info", active: true },
    { id: 2, name: "Registry Selection", active: true },
    { id: 3, name: "Stakeholders", active: false },
    { id: 4, name: "Compliance", active: false },
    { id: 5, name: "Registry Package", active: false },
    { id: 6, name: "Review & Submit", active: false },
];

interface CollapsibleBlockProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    required?: boolean;
    completed?: boolean;
}

function CollapsibleBlock({ title, icon, children, defaultOpen = false, required = false, completed = false }: CollapsibleBlockProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card className={cn("overflow-hidden", completed && "border-green-200")}>
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        completed ? "bg-green-100" : "bg-primary/10"
                    )}>
                        {completed ? <Check className="h-5 w-5 text-green-600" /> : icon}
                    </div>
                    <div>
                        <h3 className="font-semibold flex items-center gap-2">
                            {title}
                            {required && <span className="text-destructive text-sm">*</span>}
                            {completed && <span className="text-sm text-green-600">Complete</span>}
                        </h3>
                    </div>
                </div>
                {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </div>
            {isOpen && (
                <CardContent className="border-t pt-6 animate-fade-in">
                    {children}
                </CardContent>
            )}
        </Card>
    );
}

// Wizard sub-step type
type WizardStep = 'upload' | 'mapping' | 'methodology' | 'gridEF' | 'estimate' | 'results';

export default function CreditEstimationWizardPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const rawProjectId = params?.id as string;
    const projectId = rawProjectId ? parseInt(rawProjectId, 10) : NaN;
    const hasValidProjectId = !isNaN(projectId) && projectId > 0;
    const projectType = searchParams.get("type") || "solar";

    // Loading and saving states
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Wizard step tracking
    const [currentStep, setCurrentStep] = useState<WizardStep>('upload');

    // File upload state
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
    const [filePreview, setFilePreview] = useState<FilePreview | null>(null);

    // Mapping state
    const [columnMapping, setColumnMapping] = useState<DatasetMapping | null>(null);
    const [isSavingMapping, setIsSavingMapping] = useState(false);

    // Methodology state
    const [methodologies, setMethodologies] = useState<MethodologyInfo[]>([]);
    const [selectedMethodology, setSelectedMethodology] = useState<MethodologyInfo | null>(null);

    // Grid EF state
    const [gridEFs, setGridEFs] = useState<GridEmissionFactor[]>([]);
    const [selectedGridEF, setSelectedGridEF] = useState<GridEmissionFactor | null>(null);
    const [customEFValue, setCustomEFValue] = useState<number | undefined>();
    const [projectCountry, setProjectCountry] = useState<string>('');

    // Estimation state
    const [isEstimating, setIsEstimating] = useState(false);
    const [estimationResult, setEstimationResult] = useState<EstimationResult | null>(null);

    // Eligibility state
    const [eligibilityResult, setEligibilityResult] = useState<EligibilityResult | null>(null);

    // Load initial data
    useEffect(() => {
        async function loadInitialData() {
            setIsLoading(true);
            try {
                // Load methodologies for project type
                const methodsResponse = await generationApi.getMethodologies(projectType);
                setMethodologies(methodsResponse.methodologies);

                // Load grid emission factors
                const efsResponse = await generationApi.getGridEFs();
                setGridEFs(efsResponse.emission_factors);

                // Try to get project data to restore saved wizard state
                if (projectId) {
                    try {
                        const project = await projectApi.getById(projectId);
                        const wd = project.wizard_data;

                        // Restore country and auto-select grid EF
                        if (wd?.country) {
                            setProjectCountry(wd.country);
                            const matchingEF = efsResponse.emission_factors.find(
                                ef => ef.country_code === wd.country
                            );
                            if (matchingEF) {
                                setSelectedGridEF(matchingEF);
                            }
                        }

                        // Restore credit-estimation wizard state
                        if (wd?.currentStep) {
                            setCurrentStep(wd.currentStep);
                        }
                        if (wd?.uploadedFile) {
                            // Re-fetch file preview to verify the file is still available on the server
                            try {
                                const preview = await generationApi.getPreview(wd.uploadedFile.id);
                                setFilePreview(preview);
                                setUploadedFile(wd.uploadedFile);
                            } catch (previewErr) {
                                // File is no longer available on the server (Cloud Run /tmp is ephemeral)
                                // Clear stale file reference and ask user to re-upload
                                console.log('Uploaded file no longer available on server:', previewErr);
                                setUploadedFile(null);
                                setCurrentStep('upload');
                                setError('Your previously uploaded file is no longer available on the server. Please re-upload your generation data file.');
                            }
                        }
                        if (wd?.columnMapping) {
                            setColumnMapping(wd.columnMapping);
                        }
                        if (wd?.selectedMethodology) {
                            const method = methodsResponse.methodologies.find(
                                m => m.id === wd.selectedMethodology
                            );
                            if (method) {
                                setSelectedMethodology(method);
                            }
                        }
                        if (wd?.selectedGridEF) {
                            setSelectedGridEF(wd.selectedGridEF);
                        }
                        if (wd?.customEFValue !== undefined) {
                            setCustomEFValue(wd.customEFValue);
                        }
                        if (wd?.estimationResult) {
                            setEstimationResult(wd.estimationResult);
                        }

                        // Evaluate carbon credit eligibility
                        const eligibilityData: ProjectEligibilityData = {
                            installedCapacityDC: wd?.installedCapacityDC,
                            installedCapacityAC: wd?.installedCapacityAC,
                            installedCapacity: wd?.installedCapacity,
                            ppaDuration: wd?.ppaDuration,
                            offtakeType: wd?.offtakeType,
                            creditingPeriodStart: wd?.creditingPeriodStart,
                            commissioningDate: wd?.commissioningDate,
                            offtakerType: wd?.offtakerType,
                            isPolicyDriven: wd?.isPolicyDriven,
                            carbonRegistrationIntent: wd?.carbonRegistrationIntent,
                            additionalityJustification: wd?.additionalityJustification,
                            hostCountryArticle6Status: wd?.hostCountryArticle6Status,
                            isMerchant: wd?.isMerchant,
                            carbonRevenueMaterial: wd?.carbonRevenueMaterial,
                        };
                        const eligibility = evaluateEligibility(eligibilityData);
                        setEligibilityResult(eligibility);
                    } catch (e) {
                        // Project may not exist yet
                        console.log('Could not load project data:', e);
                    }
                }
            } catch (err) {
                console.error('Failed to load data:', err);
                setError('Failed to load initial data');
            } finally {
                setIsLoading(false);
            }
        }

        loadInitialData();
    }, [projectType, projectId]);

    // Handle file upload
    const handleFileUpload = async (file: File) => {
        if (!hasValidProjectId) {
            setError('Project ID is required. Please save the project first.');
            return;
        }

        setIsUploading(true);
        setUploadProgress(0);
        setError(null);

        try {
            // Simulate progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => Math.min(prev + 10, 90));
            }, 200);

            const result = await generationApi.uploadFile(projectId, file);

            clearInterval(progressInterval);
            setUploadProgress(100);
            setUploadedFile(result);

            // Get file preview
            const preview = await generationApi.getPreview(result.id);
            setFilePreview(preview);

            // Move to mapping step
            setCurrentStep('mapping');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsUploading(false);
        }
    };

    // Handle mapping completion
    const handleMappingComplete = async (mapping: DatasetMapping) => {
        if (!uploadedFile) {
            setError('No file uploaded. Please upload a file first.');
            return;
        }

        setIsSavingMapping(true);
        setError(null);

        try {
            await generationApi.saveMapping(uploadedFile.id, mapping);
            setColumnMapping(mapping);
            setCurrentStep('methodology');
        } catch (err) {
            const errorMessage = (err as Error).message;
            setError(`Failed to save column mapping: ${errorMessage}`);
            console.error('Column mapping save error:', err);
        } finally {
            setIsSavingMapping(false);
        }
    };

    // Handle mapping validation
    const handleValidateMapping = async (mapping: DatasetMapping) => {
        if (!uploadedFile) {
            throw new Error('No file uploaded');
        }
        return generationApi.validateMapping(uploadedFile.id, mapping);
    };

    // Handle methodology selection
    const handleMethodologySelect = (methodology: MethodologyInfo) => {
        setSelectedMethodology(methodology);
        setCurrentStep('gridEF');
    };

    // Handle grid EF selection
    const handleGridEFSelect = (ef: GridEmissionFactor, customValue?: number) => {
        setSelectedGridEF(ef);
        setCustomEFValue(customValue);
    };

    // Run estimation
    const handleRunEstimation = async () => {
        if (!selectedMethodology || !selectedGridEF || !projectId) {
            setError('Please complete all required selections');
            return;
        }

        setIsEstimating(true);
        setError(null);

        try {
            // If we have uploaded data, use the full estimate endpoint
            // Otherwise, use quick estimate based on project wizard_data

            // For now, try quick estimate with sample data
            // In production, you'd get actual generation data
            const project = await projectApi.getById(projectId);
            const capacity = project.wizard_data?.installedCapacityDC ||
                project.wizard_data?.installedCapacity || 10;

            // Estimate annual generation: capacity * 1600 hours (typical solar CF)
            const annualGeneration = capacity * 1600; // MWh/year

            const result = await generationApi.quickEstimate(
                annualGeneration,
                selectedGridEF.country_code,
                projectType,
                selectedMethodology.id
            );

            // Transform quick estimate result to EstimationResult format
            const estimationResult: EstimationResult = {
                id: 0,
                project_id: projectId,
                methodology_id: selectedMethodology.id,
                registry: selectedMethodology.registry,
                total_generation_mwh: result.total_generation_mwh,
                total_er_tco2e: result.total_er_tco2e,
                baseline_emissions_tco2e: result.baseline_emissions_tco2e,
                project_emissions_tco2e: result.project_emissions_tco2e || 0,
                leakage_tco2e: result.leakage_tco2e || 0,
                country_code: selectedGridEF.country_code,
                ef_value: customEFValue || selectedGridEF.combined_margin || 0,
                ef_source: result.ef_source || selectedGridEF.source_name,
                ef_year: result.ef_year || selectedGridEF.data_year,
                monthly_breakdown: result.monthly_breakdown || [],
                annual_breakdown: result.annual_breakdown || [],
                calculation_date: result.calculation_date || new Date().toISOString(),
                assumptions: result.assumptions,
            };

            setEstimationResult(estimationResult);
            setCurrentStep('results');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsEstimating(false);
        }
    };

    // Save draft
    const handleSaveDraft = async () => {
        if (!hasValidProjectId) {
            setError("Cannot save: No valid project ID");
            return;
        }

        setIsSaving(true);
        try {
            // Gather all wizard state to save
            const wizardData = {
                // Current step
                currentStep,
                // File upload info
                uploadedFile: uploadedFile,
                // Column mapping
                columnMapping: columnMapping,
                // Methodology selection
                selectedMethodology: selectedMethodology ? selectedMethodology.id : null,
                // Grid EF selection
                selectedGridEF: selectedGridEF,
                customEFValue: customEFValue,
                // Estimation results
                estimationResult: estimationResult,
            };

            await projectApi.update(projectId, {
                wizard_step: "credit-estimation",
                wizard_data: wizardData,
            });

            // Show success feedback (brief)
            setError(null);
        } catch (err) {
            setError("Failed to save draft: " + (err as Error).message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleNext = async () => {
        // Auto-save before navigating to next step
        await handleSaveDraft();
        router.push(`/dashboard/developer/project/${projectId}/wizard/stakeholders?type=${projectType}`);
    };

    const handleRemoveFile = () => {
        setUploadedFile(null);
        setFilePreview(null);
        setColumnMapping(null);
        setCurrentStep('upload');
    };

    // Export functions
    const handleExportExcel = () => {
        if (!estimationResult) return;

        // Create workbook
        const wb = XLSX.utils.book_new();

        // ===== Sheet 1: Summary =====
        const summaryData = [
            ['CARBON CREDIT ESTIMATION REPORT'],
            [''],
            ['CredoCarbon Platform'],
            ['Generated:', new Date().toLocaleString()],
            [''],
            ['PROJECT INFORMATION'],
            ['Project ID:', estimationResult.project_id],
            ['Methodology:', estimationResult.methodology_id],
            ['Registry:', estimationResult.registry],
            [''],
            ['GRID EMISSION FACTOR'],
            ['Country:', estimationResult.country_code],
            ['Emission Factor:', estimationResult.ef_value, 'tCO₂/MWh'],
            ['Source:', estimationResult.ef_source],
            ['Data Year:', estimationResult.ef_year || 'N/A'],
            [''],
            ['ESTIMATION RESULTS'],
            ['Metric', 'Value', 'Unit'],
            ['Total Generation', estimationResult.total_generation_mwh, 'MWh'],
            ['Baseline Emissions', estimationResult.baseline_emissions_tco2e, 'tCO₂e'],
            ['Project Emissions', estimationResult.project_emissions_tco2e, 'tCO₂e'],
            ['Leakage', estimationResult.leakage_tco2e, 'tCO₂e'],
            [''],
            ['TOTAL EMISSION REDUCTIONS', estimationResult.total_er_tco2e, 'tCO₂e'],
        ];

        const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);

        // Set column widths
        wsSummary['!cols'] = [{ wch: 25 }, { wch: 30 }, { wch: 15 }];

        XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

        // ===== Sheet 2: Monthly Breakdown =====
        if (estimationResult.monthly_breakdown?.length) {
            const monthlyData = [
                ['MONTHLY BREAKDOWN'],
                [''],
                ['Month', 'Generation (MWh)', 'Emission Reductions (tCO₂e)'],
                ...estimationResult.monthly_breakdown.map(m => [
                    m.month,
                    m.generation_mwh,
                    m.emission_reductions_tco2e
                ])
            ];

            const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData);
            wsMonthly['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 25 }];
            XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly Breakdown');
        }

        // ===== Sheet 3: Annual Breakdown (Vintages) =====
        if (estimationResult.annual_breakdown?.length) {
            const annualData = [
                ['ANNUAL BREAKDOWN (VINTAGES)'],
                [''],
                ['Year', 'Generation (MWh)', 'Emission Reductions (tCO₂e)'],
                ...estimationResult.annual_breakdown.map(a => [
                    a.vintage,
                    a.generation_mwh,
                    a.emission_reductions_tco2e
                ])
            ];

            const wsAnnual = XLSX.utils.aoa_to_sheet(annualData);
            wsAnnual['!cols'] = [{ wch: 10 }, { wch: 20 }, { wch: 25 }];
            XLSX.utils.book_append_sheet(wb, wsAnnual, 'Annual Vintages');
        }

        // ===== Sheet 4: Methodology Details =====
        const methodologyData = [
            ['METHODOLOGY DETAILS'],
            [''],
            ['Methodology ID:', estimationResult.methodology_id],
            ['Registry:', estimationResult.registry],
            [''],
            ['ASSUMPTIONS'],
            ...Object.entries(estimationResult.assumptions || {}).map(([key, value]) => [
                key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) + ':',
                String(value)
            ]),
            [''],
            ['DISCLAIMER'],
            ['This is an estimation based on the methodology and data provided.'],
            ['Actual carbon credits may vary based on verification and validation by the registry.'],
        ];

        const wsMethodology = XLSX.utils.aoa_to_sheet(methodologyData);
        wsMethodology['!cols'] = [{ wch: 35 }, { wch: 50 }];
        XLSX.utils.book_append_sheet(wb, wsMethodology, 'Methodology');

        // Download the file
        const fileName = `Carbon_Credit_Estimation_Project_${estimationResult.project_id}_${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const handleExportPDF = () => {
        if (!estimationResult) return;

        // Create a printable HTML document
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Carbon Credit Estimation Report</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
                    h1 { color: #166534; border-bottom: 2px solid #166534; padding-bottom: 10px; }
                    h2 { color: #374151; margin-top: 30px; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e5e7eb; }
                    th { background-color: #f9fafb; font-weight: 600; }
                    .highlight { background-color: #dcfce7; font-weight: bold; }
                    .metric-value { font-size: 24px; color: #166534; font-weight: bold; }
                    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
                    .summary-box { background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; padding: 20px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <h1>🌱 Carbon Credit Estimation Report</h1>
                
                <div class="summary-box">
                    <p><strong>Project ID:</strong> ${estimationResult.project_id}</p>
                    <p><strong>Methodology:</strong> ${estimationResult.methodology_id} (${estimationResult.registry})</p>
                    <p><strong>Calculation Date:</strong> ${new Date(estimationResult.calculation_date).toLocaleDateString()}</p>
                </div>
                
                <h2>Estimation Summary</h2>
                <table>
                    <tr class="highlight">
                        <td>Total Emission Reductions</td>
                        <td class="metric-value">${estimationResult.total_er_tco2e.toLocaleString()} tCO₂e</td>
                    </tr>
                    <tr>
                        <td>Total Generation</td>
                        <td>${estimationResult.total_generation_mwh.toLocaleString()} MWh</td>
                    </tr>
                    <tr>
                        <td>Baseline Emissions</td>
                        <td>${estimationResult.baseline_emissions_tco2e.toLocaleString()} tCO₂e</td>
                    </tr>
                    <tr>
                        <td>Project Emissions</td>
                        <td>${estimationResult.project_emissions_tco2e.toLocaleString()} tCO₂e</td>
                    </tr>
                    <tr>
                        <td>Leakage</td>
                        <td>${estimationResult.leakage_tco2e.toLocaleString()} tCO₂e</td>
                    </tr>
                </table>
                
                <h2>Grid Emission Factor</h2>
                <table>
                    <tr>
                        <td>Country</td>
                        <td>${estimationResult.country_code}</td>
                    </tr>
                    <tr>
                        <td>Emission Factor</td>
                        <td>${estimationResult.ef_value} tCO₂/MWh</td>
                    </tr>
                    <tr>
                        <td>Source</td>
                        <td>${estimationResult.ef_source}</td>
                    </tr>
                    <tr>
                        <td>Data Year</td>
                        <td>${estimationResult.ef_year || 'N/A'}</td>
                    </tr>
                </table>
                
                ${estimationResult.monthly_breakdown?.length ? `
                <h2>Monthly Breakdown</h2>
                <table>
                    <tr>
                        <th>Month</th>
                        <th>Generation (MWh)</th>
                        <th>Emission Reductions (tCO₂e)</th>
                    </tr>
                    ${estimationResult.monthly_breakdown.map(m => `
                        <tr>
                            <td>${m.month}</td>
                            <td>${m.generation_mwh.toLocaleString()}</td>
                            <td>${m.emission_reductions_tco2e.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </table>
                ` : ''}
                
                <div class="footer">
                    <p><strong>Disclaimer:</strong> This is an estimation based on the methodology and data provided. 
                    Actual carbon credits may vary based on verification and validation by the registry.</p>
                    <p>Generated by CredoCarbon Platform • ${new Date().toLocaleString()}</p>
                </div>
            </body>
            </html>
        `;

        // Open print dialog
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 250);
        }
    };

    // Show error if no valid project ID
    if (!hasValidProjectId && !isLoading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col items-center gap-4 text-center">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                            <div>
                                <h2 className="text-lg font-semibold">Project ID Required</h2>
                                <p className="text-muted-foreground mt-2">
                                    Please create and save a project first before adding generation data.
                                </p>
                            </div>
                            <Link href="/dashboard/developer/projects">
                                <Button>Go to My Projects</Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-muted/30 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-card border-b">
                <div className="container mx-auto px-4">
                    <div className="h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={`/dashboard/developer/project/${projectId}/wizard/basic-info`}>
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="font-semibold">Registry Selection</h1>
                                <p className="text-sm text-muted-foreground">Step 2 of 6</p>
                            </div>
                        </div>
                    </div>

                    {/* Step Indicator */}
                    <div className="py-4 overflow-x-auto">
                        <div className="flex items-center gap-2 min-w-max">
                            {wizardSteps.map((step, index) => (
                                <div key={step.id} className="flex items-center">
                                    <div className={cn(
                                        "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                                        step.id === 2
                                            ? "bg-primary text-primary-foreground"
                                            : step.id < 2
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted text-muted-foreground"
                                    )}>
                                        <span className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                            step.id === 2 ? "bg-white/20" : "bg-transparent border border-current"
                                        )}>
                                            {step.id}
                                        </span>
                                        {step.name}
                                    </div>
                                    {index < wizardSteps.length - 1 && (
                                        <div className="w-8 h-0.5 bg-border mx-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* Error Alert */}
                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {/* Eligibility Assessment Results - Shown First */}
                    {eligibilityResult && (
                        <CollapsibleBlock
                            title="Carbon Credit Eligibility Assessment"
                            icon={eligibilityResult.hardFailTriggered ?
                                <ShieldAlert className="h-5 w-5 text-destructive" /> :
                                <ShieldCheck className="h-5 w-5 text-primary" />
                            }
                            defaultOpen={true}
                            completed={!eligibilityResult.hardFailTriggered}
                        >
                            <div className="space-y-4">
                                {/* Main Result Card */}
                                <div className={cn(
                                    "p-4 rounded-lg border-2",
                                    eligibilityResult.hardFailTriggered
                                        ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800"
                                        : eligibilityResult.confidenceLevel === 'HIGH'
                                            ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800"
                                            : eligibilityResult.confidenceLevel === 'MEDIUM'
                                                ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300 dark:border-yellow-800"
                                                : "bg-orange-50 dark:bg-orange-900/20 border-orange-300 dark:border-orange-800"
                                )}>
                                    <div className="flex items-start gap-4">
                                        {eligibilityResult.hardFailTriggered ? (
                                            <XCircle className="h-8 w-8 text-red-600 mt-1 flex-shrink-0" />
                                        ) : eligibilityResult.confidenceLevel === 'HIGH' ? (
                                            <CheckCircle2 className="h-8 w-8 text-green-600 mt-1 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="h-8 w-8 text-amber-600 mt-1 flex-shrink-0" />
                                        )}
                                        <div className="flex-1">
                                            <h3 className={cn(
                                                "text-lg font-semibold",
                                                eligibilityResult.hardFailTriggered ? "text-red-800 dark:text-red-200" :
                                                    eligibilityResult.confidenceLevel === 'HIGH' ? "text-green-800 dark:text-green-200" :
                                                        "text-amber-800 dark:text-amber-200"
                                            )}>
                                                {eligibilityResult.recommendation}
                                            </h3>
                                            {!eligibilityResult.hardFailTriggered && (
                                                <p className="text-sm text-muted-foreground mt-1">
                                                    Confidence Score: <span className="font-semibold">{eligibilityResult.confidenceScore}%</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Hard Fail Details */}
                                {eligibilityResult.hardFailTriggered && (
                                    <div className="space-y-3">
                                        <h4 className="font-medium text-destructive">Hard Fail Conditions Triggered:</h4>
                                        <div className="space-y-2">
                                            {eligibilityResult.hardFailReasons
                                                .filter(r => r.triggered)
                                                .map(fail => (
                                                    <div key={fail.id} className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-200 dark:border-red-800">
                                                        <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="text-sm font-medium text-red-800 dark:text-red-200">{fail.condition}</p>
                                                            {fail.reason && (
                                                                <p className="text-xs text-red-600 dark:text-red-300 mt-1">{fail.reason}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    </div>
                                )}

                                {/* Soft Signals (only if no hard fail) */}
                                {!eligibilityResult.hardFailTriggered && (
                                    <div className="space-y-3">
                                        <h4 className="font-medium">Eligibility Signals:</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            {eligibilityResult.softSignals.map(signal => (
                                                <div
                                                    key={signal.id}
                                                    className={cn(
                                                        "flex items-start gap-2 p-3 rounded-lg border",
                                                        signal.present
                                                            ? "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800"
                                                            : "bg-muted/50 border-muted"
                                                    )}
                                                >
                                                    {signal.present ? (
                                                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                                    ) : (
                                                        <div className="h-4 w-4 border border-muted-foreground/30 rounded mt-0.5 flex-shrink-0" />
                                                    )}
                                                    <p className={cn(
                                                        "text-sm",
                                                        signal.present ? "text-green-800 dark:text-green-200" : "text-muted-foreground"
                                                    )}>
                                                        {signal.signal}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Risk Warnings */}
                                {eligibilityResult.riskWarnings.length > 0 && (
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                        <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">Risk Warnings:</h4>
                                        <ul className="space-y-1">
                                            {eligibilityResult.riskWarnings.map((warning, i) => (
                                                <li key={i} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                                    {warning}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </CollapsibleBlock>
                    )}

                    {/* Step 1: Data Upload */}
                    <CollapsibleBlock
                        title="Data Upload"
                        icon={<Upload className="h-5 w-5 text-primary" />}
                        defaultOpen={currentStep === 'upload'}
                        required
                        completed={!!uploadedFile}
                    >
                        <div className="space-y-4">
                            <Alert className="border-blue-200 bg-blue-50">
                                <AlertCircle className="h-4 w-4 text-blue-600" />
                                <AlertDescription className="text-blue-800">
                                    Upload your generation data (CSV or Excel). The file should contain timestamps and
                                    generation values (power or energy readings).
                                </AlertDescription>
                            </Alert>

                            <FileUploadZone
                                onFileAccepted={handleFileUpload}
                                isUploading={isUploading}
                                uploadProgress={uploadProgress}
                                uploadedFile={uploadedFile ? {
                                    name: uploadedFile.original_filename,
                                    size: uploadedFile.file_size_bytes,
                                    status: uploadedFile.status
                                } : null}
                                onRemoveFile={handleRemoveFile}
                            />
                        </div>
                    </CollapsibleBlock>

                    {/* Step 2: Column Mapping */}
                    {filePreview && (
                        <CollapsibleBlock
                            title="Column Mapping"
                            icon={<FileText className="h-5 w-5 text-primary" />}
                            defaultOpen={currentStep === 'mapping'}
                            required
                            completed={!!columnMapping}
                        >
                            <ColumnMappingForm
                                columns={filePreview.columns}
                                previewRows={filePreview.preview_rows}
                                onMappingComplete={handleMappingComplete}
                                onValidate={handleValidateMapping}
                                isSubmitting={isSavingMapping}
                            />
                        </CollapsibleBlock>
                    )}

                    {/* Step 3: Methodology Selection */}
                    <CollapsibleBlock
                        title="Methodology Selection"
                        icon={<Database className="h-5 w-5 text-primary" />}
                        defaultOpen={currentStep === 'methodology' || (!uploadedFile && !estimationResult)}
                        required
                        completed={!!selectedMethodology}
                    >
                        <MethodologySelector
                            methodologies={methodologies}
                            projectType={projectType}
                            onSelect={handleMethodologySelect}
                            selectedMethodologyId={selectedMethodology?.id}
                            eligibilityResult={eligibilityResult}
                        />
                    </CollapsibleBlock>

                    {/* Step 4: Grid Emission Factor */}
                    <CollapsibleBlock
                        title="Grid Emission Factor"
                        icon={<Globe className="h-5 w-5 text-primary" />}
                        defaultOpen={currentStep === 'gridEF'}
                        required
                        completed={!!selectedGridEF}
                    >
                        <div className="space-y-4">
                            <GridEFSelector
                                emissionFactors={gridEFs}
                                onSelect={handleGridEFSelect}
                                selectedCountryCode={selectedGridEF?.country_code || projectCountry}
                                customEFValue={customEFValue}
                            />

                            {selectedGridEF && selectedMethodology && (
                                <div className="flex justify-end pt-4">
                                    <Button
                                        onClick={handleRunEstimation}
                                        disabled={isEstimating}
                                        className="gap-2"
                                    >
                                        {isEstimating ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Calculating...
                                            </>
                                        ) : (
                                            <>
                                                <BarChart3 className="h-4 w-4" />
                                                Run Credit Estimation
                                            </>
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CollapsibleBlock>

                    {/* Step 5: Results */}
                    {estimationResult && (
                        <CollapsibleBlock
                            title="Estimation Results"
                            icon={<BarChart3 className="h-5 w-5 text-primary" />}
                            defaultOpen={currentStep === 'results'}
                            completed={true}
                        >
                            <EstimationResults
                                result={estimationResult}
                                onExportExcel={handleExportExcel}
                                onExportPDF={handleExportPDF}
                            />
                        </CollapsibleBlock>
                    )}

                </div>
            </main>

            {/* Sticky Footer */}
            <footer className="fixed bottom-0 left-0 right-0 lg:left-72 bg-card border-t shadow-lg z-50">
                <div className="container mx-auto px-4">
                    <div className="h-16 flex items-center justify-between">
                        {/* Left: Back button */}
                        <Link href={`/dashboard/developer/project/${projectId}/wizard/basic-info`}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back
                            </Button>
                        </Link>

                        {/* Center: Save status */}
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                onClick={handleSaveDraft}
                                disabled={isSaving}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                {isSaving ? (
                                    <>
                                        <span className="mr-2 animate-pulse">●</span>
                                        Saving...
                                    </>
                                ) : lastSaved ? (
                                    <>
                                        <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                                        Saved {lastSaved.toLocaleTimeString()}
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />
                                        Save Draft
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Right: Primary action */}
                        <Button
                            onClick={handleNext}
                            disabled={!estimationResult}
                            className="gradient-primary text-white btn-shine"
                        >
                            Next: Stakeholders
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </footer>

            {/* Spacer to prevent content from being hidden behind sticky footer */}
            <div className="h-20" />
        </div>
    );
}
