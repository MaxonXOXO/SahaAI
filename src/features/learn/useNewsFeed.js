import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../shared/lib/supabaseClient';

export default function useNewsFeed(profile, enabled) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!profile?.id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('learn-news');
      if (invokeError || data?.error) throw new Error(data?.error || invokeError.message);
      setArticles(data?.articles || []);
    } catch (requestError) {
      console.error('Learn news feed error:', requestError);
      setError('Could not load news right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [profile?.id]);

  useEffect(() => {
    if (enabled) void refresh();
  }, [enabled, refresh]);

  return { articles, loading, error, refresh };
}
