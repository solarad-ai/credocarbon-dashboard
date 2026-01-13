"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Leaf, Home, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    const [particles, setParticles] = useState<Array<{ id: number; x: number; delay: number; duration: number }>>([]);

    useEffect(() => {
        // Generate floating leaf particles
        const newParticles = Array.from({ length: 12 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            delay: Math.random() * 5,
            duration: 8 + Math.random() * 6,
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0f0a] flex items-center justify-center relative overflow-hidden">
            {/* Animated gradient orbs - eco themed */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-emerald-500/15 rounded-full blur-[150px] animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-400/10 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: "1s" }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-green-500/5 rounded-full blur-[200px]" />
            </div>

            {/* Floating leaf particles */}
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute pointer-events-none"
                    style={{
                        left: `${particle.x}%`,
                        animation: `floatUp ${particle.duration}s ease-in-out infinite`,
                        animationDelay: `${particle.delay}s`,
                    }}
                >
                    <Leaf className="w-4 h-4 text-emerald-500/30" />
                </div>
            ))}

            {/* Hexagonal grid pattern - carbon molecule inspired */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 17.32V51.96L30 69.28L0 51.96V17.32L30 0z' fill='none' stroke='%2310b981' stroke-width='1'/%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px'
            }} />

            <div className="relative z-10 text-center px-6 max-w-3xl">
                {/* Premium 404 with rotating leaf */}
                <div className="relative mb-6">
                    {/* Glow ring behind the numbers */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] md:w-[400px] md:h-[400px] rounded-full border border-emerald-500/20 animate-pulse" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] md:w-[450px] md:h-[450px] rounded-full border border-emerald-500/10" style={{ animation: 'spin 20s linear infinite reverse' }} />

                    {/* 404 Display */}
                    <div className="flex items-center justify-center gap-0 md:gap-2">
                        {/* 4 */}
                        <span className="text-[100px] md:text-[160px] lg:text-[200px] font-black bg-gradient-to-b from-emerald-300 via-emerald-500 to-teal-600 bg-clip-text text-transparent leading-none select-none drop-shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                            4
                        </span>

                        {/* Rotating Leaf (the 0) */}
                        <div className="relative w-[80px] h-[100px] md:w-[130px] md:h-[160px] lg:w-[160px] lg:h-[200px] flex items-center justify-center mx-[-10px] md:mx-0">
                            {/* Inner glow */}
                            <div className="absolute w-full h-full bg-emerald-500/30 rounded-full blur-3xl animate-pulse" />

                            {/* Orbiting sparkles */}
                            <div className="absolute w-full h-full animate-spin" style={{ animationDuration: '6s' }}>
                                <Sparkles className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 text-emerald-300" />
                            </div>
                            <div className="absolute w-full h-full animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse' }}>
                                <Sparkles className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 text-teal-300" />
                            </div>

                            {/* Main rotating leaf */}
                            <Leaf
                                className="w-[60px] h-[80px] md:w-[100px] md:h-[130px] lg:w-[130px] lg:h-[170px] text-emerald-400 animate-spin-slow drop-shadow-[0_0_40px_rgba(16,185,129,0.6)]"
                                strokeWidth={1.2}
                            />
                        </div>

                        {/* 4 */}
                        <span className="text-[100px] md:text-[160px] lg:text-[200px] font-black bg-gradient-to-b from-emerald-300 via-emerald-500 to-teal-600 bg-clip-text text-transparent leading-none select-none drop-shadow-[0_0_50px_rgba(16,185,129,0.3)]">
                            4
                        </span>
                    </div>
                </div>

                {/* Carbon credit themed message */}
                <div className="space-y-4 mb-10">
                    <h2 className="text-2xl md:text-4xl font-bold text-white">
                        Page Not Found
                    </h2>
                    <p className="text-slate-400 text-lg leading-relaxed max-w-lg mx-auto">
                        This carbon credit has been offset! The page you're looking for
                        has vanished like CO₂ from the atmosphere.
                    </p>
                </div>

                {/* Premium action buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                    <Link href="/">
                        <Button
                            size="lg"
                            className="group relative overflow-hidden bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 text-white px-10 py-7 text-lg font-semibold rounded-2xl shadow-2xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all duration-300 hover:scale-105"
                        >
                            <span className="relative z-10 flex items-center">
                                <Home className="mr-2 h-5 w-5" />
                                Return Home
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </Button>
                    </Link>
                    <Button
                        size="lg"
                        variant="outline"
                        onClick={() => window.history.back()}
                        className="px-10 py-7 text-lg font-semibold rounded-2xl border-2 border-emerald-500/30 text-emerald-400 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 backdrop-blur-sm transition-all duration-300"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5" />
                        Go Back
                    </Button>
                </div>

                {/* CredoCarbon signature */}
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 backdrop-blur-sm">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <Leaf className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-slate-300">
                        <span className="text-emerald-400 font-bold">Credo</span>Carbon
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-500">Sustainable Carbon Credits</span>
                </div>
            </div>

            {/* CSS for animations */}
            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 4s linear infinite;
                }
                @keyframes floatUp {
                    0% {
                        transform: translateY(100vh) rotate(0deg);
                        opacity: 0;
                    }
                    10% { opacity: 0.3; }
                    90% { opacity: 0.3; }
                    100% {
                        transform: translateY(-100px) rotate(360deg);
                        opacity: 0;
                    }
                }
                @keyframes spin {
                    from { transform: translate(-50%, -50%) rotate(0deg); }
                    to { transform: translate(-50%, -50%) rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
