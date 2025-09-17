import { supabase } from "@/integrations/supabase/client";

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
    const content = `${category}:${description}:${imageDataUrl.slice(0, 100)}`;
    return btoa(content).slice(0, 32);
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
        console.log('Using cached Google Vision result');
        return cached.result;
      }

      console.log(`Attempting Google Vision API for category: ${category}`);

      // Call Supabase edge function
      const { data, error } = await supabase.functions.invoke('google-vision-verify', {
        body: {
          imageDataUrl,
          description,
          category
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        console.log('Falling back to local image verification');
        
        // Fallback to local verification from old service
        const { ImageVerificationService: LocalVerificationService } = await import("@/services/imageVerification");
        return await LocalVerificationService.verifyImage(imageDataUrl, description, category);
      }

      const result: VerificationResult = data;

      // Cache the result
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });

      return result;

    } catch (error) {
      console.error('Google Vision verification error:', error);
      console.log('Falling back to local image verification');
      
      try {
        // Fallback to local verification
        const { ImageVerificationService: LocalVerificationService } = await import("@/services/imageVerification");
        return await LocalVerificationService.verifyImage(imageDataUrl, description, category);
      } catch (fallbackError) {
        console.error('Fallback verification also failed:', fallbackError);
        return {
          isValid: false,
          confidence: 0,
          reason: 'Both Google Vision and local verification failed'
        };
      }
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