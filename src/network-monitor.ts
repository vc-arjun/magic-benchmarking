import { Page, Request, Response } from 'playwright';
import { 
  NetworkRequest, 
  RequestStatistics, 
  NetworkAnalysis, 
  WaterfallEntry, 
  RequestDependency,
  NetworkRequestType,
  ContextNetworkResults
} from './types/network';
import { ExecutionContext } from './types/metrics';

export class NetworkMonitor {
  private page: Page | null = null;
  private isMonitoring: boolean = false;
  private monitoringStartTime: number = 0;
  private requests: Map<string, NetworkRequest[]> = new Map(); // contextKey -> requests
  private currentContext: ExecutionContext | null = null;
  private currentIteration: number = 0;
  private requestIdCounter: number = 0;

  constructor() {}

  public setPage(page: Page): void {
    this.page = page;
  }

  public setExecutionContext(context: ExecutionContext, iteration: number): void {
    this.currentContext = context;
    this.currentIteration = iteration;
  }

  /**
   * Start monitoring network requests
   */
  public async startMonitoring(): Promise<void> {
    if (!this.page || !this.currentContext) {
      throw new Error('Page and execution context must be set before starting monitoring');
    }

    this.isMonitoring = true;
    this.monitoringStartTime = Date.now();

    // Listen to all network events
    this.page.on('request', this.handleRequest.bind(this));
    this.page.on('response', this.handleResponse.bind(this));
    this.page.on('requestfailed', this.handleRequestFailed.bind(this));
  }

  /**
   * Stop monitoring network requests
   */
  public async stopMonitoring(): Promise<void> {
    if (!this.page) return;

    this.isMonitoring = false;

    // Remove listeners
    this.page.off('request', this.handleRequest.bind(this));
    this.page.off('response', this.handleResponse.bind(this));
    this.page.off('requestfailed', this.handleRequestFailed.bind(this));
  }

  /**
   * Handle request event
   */
  private async handleRequest(request: Request): Promise<void> {
    if (!this.isMonitoring || !this.shouldTrackRequest(request)) {
      return;
    }

    const requestId = `req_${++this.requestIdCounter}_${this.currentIteration}`;
    const startTime = Date.now() - this.monitoringStartTime;

    // Create network request object (will be completed when response arrives)
    const networkRequest: Partial<NetworkRequest> = {
      id: requestId,
      url: request.url(),
      method: request.method(),
      type: this.getRequestType(request),
      startTime,
      iteration: this.currentIteration,
      timestamp: new Date().toISOString(),
      initiator: this.getInitiator(request) || undefined,
    };

    // Store temporarily until response
    (request as Request & { _networkRequestData?: Partial<NetworkRequest> })._networkRequestData = networkRequest;
  }

  /**
   * Handle response event
   */
  private async handleResponse(response: Response): Promise<void> {
    const request = response.request();
    const networkRequestData = (request as Request & { _networkRequestData?: Partial<NetworkRequest> })._networkRequestData;

    if (!networkRequestData || !this.isMonitoring) {
      return;
    }

    const endTime = Date.now() - this.monitoringStartTime;
    const duration = endTime - (networkRequestData.startTime || 0);

    // Complete the network request
    const networkRequest: NetworkRequest = {
      ...networkRequestData,
      endTime,
      duration,
      status: response.status(),
      size: await this.getResponseSize(response),
    } as NetworkRequest;

    this.addRequest(networkRequest);
  }

  /**
   * Handle failed request event
   */
  private async handleRequestFailed(request: Request): Promise<void> {
    const networkRequestData = (request as Request & { _networkRequestData?: Partial<NetworkRequest> })._networkRequestData;

    if (!networkRequestData || !this.isMonitoring) {
      return;
    }

    const endTime = Date.now() - this.monitoringStartTime;
    const duration = endTime - (networkRequestData.startTime || 0);

    // Complete the failed network request
    const networkRequest: NetworkRequest = {
      ...networkRequestData,
      endTime,
      duration,
      status: 0, // Failed request
      size: 0,
    } as NetworkRequest;

    this.addRequest(networkRequest);
  }

