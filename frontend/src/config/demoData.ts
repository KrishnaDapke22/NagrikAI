export interface PlatformStats {
  totalAnalyzed: number;
  resolved: number;
  avgResolutionDays: number;
  satisfactionRate: number;
}

export const FALLBACK_PLATFORM_STATS: PlatformStats = {
  totalAnalyzed: 1284,
  resolved: 815,
  avgResolutionDays: 2.8,
  satisfactionRate: 98,
};

export interface CivicHotspot {
  area: string;
  count: number;
  primaryCategory: string;
  trend: string;
}

export const CIVIC_HOTSPOTS: CivicHotspot[] = [
  { area: 'Pimpri Central', count: 12, primaryCategory: 'Roads', trend: '+3 today' },
  { area: 'Hinjawadi Phase 1', count: 9, primaryCategory: 'Traffic', trend: '+1 today' },
  { area: 'Wakad Bridge', count: 7, primaryCategory: 'Water', trend: 'Active hotspot' },
  { area: 'Kothrud Ward 12', count: 6, primaryCategory: 'Electricity', trend: '2 in progress' },
  { area: 'College Road', count: 4, primaryCategory: 'Sanitation', trend: 'Resolving' },
];

export const AI_CIVIC_INSIGHTS: string[] = [
  'Street-light complaints increased 18% this week across peripheral transit corridors.',
  '7 complaints appear related to the same primary distribution junction near Ward 4.',
  'Road maintenance currently has the highest unresolved workload across municipal sectors.',
  'Average resolution time for electricity complaints has decreased from 3.4 to 1.8 days.',
];
