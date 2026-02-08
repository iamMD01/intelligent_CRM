/**
 * @file tambo.ts
 * @description Central configuration file for Tambo components and tools
 */

import {
  CRMStatCard,
  crmStatCardSchema,
  CRMChart,
  crmChartSchema,
  CRMList,
  crmListSchema,
  CRMHeatmap,
  crmHeatmapSchema,
} from "@/components/tambo/crm-components";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { useCRMStore } from "@/lib/crm-store";
import { CRM_DATA } from "@/lib/mock-data";

/**
 * tools
 */
export const tools: TamboTool[] = [
  // We will add dashboard manipulation tools here later
  // For now, let's keep it simple or add a dummy tool to valid schema
  {
    name: "getCurrentDate",
    description: "Get the current date",
    tool: async () => new Date().toISOString(),
    inputSchema: z.object({}),
    outputSchema: z.string(),
  },
  {
    name: "fetchCRMData",
    description: "Simulate an MCP tool to fetch real CRM data (Deals, Pipeline, Revenue, Team). Always use this to get the latest source of truth.",
    inputSchema: z.object({
      query: z.string().describe("What data to fetch? (leads, deals, revenue, team, pipeline)"),
    }),
    outputSchema: z.string(),
    tool: async ({ query }) => {
      const q = query.toLowerCase();

      // Check for user-provided data override
      const store = useCRMStore.getState();
      const context = store.dataContext || {};

      let data: any = null;

      // Helper to check both context and mock
      const getData = (key: string, fallback: any) => {
        return context[key] || fallback;
      };

      if (q.includes("pipeline") || q.includes("stage")) {
        data = getData("pipeline", CRM_DATA.pipeline);
      } else if (q.includes("deal") || q.includes("recent")) {
        data = getData("recentDeals", CRM_DATA.recentDeals);
      } else if (q.includes("revenue") || q.includes("money") || q.includes("trend")) {
        data = getData("revenueHistory", CRM_DATA.revenueHistory);
      } else if (q.includes("team") || q.includes("rep") || q.includes("sales")) {
        data = getData("teamPerformance", CRM_DATA.teamPerformance);
      } else {
        data = {
          suggestedQueries: ["Show pipeline", "Recent deals", "Revenue history", "Team performance"],
          error: "Could not match query to data category."
        };
      }

      return JSON.stringify(data, null, 2);
    },
  },
  {
    name: "updateWidgetData",
    description: "Update an existing widget's data or appearance without recreating it. Use this for real-time adjustments (e.g., changing a single value, color, or label).",
    inputSchema: z.object({
      widgetId: z.string().optional().describe("The ID of the widget (preferred)"),
      widgetName: z.string().optional().describe("The fuzzy name/title of the widget if ID is unknown"),
      updates: z.object({
        value: z.union([z.string(), z.number()]).optional(),
        title: z.string().optional(),
        description: z.string().optional(),
        trend: z.string().optional(),
        trendValue: z.string().optional(),
        color: z.string().optional(),
        colorTheme: z.string().optional(),
        data: z.array(z.any()).optional(),
        items: z.array(z.any()).optional(),
        xLabels: z.array(z.string()).optional(),
        yLabels: z.array(z.string()).optional(),
        minValue: z.number().optional(),
        maxValue: z.number().optional(),
      }).describe("The new props to apply."),
    }),
    outputSchema: z.string(),
    tool: async ({ widgetId, widgetName, updates }) => {
      const store = useCRMStore.getState();
      const widgets = store.widgets;

      let targetWidget = null;
      if (widgetId) targetWidget = widgets.find(w => w.id === widgetId);
      if (!targetWidget && widgetName) {
        const lower = widgetName.toLowerCase();
        targetWidget = widgets.find(w => w.title.toLowerCase().includes(lower));
      }

      if (!targetWidget) return "Could not find widget to update.";

      // Apply the update
      store.updateWidget(targetWidget.id, { props: updates });

      // Also focus it to show the change
      store.setFocusing(true);
      setTimeout(() => store.setFocusing(false), 1700);

      return `Successfully updated ${targetWidget.title}.`;
    }
  },
  {
    name: "focusOnWidget",
    description: "Pan and zoom the canvas to focus on a specific widget. Use this when discussing a specific chart or metric.",
    inputSchema: z.object({
      widgetId: z.string().optional().describe("The exact ID of the widget (preferred)"),
      widgetName: z.string().optional().describe("The fuzzy name/title of the widget if ID is unknown"),
    }),
    outputSchema: z.string(),
    tool: async ({ widgetId, widgetName }) => {
      const store = useCRMStore.getState();
      const widgets = store.widgets;

      let targetWidget = null;

      if (widgetId) {
        targetWidget = widgets.find(w => w.id === widgetId);
      }

      if (!targetWidget && widgetName) {
        // Simple fuzzy match
        const lowerName = widgetName.toLowerCase();
        targetWidget = widgets.find(w =>
          w.title.toLowerCase().includes(lowerName) ||
          w.componentName.toLowerCase().includes(lowerName)
        );
      }

      if (!targetWidget) {
        return `Could not find widget. Available widgets: ${widgets.map(w => w.title).join(", ")}`;
      }

      // Calculate center position
      // We want the widget center to be at the screen center
      // Screen Center (approx) = Window Width/2, Window Height/2
      // But we don't have window access easily in non-component, so assume 1920x1080 or better yet, 
      // just center relative to current view if possible.
      // Actually, we can assume standard viewport center is good enough target.

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Target Zoom - fit widget comfortably
      // Let's aim for the widget to take up about 40-50% of the screen min dimension
      const widgetSize = Math.max(targetWidget.size.width, targetWidget.size.height);
      const screenSize = Math.min(viewportWidth, viewportHeight);

      // Clamp zoom between 0.5 and 1.5
      const targetZoom = Math.min(Math.max(screenSize / (widgetSize * 1.5), 0.5), 1.5);

      // Calculate widget center in world coordinates
      const widgetCenterX = targetWidget.position.x + targetWidget.size.width / 2;
      const widgetCenterY = targetWidget.position.y + targetWidget.size.height / 2;

      // Calculate required offset
      // ScreenCenter = (WorldPos + Offset) * Zoom
      // Offset = (ScreenCenter / Zoom) - WorldPos

      const targetOffsetX = (viewportWidth / 2) / targetZoom - widgetCenterX;
      const targetOffsetY = (viewportHeight / 2) / targetZoom - widgetCenterY;

      // Apply changes with animation flag
      store.setFocusing(true);
      store.setZoomLevel(targetZoom);
      store.setCanvasOffset({ x: targetOffsetX, y: targetOffsetY });

      // Also select it for visual flair
      store.selectWidgetForChat(targetWidget.id);

      // Turn off animation flag after transition finishes (plus buffer)
      setTimeout(() => {
        store.setFocusing(false);
      }, 1700); // 1.6s transition + buffer

      return `Focused on widget: ${targetWidget.title}`;
    }
  }
];

/**
 * components
 */
export const components: TamboComponent[] = [
  {
    name: "StatCard",
    description: "Display a single key metric (revenue, users, etc) with a trend indicator.",
    component: CRMStatCard,
    propsSchema: crmStatCardSchema,
  },
  {
    name: "Chart",
    description: "Display a visual chart (bar, line, pie) for data trends.",
    component: CRMChart,
    propsSchema: crmChartSchema,
  },
  {
    name: "List",
    description: "Display a list of items, transactions, or tasks.",
    component: CRMList,
    propsSchema: crmListSchema,
  },
  {
    name: "DataCard",
    description: "Display selectable data cards with titles, descriptions, and optional links.",
    component: DataCard,
    propsSchema: dataCardSchema,
  },
  {
    name: "Heatmap",
    description: "Display a 2D heatmap grid. Useful for time-based activity (Day x Hour), cohort analysis (Month x Month), or correlation matrices.",
    component: CRMHeatmap,
    propsSchema: crmHeatmapSchema,
  },
];