  /**
   * Check if request should be tracked
   */
  private shouldTrackRequest(request: Request): boolean {
    const url = request.url();
    const razorpayPattern = /(?:rzp|razorpay)/i;
    
    // First check if it's a Razorpay request
    if (!razorpayPattern.test(url)) {
      return false;
    }
    
    // Exclude images
    if (request.resourceType() === 'image') {
      return false;
    }
    
    // Exclude specific patterns we don't want to track
    const excludePatterns = [
      /analytics\.google\.com/i,
      /lumberjack\.razorpay\.com/i,
      /facebook\.com/i,
      /\/magic\/analytics/i,
    ];
    
    // Check if URL matches any exclude pattern
    for (const pattern of excludePatterns) {
      if (pattern.test(url)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Get request type from Playwright request
   */
  private getRequestType(request: Request): NetworkRequestType {
    const resourceType = request.resourceType();
    
    switch (resourceType) {
      case 'document': return 'document';
      case 'script': return 'script';
      case 'stylesheet': return 'stylesheet';
      case 'image': return 'image';
      case 'font': return 'font';
      case 'xhr': return 'xhr';
      case 'fetch': return 'fetch';
      default: return 'other';
    }
  }

  /**
   * Get request initiator information
   */
  private getInitiator(request: Request): string | undefined {
    try {
      // Try to get initiator from headers or frame
      const frame = request.frame();
      return frame ? frame.url() : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Get response size
   */
  private async getResponseSize(response: Response): Promise<number> {
    try {
      const headers = response.headers();
      const contentLength = headers['content-length'];
      if (contentLength) {
        return parseInt(contentLength, 10);
      }
      
      // Fallback: try to get body size
      const body = await response.body().catch(() => null);
      return body ? body.length : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Add request to storage
   */
  private addRequest(request: NetworkRequest): void {
    if (!this.currentContext) return;

    const contextKey = this.getContextKey(this.currentContext);
    
    if (!this.requests.has(contextKey)) {
      this.requests.set(contextKey, []);
    }
    
    this.requests.get(contextKey)!.push(request);
  }

  /**
   * Generate context key
   */
  private getContextKey(context: ExecutionContext): string {
    return `${context.network}|${context.cpu}|${context.user_state}|${context.browser}`;
  }

  /**
   * Get all network results organized by context
   */
  public getNetworkResults(): ContextNetworkResults[] {
    const results: ContextNetworkResults[] = [];

    for (const [contextKey, requests] of this.requests) {
      const [network, cpu, user_state, browser] = contextKey.split('|');
      
      const context: ExecutionContext = {
        network,
        cpu,
        user_state,
        browser,
      };

      // Group requests by URL and calculate statistics
      const requestStats = this.calculateRequestStatistics(requests);
      
      // Analyze network patterns
      const analysis = this.analyzeNetworkPatterns(requests);

      results.push({
        context,
        requests: requestStats,
        analysis,
      });
    }

    return results;
  }

  /**
   * Calculate statistics for each unique request URL
   */
  private calculateRequestStatistics(requests: NetworkRequest[]): RequestStatistics[] {
    const requestGroups = new Map<string, NetworkRequest[]>();

    // Group by URL + method
    for (const request of requests) {
      const groupKey = `${request.method}:${request.url}`;
      if (!requestGroups.has(groupKey)) {
        requestGroups.set(groupKey, []);
      }
      requestGroups.get(groupKey)!.push(request);
    }

    const statistics: RequestStatistics[] = [];

    for (const [, requestList] of requestGroups) {
      const firstRequest = requestList[0];
      const durations = requestList.map(r => r.duration);
      
      const stats: RequestStatistics = {
        url: firstRequest.url,
        method: firstRequest.method,
        type: firstRequest.type,
        measurements: requestList.map(r => ({
          iteration: r.iteration,
          duration: r.duration,
          status: r.status,
          size: r.size,
          startTime: r.startTime,
          endTime: r.endTime,
        })),
        statistics: {
          min: Math.min(...durations),
          max: Math.max(...durations),
          mean: Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 100) / 100,
          count: durations.length,
        },
      };

      statistics.push(stats);
    }

    return statistics.sort((a, b) => a.measurements[0]?.startTime - b.measurements[0]?.startTime);
  }

  /**
   * Analyze network patterns and dependencies
   */
  private analyzeNetworkPatterns(requests: NetworkRequest[]): NetworkAnalysis {
    // Sort requests by start time for analysis
    const sortedRequests = [...requests].sort((a, b) => a.startTime - b.startTime);
    
    // Calculate basic metrics
    const totalRequests = requests.length;
    const totalDuration = Math.max(...requests.map(r => r.endTime)) - Math.min(...requests.map(r => r.startTime));
    
    // Analyze request types
    const requestsByType: Record<NetworkRequestType, number> = {
      document: 0, script: 0, stylesheet: 0, image: 0, 
      font: 0, xhr: 0, fetch: 0, other: 0
    };
    
    for (const request of requests) {
      requestsByType[request.type]++;
    }

    // Find largest and slowest requests
    const largestRequest = requests.reduce((max, req) => 
      req.size > max.size ? req : max, requests[0] || { url: '', size: 0, duration: 0 });
    
    const slowestRequest = requests.reduce((max, req) => 
      req.duration > max.duration ? req : max, requests[0] || { url: '', duration: 0 });

    // Build waterfall and analyze dependencies
    const { waterfall, dependencies } = this.buildWaterfall(sortedRequests);
    
    // Calculate critical path
    const criticalPathDuration = this.calculateCriticalPath(waterfall);
    
    // Count parallel vs sequential requests
    const { parallelRequests, sequentialRequests } = this.analyzeParallelism(waterfall);

    return {
      totalRequests,
      totalDuration: Math.round(totalDuration * 100) / 100,
      criticalPathDuration: Math.round(criticalPathDuration * 100) / 100,
      parallelRequests,
      sequentialRequests,
      requestsByType,
      largestRequest: {
        url: largestRequest.url,
        size: largestRequest.size,
        duration: Math.round(largestRequest.duration * 100) / 100,
      },
      slowestRequest: {
        url: slowestRequest.url,
        duration: Math.round(slowestRequest.duration * 100) / 100,
      },
      waterfall,
      dependencies,
    };
  }

  /**
   * Build waterfall visualization data
   */
  private buildWaterfall(requests: NetworkRequest[]): { waterfall: WaterfallEntry[]; dependencies: RequestDependency[] } {
    const waterfall: WaterfallEntry[] = [];
    const dependencies: RequestDependency[] = [];

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i];
      const dependsOn: string[] = [];
      const dependents: string[] = [];

      // Simple dependency detection based on timing and type
      for (let j = 0; j < i; j++) {
        const prevRequest = requests[j];
        
        // If this request started after another ended, it might depend on it
        if (request.startTime >= prevRequest.endTime - 50) { // 50ms tolerance
          // Check if it's a logical dependency (e.g., script loading after document)
          if (this.isLogicalDependency(prevRequest, request)) {
            dependsOn.push(prevRequest.id);
            dependencies.push({
              parentId: prevRequest.id,
              childId: request.id,
              parentUrl: prevRequest.url,
              childUrl: request.url,
              dependencyType: 'sequential',
              timingRelation: 'after',
            });
          }
        }
      }

      // Find dependents (requests that depend on this one)
      for (let j = i + 1; j < requests.length; j++) {
        const nextRequest = requests[j];
        if (nextRequest.startTime >= request.endTime - 50 && this.isLogicalDependency(request, nextRequest)) {
          dependents.push(nextRequest.id);
        }
      }

      waterfall.push({
        id: request.id,
        url: request.url,
        type: request.type,
        startTime: Math.round(request.startTime * 100) / 100,
        duration: Math.round(request.duration * 100) / 100,
        level: dependsOn.length, // Simple level calculation
        dependencies: dependsOn,
        dependents,
        isParallel: dependsOn.length === 0 && i > 0, // Simplified parallel detection
        criticalPath: false, // Will be calculated separately
      });
    }

    // Mark critical path
    this.markCriticalPath(waterfall);

    return { waterfall, dependencies };
  }

  /**
   * Check if one request logically depends on another
   */
  private isLogicalDependency(parent: NetworkRequest, child: NetworkRequest): boolean {
    // Document loads first, then scripts/styles
    if (parent.type === 'document' && (child.type === 'script' || child.type === 'stylesheet')) {
      return true;
    }
    
    // Scripts might load other resources
    if (parent.type === 'script' && (child.type === 'xhr' || child.type === 'fetch')) {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate critical path duration
   */
  private calculateCriticalPath(waterfall: WaterfallEntry[]): number {
    // Simple critical path: longest chain of dependencies
    let maxPath = 0;
    
    for (const entry of waterfall) {
      const pathLength = this.getPathLength(entry, waterfall);
      if (pathLength > maxPath) {
        maxPath = pathLength;
      }
    }
    
    return maxPath;
  }

  /**
   * Get path length for critical path calculation
   */
  private getPathLength(entry: WaterfallEntry, waterfall: WaterfallEntry[]): number {
    if (entry.dependencies.length === 0) {
      return entry.startTime + entry.duration;
    }
    
    let maxDependencyPath = 0;
    for (const depId of entry.dependencies) {
      const dep = waterfall.find(w => w.id === depId);
      if (dep) {
        const depPath = this.getPathLength(dep, waterfall);
        if (depPath > maxDependencyPath) {
          maxDependencyPath = depPath;
        }
      }
    }
    
    return maxDependencyPath + entry.duration;
  }

  /**
   * Mark entries on critical path
   */
  private markCriticalPath(waterfall: WaterfallEntry[]): void {
    // Find the entry with the longest total path
    let longestPathEntry: WaterfallEntry | null = null;
    let longestPath = 0;
    
    for (const entry of waterfall) {
      const pathLength = this.getPathLength(entry, waterfall);
      if (pathLength > longestPath) {
        longestPath = pathLength;
        longestPathEntry = entry;
      }
    }
    
    // Mark the critical path
    if (longestPathEntry) {
      this.markPathAsCritical(longestPathEntry, waterfall);
    }
  }

  /**
   * Recursively mark path as critical
   */
  private markPathAsCritical(entry: WaterfallEntry, waterfall: WaterfallEntry[]): void {
    entry.criticalPath = true;
    
    for (const depId of entry.dependencies) {
      const dep = waterfall.find(w => w.id === depId);
      if (dep && !dep.criticalPath) {
        this.markPathAsCritical(dep, waterfall);
      }
    }
  }

  /**
   * Analyze parallelism in requests
   */
  private analyzeParallelism(waterfall: WaterfallEntry[]): { parallelRequests: number; sequentialRequests: number } {
    let parallelRequests = 0;
    let sequentialRequests = 0;
    
    for (const entry of waterfall) {
      if (entry.isParallel) {
        parallelRequests++;
      } else {
        sequentialRequests++;
      }
    }
    
    return { parallelRequests, sequentialRequests };
  }

  /**
   * Reset all stored data
   */
  public reset(): void {
    this.requests.clear();
    this.requestIdCounter = 0;
  }
}
