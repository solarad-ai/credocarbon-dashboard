"use client";

import Link from "next/link";
import {
    Book,
    FileText,
    Users,
    ShoppingBag,
    Shield,
    Building,
    ArrowRight,
    ExternalLink,
} from "lucide-react";

const guides = [
    {
        icon: FileText,
        title: "Developer Guide",
        description: "Learn how to register projects and submit monitoring reports.",
        href: "/guides/developer-guide.html",
        gradient: "from-emerald-500 to-green-600",
    },
    {
        icon: ShoppingBag,
        title: "Buyer Guide",
        description: "Browse, purchase, and retire carbon credits from the marketplace.",
        href: "/guides/buyer-guide.html",
        gradient: "from-orange-500 to-amber-600",
    },
    {
        icon: Shield,
        title: "VVB Guide",
        description: "Conduct validation and verification audits efficiently.",
        href: "/guides/vvb-guide.html",
        gradient: "from-purple-500 to-violet-600",
    },
    {
        icon: Building,
        title: "Registry Guide",
        description: "Manage credit issuance and maintain registry operations.",
        href: "/guides/registry-guide.html",
        gradient: "from-blue-500 to-indigo-600",
    },
    {
        icon: Users,
        title: "Admin Guide",
        description: "Day-to-day platform administration and user support.",
        href: "/guides/admin-guide.html",
        gradient: "from-fuchsia-500 to-pink-600",
    },
    {
        icon: Shield,
        title: "SuperAdmin Guide",
        description: "Full platform control, configuration, and system management.",
        href: "/guides/superadmin-guide.html",
        gradient: "from-red-500 to-rose-600",
    },
];

export function DocsSection() {
    return (
        <section id="docs" className="relative py-24 bg-[#0a0a0f]">
            {/* Background gradient */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="container mx-auto px-4 relative z-10">
                {/* Section Header */}
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-blue-400 text-sm font-medium mb-6">
                        <Book className="h-4 w-4" />
                        <span>Documentation</span>
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                        User Guides & Resources
                    </h2>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                        Comprehensive documentation to help you get started and make the
                        most of the CredoCarbon platform.
                    </p>
                </div>

                {/* Guides Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
                    {guides.map((guide, index) => (
                        <Link
                            key={guide.title}
                            href={guide.href}
                            className="group relative p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-sm hover:bg-white/[0.04] hover:border-white/10 transition-all duration-300"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            {/* Icon */}
                            <div
                                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${guide.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                            >
                                <guide.icon className="h-6 w-6 text-white" />
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors flex items-center gap-2">
                                {guide.title}
                                <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed">
                                {guide.description}
                            </p>
                        </Link>
                    ))}
                </div>

                {/* View All Docs CTA */}
                <div className="text-center">
                    <Link
                        href="/guides/index.html"
                        className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white/5 border border-white/10 text-white font-medium hover:bg-white/10 hover:border-white/20 transition-all group"
                    >
                        <span>View All Documentation</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>
            </div>
        </section>
    );
}
