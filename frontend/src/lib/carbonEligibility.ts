"use client";

// Carbon Credit Eligibility Assessment Utility
// Based on Hard Fail Checks and Soft Signal Scoring

export interface ProjectEligibilityData {
    // From existing fields
    installedCapacityDC?: string;
    installedCapacityAC?: string;
    installedCapacity?: string;
    ppaDuration?: string;
    offtakeType?: string;
    creditingPeriodStart?: string;

    // New eligibility fields
    commissioningDate?: string;
    offtakerType?: string; // 'GOVERNMENT' | 'UTILITY' | 'PRIVATE' | 'OTHER'
    isPolicyDriven?: boolean;
    carbonRegistrationIntent?: string; // 'BEFORE_COMMISSIONING' | 'WITHIN_2_YEARS' | 'AFTER_2_YEARS' | 'NOT_DECIDED'
    additionalityJustification?: string;
    hostCountryArticle6Status?: string; // 'CLEAR' | 'AMBIGUOUS' | 'HIGH_RISK'
    isMerchant?: boolean;
    merchantPercentage?: number;
    carbonRevenueMaterial?: boolean;
}

export interface HardFailResult {
    id: string;
    condition: string;
    triggered: boolean;
    reason?: string;
}

export interface SoftSignalResult {
    id: string;
    signal: string;
    present: boolean;
    points: number;
}

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NOT_RECOMMENDED';

export interface EligibilityResult {
    isEligible: boolean;
    hardFailTriggered: boolean;
    hardFailReasons: HardFailResult[];
    softSignals: SoftSignalResult[];
    confidenceLevel: ConfidenceLevel;
    confidenceScore: number; // 0-100
    recommendation: string;
    riskWarnings: string[];
}

const HARD_FAIL_CONDITIONS = [
    {
        id: 'utility_scale',
        condition: 'Project is utility-scale grid-connected renewable (typically >50 MW)',
        check: (data: ProjectEligibilityData): boolean => {
            const capacity = parseFloat(data.installedCapacityDC || data.installedCapacityAC || data.installedCapacity || '0');
            return capacity > 50;
        },
        reason: 'Project capacity exceeds 50 MW threshold for utility-scale projects.'
    },
    {
        id: 'long_term_ppa',
        condition: 'Project has a long-term Power Purchase Agreement (PPA)',
        check: (data: ProjectEligibilityData): boolean => {
            const hasPPA = data.offtakeType === 'PPA';
            const ppaDuration = parseFloat(data.ppaDuration || '0');
            return hasPPA && ppaDuration >= 10; // 10+ years considered long-term
        },
        reason: 'Project has a long-term PPA (10+ years), which typically indicates financial viability without carbon revenue.'
    },
    {
        id: 'government_offtaker',
        condition: 'Offtaker is a government entity or regulated utility',
        check: (data: ProjectEligibilityData): boolean => {
            return data.offtakerType === 'GOVERNMENT' || data.offtakerType === 'UTILITY';
        },
        reason: 'Government or regulated utility offtakers typically provide guaranteed revenue streams.'
    },
    {
        id: 'policy_driven',
        condition: 'Project is part of a policy-driven renewable program, auction, or mandate',
        check: (data: ProjectEligibilityData): boolean => {
            return data.isPolicyDriven === true;
        },
        reason: 'Policy-driven projects face significant additionality challenges.'
    },
    {
        id: 'commissioning_before_intent',
        condition: 'Project commissioning occurred before carbon registration intent',
        check: (data: ProjectEligibilityData): boolean => {
            if (!data.commissioningDate || !data.carbonRegistrationIntent) return false;
            return data.carbonRegistrationIntent === 'AFTER_2_YEARS';
        },
        reason: 'Carbon registration intent documented more than 2 years after commissioning.'
    },
    {
        id: 'retroactive_registration',
        condition: 'Carbon crediting would require retroactive registration',
        check: (data: ProjectEligibilityData): boolean => {
            if (!data.commissioningDate || !data.creditingPeriodStart) return false;
            const commissioning = new Date(data.commissioningDate);
            const crediting = new Date(data.creditingPeriodStart);
            const diffYears = (crediting.getTime() - commissioning.getTime()) / (1000 * 60 * 60 * 24 * 365);
            return diffYears > 2; // More than 2 years gap
        },
        reason: 'Significant gap between commissioning and crediting period suggests retroactive registration.'
    },
    {
        id: 'no_additionality',
        condition: 'No documented financial, regulatory, or barrier additionality',
        check: (data: ProjectEligibilityData): boolean => {
            const justification = data.additionalityJustification?.trim() || '';
            return justification.length < 50; // Needs substantial justification
        },
        reason: 'Insufficient additionality documentation provided.'
    },
    {
        id: 'article_6_risk',
        condition: 'High risk of double counting or Article 6 ambiguity in host country',
        check: (data: ProjectEligibilityData): boolean => {
            return data.hostCountryArticle6Status === 'HIGH_RISK';
        },
        reason: 'Host country has high risk of double counting under Article 6.'
    }
];

