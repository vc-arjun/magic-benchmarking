import { ExecutionContext } from './metrics';

export type NetworkRequestType =
  | 'document'
  | 'script'
  | 'stylesheet'
  | 'image'
  | 'font'
  | 'xhr'
  | 'fetch'
  | 'other';

export type NetworkRequest = {
  id: string;
  url: string;
  method: string;
  type: NetworkRequestType;
  startTime: number; // Relative to monitoring start
  endTime: number;
  duration: number;
  status: number;
  size: number; // Response size in bytes
  initiator?: string | undefined; // What initiated this request
  parentRequestId?: string; // For dependency tracking
  iteration: number;
  timestamp: string; // Absolute timestamp
};

export type RequestStatistics = {
  url: string;
  method: string;
  type: NetworkRequestType;
  measurements: {
    iteration: number;
    duration: number;
    status: number;
    size: number;
    startTime: number;
    endTime: number;
  }[];
  statistics: {
    min: number;
    max: number;
    mean: number;
    count: number;
  };
};

export type RequestDependency = {
  parentId: string;
  childId: string;
  parentUrl: string;
  childUrl: string;
  dependencyType: 'blocking' | 'parallel' | 'sequential';
  timingRelation: 'before' | 'during' | 'after';
};

export type WaterfallEntry = {
  id: string;
  url: string;
  type: NetworkRequestType;
  startTime: number;
  duration: number;
  level: number; // Depth in dependency tree
  dependencies: string[]; // IDs of requests this depends on
  dependents: string[]; // IDs of requests that depend on this
  isParallel: boolean;
  criticalPath: boolean; // Is this on the critical path?
};

export type NetworkAnalysis = {
  totalRequests: number;
  totalDuration: number;
  criticalPathDuration: number;
  parallelRequests: number;
  sequentialRequests: number;
  requestsByType: Record<NetworkRequestType, number>;
  largestRequest: {
    url: string;
    size: number;
    duration: number;
  };
  slowestRequest: {
    url: string;
    duration: number;
  };
  waterfall: WaterfallEntry[];
  dependencies: RequestDependency[];
};

export type ContextNetworkResults = {
  context: ExecutionContext;
  requests: RequestStatistics[];
  analysis: NetworkAnalysis;
};

export type NetworkResults = {
  product: string;
  timestamp: string;
  monitoringPhase: 'popup_to_interactive';
  results: ContextNetworkResults[];
};
