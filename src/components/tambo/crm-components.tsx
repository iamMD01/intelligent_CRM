"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import * as RechartsCore from "recharts";
import { z } from "zod";
import { Graph, graphSchema } from "./graph";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, MoreHorizontal, Plus } from "lucide-react";
import { useCRMStore, CRMWidget } from "@/lib/crm-store";

// --- CRM Stat Card ---

export const crmStatCardSchema = z.object({
    title: z.string().describe("The label of the statistic (e.g., 'Total Revenue')"),
    value: z.string().describe("The main value to display (e.g., '$4,350.33')"),
    trend: z.string().optional().describe("The trend text (e.g., '+12.5%')"),
    trendDirection: z.enum(["up", "down", "neutral"]).optional().describe("Direction of the trend"),
    subtext: z.string().optional().describe("Additional context (e.g., 'vs last month')"),
    className: z.string().optional(),
});

export type CRMStatCardProps = z.infer<typeof crmStatCardSchema>;

export const CRMStatCard = ({ title, value, trend, trendDirection = "neutral", subtext, className }: CRMStatCardProps) => {
    return (
        <div className={cn("p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm", className)}>
            <div className="flex justify-between items-start mb-4">
                <h3 className="text-zinc-500 font-medium text-sm uppercase tracking-wide">{title}</h3>
                {trendDirection !== "neutral" && (
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        trendDirection === "up" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                    )}>
                        {trendDirection === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        <span>{trend}</span>
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-1">
                <span className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">{value}</span>
                {subtext && <span className="text-sm text-zinc-400">{subtext}</span>}
            </div>
        </div>
    );
};

// --- CRM Chart ---

export const crmChartSchema = graphSchema.extend({
    description: z.string().optional().describe("Brief description of what the chart shows"),
});

export type CRMChartProps = z.infer<typeof crmChartSchema>;

export const CRMChart = (props: CRMChartProps) => {
    return (
        <div className={cn("p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden flex flex-col h-full", props.className)}>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-zinc-900 dark:text-zinc-50 font-semibold text-lg">{props.title}</h3>
                    {props.description && <p className="text-zinc-400 text-sm">{props.description}</p>}
                </div>
            </div>
            <div className="flex-1 w-full min-h-[200px]">
                {/* Reusing the robust Graph component but stripping its wrapper padding if needed */}
                <Graph {...props} className="h-full !p-0 !bg-transparent !shadow-none !border-none" />
            </div>
        </div>
    );
};

// --- CRM List ---

export const crmListItemSchema = z.object({
    id: z.string().optional(),
    label: z.string().describe("Main text of the item"),
    value: z.string().optional().describe("Right-side value (e.g., amount, status)"),
    icon: z.string().optional().describe("Emoji or simple icon string"),
    status: z.enum(["success", "warning", "error", "neutral"]).optional(),
});

export const crmListSchema = z.object({
    title: z.string(),
    items: z.array(crmListItemSchema),
    className: z.string().optional(),
});

export type CRMListProps = z.infer<typeof crmListSchema>;

export const CRMList = ({ title, items = [], className }: CRMListProps) => {
    return (
        <div className={cn("p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm", className)}>
            <h3 className="text-zinc-900 dark:text-zinc-50 font-semibold text-lg mb-4">{title}</h3>
            <div className="space-y-3">
                {items?.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            {item.icon && (
                                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-sm">
                                    {item.icon}
                                </div>
                            )}
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">{item.label}</span>
                        </div>
                        {item.value && (
                            <span className={cn(
                                "text-sm font-semibold",
                                item.status === "success" ? "text-green-600" :
                                    item.status === "warning" ? "text-yellow-600" :
                                        item.status === "error" ? "text-red-600" : "text-zinc-500"
                            )}>
                                {item.value}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};
