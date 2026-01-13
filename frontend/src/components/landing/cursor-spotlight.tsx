"use client";

import { useEffect, useRef, useState } from "react";

export function CursorSpotlight() {
    const spotlightRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setPosition({ x: e.clientX, y: e.clientY });
            setIsVisible(true);
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
        };

        window.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseleave", handleMouseLeave);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            document.removeEventListener("mouseleave", handleMouseLeave);
        };
    }, []);

    return (
        <>
            {/* Main spotlight - follows cursor */}
            <div
                ref={spotlightRef}
                className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-500"
                style={{
                    opacity: isVisible ? 1 : 0,
                    background: `
            radial-gradient(800px circle at ${position.x}px ${position.y}px, 
              rgba(16, 185, 129, 0.15), 
              rgba(59, 130, 246, 0.1) 25%, 
              rgba(139, 92, 246, 0.05) 50%, 
              transparent 70%
            )
          `,
                }}
            />

            {/* Inner bright core */}
            <div
                className="pointer-events-none fixed z-40 rounded-full transition-all duration-100"
                style={{
                    opacity: isVisible ? 1 : 0,
                    left: position.x - 150,
                    top: position.y - 150,
                    width: 300,
                    height: 300,
                    background: `radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)`,
                    filter: "blur(40px)",
                }}
            />

            {/* Trailing glow */}
            <div
                className="pointer-events-none fixed z-30 rounded-full transition-all duration-300 ease-out"
                style={{
                    opacity: isVisible ? 0.6 : 0,
                    left: position.x - 300,
                    top: position.y - 300,
                    width: 600,
                    height: 600,
                    background: `radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 60%)`,
                    filter: "blur(60px)",
                }}
            />
        </>
    );
}
