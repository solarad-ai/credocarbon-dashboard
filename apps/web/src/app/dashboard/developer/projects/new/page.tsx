"use client";

import { useProjectWizardStore } from "@/lib/stores/project-wizard-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import Step1Type from "@/components/wizard/step-1-type";
import Step2Basic from "@/components/wizard/step-2-basic";
import Step3Technical from "@/components/wizard/step-3-technical";
import Step4Stakeholders from "@/components/wizard/step-4-stakeholders";
import Step5Compliance from "@/components/wizard/step-5-compliance";
import Step6Registry from "@/components/wizard/step-6-registry";
import { useRouter } from "next/navigation";
import { useState } from "react";
// ...

export default function NewProjectWizard() {
    const { step, setStep, data } = useProjectWizardStore();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const totalSteps = 6;
    const progress = (step / totalSteps) * 100;

    const handleNext = () => {
        if (step < totalSteps) setStep(step + 1);
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // TODO: Replace with real API call
            console.log("Submitting Project Data:", data);

            // Get token from storage (crude but works for now)
            // In a real app, use a proper AuthContext
            const token = localStorage.getItem("token"); // We haven't set this yet! Need to set in Login

            // Mock token if missing for demo dev flow
            const authHeader = token ? `Bearer ${token}` : "";

            const response = await fetch("https://credocarbon-api-641001192587.asia-south2.run.app/api/projects", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": authHeader
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) throw new Error("Submission failed");

            router.push("/dashboard/developer/projects");
        } catch (error) {
            console.error(error);
            alert("Failed to create project. See console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8">
            <div className="mb-8 space-y-2">
                <h1 className="text-3xl font-bold">New Project Setup</h1>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Step {step} of {totalSteps}</span>
                    <span>{Math.round(progress)}% Completed</span>
                </div>
                <Progress value={progress} className="h-2" />
            </div>

            <div className="min-h-[400px]">
                {step === 1 && <Step1Type />}
                {step === 2 && <Step2Basic />}
                {step === 3 && <Step3Technical />}
                {step === 4 && <Step4Stakeholders />}
                {step === 5 && <Step5Compliance />}
                {step === 6 && <Step6Registry />}
            </div>

            <div className="flex justify-between mt-8">
                <Button variant="outline" onClick={handleBack} disabled={step === 1}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                {step < totalSteps ? (
                    <Button onClick={handleNext}>
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Project"}
                    </Button>
                )}
            </div>
        </div>
    );
}
