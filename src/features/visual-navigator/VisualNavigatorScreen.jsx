import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, Mic, MicOff, Navigation, Square, Volume2 } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useSettingsStore from '../../store/useSettingsStore';
import { supabase } from '../../shared/lib/supabaseClient';

const NAVIGATOR_INSTRUCTIONS = `You are SahaAI Visual Navigator, a calm mobility assistant for a person navigating their immediate surroundings with a camera.
Speak only in the user's preferred language. Give short, practical navigation guidance: obstacles, steps, doors, changes in direction, and nearby landmarks.
Do not speculate. Never claim a path is safe; say what you can see and encourage the user to verify with their mobility aid or a trusted person.
Stay quiet when nothing meaningfully changes. Respond immediately to direct questions. Keep each response under two sentences.`;

const toBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let text = '';
  bytes.forEach((byte) => { text += String.fromCharCode(byte); });
  return btoa(text);
};

const dataUrlToBase64 = (dataUrl) => dataUrl.split(',')[1];

export default function VisualNavigatorScreen() {
  const speechLanguage = useSettingsStore((s) => s.speechLanguage);
  const displayLanguage = useSettingsStore((s) => s.displayLanguage);
  const [status, setStatus] = useState('Ready to start live navigation');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [lastGuidance, setLastGuidance] = useState('Point your camera ahead, then start the navigator.');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const playbackRef = useRef(0);
  const frameIntervalRef = useRef(null);
  const mutedRef = useRef(false);

  const playAudio = useCallback((base64Audio) => {
    const context = audioContextRef.current;
    if (!context) return;
    const bytes = Uint8Array.from(atob(base64Audio), (char) => char.charCodeAt(0));
    const pcm16 = new Int16Array(bytes.buffer);
    const samples = new Float32Array(pcm16.length);
    pcm16.forEach((sample, index) => { samples[index] = sample / 32768; });
    const buffer = context.createBuffer(1, samples.length, 24000);
    buffer.copyToChannel(samples, 0);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const startAt = Math.max(context.currentTime, playbackRef.current);
    source.start(startAt);
    playbackRef.current = startAt + buffer.duration;
  }, []);

  const stopNavigator = useCallback((nextStatus = 'Navigation stopped') => {
    setIsActive(false);
    setIsConnecting(false);
    setStatus(nextStatus);
    clearInterval(frameIntervalRef.current);
    frameIntervalRef.current = null;
    processorRef.current?.disconnect();
    processorRef.current = null;
    socketRef.current?.close(1000, 'Navigator stopped');
    socketRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraReady(false);
    if (videoRef.current) videoRef.current.srcObject = null;
    audioContextRef.current?.close();
    audioContextRef.current = null;
  }, []);

  useEffect(() => () => stopNavigator(), [stopNavigator]);

  // Show a camera preview as soon as the feature opens. Gemini Live and the
  // microphone still begin only after the user taps Start Navigator.
  useEffect(() => {
    let cancelled = false;
    const startPreview = async () => {
      try {
        setStatus('Requesting camera access…');
        const preview = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          preview.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = preview;
        if (videoRef.current) videoRef.current.srcObject = preview;
        setIsCameraReady(true);
        setStatus('Camera ready. Start navigation when you are ready.');
      } catch (error) {
        setStatus(`Camera unavailable: ${error.message || 'please allow camera access in your browser.'}`);
      }
    };
    startPreview();
    return () => { cancelled = true; };
  }, []);

  const sendVideoFrame = useCallback(() => {
    const socket = socketRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !video || !canvas || video.readyState < 2) return;
    const width = 640;
    const height = Math.round((video.videoHeight / video.videoWidth) * width) || 480;
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
    socket.send(JSON.stringify({ realtimeInput: { video: { data: dataUrlToBase64(canvas.toDataURL('image/jpeg', 0.7)), mimeType: 'image/jpeg' } } }));
  }, []);

  const startNavigator = async () => {
    try {
      setIsConnecting(true);
      setStatus('Requesting secure Gemini Live access…');
      const { data, error } = await supabase.functions.invoke('gemini-live-token');
      if (error || !data?.token) throw new Error(data?.error || error?.message || 'Could not get a Gemini Live token.');

      // Replace the preview-only stream with the combined camera + microphone stream.
      streamRef.current?.getTracks().forEach((track) => track.stop());
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setIsCameraReady(true);

      const context = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = context;
      await context.resume();
      playbackRef.current = context.currentTime;
      const input = context.createMediaStreamSource(stream);
      const processor = context.createScriptProcessor(2048, 1, 1);
      processorRef.current = processor;

      const socket = new WebSocket(`wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained?access_token=${encodeURIComponent(data.token)}`);
      socketRef.current = socket;
      socket.onopen = () => socket.send(JSON.stringify({
        setup: {
          model: 'models/gemini-3.1-flash-live-preview',
          generationConfig: { responseModalities: ['AUDIO'] },
          systemInstruction: { parts: [{ text: `${NAVIGATOR_INSTRUCTIONS}\nThe preferred language is ${speechLanguage === 'ml' ? 'Malayalam' : 'English'}.` }] },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      }));
      socket.onmessage = async (event) => {
        let payload = event.data;
        if (payload instanceof Blob) payload = await payload.text();
        if (payload instanceof ArrayBuffer) payload = new TextDecoder().decode(payload);
        if (typeof payload !== 'string') return;
        const message = JSON.parse(payload);
        if (message.setupComplete) {
          const silentOutput = context.createGain();
          silentOutput.gain.value = 0;
          input.connect(processor);
          processor.connect(silentOutput);
          silentOutput.connect(context.destination);
          processor.onaudioprocess = (audioEvent) => {
            if (mutedRef.current || socket.readyState !== WebSocket.OPEN) return;
            const floats = audioEvent.inputBuffer.getChannelData(0);
            const pcm16 = new Int16Array(floats.length);
            floats.forEach((sample, index) => { pcm16[index] = Math.max(-32768, Math.min(32767, sample * 32767)); });
            socket.send(JSON.stringify({ realtimeInput: { audio: { data: toBase64(pcm16.buffer), mimeType: `audio/pcm;rate=${context.sampleRate}` } } }));
          };
          frameIntervalRef.current = setInterval(sendVideoFrame, 1000);
          sendVideoFrame();
          setIsConnecting(false);
          setIsActive(true);
          setStatus('Live navigator is watching and listening');
        }
        const content = message.serverContent;
        if (content?.outputTranscription?.text) setLastGuidance(content.outputTranscription.text);
        content?.modelTurn?.parts?.forEach((part) => {
          if (part.inlineData?.data) playAudio(part.inlineData.data);
        });
        if (message.error?.message) setStatus(`Gemini error: ${message.error.message}`);
      };
      socket.onerror = () => stopNavigator('Gemini Live connection error. Please try again.');
      socket.onclose = (event) => { if (event.code !== 1000) stopNavigator(`Navigator disconnected (${event.code}).`); };
    } catch (error) {
      stopNavigator(`Could not start navigator: ${error.message}`);
    }
  };

  const toggleMute = () => {
    const nextMuted = !isMuted;
    mutedRef.current = nextMuted;
    setIsMuted(nextMuted);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gray-950 text-white">
      <ScreenHeader title={displayLanguage === 'ml' ? 'വിഷ്വൽ നാവിഗേറ്റർ' : 'Visual Navigator'} showBack />
      <main className="flex-1 min-h-0 overflow-y-auto p-4 pb-24 max-w-2xl w-full mx-auto space-y-4">
        <section className="relative aspect-[3/4] sm:aspect-video overflow-hidden rounded-3xl border-2 border-primary bg-black shadow-xl">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          {!isCameraReady && !isConnecting && <div className="absolute inset-0 grid place-items-center bg-black/65 p-8 text-center"><Camera size={48} className="text-primary mb-3" /><p className="font-bold">Allow camera access to preview your surroundings.</p></div>}
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold"><span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : isCameraReady ? 'bg-sky-400' : 'bg-gray-400'}`} />{isActive ? 'LIVE' : isCameraReady ? 'CAMERA READY' : 'CAMERA OFF'}</div>
        </section>
        <section className="rounded-2xl border border-gray-700 bg-gray-900 p-4"><div className="flex items-center gap-2 text-primary font-bold"><Navigation size={20} />Latest guidance</div><p aria-live="polite" className="mt-2 text-base leading-relaxed text-gray-100">{lastGuidance}</p></section>
        <p className="text-center text-sm text-gray-400">{status}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={isActive || isConnecting ? () => stopNavigator() : startNavigator} className={`min-h-touch rounded-2xl font-bold flex items-center justify-center gap-2 ${isActive || isConnecting ? 'bg-red-600 text-white' : 'bg-primary text-white'}`}>{isActive || isConnecting ? <><Square size={18} />Stop</> : <><Navigation size={18} />Start navigator</>}</button>
          <button onClick={toggleMute} disabled={!isActive} className="min-h-touch rounded-2xl border border-gray-600 bg-gray-800 font-bold flex items-center justify-center gap-2 disabled:opacity-40">{isMuted ? <MicOff size={18} /> : <Mic size={18} />}{isMuted ? 'Unmute' : 'Mute'}</button>
        </div>
        <p className="rounded-xl bg-amber-950/50 border border-amber-700/50 p-3 text-xs text-amber-100"><Volume2 size={15} className="inline mr-2" />Use this as an assistive description tool, not as a replacement for a cane, guide dog, trained mobility support, or personal judgement.</p>
      </main>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
