import { ExecutionConfig, ExecutionMatrixConfig, ProductConfig } from './config';
import { SystemInfo } from '../utils/system-info';

export type InitialLoadMetrics =
  | 'click_to_content'
  | 'click_to_popup'
  | 'popup_to_content'
  | 'total_load_time'
  | 'content_to_interactive'
  | 'tti_internal';

export type ExecutionContext = {
  network: string;
  cpu: string;
  user_state: string;
  browser: string;
};

export type Measurement = {
  iteration: number;
  value: number;
  unit: string;
};

export type MetricStatistics = {
  min: number;
  max: number;
  mean: number;
  count: number;
};

export type MetricMetadata = {
  name: string;
  description: string;
};

export type ContextResults = {
  context: ExecutionContext;
  metrics: Record<
    InitialLoadMetrics,
    {
      measurements: Measurement[];
      statistics: MetricStatistics;
    }
  >;
};

export type ProductResults = {
  product: string;
  results: ContextResults[];
};

export type BenchmarkResults = {
  timestamp: string;
  execution_config: ExecutionConfig;
  execution_matrix: ExecutionMatrixConfig;
  products_config: ProductConfig[];
  metrics_metadata: Record<InitialLoadMetrics, MetricMetadata>;
  products: ProductResults[];
  system_info?: SystemInfo | undefined; // Optional for backward compatibility
};
