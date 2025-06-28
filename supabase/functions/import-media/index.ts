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
const FETCH_TIMEOUT = 30000; // 30 seconds timeout

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

    console.log('Starting import for URL:', url);

    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    try {
      // Fetch the external resource with comprehensive headers and timeout
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
          'Sec-Ch-Ua-Mobile': '?0',
          'Sec-Ch-Ua-Platform': '"Windows"',
        },
        signal: controller.signal,
        // Add redirect handling
        redirect: 'follow'
      });

      clearTimeout(timeoutId);

      console.log('Fetch response status:', response.status, response.statusText);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

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

      // Check content type and length
      const contentType = response.headers.get('content-type') || '';
      const contentLength = response.headers.get('content-length');
      
      console.log('Content-Type:', contentType);
      console.log('Content-Length:', contentLength);
      
      // Validate file size from header
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
          const typeMap: Record<string, string> = {
            'image/jpeg': 'jpg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp',
            'image/svg+xml': 'svg',
            'image/bmp': 'bmp',
            'image/tiff': 'tiff'
          };
          fileExtension = typeMap[contentType.toLowerCase()] || contentType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
        } else if (contentType.startsWith('audio/')) {
          fileType = 'audio';
          const typeMap: Record<string, string> = {
            'audio/mpeg': 'mp3',
            'audio/mp3': 'mp3',
            'audio/wav': 'wav',
            'audio/wave': 'wav',
            'audio/ogg': 'ogg',
            'audio/mp4': 'm4a',
            'audio/aac': 'aac',
            'audio/x-m4a': 'm4a'
          };
          fileExtension = typeMap[contentType.toLowerCase()] || contentType.split('/')[1] || 'mp3';
        } else if (contentType.startsWith('video/')) {
          fileType = 'video';
          const typeMap: Record<string, string> = {
            'video/mp4': 'mp4',
            'video/webm': 'webm',
            'video/quicktime': 'mov',
            'video/x-msvideo': 'avi',
            'video/avi': 'avi'
          };
          fileExtension = typeMap[contentType.toLowerCase()] || contentType.split('/')[1] || 'mp4';
        }
      }

      // Fallback to URL extension if content-type is not helpful
      if (!fileType) {
        const urlLower = url.toLowerCase();
        const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'tiff'];
        const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
        const videoExts = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
        
        for (const ext of imageExts) {
          if (urlLower.includes(`.${ext}`)) {
            fileType = 'image';
            fileExtension = ext;
            break;
          }
        }
        
        if (!fileType) {
          for (const ext of audioExts) {
            if (urlLower.includes(`.${ext}`)) {
              fileType = 'audio';
              fileExtension = ext;
              break;
            }
          }
        }
        
        if (!fileType) {
          for (const ext of videoExts) {
            if (urlLower.includes(`.${ext}`)) {
              fileType = 'video';
              fileExtension = ext;
              break;
            }
          }
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

      console.log('Detected file type:', fileType, 'extension:', fileExtension);

      // Get the file data with size validation
      const arrayBuffer = await response.arrayBuffer();
      
      console.log('Downloaded file size:', arrayBuffer.byteLength, 'bytes');
      
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
      let originalFilename = urlPath.split('/').pop() || `imported-${fileType}`;
      
      // Clean filename and ensure it has proper extension
      originalFilename = originalFilename.replace(/[^a-zA-Z0-9.-]/g, '_');
      
      const filename = originalFilename.includes('.') 
        ? originalFilename 
        : `${originalFilename}.${fileExtension}`;

      console.log('Generated filename:', filename);

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

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      console.error('Fetch error:', fetchError);
      
      let errorMessage = "Failed to fetch the external resource.";
      
      if (fetchError.name === 'AbortError') {
        errorMessage = "Request timed out. The external resource is taking too long to respond. Please try again or use a different URL.";
      } else if (fetchError.message.includes('network')) {
        errorMessage = "Network error: Unable to connect to the external resource. Please check the URL and try again.";
      } else if (fetchError.message.includes('SSL') || fetchError.message.includes('certificate')) {
        errorMessage = "SSL/Certificate error: The external resource has an invalid security certificate.";
      } else if (fetchError.message.includes('DNS') || fetchError.message.includes('resolve')) {
        errorMessage = "DNS error: Unable to resolve the domain name. Please check the URL.";
      } else {
        errorMessage = `Network error: ${fetchError.message}`;
      }
      
      return new Response(
        JSON.stringify({ error: errorMessage }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

  } catch (error) {
    console.error('Import media error:', error);
    
    let errorMessage = "Internal server error";
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        errorMessage = "Request timed out. Please try again with a different URL or check if the resource is accessible.";
      } else if (error.message.includes('JSON')) {
        errorMessage = "Invalid request format. Please check your input and try again.";
      } else {
        errorMessage = `Error: ${error.message}`;
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