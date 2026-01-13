import { create } from 'zustand';

export interface ProjectWizardState {
    step: number;
    data: {
        // Step 1: Type Selection
        projectType: string;
        registry: string;
        methodology: string;

        // Step 2: Basic Info (Section 8)
        name: string;
        projectID: string; // from registry
        location: {
            country: string;
            region: string;
            coordinates: string;
        };
        description: string;
        startDate: string;
        creditingPeriodStart: string;
        creditingPeriodEnd: string;

        // Step 3: Technical Data (Section 9)
        installedCapacity: string; // Dynamic
        estimatedGeneration: string; // Dynamic
    };
    setStep: (step: number) => void;
    updateData: (data: Partial<ProjectWizardState['data']>) => void;
    reset: () => void;
}

export const useProjectWizardStore = create<ProjectWizardState>((set) => ({
    step: 1,
    data: {
        projectType: "",
        registry: "",
        methodology: "",
        name: "",
        projectID: "",
        location: { country: "", region: "", coordinates: "" },
        description: "",
        startDate: "",
        creditingPeriodStart: "",
        creditingPeriodEnd: "",
        installedCapacity: "",
        estimatedGeneration: "",
    },
    setStep: (step) => set({ step }),
    updateData: (newData) => set((state) => ({ data: { ...state.data, ...newData } })),
    reset: () => set({ step: 1, data: {} as any }),
}));
