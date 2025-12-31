"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import {
    ArrowLeft, ArrowRight, Save, ChevronDown, ChevronUp,
    Package, FileText, Upload, CheckCircle2, AlertCircle, Send, Download, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { projectApi } from "@/lib/api";
import { jsPDF } from "jspdf";
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from "docx";
import * as XLSX from "xlsx";

const wizardSteps = [
    { id: 1, name: "Basic Info", completed: true },
    { id: 2, name: "Generation Data", completed: true },
    { id: 3, name: "Stakeholders", completed: true },
    { id: 4, name: "Compliance", completed: true },
    { id: 5, name: "Registry Package", active: true },
    { id: 6, name: "Review & Submit", active: false },
];

interface CollapsibleBlockProps {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

function CollapsibleBlock({ title, icon, children, defaultOpen = false }: CollapsibleBlockProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <Card className="overflow-hidden">
            <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {icon}
                    </div>
                    <h3 className="font-semibold">{title}</h3>
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

interface DocumentItem {
    name: string;
    description: string;
    status: "pending" | "uploaded" | "generated";
    required: boolean;
    content?: string; // Generated document content
    filename?: string; // Filename for download
}

export default function RegistrySubmissionWizardPage() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const projectType = searchParams.get("type") || "solar";

    // Get project ID from URL params
    const rawProjectId = params?.id as string;
    const projectId = rawProjectId && rawProjectId !== 'new' ? parseInt(rawProjectId, 10) : null;

    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);

    const [documents, setDocuments] = useState<DocumentItem[]>([
        { name: "Project Design Document (PDD)", description: "Comprehensive project description following registry template", status: "pending", required: true },
        { name: "Baseline Emissions Calculation", description: "Baseline scenario and emission calculations spreadsheet", status: "pending", required: true },
        { name: "Monitoring Plan", description: "Data collection and monitoring methodology", status: "pending", required: true },
        { name: "Stakeholder Consultation Report", description: "Summary of stakeholder engagements", status: "uploaded", required: true },
        { name: "Environmental Assessment", description: "EIA or environmental screening document", status: "pending", required: false },
        { name: "Legal Documentation", description: "Permits, licenses, and land agreements", status: "pending", required: true },
        { name: "Technical Specifications", description: "Equipment specs, capacity factors, grid connection details", status: "uploaded", required: true },
        { name: "Financial Additionality Evidence", description: "Investment analysis or barrier analysis documentation", status: "pending", required: true },
    ]);

    // Load existing data on mount
    useEffect(() => {
        const loadProjectData = async () => {
            if (!projectId) return;
            try {
                const project = await projectApi.getById(projectId);
                if (project.wizard_data?.registrySubmission?.documents) {
                    setDocuments(project.wizard_data.registrySubmission.documents);
                }
            } catch (error) {
                console.error("Error loading project data:", error);
            }
        };
        loadProjectData();
    }, [projectId]);

    // Save draft to database
    const saveDraftToStorage = useCallback(async () => {
        if (!projectId) {
            console.log("No project ID, cannot save draft");
            return;
        }

        try {
            const apiData = {
                wizard_step: "registry-submission",
                wizard_data: {
                    registrySubmission: {
                        documents,
                    },
                },
            };

            await projectApi.update(projectId, apiData);
            setLastSaved(new Date());
        } catch (error) {
            console.error("Error saving draft:", error);
        }
    }, [documents, projectId]);

    const handleSaveDraft = async () => {
        setIsSaving(true);
        await saveDraftToStorage();
        setIsSaving(false);
    };

