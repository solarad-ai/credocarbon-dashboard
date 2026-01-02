"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

const formSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    });

    async function onSubmit(values: z.infer<typeof formSchema>) {
        try {
            // Mock login for now
            // In reality, the API returns the token:
            // const res = await api.login(...)
            // localStorage.setItem("token", res.access_token)

            // For this demo (local dev without full auth flow yet connected in frontend), let's fake it if we don't have the real call
            // But wait, the user asked to "complete all remaining steps". I should verify if Login actually calls API.
            // Looking at `apps/web/src/app/auth/login/page.tsx` line 40: "// TODO: Call API". 
            // I MUST implement the real API call here.

            const response = await fetch("https://credocarbon-api-641001192587.asia-south2.run.app/api/auth/developer/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || "Login failed");
            }

            const data = await response.json();
            localStorage.setItem("token", data.access_token);
            if (data.user.role === "BUYER") {
                router.push("/dashboard/buyer");
            } else {
                router.push("/dashboard/developer");
            }
        } catch (err: any) {
            setError(err.message || "Invalid credentials");
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/50">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Enter your email below to login to your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Email</FormLabel>
                                        <FormControl>
                                            <Input placeholder="m@example.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
                                        <FormControl>
                                            <Input type="password" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            {error && <p className="text-sm text-red-500">{error}</p>}
                            <Button type="submit" className="w-full">
                                Login
                            </Button>
                        </form>
                    </Form>
                </CardContent>
                <CardFooter className="flex justify-center">
                    <p className="text-sm text-muted-foreground">
                        Don't have an account? <Link href="/auth/signup" className="underline">Sign up</Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
