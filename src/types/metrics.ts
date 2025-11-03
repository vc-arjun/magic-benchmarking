import { ExecutionConfig, ExecutionMatrixConfig } from './config';

export type InitialLoadMetrics =
  | 'click_to_content'
  | 'click_to_popup'
  | 'popup_to_content'
  | 'total_load_time'
  | 'content_to_interactive';

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
  metrics_metadata: Record<InitialLoadMetrics, MetricMetadata>;
  products: ProductResults[];
};