    const handleGeneratePackage = async () => {
        setIsGenerating(true);
        await new Promise(resolve => setTimeout(resolve, 2500));

        // Generate sample document content
        const projectName = `Project ${projectId || 'New'}`;
        const currentDate = new Date().toLocaleDateString();

        setDocuments(prev => prev.map(doc => {
            // Generate content for documents that don't have it (both pending and uploaded)
            if (!doc.content) {
                let content = '';
                let filename = '';

                switch (doc.name) {
                    case "Project Design Document (PDD)":
                        filename = 'VCS_PDD_Template.pdf';
                        content = `VERRA VCS PROJECT DESIGN DOCUMENT (PDD)
VCS Version 4.4
${'='.repeat(70)}

Document prepared in accordance with VCS Standard v4.4 and VCS Program Guide

PROJECT DETAILS
${'─'.repeat(70)}
Project Title:              ${projectName}
Project ID:                 VCS-[To be assigned]
Sectoral Scope:             1 - Energy (renewable/non-renewable sources)
Project Type:               Grid-connected renewable electricity generation
Project Scale:              Large Project
AFOLU Project Category:     N/A
Estimated Annual ERs:       [From estimation] tCO2e/year
Crediting Period:           [Start Date] to [End Date] (7 years, renewable)
Document Version:           1.0
Date:                       ${currentDate}

1. PROJECT DESCRIPTION
${'─'.repeat(70)}

1.1 General Description
The project activity involves the installation and operation of a grid-connected 
solar photovoltaic (PV) power plant. The electricity generated displaces 
grid electricity that would otherwise be generated by fossil fuel-based power 
plants, thereby reducing greenhouse gas emissions.

1.2 Project Location
Country:                    [Country]
State/Province:             [State]
District:                   [District]
Coordinates:                [Latitude], [Longitude]

1.3 Project Proponent
Organization:               [Project Developer Name]
Contact Person:             [Name]
Address:                    [Full Address]
Email:                      [Email]

1.4 Other Entities
Validation/Verification Body: [VVB Name]
Technical Consultant:        CredoCarbon Platform

2. APPLICABILITY OF METHODOLOGY
${'─'.repeat(70)}

2.1 Methodology Applied
Title:                      Grid-connected electricity generation from renewable sources
Methodology ID:             AMS-I.D / VM0038
Version:                    [Latest Version]
Scope Applicability:        Project connects renewable generating equipment to an 
                            electricity grid

2.2 Project Boundary
The spatial extent of the project boundary encompasses:
- The solar PV power plant including all generating equipment
- The grid connection point (point of interconnection)
- Associated transmission infrastructure up to grid delivery point

2.3 Baseline Scenario
The baseline scenario is electricity delivered to the grid by the project 
activity that would otherwise be generated by the operation of grid-connected 
power plants and by the addition of new generation sources.

3. ADDITIONALITY
${'─'.repeat(70)}

3.1 Additionality Approach
The project demonstrates additionality through investment analysis showing 
that the project would not be financially viable without carbon credit revenue.

3.2 Investment Analysis Summary
- Project IRR without carbon credits: [X]%
- Benchmark IRR: 12% (country/sector standard)
- Project is financially additional as IRR < Benchmark without carbon revenue

3.3 Barrier Analysis (Supplementary)
- Investment barriers: High upfront capital costs
- Technological barriers: Limited local expertise
- Institutional barriers: Complex permitting requirements

4. QUANTIFICATION OF GHG EMISSION REDUCTIONS
${'─'.repeat(70)}

4.1 Baseline Emissions
BE = EG × EF_grid × (1 - TDL)
Where:
- EG = Electricity generated and delivered to the grid (MWh)
- EF_grid = Grid emission factor (tCO2/MWh)
- TDL = Transmission and distribution losses (%)

4.2 Project Emissions
PE = 0 (No direct emissions from solar PV operation)

4.3 Leakage
L = 0 (No significant leakage identified for grid-connected RE)

4.4 Net Emission Reductions
ER = BE - PE - L

5. MONITORING
${'─'.repeat(70)}

5.1 Data and Parameters Monitored
- Electricity delivered to grid (MWh) - Continuously metered
- Operating hours - Data logger
- Equipment availability - O&M records

5.2 Monitoring Equipment
- ABB/Schneider class 0.5s revenue-grade energy meters
- SCADA system with remote data access
- Calibration per manufacturer specifications

6. ENVIRONMENTAL AND SOCIAL SAFEGUARDS
${'─'.repeat(70)}

6.1 Stakeholder Consultation
Local stakeholder consultations conducted per VCS requirements.

6.2 Environmental Impact
EIA/Environmental screening completed. No significant adverse impacts identified.

6.3 FPIC (if applicable)
N/A - No indigenous peoples affected

${'─'.repeat(70)}
DOCUMENT HISTORY
Version 1.0 - ${currentDate} - Initial draft

Generated by CredoCarbon Platform
This document template follows Verra VCS Standard v4.4 requirements`;
                        break;
                    case "Baseline Emissions Calculation":
                        filename = 'Baseline_Calculations.xlsx';
                        content = `Baseline Emissions Calculation Spreadsheet\nGenerated: ${currentDate}\n\nParameter,Value,Unit,Source\nGrid Emission Factor,0.85,tCO2/MWh,CEA India 2023\nAnnual Generation,5000,MWh,Estimated\nBaseline Emissions,4250,tCO2e,Calculated\nProject Emissions,0,tCO2e,Zero for RE\nLeakage,0,tCO2e,Not applicable\nNet Emission Reductions,4250,tCO2e,Calculated\n\nMethodology: CDM AMS-I.D\nCalculation: BE = EG × EF_grid\nwhere:\nBE = Baseline Emissions\nEG = Electricity Generated\nEF_grid = Grid Emission Factor`;
                        break;
                    case "Monitoring Plan":
                        filename = 'Monitoring_Plan.docx';
                        content = `MONITORING PLAN\n${'='.repeat(50)}\n\nProject: ${projectName}\nDate: ${currentDate}\n\n1. MONITORING PARAMETERS\n${'-'.repeat(30)}\n- Electricity generated (MWh) - Metered\n- Operating hours - Logged\n- Equipment availability - Recorded\n\n2. MONITORING EQUIPMENT\n${'-'.repeat(30)}\n- Revenue-grade electricity meters\n- Data loggers with remote access\n- Calibration certificates maintained\n\n3. DATA COLLECTION FREQUENCY\n${'-'.repeat(30)}\n- Generation data: Hourly\n- Meter readings: Daily\n- Calibration: Annual\n\n4. QUALITY ASSURANCE\n${'-'.repeat(30)}\n- Cross-verification with grid invoices\n- Regular meter calibration\n- Data backup procedures\n\n5. RESPONSIBILITIES\n${'-'.repeat(30)}\n- Plant Manager: Data collection\n- QA Officer: Data verification\n- Project Developer: Reporting`;
                        break;
                    case "Stakeholder Consultation Report":
                        filename = 'Stakeholder_Report.docx';
                        content = `STAKEHOLDER CONSULTATION REPORT\n${'='.repeat(50)}\n\nProject: ${projectName}\nDate: ${currentDate}\n\n1. CONSULTATION SUMMARY\n${'-'.repeat(30)}\nTotal Stakeholders Consulted: 5\nConsultation Period: [Date range]\n\n2. STAKEHOLDER GROUPS\n${'-'.repeat(30)}\n- Local Community Representatives\n- Government Authorities\n- Environmental NGOs\n- Landowners\n- Grid Operator\n\n3. KEY FINDINGS\n${'-'.repeat(30)}\n- Community support for renewable energy project\n- No displacement of local populations\n- Employment opportunities welcomed\n- Environmental concerns addressed\n\n4. GRIEVANCE MECHANISM\n${'-'.repeat(30)}\nContact: grievance@project.com\nResponse Time: 15 working days`;
                        break;
                    case "Environmental Assessment":
                        filename = 'Environmental_Assessment.pdf';
                        content = `ENVIRONMENTAL IMPACT ASSESSMENT SUMMARY\n${'='.repeat(50)}\n\nProject: ${projectName}\nDate: ${currentDate}\n\n1. ASSESSMENT CONCLUSION\n${'-'.repeat(30)}\nOverall Impact: LOW - No significant adverse impacts\n\n2. BIODIVERSITY\n${'-'.repeat(30)}\n- No critical habitats affected\n- No endangered species present\n- Mitigation measures in place\n\n3. WATER RESOURCES\n${'-'.repeat(30)}\n- Minimal water usage for cleaning\n- No impact on local water bodies\n\n4. AIR QUALITY\n${'-'.repeat(30)}\n- Net positive impact (displaces fossil fuels)\n- No emissions during operation\n\n5. LAND USE\n${'-'.repeat(30)}\n- Previously degraded/barren land\n- No agricultural displacement`;
                        break;
                    case "Legal Documentation":
                        filename = 'Legal_Documentation.pdf';
                        content = `LEGAL DOCUMENTATION SUMMARY\n${'='.repeat(50)}\n\nProject: ${projectName}\nDate: ${currentDate}\n\n1. PERMITS & LICENSES\n${'-'.repeat(30)}\n✓ Land Use Permission\n✓ Grid Connection Agreement\n✓ Power Purchase Agreement\n✓ Environmental Clearance\n✓ Building Permits\n\n2. LAND RIGHTS\n${'-'.repeat(30)}\nType: [Lease/Ownership]\nDuration: 25 years\nRegistered: [Registration number]\n\n3. PPA DETAILS\n${'-'.repeat(30)}\nOfftaker: [Utility name]\nTariff: [Rate] per kWh\nTenure: 25 years`;
                        break;
                    case "Technical Specifications":
                        filename = 'Technical_Specifications.xlsx';
                        content = `TECHNICAL SPECIFICATIONS\n${'='.repeat(50)}\n\nProject: ${projectName}\nDate: ${currentDate}\n\n1. PLANT CONFIGURATION\n${'-'.repeat(30)}\nTechnology: Crystalline Silicon PV\nInstalled Capacity: [X] MWp\nPlant Area: [X] hectares\n\n2. EQUIPMENT\n${'-'.repeat(30)}\nPV Modules: [Brand/Model]\nInverters: [Brand/Model]\nMounting: Fixed-tilt ground mount\n\n3. GRID CONNECTION\n${'-'.repeat(30)}\nVoltage Level: [X] kV\nEvacuation Capacity: [X] MW\nMetering: Bi-directional\n\n4. PERFORMANCE\n${'-'.repeat(30)}\nCapacity Factor: ~20%\nPerformance Ratio: 80%\nDegradation: 0.5%/year\n\n5. ANNUAL GENERATION\n${'-'.repeat(30)}\nP50 Estimate: [X] MWh/year\nP90 Estimate: [X] MWh/year`;
                        break;
                    case "Financial Additionality Evidence":
                        filename = 'Financial_Additionality.pdf';
                        content = `FINANCIAL ADDITIONALITY ANALYSIS\n${'='.repeat(50)}\n\nProject: ${projectName}\nDate: ${currentDate}\n\n1. ADDITIONALITY DEMONSTRATION\n${'-'.repeat(30)}\nApproach: Investment Analysis\n\n2. PROJECT IRR WITHOUT CARBON\n${'-'.repeat(30)}\nEquity IRR: [X]%\nBenchmark: 12%\nResult: Below benchmark - NOT VIABLE\n\n3. PROJECT IRR WITH CARBON\n${'-'.repeat(30)}\nCarbon Price Assumed: $15/tCO2e\nEquity IRR: [X]%\nResult: Above benchmark - VIABLE\n\n4. CONCLUSION\n${'-'.repeat(30)}\nThe project demonstrates financial additionality\nas it would not be economically viable without\ncarbon credit revenue.\n\n5. BARRIER ANALYSIS (SUPPLEMENTARY)\n${'-'.repeat(30)}\n- Investment barriers: High upfront costs\n- Technology barriers: First-of-kind in region\n- Institutional barriers: Complex permitting`;
                        break;
                    default:
                        filename = 'Document.pdf';
                        content = `Document: ${doc.name}\nGenerated: ${currentDate}\n\nContent pending...`;
                }

                return {
                    ...doc,
                    status: doc.status === "uploaded" ? "uploaded" : "generated" as const,
                    content,
                    filename
                };
            }
            return doc;
        }));

        setIsGenerating(false);
        saveDraftToStorage(); // Save after generating
    };

