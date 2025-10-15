
import { useState } from 'react';
import { supabase } from '@/app/integrations/supabase/client';

interface GenerateOutfitParams {
  imageData: string;
  style: string;
  mimeType?: string;
}

interface GenerateOutfitResponse {
  success: boolean;
  imageUrl?: string;
  message?: string;
  style: string;
  note?: string;
}

export const useOutfitGeneration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateOutfit = async ({
    imageData,
    style,
    mimeType = 'image/jpeg',
  }: GenerateOutfitParams): Promise<GenerateOutfitResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      console.log('Calling generate-outfit edge function...');
      console.log('Style:', style);
      console.log('Image data length:', imageData.length);

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to generate outfits');
      }

      console.log('User authenticated, calling edge function...');

      // Convert base64 image data to a Blob using the proper React Native approach
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      
      // Create a File-like object that React Native's FormData can handle
      const imageBlob = {
        uri: `data:${mimeType};base64,${base64Data}`,
        type: mimeType,
        name: 'photo.jpg',
      };

      // Create FormData with multipart fields
      const formData = new FormData();
      // @ts-ignore - React Native FormData accepts this format
      formData.append('image', imageBlob);
      formData.append('prompt', `Transform this person's outfit into a ${style} style. Keep the person's face and body the same, only change their clothing to match the ${style} aesthetic.`);

      console.log('Sending multipart form-data to edge function...');

      // Get the project URL
      const projectUrl = 'https://qtnthtvhndbdxczoexyn.supabase.co';
      
      // Call the edge function using fetch with FormData
      const response = await fetch(`${projectUrl}/functions/v1/generate-outfit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          // Don't set Content-Type header - let the browser/fetch set it with the boundary
        },
        body: formData,
      });

      console.log('Edge function response received');
      console.log('Status:', response.status);
      console.log('Content-Type:', response.headers.get('content-type'));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Edge function error:', errorText);
        
        let errorMessage = 'Failed to generate outfit';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = errorText || errorMessage;
        }
        
        // Check for common error patterns
        if (response.status === 503) {
          errorMessage = 'The AI service is temporarily unavailable. Please try again in a moment.';
        } else if (response.status === 401) {
          errorMessage = 'Authentication failed. Please sign in again.';
        } else if (errorMessage.includes('timeout')) {
          errorMessage = 'The request took too long. Please try again with a smaller image.';
        }
        
        throw new Error(errorMessage);
      }

      const contentType = response.headers.get('content-type') || '';
      
      // Check if the response is an image
      if (contentType.includes('image/')) {
        console.log('Received image response');
        const imageBlob = await response.blob();
        
        // Convert blob to base64 for display
        const reader = new FileReader();
        const imageDataUrl = await new Promise<string>((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imageBlob);
        });
        
        setLoading(false);
        return {
          success: true,
          imageUrl: imageDataUrl,
          style,
          message: 'Outfit generated successfully!',
        };
      } else if (contentType.includes('application/json')) {
        // Handle JSON response (text-based response)
        const data = await response.json();
        console.log('Received JSON response:', data);
        
        setLoading(false);
        return {
          success: true,
          message: data.message || 'Outfit description generated!',
          style,
          note: 'The AI provided a text description instead of an image.',
        };
      } else {
        throw new Error('Unexpected response format from edge function');
      }
    } catch (err) {
      console.error('Error generating outfit:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      
      // Return null to indicate failure
      return null;
    }
  };

  return {
    generateOutfit,
    loading,
    error,
  };
};
