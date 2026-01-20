"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Crown, Mail, Phone, MessageSquare, Building2, Leaf, Sun, Factory } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PricingPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setSubmitted(true);
        setIsSubmitting(false);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className="border-b border-slate-700/50">
                <div className="container mx-auto px-4 h-16 flex items-center">
                    <Link href="/">
                        <Button variant="ghost" className="text-slate-300 hover:text-white">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Home
                        </Button>
                    </Link>
                </div>
            </header>

            <main className="container mx-auto px-4 py-12">
                {/* Title */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1 rounded-full text-sm mb-4">
                        <Crown className="h-4 w-4" />
                        Pricing
                    </div>
                    <h1 className="text-4xl font-bold text-white mb-4">
                        Transparent, Milestone-Based Pricing
                    </h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Professional execution supported by structured digital workflows. Fees are milestone-based and aligned with delivery stages.
                    </p>
                </div>

                {/* Pricing Tabs */}
                <Tabs defaultValue="analysis" className="mb-16">
                    <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-5 bg-slate-800/50 mb-8">
                        <TabsTrigger value="analysis">Analysis</TabsTrigger>
                        <TabsTrigger value="buyers">Buyers</TabsTrigger>
                        <TabsTrigger value="developers">Developers</TabsTrigger>
                        <TabsTrigger value="recs">RECs</TabsTrigger>
                        <TabsTrigger value="compliance">Compliance</TabsTrigger>
                    </TabsList>

                    {/* Free Analysis */}
                    <TabsContent value="analysis">
                        <div className="max-w-lg mx-auto">
                            <Card className="bg-slate-800/50 border-slate-700">
                                <CardHeader className="text-center">
                                    <CardTitle className="text-white text-2xl">Free Analysis</CardTitle>
                                    <div className="text-4xl font-bold text-emerald-400 mt-2">$0</div>
                                    <CardDescription className="text-slate-400">
                                        Evaluate feasibility before committing to registration
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {[
                                            "Digital analysis workspace",
                                            "Feasibility and revenue modelling",
                                            "Indicative credit volumes and timelines",
                                            "Registry, methodology, or scheme fit assessment",
                                            "High-level risk indicators",
                                        ].map((feature, i) => (
                                            <li key={i} className="flex items-center gap-2 text-slate-300">
                                                <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    <Button className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700">
                                        Get Started Free
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Buyers */}
                    <TabsContent value="buyers">
                        <div className="max-w-2xl mx-auto">
                            <Card className="bg-slate-800/50 border-slate-700">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                            <Building2 className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-white">Buyers (Corporates & Traders)</CardTitle>
                                            <CardDescription className="text-slate-400">
                                                Execution-based fees on completed transactions
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                        <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                                            <div className="text-sm text-slate-400 mb-1">Volume &lt; $1M</div>
                                            <div className="text-2xl font-bold text-white">From 2.5%</div>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                                            <div className="text-sm text-slate-400 mb-1">Volume $1M – $5M</div>
                                            <div className="text-2xl font-bold text-white">1.5% – 2.0%</div>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-4 text-center">
                                            <div className="text-sm text-slate-400 mb-1">Volume &gt; $5M</div>
                                            <div className="text-2xl font-bold text-white">1.0% – 1.5%</div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400 mb-4">
                                        <strong className="text-white">Minimum Execution Fee:</strong> $25,000 per transaction
                                    </p>
                                    <h4 className="text-white font-semibold mb-2">Included Services:</h4>
                                    <ul className="space-y-2 text-slate-300 text-sm">
                                        {[
                                            "Curated supply sourcing",
                                            "Due diligence & eligibility screening",
                                            "Documentation review",
                                            "Counterparty/registry coordination",
                                            "Settlement support",
                                        ].map((s, i) => (
                                            <li key={i} className="flex items-center gap-2">
                                                <Check className="h-4 w-4 text-blue-400" />
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Developers */}
                    <TabsContent value="developers">
                        <div className="max-w-4xl mx-auto space-y-6">
                            <Card className="bg-slate-800/50 border-slate-700">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                            <Leaf className="h-6 w-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-white">Voluntary Carbon Projects — Developers</CardTitle>
                                            <CardDescription className="text-slate-400">
                                                Project registration, MRV, and issuance services
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <h4 className="text-white font-semibold mb-4">Project Registration & Structuring (One-time)</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                        <div className="bg-slate-900/50 rounded-lg p-4">
                                            <div className="text-sm text-slate-400 mb-1">Standard</div>
                                            <div className="text-xl font-bold text-white">$12k – $25k</div>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-4">
                                            <div className="text-sm text-slate-400 mb-1">Premium</div>
                                            <div className="text-xl font-bold text-white">$20k – $45k</div>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-4">
                                            <div className="text-sm text-slate-400 mb-1">Nature-based / REDD+</div>
                                            <div className="text-xl font-bold text-white">$45k – $75k</div>
                                        </div>
                                    </div>

                                    <h4 className="text-white font-semibold mb-4">MRV, Verification & Issuance</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className="bg-slate-900/50 rounded-lg p-4">
                                            <div className="text-sm text-slate-400 mb-1">Standard</div>
                                            <div className="text-xl font-bold text-white">$0.18 – $0.30</div>
                                            <div className="text-xs text-slate-500">per tCO₂e (Annual Min: $12k)</div>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-4">
                                            <div className="text-sm text-slate-400 mb-1">Premium</div>
                                            <div className="text-xl font-bold text-white">$0.25 – $0.45</div>
                                            <div className="text-xs text-slate-500">per tCO₂e (Annual Min: $15k)</div>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-4">
                                            <div className="text-sm text-slate-400 mb-1">Nature-based</div>
                                            <div className="text-xl font-bold text-white">$0.60 – $1.00</div>
                                            <div className="text-xs text-slate-500">per tCO₂e (Annual Min: $25k)</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* RECs */}
                    <TabsContent value="recs">
                        <div className="max-w-2xl mx-auto">
                            <Card className="bg-slate-800/50 border-slate-700">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-amber-500/20 rounded-lg flex items-center justify-center">
                                            <Sun className="h-6 w-6 text-amber-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-white">Renewable Energy Certificates (RECs)</CardTitle>
                                            <CardDescription className="text-slate-400">
                                                Registration, issuance, and reporting
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-900/50 rounded-lg p-4">
                                            <div className="text-sm text-slate-400 mb-1">Registration & Setup (One-time)</div>
                                            <div className="text-xl font-bold text-white">$6k – $15k</div>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-4">
                                            <div className="text-sm text-slate-400 mb-1">Issuance & Reporting</div>
                                            <div className="text-xl font-bold text-white">$0.03 – $0.10 / MWh</div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-slate-400">
                                        <strong className="text-white">Minimum Annual Fee:</strong> $5k – $10k
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Compliance */}
                    <TabsContent value="compliance">
                        <div className="max-w-2xl mx-auto">
                            <Card className="bg-slate-800/50 border-slate-700">
                                <CardHeader>
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                                            <Factory className="h-6 w-6 text-purple-400" />
                                        </div>
                                        <div>
                                            <CardTitle className="text-white">Compliance & Emissions Trading Schemes (ETS)</CardTitle>
                                            <CardDescription className="text-slate-400">
                                                ETS account setup and structuring
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div className="bg-slate-900/50 rounded-lg p-4">
                                            <div className="text-sm text-slate-400 mb-1">Emerging / Regional</div>
                                            <div className="text-xl font-bold text-white">$15k – $30k</div>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-4">
                                            <div className="text-sm text-slate-400 mb-1">National</div>
                                            <div className="text-xl font-bold text-white">$25k – $45k</div>
                                        </div>
                                        <div className="bg-slate-900/50 rounded-lg p-4">
                                            <div className="text-sm text-slate-400 mb-1">High-scrutiny (e.g., EU ETS, CORSIA)</div>
                                            <div className="text-xl font-bold text-white">$40k – $70k</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Important Notes */}
                <div className="max-w-3xl mx-auto mb-16">
                    <Card className="bg-slate-800/30 border-slate-700">
                        <CardHeader>
                            <CardTitle className="text-white text-lg">Important Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm text-slate-400">
                            <p>• <strong className="text-white">Pass-through Costs:</strong> Registry, verifier (VVB), and regulator fees are always charged at cost and billed separately.</p>
                            <p>• <strong className="text-white">Model:</strong> CredoCarbon prices professional execution time supported by structured digital workflows, not just software access.</p>
                            <p>• <strong className="text-white">Milestones:</strong> Fees are milestone-based and aligned with delivery stages.</p>
                            <p>• <strong className="text-white">No Principal Trading:</strong> CredoCarbon does not take title to credits or trade on its own balance sheet.</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Contact Form */}
                <div className="max-w-2xl mx-auto">
                    <Card className="bg-slate-800/50 border-slate-700">
                        <CardHeader className="text-center">
                            <CardTitle className="text-white flex items-center justify-center gap-2">
                                <MessageSquare className="h-5 w-5 text-emerald-500" />
                                Get in Touch
                            </CardTitle>
                            <CardDescription className="text-slate-400">
                                Interested in learning more? Contact our team for a personalized quote.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {submitted ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Check className="h-8 w-8 text-emerald-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-white mb-2">
                                        Thank you for your interest!
                                    </h3>
                                    <p className="text-slate-400">
                                        Our team will get back to you within 24 hours.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <Label className="text-slate-300">Name</Label>
                                            <Input
                                                placeholder="Your name"
                                                required
                                                className="bg-slate-900/50 border-slate-600 text-white mt-2"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-slate-300">Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="you@company.com"
                                                required
                                                className="bg-slate-900/50 border-slate-600 text-white mt-2"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-slate-300">Company</Label>
                                        <Input
                                            placeholder="Your company name"
                                            className="bg-slate-900/50 border-slate-600 text-white mt-2"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-slate-300">Message</Label>
                                        <Textarea
                                            placeholder="Tell us about your needs..."
                                            rows={4}
                                            className="bg-slate-900/50 border-slate-600 text-white mt-2"
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Sending..." : "Send Message"}
                                    </Button>
                                </form>
                            )}
                        </CardContent>
                    </Card>

                    {/* Contact Info */}
                    <div className="flex justify-center gap-8 mt-8 text-slate-400">
                        <a href="mailto:sales@credocarbon.com" className="flex items-center gap-2 hover:text-emerald-400">
                            <Mail className="h-4 w-4" />
                            sales@credocarbon.com
                        </a>
                    </div>
                </div>
            </main>
        </div>
    );
}
