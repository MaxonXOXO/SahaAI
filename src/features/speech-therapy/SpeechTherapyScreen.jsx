import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Volume2, Mic, MicOff, Play, Square, Loader2, Award, Heart, CheckCircle2, ChevronRight, Settings, Info, MessageCircle } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useProfileStore from '../../store/useProfileStore';
import useSettingsStore from '../../store/useSettingsStore';
import { translate } from '../../shared/lib/translations';
import { supabase } from '../../shared/lib/supabaseClient';
import Strands from '../../shared/components/Strands';
import { generateSessionSummary } from '../../shared/lib/aiClient';
import { logActivity } from '../../shared/lib/logActivity';

const THERAPY_GOALS = [
    { id: 'articulation', label: 'Slow & Clear', desc: 'Focus on slow pacing, clean articulation, and clear pronunciation of words.', system: 'You are a warm, extremely patient speech-language therapist. The user wants to practice speaking slowly and clearly. Listen to them speak, and encourage them to articulate each syllable. Speak slowly yourself, use short sentences, and provide gentle, positive feedback.' },
    { id: 'pronunciation', label: 'Word Pronunciation', desc: 'Practice correct syllable placement and tongue positioning for complex words.', system: 'You are a supportive speech-language therapist. The user wants to work on pronouncing words correctly. Guide them through repeating target sounds, breaking down words syllable-by-syllable, and explaining how to position the mouth or tongue.' },
    { id: 'conversation', label: 'Social Conversation', desc: 'Practice natural turn-taking, casual banter, and sharing stories in a comfortable space.', system: 'You are a friendly speech therapist. Practice natural, everyday social conversation with the user. Help them with conversational turn-taking, pacing, and asking open questions to build confidence.' },
    { id: 'confidence', label: 'Confidence Booster', desc: 'A comfortable, low-pressure space to speak freely, express ideas, and practice speaking voice.', system: 'You are an encouraging speech therapist. The user wants to build overall speaking confidence. Provide a safe, zero-pressure space. Celebrate their efforts, give warm affirmation, and encourage creative expression.' }
];

const OPENAI_VOICES = [
    { id: 'alloy', label: 'Alloy (Warm & Balanced, Female)' },
    { id: 'echo', label: 'Echo (Deep & Calm, Male)' },
    { id: 'shimmer', label: 'Shimmer (Clear & Bright, Female)' },
    { id: 'ash', label: 'Ash (Energetic & Modern, Male)' },
    { id: 'ballad', label: 'Ballad (Cheerful & Dynamic, Male)' },
    { id: 'sage', label: 'Sage (Professional & Soft, Female)' }
];

const GEMINI_VOICES = [
    { id: 'Aoede', label: 'Aoede (Warm & Gentle, Female)' },
    { id: 'Charon', label: 'Charon (Deep & Calm, Male)' },
    { id: 'Fenrir', label: 'Fenrir (Energetic, Male)' },
    { id: 'Kore', label: 'Kore (Clear & Bright, Female)' },
    { id: 'Puck', label: 'Puck (Cheerful & Warm, Male)' }
];

