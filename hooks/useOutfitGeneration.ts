
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

      // Get the current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('You must be logged in to generate outfits');
      }

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

      if (functionError) {
        console.error('Edge function error:', functionError);
        throw new Error(functionError.message || 'Failed to generate outfit');
      }

      console.log('Edge function response:', data);

      setLoading(false);
      return data as GenerateOutfitResponse;
    } catch (err) {
      console.error('Error generating outfit:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  };

  return {
    generateOutfit,
    loading,
    error,
  };
};