    const handleDownload = async (doc: DocumentItem) => {
        if (!doc.content || !doc.filename) {
            alert('Document content not available. Please generate documents first.');
            return;
        }

        const extension = doc.filename.split('.').pop()?.toLowerCase();

        try {
            if (extension === 'pdf') {
                // Generate actual PDF using jsPDF
                const pdf = new jsPDF();
                const lines = doc.content.split('\n');
                let y = 20;
                const pageHeight = pdf.internal.pageSize.height;

                lines.forEach((line) => {
                    if (y > pageHeight - 20) {
                        pdf.addPage();
                        y = 20;
                    }

                    // Check if it's a header line (contains only = or -)
                    if (line.match(/^[=-]+$/)) {
                        pdf.setDrawColor(0);
                        pdf.line(15, y, 195, y);
                        y += 5;
                    } else if (line.startsWith('VERRA') || line.startsWith('PROJECT') || line.match(/^\d+\./)) {
                        pdf.setFontSize(12);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text(line, 15, y);
                        y += 7;
                    } else {
                        pdf.setFontSize(10);
                        pdf.setFont('helvetica', 'normal');
                        pdf.text(line, 15, y);
                        y += 5;
                    }
                });

                pdf.save(doc.filename);

            } else if (extension === 'docx') {
                // Generate actual DOCX using docx library
                const paragraphs: Paragraph[] = [];
                const lines = doc.content.split('\n');

                lines.forEach((line) => {
                    if (line.match(/^[=-]+$/)) {
                        // Skip separator lines
                    } else if (line.startsWith('VERRA') || line.startsWith('PROJECT') || line.startsWith('MONITORING') || line.startsWith('STAKEHOLDER')) {
                        paragraphs.push(new Paragraph({
                            text: line,
                            heading: HeadingLevel.HEADING_1,
                            spacing: { before: 400, after: 200 }
                        }));
                    } else if (line.match(/^\d+\./)) {
                        paragraphs.push(new Paragraph({
                            text: line,
                            heading: HeadingLevel.HEADING_2,
                            spacing: { before: 300, after: 100 }
                        }));
                    } else if (line.startsWith('-')) {
                        paragraphs.push(new Paragraph({
                            text: line.substring(1).trim(),
                            bullet: { level: 0 },
                            spacing: { before: 50, after: 50 }
                        }));
                    } else if (line.trim()) {
                        paragraphs.push(new Paragraph({
                            text: line,
                            spacing: { before: 50, after: 50 }
                        }));
                    }
                });

                const docxDoc = new Document({
                    sections: [{
                        properties: {},
                        children: paragraphs
                    }]
                });

                const blob = await Packer.toBlob(docxDoc);
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = doc.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

            } else if (extension === 'xlsx' || extension === 'csv') {
                // Generate actual XLSX using xlsx library
                const lines = doc.content.split('\n').filter(l => l.trim());
                const data: string[][] = [];

                lines.forEach((line) => {
                    if (line.includes(',')) {
                        // CSV-like data
                        data.push(line.split(',').map(s => s.trim()));
                    } else if (line.includes(':')) {
                        // Key-value pair
                        const [key, ...valueParts] = line.split(':');
                        data.push([key.trim(), valueParts.join(':').trim()]);
                    } else {
                        data.push([line]);
                    }
                });

                const ws = XLSX.utils.aoa_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, 'Document');

                // Set column widths
                ws['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 15 }, { wch: 20 }];

                XLSX.writeFile(wb, doc.filename.replace('.csv', '.xlsx'));

            } else {
                // Fallback for txt files
                const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = doc.filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error generating document:', error);
            // Fallback to text download
            const blob = new Blob([doc.content], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = doc.filename.replace(/\.(pdf|docx|xlsx)$/, '.txt');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const handleSubmit = async () => {
        // Save draft and update status to SUBMITTED_TO_VVB
        if (projectId) {
            try {
                await projectApi.update(projectId, {
                    status: 'SUBMITTED_TO_VVB',
                    wizard_step: 'registry-submission',
                    wizard_data: {
                        ...documents.reduce((acc, doc) => ({ ...acc }), {}),
                        registrySubmission: { documents }
                    }
                });
            } catch (error) {
                console.error('Failed to update project status:', error);
            }
        }
        router.push("/dashboard/developer/projects");
    };


    const uploadedCount = documents.filter(d => d.status !== "pending").length;
    const requiredCount = documents.filter(d => d.required).length;
    const requiredComplete = documents.filter(d => d.required && d.status !== "pending").length;

    const getStatusBadge = (status: DocumentItem["status"]) => {
        switch (status) {
            case "uploaded":
                return <Badge className="bg-green-100 text-green-700">Uploaded</Badge>;
            case "generated":
                return <Badge className="bg-blue-100 text-blue-700">Generated</Badge>;
            default:
                return <Badge variant="secondary">Pending</Badge>;
        }
    };

    return (
        <div className="min-h-screen bg-muted/30">
            {/* Header */}
            <header className="bg-card border-b">
                <div className="container mx-auto px-4">
                    <div className="h-16 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard/developer/project/new/wizard/compliance">
                                <Button variant="ghost" size="icon">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="font-semibold">Registry Submission Package</h1>
                                <p className="text-sm text-muted-foreground">Step 5 of 6</p>
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
                                        step.id === 5
                                            ? "bg-primary text-primary-foreground"
                                            : step.id < 5
                                                ? "bg-primary/20 text-primary"
                                                : "bg-muted text-muted-foreground"
                                    )}>
                                        <span className={cn(
                                            "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                                            step.id === 5 ? "bg-white/20" : "bg-transparent border border-current"
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

                    {/* Progress Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <FileText className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{uploadedCount}/{documents.length}</p>
                                        <p className="text-sm text-muted-foreground">Documents Ready</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{requiredComplete}/{requiredCount}</p>
                                        <p className="text-sm text-muted-foreground">Required Complete</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                                        <Package className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">Verra VCS</p>
                                        <p className="text-sm text-muted-foreground">Target Registry</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Document Checklist */}
                    <CollapsibleBlock
                        title="Required Documents"
                        icon={<FileText className="h-5 w-5 text-primary" />}
                        defaultOpen={true}
                    >
                        <div className="space-y-3">
                            {documents.map((doc, index) => (
                                <div
                                    key={index}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-lg border",
                                        doc.status !== "pending" ? "bg-muted/30" : ""
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-10 h-10 rounded-lg flex items-center justify-center",
                                            doc.status !== "pending" ? "bg-green-100" : "bg-muted"
                                        )}>
                                            {doc.status !== "pending" ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                            ) : (
                                                <FileText className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium flex items-center gap-2">
                                                {doc.name}
                                                {doc.required && <span className="text-destructive">*</span>}
                                            </p>
                                            <p className="text-sm text-muted-foreground">{doc.description}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {getStatusBadge(doc.status)}
                                        {doc.status === "pending" ? (
                                            <Button variant="outline" size="sm">
                                                <Upload className="h-4 w-4 mr-1" />
                                                Upload
                                            </Button>
                                        ) : (
                                            <Button variant="ghost" size="sm" onClick={() => handleDownload(doc)}>
                                                <Download className="h-4 w-4 mr-1" />
                                                Download
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CollapsibleBlock>

                    {/* Auto-Generate */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5 text-primary" />
                                Auto-Generate Documents
                            </CardTitle>
                            <CardDescription>
                                CredoCarbon can automatically generate PDD sections, calculation spreadsheets, and monitoring templates
                                based on the data you've provided.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleGeneratePackage}
                                disabled={isGenerating}
                                className="gradient-primary text-white"
                            >
                                {isGenerating ? (
                                    <>Generating Documents...</>
                                ) : (
                                    <>
                                        <Package className="mr-2 h-4 w-4" />
                                        Generate Missing Documents
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Submission Notice */}
                    <Card className="bg-amber-50/50 border-amber-100">
                        <CardContent className="pt-6">
                            <div className="flex gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-amber-900">Before Submitting</h4>
                                    <ul className="text-sm text-amber-700 mt-2 space-y-1">
                                        <li>• Review all documents for accuracy and completeness</li>
                                        <li>• Ensure all required stakeholder consultations are documented</li>
                                        <li>• Confirm the VVB has been identified for validation</li>
                                        <li>• Registry fees will be due upon formal submission</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </main>

            {/* Sticky Footer */}
            <footer className="fixed bottom-0 left-0 right-0 lg:left-72 bg-card border-t shadow-lg z-50">
                <div className="container mx-auto px-4">
                    <div className="h-16 flex items-center justify-between">
                        {/* Left: Back button */}
                        <Link href={`/dashboard/developer/project/${projectId}/wizard/compliance`}>
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
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
                            onClick={handleSubmit}
                            className="gradient-primary text-white btn-shine"
                        >
                            <Send className="mr-2 h-4 w-4" />
                            Submit to Registry
                        </Button>
                    </div>
                </div>
            </footer>

            {/* Spacer to prevent content from being hidden behind sticky footer */}
            <div className="h-20" />
        </div>
    );
}
