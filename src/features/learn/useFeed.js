import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../shared/lib/supabaseClient';
import { findLearnVideo, generateDailyLearnTopics, generateLearnExplainer, generateLearnImage } from '../../shared/lib/aiClient';

const todayStart = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date.toISOString();
};

export default function useFeed(profile) {
    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const profileId = profile?.id;
    const profileLanguage = profile?.language;
    const profilePrimaryMode = profile?.primaryMode;

    const createCard = useCallback(async (topic, source) => {
        const explainer = await generateLearnExplainer(profile, topic);
        const [imageResult, videoResult] = await Promise.allSettled([
            generateLearnImage(explainer.topic),
            findLearnVideo(explainer.videoQuery, profileLanguage || 'en'),
        ]);
        return {
            user_id: profileId,
            topic: explainer.topic,
            explanation: explainer.explanation,
            diagram_steps: explainer.diagramSteps.length ? explainer.diagramSteps : null,
            image_url: imageResult.status === 'fulfilled' ? imageResult.value : null,
            video_id: videoResult.status === 'fulfilled' ? videoResult.value : null,
            source,
            created_at: new Date().toISOString(),
        };
    }, [profile, profileId, profileLanguage]);

    const saveCard = useCallback(async (card) => {
        const { data, error: saveError } = await supabase.from('learn_cards').insert(card).select().single();
        if (saveError) throw saveError;
        setCards((current) => [data, ...current]);
        return data;
    }, []);

    const addUserExplainer = useCallback(async (topic) => {
        const optimistic = await createCard(topic, 'user_asked');
        try {
            return await saveCard(optimistic);
        } catch (saveError) {
            // The card remains useful during this session when the migration has not run yet.
            console.error('Could not save Learn card:', saveError);
            setError('Your explainer is ready, but could not be saved yet. Run the Learn database migration to keep it in your feed.');
            const local = { ...optimistic, id: `local-${crypto.randomUUID()}` };
            setCards((current) => [local, ...current]);
            return local;
        }
    }, [createCard, saveCard]);

    const ensureDailyBatch = useCallback(async () => {
        if (!profileId) return;
        const { data: existing, error: batchError } = await supabase.from('learn_cards')
            .select('id').eq('user_id', profileId).eq('source', 'daily_batch').gte('created_at', todayStart()).limit(1);
        if (batchError) throw batchError;
        if (existing?.length) return;

        const { data: activity } = await supabase.from('activity_log').select('event_type').eq('user_id', profileId)
            .order('created_at', { ascending: false }).limit(12);
        const topics = await generateDailyLearnTopics(profile, (activity || []).map((entry) => entry.event_type));
        for (const topic of topics) {
            try {
                await saveCard(await createCard(topic, 'daily_batch'));
            } catch (cardError) {
                console.error('Could not create daily Learn card:', cardError);
            }
        }
    }, [createCard, profile, profileId, saveCard]);

    useEffect(() => {
        if (!profileId) {
            setLoading(false);
            return undefined;
        }
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                const { data, error: loadError } = await supabase.from('learn_cards').select('*').eq('user_id', profileId)
                    .order('created_at', { ascending: false });
                if (cancelled) return;
                if (loadError) {
                    setError('Learn needs its database table before it can save a feed.');
                    return;
                }
                setCards(data || []);
                try {
                    await ensureDailyBatch();
                } catch (batchError) {
                    console.error('Daily Learn batch skipped:', batchError);
                }
            } catch (err) {
                console.error('Learn feed hydration error:', err);
                setError('Failed to load learning feed. Please refresh the page.');
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [ensureDailyBatch, profileId]);

    return { cards, loading, error, addUserExplainer };
}
