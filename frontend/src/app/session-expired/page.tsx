"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Leaf, Clock, LogIn, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SessionExpiredPage() {
    const [countdown, setCountdown] = useState(10);
    const [particles, setParticles] = useState<Array<{ id: number; x: number; size: number; delay: number }>>([]);

    useEffect(() => {
        // Generate falling particles
        const newParticles = Array.from({ length: 15 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            size: 4 + Math.random() * 8,
            delay: Math.random() * 3,
        }));
        setParticles(newParticles);

        // Countdown to redirect
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    window.location.href = "/auth/login";
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center relative overflow-hidden">
            {/* Animated gradient orbs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-orange-500/10 rounded-full blur-[120px] animate-float" />
                <div
                    className="absolute bottom-1/3 right-1/3 w-[350px] h-[350px] bg-red-500/10 rounded-full blur-[100px] animate-float"
                    style={{ animationDelay: "1.5s" }}
                />
            </div>

            {/* Falling particles animation */}
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="absolute bg-gradient-to-b from-orange-400 to-red-500 rounded-full opacity-30"
                    style={{
                        left: `${particle.x}%`,
                        width: `${particle.size}px`,
                        height: `${particle.size}px`,
                        animation: `fall ${5 + Math.random() * 5}s linear infinite`,
                        animationDelay: `${particle.delay}s`,
                    }}
                />
            ))}

            {/* Grid pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

            {/* Content */}
            <div className="relative z-10 text-center px-6 max-w-lg">
                {/* Animated icon */}
                <div className="relative mb-8 inline-flex items-center justify-center">
                    <div className="absolute w-32 h-32 bg-orange-500/20 rounded-full animate-ping" style={{ animationDuration: "2s" }} />
                    <div className="relative w-28 h-28 bg-gradient-to-br from-orange-500/30 to-red-500/30 rounded-full flex items-center justify-center border border-orange-500/30">
                        <Clock className="h-14 w-14 text-orange-400" />
                    </div>
                </div>

                {/* Timer arc animation */}
                <div className="relative mb-6">
                    <svg className="w-24 h-24 mx-auto" viewBox="0 0 100 100">
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="6"
                        />
                        <circle
                            cx="50"
                            cy="50"
                            r="45"
                            fill="none"
                            stroke="url(#gradient)"
                            strokeWidth="6"
                            strokeLinecap="round"
                            strokeDasharray={`${(countdown / 10) * 283} 283`}
                            transform="rotate(-90 50 50)"
                            className="transition-all duration-1000"
                        />
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#f97316" />
                                <stop offset="100%" stopColor="#ef4444" />
                            </linearGradient>
                        </defs>
                        <text
                            x="50"
                            y="55"
                            textAnchor="middle"
                            className="fill-white text-2xl font-bold"
                        >
                            {countdown}
                        </text>
                    </svg>
                </div>

                {/* Message */}
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Session Expired
                </h1>
                <p className="text-slate-400 mb-8">
                    Your carbon credits are safe! Your session has timed out for security.
                    Please log in again to continue managing your sustainable investments.
                </p>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <Link href="/auth/login">
                        <Button
                            size="lg"
                            className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-6 text-lg font-semibold rounded-xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:scale-105 transition-all"
                        >
                            <LogIn className="mr-2 h-5 w-5" />
                            Log In Again
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button
                            size="lg"
                            variant="outline"
                            className="px-8 py-6 text-lg font-semibold rounded-xl border-2 border-white/20 text-white bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all"
                        >
                            <Home className="mr-2 h-5 w-5" />
                            Go Home
                        </Button>
                    </Link>
                </div>

                {/* Security note */}
                <div className="mt-12 p-4 rounded-xl bg-white/5 border border-white/10">
                    <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
                        <Leaf className="h-4 w-4 text-emerald-400" />
                        <span>Your account is protected by CredoCarbon security</span>
                    </div>
                </div>

                {/* Redirect notice */}
                <p className="mt-6 text-sm text-slate-500">
                    Redirecting to login in {countdown} seconds...
                </p>
            </div>

            {/* CSS for falling animation */}
            <style jsx global>{`
        @keyframes fall {
          0% {
            transform: translateY(-100px) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.3;
          }
          90% {
            opacity: 0.3;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
        </div>
    );
}
