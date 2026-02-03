import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kjsvfruozyvzxjondiec.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqc3ZmcnVvenl2enhqb25kaWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNjcwNTUsImV4cCI6MjA4NDc0MzA1NX0.xFYF_Bg7z4p2oFXPKNGJSxee2ky5WfAoQIw0ORcKPrA';

/**
 * Custom fetcher with exponential backoff and increased timeout logic.
 */
const customFetch = async (input: RequestInfo | URL, init?: RequestInit, retries = 3, backoff = 800): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); 

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok && retries > 0 && [500, 502, 503, 504, 429].includes(response.status)) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return customFetch(input, init, retries - 1, backoff * 2);
    }

    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && (error.name === 'AbortError' || error.name === 'TypeError')) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return customFetch(input, init, retries - 1, backoff * 2);
    }
    throw error;
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  global: {
    fetch: customFetch,
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  }
});

/**
 * Check if Supabase is reachable and the portfolio_content table exists.
 */
export const checkCloudHealth = async (): Promise<{ ok: boolean; message: string }> => {
  try {
    const { error, status } = await supabase
      .from('portfolio_content')
      .select('id')
      .eq('id', 'main_config')
      .limit(1)
      .maybeSingle();
    
    if (error) {
      if (status === 404) return { ok: false, message: 'Table Missing' };
      return { ok: false, message: 'Connection Error' };
    }
    
    return { ok: true, message: 'Cloud Connected' };
  } catch (err: any) {
    return { ok: false, message: 'Offline' };
  }
};