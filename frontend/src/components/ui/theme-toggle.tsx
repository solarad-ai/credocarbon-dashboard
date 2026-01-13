"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const [theme, setTheme] = useState<"light" | "dark">("dark");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const savedTheme = localStorage.getItem("admin_theme") as "light" | "dark" | null;
        if (savedTheme) {
            setTheme(savedTheme);
            document.documentElement.classList.toggle("dark", savedTheme === "dark");
        } else {
            // Default to dark for admin
            setTheme("dark");
            document.documentElement.classList.add("dark");
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("admin_theme", newTheme);
        document.documentElement.classList.toggle("dark", newTheme === "dark");
    };

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" className="w-10 h-10">
                <Sun className="h-5 w-5" />
            </Button>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="w-10 h-10 rounded-lg hover:bg-slate-700/50 transition-all duration-300"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
            {theme === "dark" ? (
                <Sun className="h-5 w-5 text-yellow-400 transition-transform hover:rotate-12" />
            ) : (
                <Moon className="h-5 w-5 text-slate-600 transition-transform hover:-rotate-12" />
            )}
        </Button>
    );
}
