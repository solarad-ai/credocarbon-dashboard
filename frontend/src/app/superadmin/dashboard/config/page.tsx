"use client";

import Link from "next/link";
import { Database, Layers, Flag, Megaphone, DollarSign, Mail, Settings2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const configSections = [
    {
        title: "Registries",
        description: "Manage carbon credit registries (VCS, Gold Standard, CDM)",
        icon: Database,
        href: "/superadmin/dashboard/config/registries",
        color: "from-blue-500 to-blue-600",
    },
    {
        title: "Project Types",
        description: "Configure project categories (Solar, Wind, Biogas)",
        icon: Layers,
        href: "/superadmin/dashboard/config/project-types",
        color: "from-green-500 to-green-600",
    },
    {
        title: "Feature Flags",
        description: "Toggle platform features and beta rollouts",
        icon: Flag,
        href: "/superadmin/dashboard/config/feature-flags",
        color: "from-purple-500 to-purple-600",
    },
    {
        title: "Announcements",
        description: "Create and manage platform-wide announcements",
        icon: Megaphone,
        href: "/superadmin/dashboard/config/announcements",
        color: "from-amber-500 to-amber-600",
    },
    {
        title: "Platform Fees",
        description: "Configure transaction fees and pricing",
        icon: DollarSign,
        href: "/superadmin/dashboard/config/fees",
        color: "from-emerald-500 to-emerald-600",
    },
    {
        title: "Email Templates",
        description: "Manage email notification templates",
        icon: Mail,
        href: "/superadmin/dashboard/config/email-templates",
        color: "from-rose-500 to-rose-600",
    },
];

export default function ConfigPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Settings2 className="h-6 w-6" />
                    Platform Configuration
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    Manage registries, project types, features, and platform settings
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {configSections.map((section) => (
                    <Link key={section.href} href={section.href}>
                        <Card className="dark:bg-slate-800 dark:border-slate-700 hover:shadow-lg transition-all duration-300 cursor-pointer group">
                            <CardHeader className="pb-3">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${section.color} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                                    <section.icon className="h-6 w-6 text-white" />
                                </div>
                                <CardTitle className="text-slate-900 dark:text-white">{section.title}</CardTitle>
                                <CardDescription className="text-slate-500 dark:text-slate-400">
                                    {section.description}
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </Link>
                ))}
            </div>
        </div>
    );
}
