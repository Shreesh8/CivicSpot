import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";

interface VerificationResult {
  isValid: boolean;
  confidence: number;
  reason?: string;
}

interface CacheEntry {
  result: VerificationResult;
  timestamp: number;
}

export class GoogleVisionService {
  private static cache = new Map<string, CacheEntry>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private static generateCacheKey(imageDataUrl: string, description: string, category: string): string {
    // Use more of the image data for uniqueness - sample from different parts of the base64 string
    const imageLength = imageDataUrl.length;
    const startSample = imageDataUrl.slice(50, 150);
    const middleSample = imageDataUrl.slice(Math.floor(imageLength / 2), Math.floor(imageLength / 2) + 100);
    const endSample = imageDataUrl.slice(-100);
    const content = `${category}:${description}:${startSample}:${middleSample}:${endSample}`;
    // Create a simple hash for the cache key
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return `${category}_${Math.abs(hash).toString(36)}`;
  }

  private static cleanCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(key);
      }
    }
  }

  static async verifyImage(
    imageDataUrl: string, 
    description: string, 
    category: string
  ): Promise<VerificationResult> {
    try {
      // Clean old cache entries
      this.cleanCache();
      
      // Check cache first
      const cacheKey = this.generateCacheKey(imageDataUrl, description, category);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        logger.log('Using cached Google Vision result');
        return cached.result;
      }

      logger.log(`Attempting Google Vision API for category: ${category}`);

      // Call Supabase edge function
      const { data, error } = await supabase.functions.invoke('google-vision-verify', {
        body: {
          imageDataUrl,
          description,
          category
        }
      });

      if (error) {
        logger.error('Google Vision API error:', error);
        return {
          isValid: false,
          confidence: 0,
          reason: `Google Vision API failed: ${error.message}`
        };
      }

      const result: VerificationResult = data;

      // Cache the result
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      logger.error('Google Vision verification error:', error);
      return {
        isValid: false,
        confidence: 0,
        reason: `Google Vision verification failed: ${error.message}`
      };
    }
  }

  // Maintain compatibility with old service
  static async preload(): Promise<boolean> {
    return true; // Google Vision API is always ready
  }

  static isReady(): boolean {
    return true; // Google Vision API is always ready
  }
}

// Export for backward compatibility
export { GoogleVisionService as ImageVerificationService };