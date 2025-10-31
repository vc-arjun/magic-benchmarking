import { Page } from 'playwright';
import { ProductConfig } from './config';

export interface POM {
  page: Page;
  productConfig: ProductConfig;
  initialize(): Promise<void>;
  cleanup(): Promise<void>;
  triggerCheckout(): Promise<void>;
}
