export interface POM {
  initialize(): Promise<void>;
  triggerCheckout(skipMetrics: boolean): Promise<void>;
}
