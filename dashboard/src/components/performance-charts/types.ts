export interface ChartDataPoint {
  contextKey: string;
  contextLabel: string;
  product: string;
  network: string;
  cpu: string;
  userState: string;
  browser: string;
  mean: number;
  min: number;
  max: number;
  measurements: number[];
}

export interface FilterState {
  selectedMetrics: string[];
  selectedProducts: string[];
  selectedNetworks: string[];
  selectedCpus: string[];
  selectedUserStates: string[];
  chartType: 'bar' | 'line';
}

export interface ContextLegendItem {
  index: number;
  contextKey: string;
  contextLabel: string;
}

export interface GroupedDataPoint {
  contextLabel: string;
  contextKey: string;
  shortLabel: string;
  contextIndex: number;
  [productName: string]: string | number; // Dynamic product data
}

export const CHART_COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7300',
  '#00ff00',
  '#ff00ff',
  '#00ffff',
  '#ff0000',
  '#0000ff',
  '#ffff00',
];
