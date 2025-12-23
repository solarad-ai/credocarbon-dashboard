"use client";

import { useState, useEffect } from "react";
import { ArrowRight, User, Building2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const typingPhrases = [
    "Registration",
    "Validation",
    "Verification",
    "Trading",
    "Retirement",
];

export function HeroSection() {
    const [currentPhrase, setCurrentPhrase] = useState(0);
    const [displayText, setDisplayText] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);

    useEffect(() => {
        const phrase = typingPhrases[currentPhrase];
        const timeout = setTimeout(
            () => {
                if (!isDeleting) {
                    if (displayText.length < phrase.length) {
                        setDisplayText(phrase.slice(0, displayText.length + 1));
                    } else {
                        setTimeout(() => setIsDeleting(true), 2000);
                    }
                } else {
                    if (displayText.length > 0) {
                        setDisplayText(displayText.slice(0, -1));
                    } else {
                        setIsDeleting(false);
                        setCurrentPhrase((prev) => (prev + 1) % typingPhrases.length);
                    }
                }
            },
            isDeleting ? 50 : 100
        );

        return () => clearTimeout(timeout);
    }, [displayText, isDeleting, currentPhrase]);

    return (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0a0a0f]">
            {/* Animated gradient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[120px] animate-float" />
                <div
                    className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-blue-500/15 rounded-full blur-[120px] animate-float"
                    style={{ animationDelay: "1s" }}
                />
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[150px] animate-float"
                    style={{ animationDelay: "2s" }}
                />
            </div>

            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

            {/* Content */}
            <div className="container mx-auto px-4 pt-24 pb-16 relative z-10">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Unified MRV, Registry & Trading Stack</span>
                    </div>

                    {/* Headline */}
                    <h1
                        className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8 animate-fade-in-up"
                        style={{ animationDelay: "0.1s" }}
                    >
                        <span className="text-white">The Future of</span>
                        <br />
                        <span className="bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
                            Carbon Credit
                        </span>
                        <br />
                        <span className="text-white">
                            {displayText}
                            <span className="inline-block w-[3px] h-[0.9em] bg-emerald-400 ml-1 animate-pulse" />
                        </span>
                    </h1>

                    {/* Sub-headline */}
                    <p
                        className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-12 animate-fade-in-up"
                        style={{ animationDelay: "0.2s" }}
                    >
                        Enterprise-grade platform for project developers, validators, registries,
                        and credit buyers. Streamline your entire carbon credit lifecycle.
                    </p>

                    {/* CTA Buttons */}
                    <div
                        className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up"
                        style={{ animationDelay: "0.3s" }}
                    >
                        <Button
                            size="lg"
                            onClick={() => setShowRoleModal(true)}
                            className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-105 transition-all cursor-pointer"
                        >
                            Get Started
                            <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                        <Link href="#docs">
                            <Button
                                size="lg"
                                variant="outline"
                                className="px-8 py-6 text-lg font-semibold rounded-xl border-2 border-white/20 text-white bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all cursor-pointer"
                            >
                                View Documentation
                            </Button>
                        </Link>
                    </div>

                    {/* Role Pills */}
                    <div
                        className="flex flex-wrap items-center justify-center gap-3 mt-16 animate-fade-in-up"
                        style={{ animationDelay: "0.4s" }}
                    >
                        {[
                            { label: "Developers", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
                            { label: "Buyers", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
                            { label: "VVBs", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
                            { label: "Registries", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" },
                            { label: "SuperAdmins", color: "bg-red-500/20 text-red-400 border-red-500/30" },
                        ].map((role) => (
                            <span
                                key={role.label}
                                className={`px-4 py-2 rounded-full text-sm font-medium border ${role.color}`}
                            >
                                {role.label}
                            </span>
                        ))}
                    </div>

                    {/* Stats */}
                    <div
                        className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-20 animate-fade-in-up"
                        style={{ animationDelay: "0.5s" }}
                    >
                        {[
                            { value: "6+", label: "Global Registries" },
                            { value: "10+", label: "Project Types" },
                            { value: "100%", label: "Compliant" },
                            { value: "Real-time", label: "Dashboard" },
                        ].map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-slate-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />

            {/* Role Selection Modal */}
            {showRoleModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="relative bg-[#0f0f15] border border-white/10 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl animate-scale-in">
                        <button
                            onClick={() => setShowRoleModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <h2 className="text-2xl font-bold text-white mb-2 text-center">
                            How would you like to join?
                        </h2>
                        <p className="text-slate-400 text-center mb-8">
                            Select your role to get started
                        </p>

                        <div className="grid gap-4">
                            <Link href="/developer/signup" onClick={() => setShowRoleModal(false)}>
                                <div className="group p-6 rounded-xl border-2 border-white/10 hover:border-emerald-500/50 bg-white/5 hover:bg-emerald-500/10 transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/30 transition-colors">
                                            <Building2 className="h-6 w-6 text-emerald-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">I'm a Developer</h3>
                                            <p className="text-sm text-slate-400">Register carbon credit projects</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-emerald-400 ml-auto transition-colors" />
                                    </div>
                                </div>
                            </Link>

                            <Link href="/buyer/signup" onClick={() => setShowRoleModal(false)}>
                                <div className="group p-6 rounded-xl border-2 border-white/10 hover:border-blue-500/50 bg-white/5 hover:bg-blue-500/10 transition-all cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                                            <User className="h-6 w-6 text-blue-400" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-white">I'm a Buyer</h3>
                                            <p className="text-sm text-slate-400">Purchase carbon credits</p>
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-400 ml-auto transition-colors" />
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

