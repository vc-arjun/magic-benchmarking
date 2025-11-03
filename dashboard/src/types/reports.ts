// Import types from parent directory first
import type {
  InitialLoadMetrics,
  ExecutionContext,
  Measurement,
  MetricStatistics,
  MetricMetadata,
  ContextResults,
  ProductResults,
  BenchmarkResults,
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

// Re-export all imported types
export type {
  InitialLoadMetrics,
  ExecutionContext,
  Measurement,
  MetricStatistics,
  MetricMetadata,
  ContextResults,
  ProductResults,
  BenchmarkResults,
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

// Dashboard-specific types
export interface ReportFile {
  name: string;
  content: BenchmarkResults | NetworkResults;
  type: 'performance' | 'network';
}
