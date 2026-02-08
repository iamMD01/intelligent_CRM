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
} from "@/components/tambo/crm-components";
import { DataCard, dataCardSchema } from "@/components/ui/card-data";
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";
import { useCRMStore } from "@/lib/crm-store";

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
      }, 700); // 400ms transition + buffer

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
];
