import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationResult {
  isValid: boolean;
  confidence: number;
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageDataUrl, description, category } = await req.json();
    const visionApiKey = Deno.env.get('VISION_API_KEY');

    console.log('Vision API Key status:', visionApiKey ? 'Found' : 'Not found');
    console.log('Available env vars:', Object.keys(Deno.env.toObject()).filter(key => key.includes('VISION')));

    if (!visionApiKey) {
      console.error('Google Vision API key not found in environment variables');
      return new Response(JSON.stringify({
        isValid: false,
        confidence: 0,
        reason: 'Google Vision API key not configured. Please check your Supabase secrets.'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Convert data URL to base64 string (remove data:image prefix)
    const base64Image = imageDataUrl.split(',')[1];

    console.log(`Verifying image for category: ${category}`);

    // Call Google Vision API
    const visionResponse = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: base64Image
            },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 20 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
              { type: 'SAFE_SEARCH_DETECTION' }
            ]
          }
        ]
      })
    });

    if (!visionResponse.ok) {
      throw new Error(`Vision API error: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    const annotations = visionData.responses[0];

    if (annotations.error) {
      throw new Error(`Vision API error: ${annotations.error.message}`);
    }

    // Get labels and objects from Vision API
    const labels = annotations.labelAnnotations || [];
    const objects = annotations.localizedObjectAnnotations || [];
    const safeSearch = annotations.safeSearchAnnotation || {};

    // Check safe search first
    if (safeSearch.adult === 'LIKELY' || safeSearch.adult === 'VERY_LIKELY' ||
        safeSearch.violence === 'LIKELY' || safeSearch.violence === 'VERY_LIKELY') {
      return new Response(JSON.stringify({
        isValid: false,
        confidence: 0,
        reason: 'Image contains inappropriate content'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Category-specific keywords
    const categoryKeywords: { [key: string]: string[] } = {
      'road_damage': ['road', 'street', 'asphalt', 'pavement', 'concrete', 'pothole', 'crack', 'damage', 'surface', 'highway'],
      'sanitation': ['garbage', 'trash', 'waste', 'litter', 'debris', 'refuse', 'rubbish', 'contamination', 'dirty', 'sanitation'],
      'lighting': ['light', 'lamp', 'streetlight', 'illumination', 'fixture', 'lighting', 'bulb', 'pole', 'electric'],
      'graffiti': ['wall', 'building', 'text', 'writing', 'art', 'paint', 'surface', 'vandalism', 'marking', 'graffiti'],
      'sidewalk': ['sidewalk', 'walkway', 'path', 'pavement', 'pedestrian', 'concrete', 'footpath', 'curb'],
      'vegetation': ['plant', 'tree', 'grass', 'vegetation', 'leaf', 'branch', 'shrub', 'garden', 'landscaping', 'overgrown'],
      'other': ['infrastructure', 'public', 'municipal', 'facility', 'structure', 'urban', 'city']
    };

    const relevantKeywords = categoryKeywords[category] || categoryKeywords['other'];

    // Score based on label matches
    let maxScore = 0;
    let bestMatch = '';
    
    for (const label of labels) {
      const labelText = label.description.toLowerCase();
      const score = label.score;
      
      for (const keyword of relevantKeywords) {
        if (labelText.includes(keyword) || keyword.includes(labelText)) {
          if (score > maxScore) {
            maxScore = score;
            bestMatch = label.description;
          }
        }
      }
    }

    // Also check objects
    for (const obj of objects) {
      const objName = obj.name.toLowerCase();
      const score = obj.score;
      
      for (const keyword of relevantKeywords) {
        if (objName.includes(keyword) || keyword.includes(objName)) {
          if (score > maxScore) {
            maxScore = score;
            bestMatch = obj.name;
          }
        }
      }
    }

    // Check if description matches any labels
    const descWords = description.toLowerCase().split(/\s+/);
    for (const label of labels) {
      const labelText = label.description.toLowerCase();
      for (const word of descWords) {
        if (word.length > 3 && labelText.includes(word)) {
          maxScore = Math.max(maxScore, label.score * 0.8);
          if (!bestMatch) bestMatch = label.description;
        }
      }
    }

    // Dynamic threshold based on category
    const threshold = category === 'graffiti' || category === 'vegetation' ? 0.6 : 0.7;
    const isValid = maxScore >= threshold;
    const confidence = Math.round(maxScore * 100);

    const result: VerificationResult = {
      isValid,
      confidence,
      reason: isValid 
        ? `Image matches "${bestMatch}" with ${confidence}% confidence`
        : maxScore > 0
          ? `Best match "${bestMatch}" has only ${confidence}% confidence (need ${Math.round(threshold * 100)}%)`
          : `No relevant features detected for category "${category}"`
    };

    console.log('Verification result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in google-vision-verify function:', error);
    return new Response(JSON.stringify({
      isValid: false,
      confidence: 0,
      reason: `Verification failed: ${error.message}`
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});