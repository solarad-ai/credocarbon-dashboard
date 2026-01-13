"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";

const footerLinks = [
    {
        title: "Platform",
        links: [
            { label: "Developer Portal", href: "/developer/login" },
            { label: "Buyer Portal", href: "/buyer/login" },
            { label: "VVB Portal", href: "/vvb/login" },
            { label: "Registry Portal", href: "/registry/login" },
            { label: "Admin Portal", href: "/admin/login" },
        ],
    },
    {
        title: "Resources",
        links: [
            { label: "Documentation", href: "#docs" },
            { label: "User Guides", href: "/guides/index.html" },
            { label: "Developer Guide", href: "/guides/developer-guide.html" },
            { label: "Buyer Guide", href: "/guides/buyer-guide.html" },
        ],
    },
];

const registries = ["VCS", "Gold Standard", "CDM", "GCC", "ACR"];

export function Footer() {
    return (
        <footer className="relative bg-[#0a0a0f] border-t border-white/5">
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center gap-2 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-blue-600 flex items-center justify-center">
                                <Leaf className="h-5 w-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
                                CredoCarbon
                            </span>
                        </Link>
                        <p className="text-slate-400 text-sm mb-6 max-w-sm">
                            Enterprise-grade carbon credit management platform. Unified MRV, Registry, and Trading stack for the carbon market.
                        </p>

                        {/* Supported Registries */}
                        <div className="mb-6">
                            <p className="text-xs text-slate-500 mb-3">Supported Registries:</p>
                            <div className="flex flex-wrap gap-2">
                                {registries.map((registry) => (
                                    <span
                                        key={registry}
                                        className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400"
                                    >
                                        {registry}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Links */}
                    {footerLinks.map((section) => (
                        <div key={section.title}>
                            <h4 className="text-white font-semibold mb-4">{section.title}</h4>
                            <ul className="space-y-3">
                                {section.links.map((link) => (
                                    <li key={link.label}>
                                        <Link
                                            href={link.href}
                                            className="text-sm text-slate-400 hover:text-emerald-400 transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Bottom */}
                <div className="mt-16 pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-500">
                        © {new Date().getFullYear()} Credo Carbon. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        <span className="text-xs text-slate-600">
                            Built with 💚 for a sustainable future
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
