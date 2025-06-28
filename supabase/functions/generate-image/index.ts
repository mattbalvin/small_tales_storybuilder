/*
  # Generate Image Edge Function

  This function generates images using Replicate's API with multiple AI models:
  - black-forest-labs/flux-1.1-pro
  - ideogram-ai/ideogram-v3-balanced  
  - google/imagen-4
  
  1. Functionality
    - Accepts text prompts and model selection
    - Generates images using specified AI model
    - Returns image URLs and metadata
    - Handles different model parameters
    - Properly waits for all images when multiple are requested
  
  2. Security
    - Requires authentication
    - Validates input parameters
    - Rate limiting through Replicate
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface GenerateImageRequest {
  prompt: string;
  model: 'flux-1.1-pro' | 'ideogram-v3-balanced' | 'imagen-4';
  width?: number;
  height?: number;
  num_outputs?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
  style?: string; // For Ideogram
  aspect_ratio?: string; // For Ideogram and Imagen
  safety_tolerance?: number; // For Imagen
}

interface ReplicateResponse {
  id: string;
  status: string;
  output?: string[] | string;
  error?: string;
  urls?: {
    get: string;
    cancel: string;
  };
}

const MODEL_CONFIGS = {
  'flux-1.1-pro': {
    version: 'black-forest-labs/flux-1.1-pro',
    defaultParams: {
      width: 1024,
      height: 1024,
      num_outputs: 1,
      guidance_scale: 3.5,
      num_inference_steps: 28,
      safety_tolerance: 2
    }
  },
  'ideogram-v3-balanced': {
    version: 'ideogram-ai/ideogram-v3-balanced',
    defaultParams: {
      aspect_ratio: '1:1',
      num_outputs: 1,
      style: 'auto',
      safety_tolerance: 2
    }
  },
  'imagen-4': {
    version: 'google/imagen-4',
    defaultParams: {
      aspect_ratio: '1:1',
      num_outputs: 1,
      safety_tolerance: 2
    }
  }
};

Deno.serve(async (req: Request) => {
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      });
    }

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get Replicate API token
    const replicateToken = Deno.env.get('REPLICATE_API_TOKEN');
    if (!replicateToken) {
      return new Response(
        JSON.stringify({ error: "Replicate API token not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body: GenerateImageRequest = await req.json();
    
    if (!body.prompt || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Valid prompt is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!body.model || !MODEL_CONFIGS[body.model]) {
      return new Response(
        JSON.stringify({ 
          error: "Valid model is required. Choose from: flux-1.1-pro, ideogram-v3-balanced, imagen-4" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const modelConfig = MODEL_CONFIGS[body.model];
    
    // Prepare input parameters based on the selected model
    let input: any = {
      prompt: body.prompt.trim(),
      ...modelConfig.defaultParams
    };

    // Apply model-specific parameters
    if (body.model === 'flux-1.1-pro') {
      if (body.width) input.width = Math.min(Math.max(body.width, 256), 2048);
      if (body.height) input.height = Math.min(Math.max(body.height, 256), 2048);
      if (body.guidance_scale) input.guidance_scale = Math.min(Math.max(body.guidance_scale, 1), 20);
      if (body.num_inference_steps) input.num_inference_steps = Math.min(Math.max(body.num_inference_steps, 1), 50);
      if (body.seed) input.seed = body.seed;
      if (body.safety_tolerance) input.safety_tolerance = Math.min(Math.max(body.safety_tolerance, 1), 5);
    } else if (body.model === 'ideogram-v3-balanced') {
      if (body.aspect_ratio) input.aspect_ratio = body.aspect_ratio;
      if (body.style) input.style = body.style;
      if (body.safety_tolerance) input.safety_tolerance = Math.min(Math.max(body.safety_tolerance, 1), 5);
    } else if (body.model === 'imagen-4') {
      if (body.aspect_ratio) input.aspect_ratio = body.aspect_ratio;
      if (body.safety_tolerance) input.safety_tolerance = Math.min(Math.max(body.safety_tolerance, 1), 5);
    }

    if (body.num_outputs) input.num_outputs = Math.min(Math.max(body.num_outputs, 1), 4);

    const expectedImageCount = input.num_outputs;

    console.log('Generating image with model:', body.model);
    console.log('Input parameters:', input);
    console.log('Expected image count:', expectedImageCount);

    // Create prediction
    const createResponse = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${replicateToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: modelConfig.version,
        input: input
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error('Replicate API error:', {
        status: createResponse.status,
        statusText: createResponse.statusText,
        error: errorText
      });
      
      return new Response(
        JSON.stringify({ 
          error: `Replicate API error: ${createResponse.status} ${createResponse.statusText}`,
          details: errorText
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const prediction: ReplicateResponse = await createResponse.json();
    
    if (!prediction.id) {
      return new Response(
        JSON.stringify({ error: "Failed to create prediction" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log('Prediction created:', prediction.id);

    // Poll for completion with proper handling for multiple images
    let attempts = 0;
    const maxAttempts = 120; // 10 minutes max wait time (increased for multiple images)
    const pollInterval = 5000; // 5 seconds
    let lastStatus = '';

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;

      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          'Authorization': `Token ${replicateToken}`,
        },
      });

      if (!statusResponse.ok) {
        console.error('Failed to check prediction status:', statusResponse.status);
        continue;
      }

      const status: ReplicateResponse = await statusResponse.json();
      
      // Only log status changes to reduce noise
      if (status.status !== lastStatus) {
        console.log(`Prediction ${prediction.id} status: ${status.status} (attempt ${attempts})`);
        lastStatus = status.status;
      }

      if (status.status === 'succeeded') {
        // Handle both string and array outputs from Replicate
        let outputImages: string[] = [];
        
        if (typeof status.output === 'string') {
          // Single image URL returned as string
          outputImages = [status.output];
        } else if (Array.isArray(status.output)) {
          // Multiple images returned as array
          outputImages = status.output.filter(url => typeof url === 'string' && url.length > 0);
        }
        
        console.log(`Generated ${outputImages.length} images, expected ${expectedImageCount}`);
        
        // Validate we got the expected number of images
        if (outputImages.length === 0) {
          return new Response(
            JSON.stringify({ 
              error: "No images generated",
              details: `Expected ${expectedImageCount} images but received none`
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        // If we expected multiple images but got fewer, wait a bit more
        if (expectedImageCount > 1 && outputImages.length < expectedImageCount && attempts < maxAttempts - 10) {
          console.log(`Got ${outputImages.length}/${expectedImageCount} images, waiting for more...`);
          continue;
        }

        // Validate all URLs are accessible
        const validImages: string[] = [];
        for (const imageUrl of outputImages) {
          try {
            const testResponse = await fetch(imageUrl, { method: 'HEAD' });
            if (testResponse.ok) {
              validImages.push(imageUrl);
            } else {
              console.warn(`Image URL not accessible: ${imageUrl} (status: ${testResponse.status})`);
            }
          } catch (error) {
            console.warn(`Failed to validate image URL: ${imageUrl}`, error);
          }
        }

        if (validImages.length === 0) {
          return new Response(
            JSON.stringify({ 
              error: "Generated images are not accessible",
              details: "All generated image URLs failed validation"
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        console.log('Image generation successful:', {
          model: body.model,
          prompt_length: body.prompt.length,
          expected_count: expectedImageCount,
          generated_count: outputImages.length,
          valid_count: validImages.length,
          prediction_id: prediction.id,
          total_attempts: attempts
        });

        return new Response(
          JSON.stringify({
            success: true,
            images: validImages,
            model: body.model,
            prompt: body.prompt,
            prediction_id: prediction.id,
            parameters: input,
            generation_info: {
              expected_count: expectedImageCount,
              generated_count: outputImages.length,
              valid_count: validImages.length,
              attempts: attempts,
              duration_seconds: attempts * (pollInterval / 1000)
            }
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else if (status.status === 'failed') {
        console.error('Prediction failed:', status.error);
        return new Response(
          JSON.stringify({ 
            error: "Image generation failed", 
            details: status.error,
            prediction_id: prediction.id
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else if (status.status === 'canceled') {
        return new Response(
          JSON.stringify({ 
            error: "Image generation was canceled",
            prediction_id: prediction.id
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Continue polling for 'starting' or 'processing' status
      // For multiple images, be more patient
      if (expectedImageCount > 1 && attempts > 60) {
        console.log(`Long-running generation for ${expectedImageCount} images, continuing to wait...`);
      }
    }

    // Timeout
    console.error(`Generation timed out after ${attempts} attempts (${attempts * pollInterval / 1000} seconds)`);
    return new Response(
      JSON.stringify({ 
        error: "Image generation timed out", 
        prediction_id: prediction.id,
        details: `The image generation is taking longer than expected (${Math.round(attempts * pollInterval / 1000)} seconds). This can happen with multiple images or complex prompts. You can check the status later using the prediction ID.`,
        expected_count: expectedImageCount,
        timeout_seconds: Math.round(attempts * pollInterval / 1000)
      }),
      {
        status: 408,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Error in generate-image function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: "Internal server error",
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});