const SOFT_SIGNALS = [
    {
        id: 'merchant_project',
        signal: 'Project is merchant or partially merchant (no guaranteed offtake)',
        check: (data: ProjectEligibilityData): boolean => {
            return data.offtakeType === 'MERCHANT' || data.isMerchant === true;
        },
        points: 20
    },
    {
        id: 'carbon_revenue_material',
        signal: 'Carbon revenue is material to project IRR or viability',
        check: (data: ProjectEligibilityData): boolean => {
            return data.carbonRevenueMaterial === true;
        },
        points: 25
    },
    {
        id: 'below_policy_threshold',
        signal: 'Project size is below policy-driven thresholds',
        check: (data: ProjectEligibilityData): boolean => {
            const capacity = parseFloat(data.installedCapacityDC || data.installedCapacityAC || data.installedCapacity || '0');
            return capacity <= 25; // Below 25 MW is often below mandate thresholds
        },
        points: 15
    },
    {
        id: 'host_country_precedent',
        signal: 'Host country has precedent voluntary carbon registrations',
        check: (data: ProjectEligibilityData): boolean => {
            return data.hostCountryArticle6Status === 'CLEAR';
        },
        points: 20
    },
    {
        id: 'ex_ante_registration',
        signal: 'Ex-ante registration is possible',
        check: (data: ProjectEligibilityData): boolean => {
            return data.carbonRegistrationIntent === 'BEFORE_COMMISSIONING' ||
                data.carbonRegistrationIntent === 'WITHIN_2_YEARS';
        },
        points: 20
    }
];

export function evaluateEligibility(data: ProjectEligibilityData): EligibilityResult {
    // Evaluate Hard Fail conditions
    const hardFailResults: HardFailResult[] = HARD_FAIL_CONDITIONS.map(condition => ({
        id: condition.id,
        condition: condition.condition,
        triggered: condition.check(data),
        reason: condition.check(data) ? condition.reason : undefined
    }));

    const hardFailTriggered = hardFailResults.some(r => r.triggered);
    const triggeredFails = hardFailResults.filter(r => r.triggered);

    // If hard fail triggered, return immediately
    if (hardFailTriggered) {
        return {
            isEligible: false,
            hardFailTriggered: true,
            hardFailReasons: hardFailResults,
            softSignals: [],
            confidenceLevel: 'NOT_RECOMMENDED',
            confidenceScore: 0,
            recommendation: 'Carbon Credits: High Risk / Not Recommended',
            riskWarnings: triggeredFails.map(f => f.reason || f.condition)
        };
    }

    // Evaluate Soft Signals
    const softSignalResults: SoftSignalResult[] = SOFT_SIGNALS.map(signal => ({
        id: signal.id,
        signal: signal.signal,
        present: signal.check(data),
        points: signal.check(data) ? signal.points : 0
    }));

    const totalPoints = softSignalResults.reduce((sum, s) => sum + s.points, 0);
    const maxPoints = SOFT_SIGNALS.reduce((sum, s) => sum + s.points, 0);
    const confidenceScore = Math.round((totalPoints / maxPoints) * 100);

    let confidenceLevel: ConfidenceLevel;
    let recommendation: string;

    if (confidenceScore >= 70) {
        confidenceLevel = 'HIGH';
        recommendation = 'Carbon Credits: High Confidence - Proceed with registration';
    } else if (confidenceScore >= 40) {
        confidenceLevel = 'MEDIUM';
        recommendation = 'Carbon Credits: Medium Confidence - Additional review recommended';
    } else {
        confidenceLevel = 'LOW';
        recommendation = 'Carbon Credits: Low Confidence - Significant additionality concerns';
    }

    const riskWarnings: string[] = [];
    if (confidenceScore < 40) {
        riskWarnings.push('Limited soft signals present - additionality may be questioned during validation.');
    }

    return {
        isEligible: true,
        hardFailTriggered: false,
        hardFailReasons: hardFailResults,
        softSignals: softSignalResults,
        confidenceLevel,
        confidenceScore,
        recommendation,
        riskWarnings
    };
}

// Export condition lists for UI display
export const HARD_FAIL_CONDITION_LIST = HARD_FAIL_CONDITIONS.map(c => ({
    id: c.id,
    condition: c.condition
}));

export const SOFT_SIGNAL_LIST = SOFT_SIGNALS.map(s => ({
    id: s.id,
    signal: s.signal,
    maxPoints: s.points
}));
