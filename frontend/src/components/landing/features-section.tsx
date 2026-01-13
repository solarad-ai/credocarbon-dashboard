"use client";

import {
    FileCheck,
    Shield,
    BarChart3,
    Globe,
    Zap,
    Lock,
} from "lucide-react";

const features = [
    {
        icon: FileCheck,
        title: "Project Registration",
        description:
            "7-step guided wizard for registering carbon projects with multi-registry support.",
        gradient: "from-emerald-500 to-green-600",
    },
    {
        icon: Shield,
        title: "VVB Validation",
        description:
            "Complete validation and verification workflows with checklists and query management.",
        gradient: "from-purple-500 to-violet-600",
    },
    {
        icon: BarChart3,
        title: "Registry Issuance",
        description:
            "Streamlined credit issuance process with serial number generation and certificates.",
        gradient: "from-orange-500 to-amber-600",
    },
    {
        icon: Globe,
        title: "Multi-Registry Support",
        description:
            "Support for VCS, Gold Standard, CDM, GCC, and ACR registries in one platform.",
        gradient: "from-blue-500 to-indigo-600",
    },
    {
        icon: Zap,
        title: "Real-time Dashboards",
        description:
            "Role-specific dashboards with live statistics, notifications, and task management.",
        gradient: "from-yellow-500 to-orange-600",
    },
    {
        icon: Lock,
        title: "Enterprise Security",
        description:
            "Role-based access control, audit logging, and secure authentication for all users.",
        gradient: "from-red-500 to-rose-600",
    },
];

export function FeaturesSection() {
    return (
        <section id="features" className="relative py-24 bg-[#0a0a0f]">
            {/* Background gradient */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-emerald-400 text-sm font-medium mb-6">
                        <Zap className="h-4 w-4" />
                        <span>Platform Features</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        Everything You Need
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Powerful tools for the complete carbon credit lifecycle, built for
                        developers, validators, registries, and buyers.
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                    {features.map((feature, index) => (
                        <div
                            key={feature.title}
                            className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Icon */}
                            <div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                            >
                                <feature.icon className="h-6 w-6 text-white" />
                            </div>

                            {/* Content */}
                            <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                                {feature.title}
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
