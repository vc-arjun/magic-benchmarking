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
};

export type CPUConfig = {
  rate: number;
};

export type UserStateConfig = {
  is_logged_in: boolean;
};

export type BrowserType = 'chromium' | 'firefox' | 'webkit';

export type ExecutionConfig = {
  iterations: number;
  timeout: number;
  headless: boolean;
  browsers: BrowserType[];
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
