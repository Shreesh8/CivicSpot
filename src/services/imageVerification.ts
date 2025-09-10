import { pipeline, env } from '@huggingface/transformers';

// Configure transformers.js
env.allowLocalModels = false;
env.useBrowserCache = true;

interface VerificationResult {
  isValid: boolean;
  confidence: number;
  reason?: string;
}

export class ImageVerificationService {
  private static classifier: any = null;
  private static isInitializing = false;
  private static initialized = false;

  private static async initializeClassifier() {
    if (this.initialized || this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    try {
      console.log('Initializing image-text classifier...');
      this.classifier = await pipeline(
        'zero-shot-image-classification',
        'Xenova/clip-vit-base-patch32',
        { device: 'webgpu' }
      );
      this.initialized = true;
      console.log('Image classifier initialized successfully');
    } catch (error) {
      console.error('Failed to initialize classifier:', error);
      // Fallback to CPU if WebGPU fails
      try {
        this.classifier = await pipeline(
          'zero-shot-image-classification',
          'Xenova/clip-vit-base-patch32'
        );
        this.initialized = true;
        console.log('Image classifier initialized with CPU fallback');
      } catch (fallbackError) {
        console.error('Failed to initialize classifier with CPU fallback:', fallbackError);
      }
    } finally {
      this.isInitializing = false;
    }
  }

  private static generateLabels(description: string, category: string): string[] {
    // Base labels for different categories
    const categoryLabels: { [key: string]: string[] } = {
      'road_damage': ['damaged road', 'pothole', 'cracked pavement', 'broken asphalt', 'road repair needed'],
      'sanitation': ['garbage', 'trash', 'dirty area', 'waste', 'litter', 'unsanitary conditions'],
      'lighting': ['broken light', 'dark street', 'faulty streetlight', 'lighting issue', 'lamp not working'],
      'graffiti': ['graffiti', 'vandalism', 'painted wall', 'spray paint', 'defaced property'],
      'sidewalk': ['damaged sidewalk', 'broken walkway', 'cracked pavement', 'pedestrian path issue'],
      'vegetation': ['overgrown plants', 'tree issue', 'landscaping problem', 'vegetation maintenance'],
      'other': ['infrastructure issue', 'municipal problem', 'public facility issue']
    };

    // Get category-specific labels
    const specificLabels = categoryLabels[category] || categoryLabels['other'];
    
    // Extract key terms from description
    const descriptionWords = description.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Combine specific labels with description terms
    const combinedLabels = [
      ...specificLabels,
      ...descriptionWords.slice(0, 3) // Take first 3 meaningful words
    ];

    // Add negative labels to check against irrelevant content
    const negativeLabels = [
      'person', 'selfie', 'face', 'indoor scene', 'food', 'animals', 
      'unrelated image', 'random photo', 'screenshot', 'meme'
    ];

    return [...combinedLabels, ...negativeLabels];
  }

  static async verifyImage(
    imageDataUrl: string, 
    description: string, 
    category: string
  ): Promise<VerificationResult> {
    try {
      await this.initializeClassifier();
      
      if (!this.classifier) {
        return {
          isValid: true, // Allow upload if classifier fails to initialize
          confidence: 0,
          reason: 'Image verification unavailable'
        };
      }

      const labels = this.generateLabels(description, category);
      console.log('Verifying image with labels:', labels);

      const result = await this.classifier(imageDataUrl, labels);
      console.log('Classification result:', result);

      // Check if any positive labels have high confidence
      const positiveLabels = labels.slice(0, -6); // Exclude negative labels
      const negativeLabels = labels.slice(-6); // Last 6 are negative

      const bestPositiveMatch = result
        .filter((item: any) => positiveLabels.includes(item.label))
        .sort((a: any, b: any) => b.score - a.score)[0];

      const bestNegativeMatch = result
        .filter((item: any) => negativeLabels.includes(item.label))
        .sort((a: any, b: any) => b.score - a.score)[0];

      const positiveScore = bestPositiveMatch?.score || 0;
      const negativeScore = bestNegativeMatch?.score || 0;

      // Image is valid if positive score is higher than negative score and above threshold
      const isValid = positiveScore > negativeScore && positiveScore > 0.15;
      
      return {
        isValid,
        confidence: Math.round(positiveScore * 100),
        reason: isValid 
          ? `Image matches "${bestPositiveMatch?.label}" with ${Math.round(positiveScore * 100)}% confidence`
          : negativeScore > positiveScore
            ? `Image appears to be "${bestNegativeMatch?.label}" which is not relevant`
            : 'Image does not clearly match the description or category'
      };
    } catch (error) {
      console.error('Image verification error:', error);
      return {
        isValid: true, // Allow upload if verification fails
        confidence: 0,
        reason: 'Verification failed - image allowed by default'
      };
    }
  }
}