export default function SpeechTherapyScreen() {
    const navigate = useNavigate();
    const profile = useProfileStore();
    const displayLanguage = useSettingsStore((s) => s.displayLanguage) || 'en';
    const languageName = new Intl.DisplayNames(['en'], { type: 'language' }).of(displayLanguage) || 'English';

    // Settings State
    const [provider, setProvider] = useState('openai');
    const [selectedGoal, setSelectedGoal] = useState(THERAPY_GOALS[0]);
    const [selectedVoice, setSelectedVoice] = useState('alloy');

    // Auto-update voice defaults when switching providers
    useEffect(() => {
        if (provider === 'openai') {
            setSelectedVoice('alloy');
        } else {
            setSelectedVoice('Aoede');
        }
    }, [provider]);

    // Live Session State
    const [isActive, setIsActive] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [statusText, setStatusText] = useState('Ready to start session');
    const [chatHistory, setChatHistory] = useState([]);
    const chatHistoryRef = useRef([]);
    const [timer, setTimer] = useState(0);
    const [showSummary, setShowSummary] = useState(false);
    const isMutedRef = useRef(false);

    // Hybrid Scoring State
    const [hybridScore, setHybridScore] = useState(null);
    const audioStatsRef = useRef({
        isSpeaking: false,
        speechStartTime: 0,
        pitchSamples: [],
    });

    // WebRTC, microphone, and visualizer refs
    const peerConnectionRef = useRef(null);
    const dataChannelRef = useRef(null);
    const audioContextRef = useRef(null);
    const mediaStreamRef = useRef(null);
    const remoteAudioRef = useRef(null);
    const geminiSocketRef = useRef(null);
    const geminiProcessorRef = useRef(null);
    const geminiPlaybackTimeRef = useRef(0);
    const timerIntervalRef = useRef(null);
    const visualizerCanvasRef = useRef(null);
    const visualizerIntensityRef = useRef(0);
    const animationFrameRef = useRef(null);
    const analyserRef = useRef(null);

    const stopSession = async (status = 'Session ended') => {
        setIsActive(false);
        setIsConnecting(false);
        setStatusText(status);
        clearInterval(timerIntervalRef.current);

        // Stop animation
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
        }

        if (dataChannelRef.current) {
            dataChannelRef.current.close();
            dataChannelRef.current = null;
        }
        if (peerConnectionRef.current) {
            peerConnectionRef.current.close();
            peerConnectionRef.current = null;
        }
        if (geminiSocketRef.current) {
            geminiSocketRef.current.close();
            geminiSocketRef.current = null;
        }
        if (geminiProcessorRef.current) {
            geminiProcessorRef.current.disconnect();
            geminiProcessorRef.current = null;
        }
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach((track) => track.stop());
            mediaStreamRef.current = null;
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

        // Generate and save therapy summary for memory
        const history = chatHistoryRef.current;
        if (history.length > 2 && profile?.id) {
            try {
                const transcript = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
                const result = await generateSessionSummary(transcript, selectedGoal.label);
                
                if (result?.summary) {
                    await supabase.from('therapy_session_summaries').insert({
                        user_id: profile.id,
                        session_target: selectedGoal.id,
                        summary: result.summary,
                        flagged: result.flagged || false,
                        flag_reason: result.flag_reason || null,
                        key_points: result.key_points || null
                    });
                }
            } catch (err) {
                console.error("Failed to generate and save therapy summary:", err);
            }
        }
        
        chatHistoryRef.current = [];
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopSession();
        };
    }, []);

    // Session Timer
    useEffect(() => {
        if (isActive) {
            timerIntervalRef.current = setInterval(() => {
                setTimer((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerIntervalRef.current);
        }
        return () => clearInterval(timerIntervalRef.current);
    }, [isActive]);

    // Handle Visualizer lifecycle automatically
    useEffect(() => {
        if (isActive || isConnecting) {
            // Wait 50ms to ensure the DOM has updated
            const timerId = setTimeout(() => {
                runAcousticTracker();
            }, 50);
            return () => {
                clearTimeout(timerId);
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
            };
        }
    }, [isActive, isConnecting]);

    // Headless acoustic tracker for Hybrid Emotion Score
    const runAcousticTracker = () => {
        const analyser = analyserRef.current;
        if (!analyser) return;

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const analyze = () => {
            if (!isActive && !isConnecting) return;
            animationFrameRef.current = requestAnimationFrame(analyze);

            if (isActive) {
                analyser.getByteTimeDomainData(dataArray);
                let sum = 0;
                let zeroCrossings = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const diff = dataArray[i] - 128;
                    sum += Math.abs(diff);
                    if (i > 0) {
                        const prevDiff = dataArray[i-1] - 128;
                        if ((prevDiff >= 0 && diff < 0) || (prevDiff < 0 && diff >= 0)) {
                            zeroCrossings++;
                        }
                    }
                }
                const average = sum / bufferLength;
                
                // Expose raw amplitude to WebGL Strands visualizer (scaled down a bit)
                visualizerIntensityRef.current = average * 0.5;

                // Track heuristic acoustic signals for Hybrid Emotion Score
                if (average > 1.5 && !isMutedRef.current) {
                    if (!audioStatsRef.current.isSpeaking) {
                        audioStatsRef.current.isSpeaking = true;
                        if (!audioStatsRef.current.speechStartTime) {
                            audioStatsRef.current.speechStartTime = Date.now();
                        }
                    }
                    const sampleRate = audioContextRef.current?.sampleRate || 48000;
                    const pitchEstimate = (zeroCrossings * sampleRate) / bufferLength / 2;
                    audioStatsRef.current.pitchSamples.push(pitchEstimate);
                } else {
                    audioStatsRef.current.isSpeaking = false;
                }
            } else if (isConnecting) {
                // Heartbeat breathing animation while connecting
                visualizerIntensityRef.current = (Math.sin(Date.now() / 200) * 0.5 + 0.5) * 1.5;
            }
        };
        analyze();
    };

    // Format Session Duration Time
    const formatTime = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Start Session with OpenAI Realtime WebSocket
    const legacyStartSession = async () => {
        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        if (!apiKey) {
            setStatusText('Error: Missing OpenAI API Key in configuration.');
            return;
        }

        try {
            setIsConnecting(true);
            setStatusText('Connecting to therapist…');
            setTimer(0);
            setChatHistory([]);
            setShowSummary(false);

            // 1. Initialize Web Audio Context
            // Using 24000Hz makes the browser natively downsample mic input to 24kHz for OpenAI!
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 24000 });
            audioContextRef.current = audioCtx;
            playStartTimeRef.current = audioCtx.currentTime;

            // Initialize Analyser Node for visualizer
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            // 2. Request Mic Stream
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const sourceNode = audioCtx.createMediaStreamSource(stream);
            sourceNode.connect(analyser);

            // Connect script processor node to read downsampled buffer
            const processor = audioCtx.createScriptProcessor(2048, 1, 1);
            processorNodeRef.current = processor;

            // 3. Establish WebSocket connection
            const baseUrl = import.meta.env.DEV
                ? `ws://${window.location.host}/openai-realtime`
                : 'wss://api.openai.com';

            const wsUrl = `${baseUrl}/v1/realtime?model=gpt-4o-realtime-preview`;
            const ws = new WebSocket(wsUrl);
            wsRef.current = ws;

            ws.onopen = () => {
                setStatusText('Connected! Establishing session…');
            };

            ws.onmessage = async (event) => {
                if (typeof event.data !== 'string') return;
                try {
                    const msg = JSON.parse(event.data);

                    // A. Handle Session Established (OpenAI sends session.created first)
                    if (msg.type === 'session.created') {
                        // Send Setup/Session update configuration
                        const setupMessage = {
                            type: 'session.update',
                            session: {
                                modalities: ['audio', 'text'],
                                instructions: selectedGoal.system,
                                voice: selectedVoice,
                                input_audio_format: 'pcm16',
                                output_audio_format: 'pcm16',
                                input_audio_transcription: {
                                    model: 'whisper-1'
                                },
                                turn_detection: {
                                    type: 'server_vad',
                                    threshold: 0.5,
                                    prefix_padding_ms: 300,
                                    silence_duration_ms: 500
                                }
                            }
                        };
                        ws.send(JSON.stringify(setupMessage));
                    }

                    // B. Handle Session Updated (Handshake complete)
                    if (msg.type === 'session.updated') {
                        setIsConnecting(false);
                        setIsActive(true);
                        setStatusText('Active Session • Go ahead and speak');

                        // Start sending microphone audio chunks
                        processor.onaudioprocess = (e) => {
                            if (isMuted || ws.readyState !== WebSocket.OPEN) return;
                            const floatData = e.inputBuffer.getChannelData(0);
                            const intData = new Int16Array(floatData.length);
                            for (let i = 0; i < floatData.length; i++) {
                                intData[i] = Math.max(-32768, Math.min(32767, floatData[i] * 32767));
                            }
                            const base64 = btoa(String.fromCharCode(...new Uint8Array(intData.buffer)));
                            ws.send(JSON.stringify({
                                type: 'input_audio_buffer.append',
                                audio: base64
                            }));
                        };
                        sourceNode.connect(processor);
                        processor.connect(audioCtx.destination);
                    }

                    // C. Handle Server Audio Output Chunks
                    if (msg.type === 'response.audio.delta' && msg.delta) {
                        const base64Data = msg.delta;
                        const rawBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
                        const int16Buffer = new Int16Array(rawBytes.buffer);
                        const float32Buffer = new Float32Array(int16Buffer.length);
                        for (let i = 0; i < int16Buffer.length; i++) {
                            float32Buffer[i] = int16Buffer[i] / 32768.0;
                        }

                        // Play audio chunk (OpenAI outputs at 24kHz PCM)
                        const playCtx = audioContextRef.current;
                        if (playCtx) {
                            const audioBuffer = playCtx.createBuffer(1, float32Buffer.length, 24000);
                            audioBuffer.copyToChannel(float32Buffer, 0);
                            const source = playCtx.createBufferSource();
                            source.buffer = audioBuffer;
                            source.connect(playCtx.destination);

                            const currentTime = playCtx.currentTime;
                            const playTime = Math.max(currentTime, playStartTimeRef.current);
                            source.start(playTime);
                            playStartTimeRef.current = playTime + audioBuffer.duration;
                        }
                    }

                    // D. Capture and render AI transcript text
                    if (msg.type === 'response.audio_transcript.delta' && msg.delta) {
                        const textVal = msg.delta;
                        setChatHistory((prev) => {
                            const last = prev[prev.length - 1];
                            if (last && last.role === 'ai') {
                                return [...prev.slice(0, -1), { role: 'ai', text: last.text + textVal }];
                            }
                            return [...prev, { role: 'ai', text: textVal }];
                        });
                    }

                    // E. Capture and render User transcript text
                    if (msg.type === 'conversation.item.input_audio_transcription.completed' && msg.transcript) {
                        const userText = msg.transcript.trim();
                        if (userText) {
                            setChatHistory((prev) => [
                                ...prev,
                                { role: 'user', text: userText }
                            ]);
                        }
                    }

                    // F. Handle user interruption (speech started while AI speaks)
                    if (msg.type === 'input_audio_buffer.speech_started') {
                        const playCtx = audioContextRef.current;
                        if (playCtx) {
                            playStartTimeRef.current = playCtx.currentTime;
                        }
                    }

                } catch (jsonErr) {
                    console.error('Error parsing live WS server message:', jsonErr);
                }
            };

            ws.onerror = (err) => {
                console.error('WebSocket Error. The handshake might have failed due to invalid API key, CORS, or a model rejection.', err);
                setStatusText('Connection error. Please try again.');
                stopSession();
            };

            ws.onclose = (event) => {
                console.log(`WebSocket closed: Code=${event.code}, Reason=${event.reason || 'No reason provided'}, Clean=${event.wasClean}`);
                stopSession();
            };

        } catch (err) {
            console.error('Failed to initialize live speech session:', err);
            setStatusText(`Microphone error: ${err.message}`);
            stopSession();
        }
    };

    const appendTranscript = (role, text) => {
        if (!text) return;
        setChatHistory((previous) => {
            const last = previous[previous.length - 1];
            
            if (role === 'ai') {
                const combined = (last?.role === 'ai' ? last.text : '') + text;
                const match = combined.match(/{"userTone":\s*"([^"]+)"}/);
                
                if (match) {
                    setHybridScore(prev => ({ ...prev, textSignal: match[1].toLowerCase() }));
                }
                
                if (last?.role === 'ai') {
                    const newHistory = [...previous.slice(0, -1), { role: 'ai', text: combined }];
                    chatHistoryRef.current = newHistory;
                    return newHistory;
                }
                const newHistory = [...previous, { role, text }];
                chatHistoryRef.current = newHistory;
                return newHistory;
            }
            
            if (role === 'user') {
                const words = text.trim().split(/\s+/).length;
                let durationMins = audioStatsRef.current.speechStartTime > 0 
                    ? (Date.now() - audioStatsRef.current.speechStartTime) / 60000 
                    : 0;
                
                // Fallback heuristic: If mic threshold didn't trigger or network lag caused 
                // unreasonable duration, estimate duration based on average conversational pace (130wpm).
                if (durationMins <= 0.01) {
                    durationMins = Math.max(0.02, words / 130);
                }
                
                let wpm = words / durationMins;
                
                // Clamp WPM to realistic human bounds to prevent wild UI jumps
                wpm = Math.max(40, Math.min(Math.round(wpm), 350));
                
                const paceSignal = wpm < 110 ? 'hesitant' : wpm > 160 ? 'rushed' : 'steady';
                
                const pitches = audioStatsRef.current.pitchSamples;
                let variance = 0;
                if (pitches.length > 0) {
                    const mean = pitches.reduce((a,b) => a+b, 0) / pitches.length;
                    variance = pitches.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / pitches.length;
                }
                const toneSignal = variance < 500 ? 'flat' : variance > 3000 ? 'highly varied' : 'varied';
                
                setHybridScore(prev => {
                    const textSignal = prev?.textSignal || 'neutral';
                    const overallLabel = `You sounded ${textSignal} and ${paceSignal} today.`;
                    
                    // Log metrics to general activity (with logActivity util)
                    logActivity(profile.id, 'speech_therapy_session_completed', { 
                        textTone: textSignal, 
                        avgWordsPerMinute: wpm, 
                        pitchVarianceLevel: toneSignal, 
                        rawVariance: variance 
                    });
                    
                    return { textSignal, paceSignal, toneSignal, overallLabel, wpm, variance };
                });
                
                audioStatsRef.current = { isSpeaking: false, speechStartTime: 0, pitchSamples: [] };
                
                const newHistory = [...previous, { role, text }];
                chatHistoryRef.current = newHistory;
                return newHistory;
            }
        });
    };

    const toBase64 = (buffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
        return btoa(binary);
    };

    const playGeminiAudio = (base64Audio) => {
        const audioContext = audioContextRef.current;
        if (!audioContext) return;
        const bytes = Uint8Array.from(atob(base64Audio), (char) => char.charCodeAt(0));
        const pcm16 = new Int16Array(bytes.buffer);
        const samples = new Float32Array(pcm16.length);
        pcm16.forEach((sample, index) => { samples[index] = sample / 32768; });
        const buffer = audioContext.createBuffer(1, samples.length, 24000);
        buffer.copyToChannel(samples, 0);
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        const when = Math.max(audioContext.currentTime, geminiPlaybackTimeRef.current);
        source.start(when);
        geminiPlaybackTimeRef.current = when + buffer.duration;
    };

    // Gemini Live uses a stateful WebSocket and PCM audio rather than WebRTC tracks.
    const startGeminiSession = async () => {
        try {
            setIsConnecting(true);
            setStatusText('Getting secure Gemini Live access…');
            setTimer(0);
            setChatHistory([]);
            chatHistoryRef.current = [];
            setShowSummary(false);

            // Fetch recent summaries for context
            let memoryContext = '';
            if (profile?.id) {
                const { data: recentSummaries } = await supabase
                    .from('therapy_session_summaries')
                    .select('summary, session_target, created_at')
                    .eq('user_id', profile.id)
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (recentSummaries?.length) {
                    memoryContext = `\n\nRecent session history (for your context only, don't recite this back verbatim):\n` +
                        recentSummaries.map(s => `- ${new Date(s.created_at).toLocaleDateString()}: ${s.summary}`).join('\n');
                }
            }

            const systemPromptWithPiggyback = `${selectedGoal.system}${memoryContext}
IMPORTANT: The user has selected their language preference as ${languageName}. You MUST speak and respond ONLY in ${languageName} for the entirety of this session.
IMPORTANT: Also classify the emotional tone of what the user just said. Respond with a JSON field: "userTone": one of ["calm", "anxious", "frustrated", "confident", "sad", "neutral", "excited"]. Put this exact JSON substring anywhere in your text response, e.g. {"userTone": "calm"}. Do NOT speak this JSON out loud. Only output it in your text transcript.`;

            const { data, error } = await supabase.functions.invoke('gemini-live-token');
            if (error) {
                let detail = error.message;
                try {
                    if (error.context && typeof error.context.json === 'function') {
                        const body = await error.context.json();
                        detail = body?.detail || body?.error || detail;
                    }
                } catch {
                    // The response body may already have been consumed by the SDK.
                }
                console.error('Gemini token function failed:', { message: error.message, detail });
                throw new Error(detail || 'Could not get a Gemini Live token.');
            }
            if (!data?.token) throw new Error(data?.error || 'Could not get a Gemini Live token.');

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;
            const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
            audioContextRef.current = audioContext;
            await audioContext.resume();
            geminiPlaybackTimeRef.current = audioContext.currentTime;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            const input = audioContext.createMediaStreamSource(stream);
            input.connect(analyser);
            const processor = audioContext.createScriptProcessor(2048, 1, 1);
            geminiProcessorRef.current = processor;

            const socket = new WebSocket(
                `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(data.token)}`
            );
            geminiSocketRef.current = socket;

            socket.onopen = () => {
                socket.send(JSON.stringify({
                    setup: {
                        model: 'models/gemini-3.1-flash-live-preview',
                        generationConfig: { responseModalities: ['AUDIO'] },
                        systemInstruction: { parts: [{ text: systemPromptWithPiggyback }] },
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                    },
                }));
                setStatusText('Connecting to Gemini therapist…');
            };

            socket.onmessage = async (event) => {
                try {
                    // Browsers may deliver Gemini frames as Blob even when the
                    // payload is JSON text. Decode the frame before parsing it.
                    let payload = event.data;
                    if (payload instanceof Blob) payload = await payload.text();
                    if (payload instanceof ArrayBuffer) payload = new TextDecoder().decode(payload);
                    if (typeof payload !== 'string') return;
                    const message = JSON.parse(payload);
                    if (message.setupComplete) {
                        input.connect(processor);
                        // Connect to a zero-gain node: it keeps ScriptProcessor alive without microphone echo.
                        const silentOutput = audioContext.createGain();
                        silentOutput.gain.value = 0;
                        processor.connect(silentOutput);
                        silentOutput.connect(audioContext.destination);
                        processor.onaudioprocess = (audioEvent) => {
                            if (isMutedRef.current || socket.readyState !== WebSocket.OPEN) return;
                            const floats = audioEvent.inputBuffer.getChannelData(0);
                            const pcm16 = new Int16Array(floats.length);
                            floats.forEach((sample, index) => { pcm16[index] = Math.max(-32768, Math.min(32767, sample * 32767)); });
                            socket.send(JSON.stringify({ realtimeInput: { audio: { data: toBase64(pcm16.buffer), mimeType: `audio/pcm;rate=${audioContext.sampleRate}` } } }));
                        };
                        setIsConnecting(false);
                        setIsActive(true);
                        setStatusText('Active Gemini session • AI is initiating conversation…');
                        
                        // Force AI to speak first
                        socket.send(JSON.stringify({
                            clientContent: {
                                turns: [{ role: 'user', parts: [{ text: `Hello! Please introduce yourself and initiate our session now in ${languageName}.` }] }],
                                turnComplete: true
                            }
                        }));
                    }

                    const content = message.serverContent;
                    if (content?.inputTranscription?.text) appendTranscript('user', content.inputTranscription.text);
                    if (content?.outputTranscription?.text) appendTranscript('ai', content.outputTranscription.text);
                    content?.modelTurn?.parts?.forEach((part) => {
                        if (part.inlineData?.data) playGeminiAudio(part.inlineData.data);
                    });
                    if (message.error?.message) setStatusText(`Gemini error: ${message.error.message}`);
                } catch (parseError) {
                    console.error('Could not parse Gemini Live event:', parseError);
                }
            };
            socket.onerror = () => stopSession('Gemini Live connection error. Please try again.');
            socket.onclose = (event) => {
                if (event.code !== 1000) stopSession(`Gemini Live closed (${event.code}). ${event.reason || 'Please try again.'}`);
            };
        } catch (error) {
            console.error('Failed to initialize Gemini Live:', error);
            stopSession(`Could not start Gemini Live: ${error.message}`);
        }
    };

    // Secure browser client: microphone travels over WebRTC; the Edge Function holds the OpenAI key.
    const startSession = async () => {
        const systemPromptWithPiggyback = `${selectedGoal.system}
IMPORTANT: The user has selected their language preference as ${languageName}. You MUST speak and respond ONLY in ${languageName} for the entirety of this session.
IMPORTANT: Also classify the emotional tone of what the user just said. Respond with a JSON field: "userTone": one of ["calm", "anxious", "frustrated", "confident", "sad", "neutral", "excited"]. Put this exact JSON substring anywhere in your text response, e.g. {"userTone": "calm"}. Do NOT speak this JSON out loud. Only output it in your text transcript.`;

        try {
            setIsConnecting(true);
            setStatusText('Connecting to therapist…');
            setTimer(0);
            setChatHistory([]);
            setShowSummary(false);

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaStreamRef.current = stream;

            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            audioContextRef.current = audioContext;
            await audioContext.resume();
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            audioContext.createMediaStreamSource(stream).connect(analyser);

            const peerConnection = new RTCPeerConnection();
            peerConnectionRef.current = peerConnection;
            stream.getAudioTracks().forEach((track) => peerConnection.addTrack(track, stream));

            const dataChannel = peerConnection.createDataChannel('oai-events');
            dataChannelRef.current = dataChannel;
            
            // Force AI to speak first once connected
            dataChannel.onopen = () => {
                dataChannel.send(JSON.stringify({
                    type: "conversation.item.create",
                    item: {
                        type: "message",
                        role: "user",
                        content: [{ type: "input_text", text: `Hello! Please introduce yourself and initiate our session now in ${languageName}.` }]
                    }
                }));
                dataChannel.send(JSON.stringify({ type: "response.create" }));
            };
            
            dataChannel.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data);
                    if ((message.type === 'response.output_audio_transcript.delta' || message.type === 'response.audio_transcript.delta') && message.delta) {
                        appendTranscript('ai', message.delta);
                    }
                    if (message.type === 'conversation.item.input_audio_transcription.completed' && message.transcript) {
                        appendTranscript('user', message.transcript.trim());
                    }
                    if (message.type === 'error') {
                        setStatusText(`Session error: ${message.error?.message || 'Unknown error'}`);
                    }
                } catch (error) {
                    console.error('Could not parse Realtime event:', error);
                }
            };
            peerConnection.ontrack = async (event) => {
                if (!remoteAudioRef.current) return;
                remoteAudioRef.current.srcObject = event.streams[0];
                try { await remoteAudioRef.current.play(); } catch (error) { console.warn('Remote audio playback failed:', error); }
            };
            peerConnection.onconnectionstatechange = () => {
                if (['failed', 'disconnected'].includes(peerConnection.connectionState)) {
                    stopSession(`Connection ${peerConnection.connectionState}. Please try again.`);
                }
            };

            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            if (sessionError || !session?.access_token) throw new Error('Please sign in again before starting therapy.');

            const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/realtime-call`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ sdp: offer.sdp, instructions: systemPromptWithPiggyback, voice: selectedVoice }),
            });
            if (!response.ok) {
                const detail = await response.json().catch(() => ({}));
                throw new Error(detail.error || `Could not start the realtime call (${response.status}).`);
            }

            await peerConnection.setRemoteDescription({ type: 'answer', sdp: await response.text() });
            setIsConnecting(false);
            setIsActive(true);
            setStatusText('Active session • Go ahead and speak');
        } catch (error) {
            console.error('Failed to initialize speech therapy:', error);
            stopSession(`Could not start session: ${error.message}`);
        }
    };

    const toggleMute = () => {
        const nextMuted = !isMuted;
        isMutedRef.current = nextMuted;
        mediaStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
        setIsMuted(nextMuted);
    };

    const handleEndSession = () => {
        stopSession();
        setShowSummary(true);
    };

    return (
        <div className="flex-1 flex flex-col min-h-0 relative">
            <audio ref={remoteAudioRef} autoPlay className="hidden" />
            <ScreenHeader
                title="Speech Therapy"
                showBack={true}
                onBack={() => {
                    stopSession();
                    navigate('/tools');
                }}
            />

            {!isActive && !isConnecting && !showSummary ? (
                /* Configurator Screen */
                <div className="flex-1 flex flex-col p-5 overflow-y-auto pb-20 justify-between">
                    <div className="flex flex-col gap-6">
                        {/* Info banner */}
                        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 flex gap-3">
                            <Info className="text-primary shrink-0 mt-0.5" size={20} />
                            <div>
                                <h3 className="text-base-sm font-bold text-primary">Live AI Speech Therapy</h3>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                    Have a natural, real-time spoken conversation with our AI therapist. The model listens directly to your pronunciation, rate, and voice pitch to give natural audio feedback.
                                </p>
                            </div>
                        </div>

                        {/* Provider Selector */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Select AI Engine</label>
                            <div className="grid grid-cols-2 gap-2 mt-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-1">
                                <button
                                    onClick={() => setProvider('openai')}
                                    className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                        provider === 'openai' 
                                            ? 'bg-primary text-white shadow-md' 
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                                >
                                    OpenAI Realtime (WebRTC)
                                </button>
                                <button
                                    onClick={() => setProvider('gemini')}
                                    className={`py-2.5 px-3 rounded-lg text-xs font-bold transition-all ${
                                        provider === 'gemini' 
                                            ? 'bg-primary text-white shadow-md' 
                                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                                    }`}
                                >
                                    Gemini Live (WebSocket)
                                </button>
                            </div>
                        </div>

                        {/* Goal Selector */}
                        <div>
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Select Therapy Target</label>
                            <div className="grid grid-cols-1 gap-3 mt-3">
                                {THERAPY_GOALS.map((goal) => (
                                    <button
                                        key={goal.id}
                                        onClick={() => setSelectedGoal(goal)}
                                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 hover:scale-[1.01] active:scale-[0.99] ${selectedGoal.id === goal.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'
                                            }`}
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${selectedGoal.id === goal.id ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                                            }`}>
                                            <Volume2 size={18} />
                                        </div>
                                        <div className="min-w-0">
                                            <h4 className="text-base-sm font-bold">{goal.label}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">{goal.desc}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Voice Configuration */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Voice Selector</label>
                                <select
                                    value={selectedVoice}
                                    onChange={(e) => setSelectedVoice(e.target.value)}
                                    className="w-full mt-2.5 p-3.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:outline-none focus:border-primary text-base-sm"
                                >
                                    {(provider === 'openai' ? OPENAI_VOICES : GEMINI_VOICES).map((voice) => (
                                        <option key={voice.id} value={voice.id}>{voice.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Start Action */}
                    <div className="pt-6">
                        <button
                            onClick={provider === 'openai' ? startSession : startGeminiSession}
                            className="w-full bg-primary hover:bg-primary-light text-white font-bold p-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20"
                        >
                            <Play size={20} fill="currentColor" />
                            Start Therapy Session
                        </button>
                    </div>
                </div>
            ) : (isActive || isConnecting) ? (
                /* Live Waveform Conversation Screen */
                <div className="flex-1 flex flex-col p-5 justify-between min-h-0">
                    {/* Header bar with timer */}
                    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${isConnecting ? 'bg-amber-500 animate-ping' : 'bg-green-500 animate-pulse'}`} />
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                {isConnecting ? 'Connecting to therapist…' : `Therapist: ${selectedVoice}`}
                            </span>
                        </div>
                        <span className="text-sm font-bold text-primary">
                            {isConnecting ? '00:00' : formatTime(timer)}
                        </span>
                    </div>

                    {/* Strands visualizer wave */}
                    <div className="flex-1 flex flex-col items-center justify-center py-4 relative w-full h-full min-h-[300px]">
                        <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, opacity: isActive || isConnecting ? 1 : 0, transition: 'opacity 0.5s' }}>
                            <Strands
                                intensityRef={visualizerIntensityRef}
                                colors={["#F97316","#7C3AED","#06B6D4"]}
                                count={3}
                                speed={0.3}
                                amplitude={1}
                                waviness={1}
                                thickness={0.7}
                                glow={2.6}
                                taper={3}
                                spread={1}
                                intensity={0.6}
                                saturation={2}
                                opacity={1}
                                scale={1.5}
                                glass={false}
                                refraction={1}
                                dispersion={1}
                                glassSize={1}
                                hueShift={0}
                            />
                        </div>
                        <div className="absolute flex flex-col items-center text-center px-4">
                            <Volume2 size={40} className={`text-primary ${isConnecting ? 'animate-bounce' : 'animate-pulse'}`} />
                            <span className="text-xs text-primary font-bold mt-2.5">
                                {isConnecting ? 'Connecting…' : 'Listening…'}
                            </span>
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 max-w-[200px] font-medium leading-tight">
                                {statusText}
                            </span>
                        </div>
                    </div>

                    {/* Interactive running transcript */}
                    <div className="bg-white/50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 rounded-2xl p-4 h-36 overflow-y-auto mb-6 flex flex-col gap-3">
                        {chatHistory.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-8">Start speaking. Your words and the AI responses will transcribe here.</p>
                        ) : (
                            chatHistory.map((msg, index) => (
                                <div key={index} className="flex gap-2">
                                    <div className="shrink-0 mt-0.5">
                                        <MessageCircle size={14} className={msg.role === 'user' ? 'text-green-500 dark:text-green-400' : 'text-primary'} />
                                    </div>
                                    <p className="text-xs text-gray-800 dark:text-gray-300 leading-relaxed font-semibold">
                                        <span className={msg.role === 'user' ? 'text-green-600 dark:text-green-400 font-bold' : 'text-primary font-bold'}>
                                            {msg.role === 'user' ? 'You: ' : 'Therapist: '}
                                        </span>
                                        {msg.text.replace(/{"userTone":\s*"[^"]+"}/g, '')}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Live controls */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleMute}
                            className={`flex-1 p-4 rounded-2xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${isMuted
                                    ? 'bg-red-500/10 border-red-500 text-red-500 dark:text-red-400'
                                    : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                                }`}
                        >
                            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
                            {isMuted ? 'Mic Muted' : 'Mute Mic'}
                        </button>
                        <button
                            onClick={handleEndSession}
                            className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold p-4 rounded-2xl flex items-center justify-center gap-2 transition-all"
                        >
                            <Square size={18} fill="currentColor" />
                            End Session
                        </button>
                    </div>
                </div>
            ) : (
                /* Session Completed Summary Screen */
                <div className="flex-1 flex flex-col p-5 overflow-y-auto justify-between pb-20">
                    <div className="flex flex-col items-center text-center py-6">
                        <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-4">
                            <Award size={32} />
                        </div>
                        <h2 className="text-base-lg font-bold">Session Completed!</h2>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Excellent work on your speech practice today.</p>

                        {/* Session Metrics grid */}
                        <div className="grid grid-cols-2 gap-4 w-full mt-8">
                            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex flex-col items-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Practice Goal</span>
                                <span className="text-sm font-bold mt-2">{selectedGoal.label}</span>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl flex flex-col items-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Session Length</span>
                                <span className="text-sm font-bold text-primary mt-2">{formatTime(timer)}</span>
                            </div>
                        </div>

                        {/* Hybrid Heuristic Score Breakdown */}
                        {hybridScore && (
                            <div className="w-full mt-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4 rounded-2xl text-left">
                                <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Hybrid Heuristic Score</h4>
                                <p className="text-sm text-primary font-bold mb-4">{hybridScore.overallLabel}</p>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col">
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Text Sentiment</span>
                                        <span className="text-xs mt-1 capitalize">{hybridScore.textSignal}</span>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col">
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Pace (WPM)</span>
                                        <span className="text-xs mt-1 capitalize">{hybridScore.paceSignal} ({Math.round(hybridScore.wpm || 0)})</span>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-800 flex flex-col">
                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 font-bold">Pitch Tone</span>
                                        <span className="text-xs mt-1 capitalize">{hybridScore.toneSignal}</span>
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-3 leading-relaxed">
                                    Note: This is a transparent, heuristic breakdown combining text tone, speaking pace, and acoustic variance. It is not an ML-based emotion detector.
                                </p>
                            </div>
                        )}

                        {/* Encouraging Feedback Cards */}
                        <div className="w-full mt-6 bg-primary/5 border border-primary/20 p-4 rounded-2xl text-left flex gap-3.5">
                            <Heart className="text-primary shrink-0 mt-0.5" size={20} />
                            <div>
                                <h4 className="text-xs font-bold text-primary">Speech therapist insights</h4>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1.5 leading-relaxed">
                                    You successfully conversed with focus on your target sound and rhythm. Speech exercises like this build confidence, retrain muscle memory, and encourage pacing. Keep up the amazing work!
                                </p>
                            </div>
                        </div>

                        {/* Checklist Achievements */}
                        <div className="w-full mt-6 flex flex-col gap-3">
                            <div className="flex items-center gap-3 bg-white dark:bg-gray-900/50 p-3.5 rounded-xl border border-gray-200 dark:border-gray-900">
                                <CheckCircle2 className="text-primary shrink-0" size={16} />
                                <span className="text-xs font-medium">Completed target: {selectedGoal.label}</span>
                            </div>
                            <div className="flex items-center gap-3 bg-white dark:bg-gray-900/50 p-3.5 rounded-xl border border-gray-200 dark:border-gray-900">
                                <CheckCircle2 className="text-primary shrink-0" size={16} />
                                <span className="text-xs font-medium">Engaged in real-time conversational exchange</span>
                            </div>
                        </div>
                    </div>

                    {/* Exit / Return button */}
                    <div>
                        <button
                            onClick={() => setShowSummary(false)}
                            className="w-full bg-primary hover:bg-primary-light text-white font-bold p-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg"
                        >
                            Return to Tools
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
