"use client";

import React from "react";
import { useCRMStore, CRMWidget } from "@/lib/crm-store";
import { CRMStatCard, CRMChart, CRMList } from "@/components/tambo/crm-components";
import { cn } from "@/lib/utils";
import { Trash2, Edit2, Move } from "lucide-react";

const WidgetRenderer = ({ widget }: { widget: CRMWidget }) => {
    const { removeWidget } = useCRMStore();

    const renderContent = () => {
        switch (widget.type) {
            case "stat":
                return <CRMStatCard {...widget.data} className="h-full shadow-none border-0" />;
            case "chart":
                return <CRMChart {...widget.data} className="h-full shadow-none border-0" />;
            case "list":
                return <CRMList {...widget.data} className="h-full shadow-none border-0" />;
            default:
                return <div>Unknown widget type</div>;
        }
    };

    return (
        <div className={cn(
            "group relative bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md",
            widget.type === "chart" ? "col-span-1 md:col-span-2 row-span-2 min-h-[400px]" : "col-span-1 min-h-[200px]"
        )}>
            {/* Action Overlay */}
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
                    <Edit2 size={14} className="text-zinc-500" />
                </button>
                <button
                    onClick={() => removeWidget(widget.id)}
                    className="p-2 bg-red-50 dark:bg-red-900/20 rounded-full hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                    <Trash2 size={14} className="text-red-500" />
                </button>
            </div>

            {/* Content */}
            <div className="h-full">
                {renderContent()}
            </div>
        </div>
    );
};

export const BentoGrid = () => {
    const { widgets } = useCRMStore();

    if (widgets.length === 0) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center opacity-50">
                <div className="max-w-md space-y-4">
                    {/* Placeholder empty state */}
                    <div className="text-lg font-medium text-zinc-400">Your canvas is empty</div>
                    <p className="text-sm text-zinc-500">Ask the AI to create a chart, list, or stat card for you.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 pb-32 max-w-[1800px] mx-auto auto-rows-[minmax(200px,auto)]">
            {widgets.map((widget) => (
                <WidgetRenderer key={widget.id} widget={widget} />
            ))}
        </div>
    );
};
