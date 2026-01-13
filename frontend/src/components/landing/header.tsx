"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Leaf } from "lucide-react";

const navItems = [
    { label: "Features", href: "#features" },
    { label: "Roles", href: "#roles" },
    { label: "Docs", href: "#docs" },
];

export function LandingHeader() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/5">
            <div className="container mx-auto px-4">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-500/40 transition-shadow">
                            <Leaf className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                            CredoCarbon
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navItems.map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="text-sm font-medium text-slate-400 hover:text-white transition-colors relative group"
                            >
                                {item.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-emerald-500 group-hover:w-full transition-all duration-300" />
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop CTA */}
                    <div className="hidden md:flex items-center gap-4">
                        <Link href="/developer/login">
                            <Button
                                variant="ghost"
                                className="text-slate-400 hover:text-white hover:bg-white/5"
                            >
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/developer/signup">
                            <Button className="bg-gradient-to-r from-emerald-500 to-blue-600 text-white hover:shadow-lg hover:shadow-emerald-500/25 transition-all">
                                Get Started
                            </Button>
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden text-white"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className="md:hidden bg-[#0a0a0f]/95 backdrop-blur-xl border-t border-white/5 animate-fade-in">
                    <nav className="container mx-auto px-4 py-4">
                        {navItems.map((item, index) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="block py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                                style={{ animationDelay: `${index * 50}ms` }}
                                onClick={() => setIsOpen(false)}
                            >
                                {item.label}
                            </Link>
                        ))}
                        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/10">
                            <Link href="/developer/login" onClick={() => setIsOpen(false)}>
                                <Button
                                    variant="ghost"
                                    className="w-full text-slate-400 hover:text-white"
                                >
                                    Sign In
                                </Button>
                            </Link>
                            <Link href="/developer/signup" onClick={() => setIsOpen(false)}>
                                <Button className="w-full bg-gradient-to-r from-emerald-500 to-blue-600 text-white">
                                    Get Started
                                </Button>
                            </Link>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
