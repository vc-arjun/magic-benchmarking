// Import types from parent directory first
import type {
  InitialLoadMetrics,
  ExecutionContext,
  Measurement,
  MetricStatistics,
  MetricMetadata,
  ContextResults,
  ProductResults,
} from '../../../src/types/metrics';

import type {
  NetworkRequestType,
  NetworkRequest,
  RequestStatistics,
  RequestDependency,
  WaterfallEntry,
  NetworkAnalysis,
  ContextNetworkResults,
  NetworkResults,
} from '../../../src/types/network';

import type {
  ProductConfig,
  NetworkConfig,
  CPUConfig,
  UserStateConfig,
  BrowserType,
  ExecutionConfig,
  ExecutionMatrixConfig,
  OutputFormat,
  OutputConfig,
  Config,
} from '../../../src/types/config';

// Re-export all imported types with modifications for dashboard compatibility
export type {
  InitialLoadMetrics,
  ExecutionContext,
  Measurement,
  MetricStatistics,
  MetricMetadata,
  ContextResults,
  ProductResults,
  NetworkRequestType,
  NetworkRequest,
  RequestStatistics,
  RequestDependency,
  WaterfallEntry,
  NetworkAnalysis,
  ContextNetworkResults,
  NetworkResults,
  ProductConfig,
  NetworkConfig,
  CPUConfig,
  UserStateConfig,
  BrowserType,
  ExecutionConfig,
  ExecutionMatrixConfig,
  OutputFormat,
  OutputConfig,
  Config,
};

// Dashboard-specific types with backward compatibility
export type BenchmarkResults = {
  timestamp: string;
  execution_config: ExecutionConfig;
  execution_matrix: ExecutionMatrixConfig;
  products_config?: ProductConfig[]; // Optional for backward compatibility
  metrics_metadata: Record<InitialLoadMetrics, MetricMetadata>;
  products: ProductResults[];
};
export interface NetworkAnalysisReport {
  timestamp: string;
  monitoring_phase: string;
  description: string;
  products: NetworkResults[];
}

export interface ReportFile {
  name: string;
  content: BenchmarkResults | NetworkAnalysisReport;
  type: 'performance' | 'network';
}
