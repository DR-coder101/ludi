export class RateLimiter {
  private limits = new Map<string, number[]>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 10, windowMs = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.limits.get(key) || [];
    
    const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
    
    if (validTimestamps.length >= this.maxRequests) {
      this.limits.set(key, validTimestamps);
      return false;
    }
    
    validTimestamps.push(now);
    this.limits.set(key, validTimestamps);
    return true;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.limits.entries()) {
      const validTimestamps = timestamps.filter(ts => now - ts < this.windowMs);
      if (validTimestamps.length === 0) {
        this.limits.delete(key);
      } else {
        this.limits.set(key, validTimestamps);
      }
    }
  }
}
