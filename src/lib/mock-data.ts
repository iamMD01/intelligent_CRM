export const CRM_DATA = {
    pipeline: [
        { stage: "Lead", count: 45, value: 120000 },
        { stage: "Contacted", count: 28, value: 85000 },
        { stage: "Proposal", count: 12, value: 320000 },
        { stage: "Won", count: 8, value: 150000 },
    ],
    recentDeals: [
        { id: "d1", company: "Acme Corp", value: 50000, stage: "Won", owner: "Sarah" },
        { id: "d2", company: "Globex Inc", value: 12000, stage: "Proposal", owner: "Mike" },
        { id: "d3", company: "Soylent Corp", value: 85000, stage: "Contacted", owner: "Sarah" },
        { id: "d4", company: "Initech", value: 24000, stage: "Lead", owner: "Jessica" },
        { id: "d5", company: "Umbrella Corp", value: 110000, stage: "Won", owner: "Mike" },
    ],
    revenueHistory: [
        { month: "Jan", revenue: 45000 },
        { month: "Feb", revenue: 52000 },
        { month: "Mar", revenue: 48000 },
        { month: "Apr", revenue: 61000 },
        { month: "May", revenue: 58000 },
        { month: "Jun", revenue: 75000 },
    ],
    teamPerformance: [
        { name: "Sarah", deals: 12, value: 450000 },
        { name: "Mike", deals: 8, value: 320000 },
        { name: "Jessica", deals: 15, value: 280000 },
    ]
};

export type CRMDataQuery = "pipeline" | "deals" | "revenue" | "team" | "summary";
