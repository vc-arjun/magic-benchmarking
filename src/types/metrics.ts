export type InitialLoadMetrics =
  | 'click_to_content'
  | 'click_to_popup'
  | 'popup_to_content'
  | 'total_load_time'
  | 'content_to_interactive';

export type MetricsResult = {
  value: number;
  unit: string;
};

export type Metrics = {
  initial_load: Record<InitialLoadMetrics, MetricsResult[]>;
};
