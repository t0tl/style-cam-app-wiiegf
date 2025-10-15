
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

      // Call the edge function
      const { data, error: functionError } = await supabase.functions.invoke(
        'generate-outfit',
        {
          body: {
            imageData,
            style,
            mimeType,
          },
        }
      );

      console.log('Edge function response received');
      console.log('Data:', data);
      console.log('Error:', functionError);

      if (functionError) {
        console.error('Edge function error:', functionError);
        
        // Provide more specific error messages
        let errorMessage = 'Failed to generate outfit';
        
        if (functionError.message) {
          errorMessage = functionError.message;
        }
        
        // Check for common error patterns
        if (functionError.message?.includes('503')) {
          errorMessage = 'The AI service is temporarily unavailable. Please try again in a moment.';
        } else if (functionError.message?.includes('401')) {
          errorMessage = 'Authentication failed. Please sign in again.';
        } else if (functionError.message?.includes('timeout')) {
          errorMessage = 'The request took too long. Please try again with a smaller image.';
        }
        
        throw new Error(errorMessage);
      }

      // Check if the response indicates failure
      if (data && !data.success) {
        console.error('Edge function returned failure:', data);
        throw new Error(data.error || data.details || 'Failed to generate outfit');
      }

      console.log('Edge function succeeded');

      setLoading(false);
      return data as GenerateOutfitResponse;
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
