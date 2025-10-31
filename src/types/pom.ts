export interface POM {
  initialize(): Promise<void>;
  triggerCheckout(): Promise<void>;
}
