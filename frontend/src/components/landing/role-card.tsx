"use client";

import Link from "next/link";
import {
    Leaf,
    ShieldCheck,
    Building2,
    ShoppingCart,
    UserCog,
    Shield,
    ArrowRight,
} from "lucide-react";

const roles = [
    {
        icon: Leaf,
        title: "Project Developer",
        description:
            "Register carbon projects, submit monitoring reports, and track credit issuance through our streamlined workflows.",
        features: ["7-Step Registration", "Document Management", "Credit Tracking"],
        href: "/developer/login",
        gradient: "from-emerald-500 to-green-600",
        bgGlow: "bg-emerald-500/10",
    },
    {
        icon: ShieldCheck,
        title: "VVB Validator",
        description:
            "Conduct validation and verification audits with comprehensive checklists and query management tools.",
        features: ["Validation Checklists", "Query Management", "Report Generation"],
        href: "/vvb/login",
        gradient: "from-purple-500 to-violet-600",
        bgGlow: "bg-purple-500/10",
    },
    {
        icon: Building2,
        title: "Registry Admin",
        description:
            "Manage credit issuance, serial number generation, and oversee the complete credit lifecycle.",
        features: ["Credit Issuance", "Serial Numbers", "Audit Logs"],
        href: "/registry/login",
        gradient: "from-blue-500 to-indigo-600",
        bgGlow: "bg-blue-500/10",
    },
    {
        icon: ShoppingCart,
        title: "Credit Buyer",
        description:
            "Browse available credits, manage your portfolio, and track retirements with full transparency.",
        features: ["Marketplace Access", "Portfolio Management", "Retirement Tracking"],
        href: "/buyer/login",
        gradient: "from-orange-500 to-amber-600",
        bgGlow: "bg-orange-500/10",
    },
    {
        icon: UserCog,
        title: "Platform Admin",
        description:
            "Manage day-to-day operations, user support, project oversight, and platform monitoring.",
        features: ["User Management", "Project Oversight", "Support"],
        href: "/admin/login",
        gradient: "from-fuchsia-500 to-pink-600",
        bgGlow: "bg-fuchsia-500/10",
    },
    {
        icon: Shield,
        title: "Super Admin",
        description:
            "Full platform control including configuration, VVB/Registry user creation, and system health.",
        features: ["Platform Config", "Create Users", "System Health"],
        href: "/superadmin/login",
        gradient: "from-red-500 to-rose-600",
        bgGlow: "bg-red-500/10",
    },
];

export function RoleCardsSection() {
    return (
        <section id="roles" className="relative py-24 bg-[#0a0a0f]">
            {/* Background gradient */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-purple-500/5 rounded-full blur-[100px]" />
                <div className="absolute top-0 left-1/4 w-[400px] h-[300px] bg-blue-500/5 rounded-full blur-[80px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-purple-400 text-sm font-medium mb-6">
                        <UserCog className="h-4 w-4" />
                        <span>Role-Based Access</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Choose Your Portal
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Access specialized tools and dashboards designed for your role in
                        the carbon credit ecosystem.
                    </p>
                </div>

                {/* Role Cards Grid */}
                <div className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto">
                    {roles.map((role, index) => (
                        <Link
                            key={role.title}
                            href={role.href}
                            className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300 flex flex-col w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)]"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Hover Glow Effect */}
                            <div
                                className={`absolute inset-0 rounded-2xl ${role.bgGlow} opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500`}
                            />

                            <div className="relative z-10 flex flex-col h-full">
                                {/* Icon */}
                                <div
                                    className={`w-14 h-14 rounded-xl bg-gradient-to-br ${role.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform shadow-lg`}
                                >
                                    <role.icon className="h-7 w-7 text-white" />
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                                    {role.title}
                                </h3>
                                <p className="text-slate-400 text-sm leading-relaxed mb-5 flex-grow">
                                    {role.description}
                                </p>

                                {/* Features */}
                                <div className="flex flex-wrap gap-2 mb-5">
                                    {role.features.map((feature) => (
                                        <span
                                            key={feature}
                                            className="px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-400"
                                        >
                                            {feature}
                                        </span>
                                    ))}
                                </div>

                                {/* CTA */}
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-400 group-hover:text-emerald-400 transition-colors">
                                    <span>Access Portal</span>
                                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    );
}
