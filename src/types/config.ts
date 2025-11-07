export type ConnectionType = 'cellular3g' | 'cellular4g' | 'wifi';

export type ProductConfig = {
  name: string;
  entry_url: string;
  pom_file: string;
  enabled: boolean;
};

export type NetworkConfig = {
  download_throughput: number;
  upload_throughput: number;
  latency: number;
  enabled: boolean;
  connection_type: ConnectionType;
};

export type CPUConfig = {
  rate: number;
  enabled: boolean;
};

export type UserStateConfig = {
  is_logged_in: boolean;
  enabled: boolean;
};

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export type ViewportConfig = {
  width: number;
  height: number;
};

export type ExecutionConfig = {
  iterations: number;
  timeout: number;
  headless: boolean;
  browsers: BrowserType[];
  viewport: ViewportConfig;
  retry: {
    max_attempts: number;
    delay_between_retries: number;
  };
};

export type ExecutionMatrixConfig = {
  network: Record<string, NetworkConfig>;
  cpu: Record<string, CPUConfig>;
  user_state: Record<string, UserStateConfig>;
};

export type OutputFormat = 'csv' | 'json' | 'html';

export type OutputConfig = {
  formats: OutputFormat[];
  directory: string;
};

export type Config = {
  products: ProductConfig[];
  execution_matrix: ExecutionMatrixConfig;
  execution: ExecutionConfig;
  output: OutputConfig;
};
