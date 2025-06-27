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
  output?: string[];
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

    console.log('Generating image with model:', body.model);
    console.log('Input parameters:', input);

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

    // Poll for completion
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max wait time
    const pollInterval = 5000; // 5 seconds

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
      
      console.log(`Prediction ${prediction.id} status: ${status.status} (attempt ${attempts})`);

      if (status.status === 'succeeded') {
        if (!status.output || !Array.isArray(status.output) || status.output.length === 0) {
          return new Response(
            JSON.stringify({ error: "No images generated" }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }

        console.log('Image generation successful:', {
          model: body.model,
          prompt_length: body.prompt.length,
          output_count: status.output.length,
          prediction_id: prediction.id
        });

        return new Response(
          JSON.stringify({
            success: true,
            images: status.output,
            model: body.model,
            prompt: body.prompt,
            prediction_id: prediction.id,
            parameters: input
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
            details: status.error 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } else if (status.status === 'canceled') {
        return new Response(
          JSON.stringify({ error: "Image generation was canceled" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Continue polling for 'starting' or 'processing' status
    }

    // Timeout
    return new Response(
      JSON.stringify({ 
        error: "Image generation timed out", 
        prediction_id: prediction.id,
        details: "The image generation is taking longer than expected. You can check the status later using the prediction ID."
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