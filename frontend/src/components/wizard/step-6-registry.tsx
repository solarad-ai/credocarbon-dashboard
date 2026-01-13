"use client";

import { useProjectWizardStore } from "@/lib/stores/project-wizard-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FileText, UploadCloud } from "lucide-react";

export default function Step6Registry() {
    const { data } = useProjectWizardStore();

    return (
        <div className="space-y-6">
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Registry Submission Review (Section 12)</h3>
                <p className="text-sm text-muted-foreground">
                    Review your data before generating the submission package for <strong>{data.registry || "Selected Registry"}</strong>.
                </p>

                <Card className="bg-muted/50">
                    <CardContent className="pt-6 space-y-4">
                        <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-blue-500" />
                            <div className="flex-1">
                                <p className="font-medium">Project Design Document (PDD)</p>
                                <p className="text-xs text-muted-foreground">Auto-generated from Steps 1-5</p>
                            </div>
                            <Button variant="outline" size="sm">Preview</Button>
                        </div>
                        <div className="flex items-center gap-3">
                            <UploadCloud className="h-5 w-5 text-indigo-500" />
                            <div className="flex-1">
                                <p className="font-medium">Evidence Package</p>
                                <p className="text-xs text-muted-foreground">7 files attached (Maps, EIA, Permits)</p>
                            </div>
                            <Button variant="outline" size="sm">Manage</Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-md border border-yellow-200 dark:border-yellow-900">
                    <div className="flex gap-2">
                        <CheckCircle2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        <div>
                            <h4 className="font-medium text-yellow-900 dark:text-yellow-200">Ready to Submit?</h4>
                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                Once submitted, the project will enter <strong>Validation Pending</strong> status.
                                The VVB will be notified automatically.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
