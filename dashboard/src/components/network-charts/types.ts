import { NetworkRequestType } from '@/types/reports';

export interface NetworkChartDataPoint {
  url: string;
  method: string;
  type: NetworkRequestType;
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
  count: number;
  measurements: {
    iteration: number;
    duration: number;
    status: number;
    size: number;
    startTime: number;
    endTime: number;
  }[];
}

export interface NetworkFilterState {
  selectedRequestTypes: NetworkRequestType[];
  selectedProducts: string[];
  selectedNetworks: string[];
  selectedCpus: string[];
  selectedUserStates: string[];
  selectedUrls: string[];
  chartType: 'bar' | 'line';
  viewType: 'latency' | 'size' | 'status';
}

export interface WaterfallDataPoint {
  id: string;
  url: string;
  shortUrl: string;
  type: NetworkRequestType;
  method: string;
  startTime: number;
  duration: number;
  endTime: number;
  status: number;
  size: number;
  iteration: number;
  level: number;
  color: string;
}

export interface RequestGroupData {
  url: string;
  shortUrl: string;
  method: string;
  type: NetworkRequestType;
  contextLabel: string;
  contextKey: string;
  shortLabel: string;
  contextIndex: number;
  [productName: string]: string | number | any[]; // Dynamic product data
}

export interface NetworkContextLegendItem {
  index: number;
  contextKey: string;
  contextLabel: string;
}

export const REQUEST_TYPE_COLORS: Record<NetworkRequestType, string> = {
  document: '#8884d8',
  script: '#82ca9d',
  stylesheet: '#ffc658',
  image: '#ff7300',
  font: '#00ff00',
  xhr: '#ff00ff',
  fetch: '#00ffff',
  other: '#ff0000',
};

export const NETWORK_CHART_COLORS = [
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
