"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import * as RechartsCore from "recharts";
import { z } from "zod";
import { Graph, graphSchema } from "./graph";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, MoreHorizontal, Plus } from "lucide-react";
import { useCRMStore, CRMWidget } from "@/lib/crm-store";
import { useThemeStore } from "@/lib/theme-store";

// --- CRM Stat Card ---

import { useWidgetContext } from "@/lib/widget-context";

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
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const { messageId } = useWidgetContext();

    // Register widget metadata to store
    React.useEffect(() => {
        if (messageId && title) {
            useCRMStore.getState().updateWidget(messageId, {
                title: title,
                componentName: 'CRMStatCard',
                props: { title, value, trend, trendDirection, subtext }
            });
        }
    }, [messageId, title, value, trend, trendDirection, subtext]);

    return (
        <div className={cn("p-4 rounded-2xl h-full", className)}>
            <div className="flex justify-between items-start mb-4">
                <h3 className={cn(
                    "font-medium text-sm uppercase tracking-wide",
                    isDark ? "text-zinc-400" : "text-zinc-500"
                )}>{title}</h3>
                {trendDirection !== "neutral" && (
                    <div className={cn(
                        "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                        trendDirection === "up"
                            ? isDark ? "bg-green-900/50 text-green-400" : "bg-green-100 text-green-700"
                            : isDark ? "bg-red-900/50 text-red-400" : "bg-red-100 text-red-700"
                    )}>
                        {trendDirection === "up" ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        <span>{trend}</span>
                    </div>
                )}
            </div>
            <div className="flex flex-col gap-1">
                <span className={cn(
                    "text-4xl font-semibold tracking-tight",
                    isDark ? "text-white" : "text-zinc-900"
                )}>{value}</span>
                {subtext && <span className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-400")}>{subtext}</span>}
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
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const { messageId } = useWidgetContext();

    // Register widget metadata to store
    React.useEffect(() => {
        if (messageId && props.title) {
            useCRMStore.getState().updateWidget(messageId, {
                title: props.title,
                componentName: 'CRMChart',
                props: props
            });
        }
    }, [messageId, props.title, props]);

    return (
        <div className={cn("p-4 rounded-2xl overflow-hidden flex flex-col h-full", props.className)}>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className={cn(
                        "font-semibold text-lg",
                        isDark ? "text-white" : "text-zinc-900"
                    )}>{props.title}</h3>
                    {props.description && <p className={cn("text-sm", isDark ? "text-zinc-500" : "text-zinc-400")}>{props.description}</p>}
                </div>
            </div>
            <div className="flex-1 w-full min-h-[200px]">
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
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const { messageId } = useWidgetContext();

    // Register widget metadata to store
    React.useEffect(() => {
        if (messageId && title) {
            useCRMStore.getState().updateWidget(messageId, {
                title: title,
                componentName: 'CRMList',
                props: { title, items }
            });
        }
    }, [messageId, title, items]);

    return (
        <div className={cn("p-4 rounded-2xl h-full", className)}>
            <h3 className={cn(
                "font-semibold text-lg mb-4",
                isDark ? "text-white" : "text-zinc-900"
            )}>{title}</h3>
            <div className="space-y-3">
                {items?.map((item, idx) => (
                    <div key={item.id || idx} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            {item.icon && (
                                <div className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                                    isDark ? "bg-zinc-800" : "bg-zinc-200"
                                )}>
                                    {item.icon}
                                </div>
                            )}
                            <span className={cn(
                                "font-medium",
                                isDark ? "text-zinc-200" : "text-zinc-700"
                            )}>{item.label}</span>
                        </div>
                        {item.value && (
                            <span className={cn(
                                "text-sm font-semibold",
                                item.status === "success" ? (isDark ? "text-green-400" : "text-green-600") :
                                    item.status === "warning" ? (isDark ? "text-yellow-400" : "text-yellow-600") :
                                        item.status === "error" ? (isDark ? "text-red-400" : "text-red-600") :
                                            (isDark ? "text-zinc-400" : "text-zinc-500")
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
// --- CRM Heatmap ---

export const crmHeatmapSchema = z.object({
    title: z.string().describe("The label of the heatmap"),
    description: z.string().optional().describe("Brief description of what the heatmap shows"),
    xLabels: z.array(z.string()).optional().describe("Need LABELS for the X-axis (columns). E.g., ['Mon', 'Tue', 'Wed']"),
    yLabels: z.array(z.string()).optional().describe("Need LABELS for the Y-axis (rows). E.g., ['User A', 'User B']"),
    data: z.array(z.array(z.number())).optional().describe("2D array of values. Outer array = rows (yLabels), Inner array = columns (xLabels)."),
    values: z.array(z.array(z.number())).optional().describe("Alias for data"),
    minValue: z.number().optional().describe("Minimum value for color scaling (default: 0)"),
    maxValue: z.number().optional().describe("Maximum value for color scaling (default: max in data)"),
    colorTheme: z.enum(["green", "blue", "red", "orange"]).optional().describe("Color theme for the heatmap"),
    className: z.string().optional(),
});

export type CRMHeatmapProps = z.infer<typeof crmHeatmapSchema>;

export const CRMHeatmap = (props: CRMHeatmapProps) => {
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';
    const { messageId } = useWidgetContext();

    // Register widget metadata to store
    React.useEffect(() => {
        if (messageId && props.title) {
            useCRMStore.getState().updateWidget(messageId, {
                title: props.title,
                componentName: 'CRMHeatmap',
                props: props
            });
        }
    }, [messageId, props.title, props]);

    const data: number[][] = props.data || (props as any).values || [];
    const xLabels = props.xLabels || [];
    const yLabels = props.yLabels || [];

    const maxValue = props.maxValue ?? (data.length > 0 ? Math.max(...data.flat()) : 100);
    const minValue = props.minValue ?? 0;

    const getColor = (value: number) => {
        const ratio = (value - minValue) / (maxValue - minValue || 1);
        // Simple opacity based color scale
        const alpha = Math.max(0.1, Math.min(1, ratio)); // min 10% opacity

        const colors = {
            green: isDark ? `rgba(74, 222, 128, ${alpha})` : `rgba(22, 163, 74, ${alpha})`,
            blue: isDark ? `rgba(96, 165, 250, ${alpha})` : `rgba(37, 99, 235, ${alpha})`,
            red: isDark ? `rgba(248, 113, 113, ${alpha})` : `rgba(220, 38, 38, ${alpha})`,
            orange: isDark ? `rgba(251, 146, 60, ${alpha})` : `rgba(234, 88, 12, ${alpha})`,
        };

        return colors[props.colorTheme || 'green'];
    };

    return (
        <div className={cn("p-4 rounded-2xl overflow-hidden flex flex-col h-full", props.className)}>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className={cn(
                        "font-medium text-sm uppercase tracking-wide",
                        isDark ? "text-zinc-400" : "text-zinc-500"
                    )}>{props.title}</h3>
                    {props.description && (
                        <p className={cn("text-xs mt-1", isDark ? "text-zinc-500" : "text-zinc-400")}>
                            {props.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-auto min-h-0">
                <div className="grid gap-1" style={{
                    gridTemplateColumns: `auto repeat(${xLabels.length}, minmax(40px, 1fr))`
                }}>
                    {/* Header Row */}
                    <div className="h-6"></div> {/* Top-left corner empty */}
                    {xLabels.map((label, i) => (
                        <div key={i} className={cn(
                            "text-xs font-medium text-center truncate px-1",
                            isDark ? "text-zinc-500" : "text-zinc-400"
                        )}>
                            {label}
                        </div>
                    ))}

                    {/* Data Rows */}
                    {yLabels.map((yLabel, rowIdx) => (
                        <React.Fragment key={rowIdx}>
                            {/* Y-Axis Label */}
                            <div className={cn(
                                "text-xs font-medium truncate pr-2 flex items-center justify-end",
                                isDark ? "text-zinc-500" : "text-zinc-400"
                            )}>
                                {yLabel}
                            </div>

                            {/* Cells */}
                            {data[rowIdx]?.map((value, colIdx) => (
                                <div
                                    key={`${rowIdx}-${colIdx}`}
                                    className="aspect-square rounded-md relative group flex items-center justify-center text-[10px]"
                                    style={{ backgroundColor: getColor(value) }}
                                    title={`${yLabel} x ${xLabels[colIdx]}: ${value}`}
                                >
                                    <span className={cn(
                                        "opacity-0 group-hover:opacity-100 font-semibold transition-opacity select-none",
                                        isDark ? "text-black mix-blend-screen" : "text-white"
                                    )}>
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </React.Fragment>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="mt-2 flex items-center justify-end gap-2 text-xs text-zinc-500">
                <span>Low</span>
                <div className="flex gap-0.5 h-2 w-16 rounded overflow-hidden">
                    {[0.1, 0.3, 0.5, 0.7, 0.9].map(alpha => (
                        <div key={alpha} className="flex-1" style={{
                            backgroundColor: props.colorTheme === 'blue'
                                ? (isDark ? `rgba(96, 165, 250, ${alpha})` : `rgba(37, 99, 235, ${alpha})`)
                                : (props.colorTheme === 'red'
                                    ? (isDark ? `rgba(248, 113, 113, ${alpha})` : `rgba(220, 38, 38, ${alpha})`)
                                    : (props.colorTheme === 'orange'
                                        ? (isDark ? `rgba(251, 146, 60, ${alpha})` : `rgba(234, 88, 12, ${alpha})`)
                                        : (isDark ? `rgba(74, 222, 128, ${alpha})` : `rgba(22, 163, 74, ${alpha})`)))
                        }} />
                    ))}
                </div>
                <span>High</span>
            </div>
        </div>
    );
};
