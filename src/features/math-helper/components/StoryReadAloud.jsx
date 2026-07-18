import { useMemo, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import useTextToSpeech from '../../../shared/hooks/useTextToSpeech';
import IconButton from '../../../shared/components/IconButton';

export default function StoryReadAloud({ text }) {
    const words = useMemo(() => {
        const list = [];
        const regex = /\S+/g;
        let match;
        while ((match = regex.exec(text)) !== null) {
            list.push({
                word: match[0],
                start: match.index,
                end: match.index + match[0].length,
                index: list.length
            });
        }
        return list;
    }, [text]);

    const { isPlaying, play, stop } = useTextToSpeech({ text, words, voiceEngine: 'browser' });

    useEffect(() => {
        if (text) {
            play(0);
        }
        return () => {
            stop();
        };
    }, [text, play, stop]);

    const handleToggle = () => {
        if (isPlaying) {
            stop();
        } else {
            play(0);
        }
    };

    return (
        <div className="flex items-start justify-center gap-2 max-w-[320px] mx-auto w-full">
            <p className="text-center font-bold text-base-md leading-relaxed text-[#f4faf6] flex-1">
                {text}
            </p>
            <IconButton
                icon={isPlaying ? VolumeX : Volume2}
                label={isPlaying ? "Stop Read Aloud" : "Read Aloud"}
                onClick={handleToggle}
                className="!bg-transparent text-[#dcedc8] hover:!bg-white/10 shrink-0 mt-0.5"
                size={20}
            />
        </div>
    );
}
