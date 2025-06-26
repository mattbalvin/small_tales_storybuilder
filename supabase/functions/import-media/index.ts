/*
  # Import Media Edge Function

  This function serves as a proxy to import external media files, bypassing CORS restrictions.
  
  1. Functionality
    - Fetches external media files from provided URLs
    - Validates file types (image, audio, video)
    - Returns file data with proper headers
    - Handles CORS for client-side requests
  
  2. Security
    - Validates URL format and accessibility
    - Limits file size to prevent abuse
    - Only allows specific media file types
*/

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

interface ImportRequest {
  url: string;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB limit

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

    const { url }: ImportRequest = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: "Valid URL is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate URL format
    let urlObj: URL;
    try {
      urlObj = new URL(url);
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid URL format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch the external resource with proper headers to avoid 403 errors
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'image/*,audio/*,video/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    if (!response.ok) {
      let errorMessage = `Failed to fetch resource: ${response.status} ${response.statusText}`;
      
      if (response.status === 403) {
        errorMessage = "Access denied: The external media URL is not publicly accessible or requires authentication. Please ensure the URL is publicly available or try a different source.";
      } else if (response.status === 404) {
        errorMessage = "Media not found: The URL does not exist or the resource has been moved.";
      } else if (response.status === 429) {
        errorMessage = "Rate limit exceeded: Too many requests to the external source. Please try again later.";
      } else if (response.status >= 500) {
        errorMessage = "Server error: The external source is experiencing issues. Please try again later.";
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check content type
    const contentType = response.headers.get('content-type') || '';
    const contentLength = response.headers.get('content-length');
    
    // Validate file size
    if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: "File too large (max 50MB)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Determine file type from content-type or URL extension
    let fileType: 'image' | 'audio' | 'video' | null = null;
    let fileExtension = '';

    if (contentType) {
      if (contentType.startsWith('image/')) {
        fileType = 'image';
        fileExtension = contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      } else if (contentType.startsWith('audio/')) {
        fileType = 'audio';
        fileExtension = contentType.split('/')[1] || 'mp3';
      } else if (contentType.startsWith('video/')) {
        fileType = 'video';
        fileExtension = contentType.split('/')[1] || 'mp4';
      }
    }

    // Fallback to URL extension if content-type is not helpful
    if (!fileType) {
      const urlLower = url.toLowerCase();
      if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/)) {
        fileType = 'image';
        fileExtension = urlLower.match(/\.(jpg|jpeg|png|gif|webp|svg)/)?.[1] || 'jpg';
      } else if (urlLower.match(/\.(mp3|wav|ogg|m4a|aac)(\?|$)/)) {
        fileType = 'audio';
        fileExtension = urlLower.match(/\.(mp3|wav|ogg|m4a|aac)/)?.[1] || 'mp3';
      } else if (urlLower.match(/\.(mp4|webm|mov|avi)(\?|$)/)) {
        fileType = 'video';
        fileExtension = urlLower.match(/\.(mp4|webm|mov|avi)/)?.[1] || 'mp4';
      }
    }

    if (!fileType) {
      return new Response(
        JSON.stringify({ error: "Unsupported file type. Only images, audio, and video files are supported." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the file data
    const arrayBuffer = await response.arrayBuffer();
    
    // Check actual file size
    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: "File too large (max 50MB)" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate filename from URL or use generic name
    const urlPath = urlObj.pathname;
    const originalFilename = urlPath.split('/').pop() || `imported-${fileType}`;
    const filename = originalFilename.includes('.') 
      ? originalFilename 
      : `${originalFilename}.${fileExtension}`;

    // Return the file data with metadata
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          arrayBuffer: Array.from(new Uint8Array(arrayBuffer)),
          filename,
          contentType: contentType || `${fileType}/*`,
          fileType,
          size: arrayBuffer.byteLength
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error('Import media error:', error);
    
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        errorMessage = "Failed to fetch the external resource. The URL may be invalid or the server may be blocking requests.";
      } else {
        errorMessage = error.message;
      }
    }
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});