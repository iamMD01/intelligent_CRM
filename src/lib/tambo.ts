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
import type { TamboComponent } from "@tambo-ai/react";
import { TamboTool } from "@tambo-ai/react";
import { z } from "zod";

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
];
