import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, Camera, ChevronDown, ChevronUp, CircleAlert, Compass, HelpCircle, Mic, MicOff, Navigation, OctagonAlert, Square, Volume2, VolumeX } from 'lucide-react';
import ScreenHeader from '../../shared/components/ScreenHeader';
import useSettingsStore from '../../store/useSettingsStore';
import { supabase } from '../../shared/lib/supabaseClient';

const NAVIGATOR_INSTRUCTIONS = `You are SahaAI Visual Navigator: a calm, practical real-time mobility companion. You can see the user's live camera feed and hear their voice. Your purpose is to help them navigate their immediate surroundings.
When the user names a destination (for example, “I need to go to the bathroom”), treat it as a navigation request. Respond helpfully: acknowledge the destination, inspect the visible surroundings for useful signs, doors, corridors, or landmarks, and ask one brief clarifying question only when needed. Continue giving step-by-step observations as the user moves.
Never say that you are “just a language model,” that you cannot help with navigation, or that you cannot see the environment. Do not give generic refusal language for ordinary navigation requests.
Speak only in the user's preferred language. Give short, practical guidance about obstacles, steps, doors, changes in direction, signs, and nearby landmarks. Do not speculate or invent locations. Never claim a path is safe; describe what you can see and encourage the user to verify with their mobility aid, senses, or a trusted person. Be proactively helpful: when asked for a navigation update, inspect the current camera view and give one short spoken observation or next action. Do not wait for the user to ask every question. Avoid continuous chatter, but do not answer a navigation check-in with silence. Keep each response under two sentences.`;

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
  const ui = displayLanguage === 'ml' ? {
    title: 'വിഷ്വൽ നാവിഗേറ്റർ', cameraReady: 'ക്യാമറ തയ്യാറാണ്', cameraOff: 'ക്യാമറ ഓഫ്', live: 'നാവിഗേഷൻ സജീവം',
    audio: 'ശബ്ദം', on: 'ഓൺ', off: 'ഓഫ്', transcriptView: 'ട്രാൻസ്ക്രിപ്റ്റ് കാഴ്ച', latest: 'ഏറ്റവും പുതിയ നിർദ്ദേശം',
    scanning: 'ചുറ്റുപാടുകൾ പരിശോധിക്കുന്നു', stop: 'നിർത്തുക', start: 'ആരംഭിക്കുക', mute: 'നിശ്ശബ്ദമാക്കുക', unmute: 'ശബ്ദം അനുവദിക്കുക',
    liveTranscript: 'തത്സമയ ട്രാൻസ്ക്രിപ്റ്റ്', cameraOnly: 'ക്യാമറ കാഴ്ചയ്ക്കായി താഴേക്ക് സ്വൈപ്പ് ചെയ്യുക', assistive: 'ഇത് ഒരു സഹായക വിവരണ ഉപകരണമായി ഉപയോഗിക്കുക; നിങ്ങളുടെ സഹായോപകരണങ്ങളും വ്യക്തിപരമായ തീരുമാനവും ഉപയോഗിക്കുക.',
  } : {
    title: 'Visual Navigator', cameraReady: 'CAMERA READY', cameraOff: 'CAMERA OFF', live: 'NAVIGATION LIVE',
    audio: 'Audio', on: 'On', off: 'Off', transcriptView: 'Transcript view', latest: 'Latest guidance',
    scanning: 'Scanning surroundings', stop: 'Stop', start: 'Start', mute: 'Mute', unmute: 'Unmute',
    liveTranscript: 'Live transcript', cameraOnly: 'Swipe down for camera-only view', assistive: 'Use this as an assistive description tool, alongside your mobility aid, senses, and personal judgement.',
  };
  const [status, setStatus] = useState('Ready to start live navigation');
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [isImmersive, setIsImmersive] = useState(false);
  const [lastGuidance, setLastGuidance] = useState('Point your camera ahead, then start the navigator.');
  const [guidanceLog, setGuidanceLog] = useState([]);
  const [navigationCue, setNavigationCue] = useState({ command: 'SCAN', confidence: 0, cue: 'Scanning surroundings.' });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const playbackRef = useRef(0);
  const frameIntervalRef = useRef(null);
  const guidanceIntervalRef = useRef(null);
  const cueIntervalRef = useRef(null);
  const cueExpiryRef = useRef(null);
  const cueRequestPendingRef = useRef(false);
  const cueCandidateRef = useRef({ command: 'SCAN', count: 0 });
  const mutedRef = useRef(false);
  const audioEnabledRef = useRef(true);
  const touchStartYRef = useRef(null);
  const transcriptBufferRef = useRef('');

  const playAudio = useCallback((base64Audio) => {
    if (!audioEnabledRef.current) return;
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

  const signalSafetyCue = useCallback((command) => {
    if (command !== 'STOP' && command !== 'CAUTION') return;
    if ('vibrate' in navigator) navigator.vibrate(command === 'STOP' ? [160, 80, 160] : [90]);
    const context = audioContextRef.current;
    if (!context || !audioEnabledRef.current) return;
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = command === 'STOP' ? 720 : 520;
    gain.gain.setValueAtTime(0.08, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
    oscillator.connect(gain).connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.16);
  }, []);

  const stopNavigator = useCallback((nextStatus = 'Navigation stopped') => {
    setIsActive(false);
    setIsConnecting(false);
    setStatus(nextStatus);
    clearInterval(frameIntervalRef.current);
    frameIntervalRef.current = null;
    clearInterval(guidanceIntervalRef.current);
    guidanceIntervalRef.current = null;
    clearInterval(cueIntervalRef.current);
    cueIntervalRef.current = null;
    clearTimeout(cueExpiryRef.current);
    cueExpiryRef.current = null;
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

  // Switching between transcript and camera-only layouts replaces the video
  // element, so attach the already-authorized stream to the new element.
  useEffect(() => {
    if (videoRef.current && streamRef.current) videoRef.current.srcObject = streamRef.current;
  }, [isImmersive]);

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

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;
    const width = 640;
    const height = Math.round((video.videoHeight / video.videoWidth) * width) || 480;
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
    return dataUrlToBase64(canvas.toDataURL('image/jpeg', 0.7));
  }, []);

  const sendVideoFrame = useCallback(() => {
    const socket = socketRef.current;
    const frame = captureFrame();
    if (!socket || socket.readyState !== WebSocket.OPEN || !frame) return;
    socket.send(JSON.stringify({ realtimeInput: { video: { data: frame, mimeType: 'image/jpeg' } } }));
  }, [captureFrame]);

  const requestNavigationCue = useCallback(async () => {
    if (cueRequestPendingRef.current) return;
    const image = captureFrame();
    if (!image) return;
    cueRequestPendingRef.current = true;
    try {
      const { data, error } = await supabase.functions.invoke('navigator-cue', { body: { image } });
      if (error || !data) return;
      const command = ['FORWARD', 'LEFT', 'RIGHT', 'STOP', 'CAUTION', 'SCAN'].includes(data.command) ? data.command : 'SCAN';
      const confidence = Number(data.confidence) || 0;
      const candidate = cueCandidateRef.current;
      candidate.count = candidate.command === command ? candidate.count + 1 : 1;
      candidate.command = command;
      const confirmed = (command === 'STOP' && confidence >= 0.85) || (candidate.count >= 2 && confidence >= 0.7);
      if (!confirmed) return;
      setNavigationCue({ command, confidence, cue: data.cue || 'Scanning surroundings.' });
      if (candidate.count === 2 || (command === 'STOP' && candidate.count === 1)) signalSafetyCue(command);
      clearTimeout(cueExpiryRef.current);
      cueExpiryRef.current = setTimeout(() => setNavigationCue({ command: 'SCAN', confidence: 0, cue: 'Scanning surroundings.' }), 6500);
    } catch (error) {
      console.warn('Navigation cue unavailable:', error);
    } finally {
      cueRequestPendingRef.current = false;
    }
  }, [captureFrame, signalSafetyCue]);

  const startNavigator = async () => {
    try {
      setIsConnecting(true);
      transcriptBufferRef.current = '';
      setGuidanceLog([]);
      cueCandidateRef.current = { command: 'SCAN', count: 0 };
      setNavigationCue({ command: 'SCAN', confidence: 0, cue: 'Scanning surroundings.' });
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
          cueIntervalRef.current = setInterval(requestNavigationCue, 3500);
          // A Live session can otherwise wait indefinitely for a user turn.
          // A paced check-in keeps it useful without narrating every frame.
          guidanceIntervalRef.current = setInterval(() => {
            if (socket.readyState !== WebSocket.OPEN) return;
            socket.send(JSON.stringify({
              clientContent: {
                turns: [{ role: 'user', parts: [{ text: 'Navigation check-in: inspect the current camera view and give one short, useful spoken navigation update. If the scene is unchanged, briefly say what direction to continue or what to watch for.' }] }],
                turnComplete: true,
              },
            }));
          }, 7000);
          sendVideoFrame();
          requestNavigationCue();
          setIsConnecting(false);
          setIsActive(true);
          setStatus('Live navigator is watching and listening');
          const welcome = speechLanguage === 'ml'
            ? 'ഞാൻ നാവിഗേഷനിൽ സഹായിക്കാൻ തയ്യാറാണ്. നിങ്ങൾ എവിടേക്കാണ് പോകാൻ ആഗ്രഹിക്കുന്നത്?'
            : 'I’m ready to help you navigate. Where do you want to go?';
          setLastGuidance(welcome);
          // Gemini Live owns audio output, so prompting it here makes the
          // greeting audible before it begins its normally quiet observation.
          socket.send(JSON.stringify({
            clientContent: {
              turns: [{ role: 'user', parts: [{ text: `Please say this greeting now, exactly and warmly: ${welcome}` }] }],
              turnComplete: true,
            },
          }));
        }
        const content = message.serverContent;
        if (content?.outputTranscription?.text) {
          const guidance = content.outputTranscription.text;
          transcriptBufferRef.current += guidance;
          setLastGuidance(transcriptBufferRef.current);
          setGuidanceLog((previous) => {
            const last = previous[previous.length - 1];
            const nextEntry = { id: last?.isLive ? last.id : crypto.randomUUID(), text: transcriptBufferRef.current, isLive: true };
            return last?.isLive ? [...previous.slice(0, -1), nextEntry] : [...previous.slice(-3), nextEntry];
          });
        }
        if (content?.turnComplete && transcriptBufferRef.current) {
          transcriptBufferRef.current = '';
          setGuidanceLog((previous) => previous.map((entry, index) => index === previous.length - 1 ? { ...entry, isLive: false } : entry));
        }
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

  const toggleAudio = () => {
    const nextAudioOn = !isAudioOn;
    audioEnabledRef.current = nextAudioOn;
    setIsAudioOn(nextAudioOn);
  };

  const handleCameraTouchStart = (event) => {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
  };

  const handleCameraTouchEnd = (event) => {
    const startY = touchStartYRef.current;
    const endY = event.changedTouches[0]?.clientY;
    touchStartYRef.current = null;
    if (startY !== null && endY - startY > 72) setIsImmersive(true);
  };

  const direction = navigationCue.command === 'LEFT' ? 'left' : navigationCue.command === 'RIGHT' ? 'right' : navigationCue.command === 'FORWARD' ? 'forward' : navigationCue.command.toLowerCase();
  const DirectionIcon = direction === 'left' ? ArrowLeft : direction === 'right' ? ArrowRight : direction === 'forward' ? ArrowUp : direction === 'stop' ? OctagonAlert : direction === 'caution' ? CircleAlert : Compass;
  const directionMotionClass = direction === 'left' ? '-translate-x-5' : direction === 'right' ? 'translate-x-5' : direction === 'forward' ? '-translate-y-3' : '';
  const cueLabel = direction === 'forward' ? 'Continue ahead' : direction === 'left' || direction === 'right' ? `Move ${direction}` : direction === 'stop' ? 'Stop' : direction === 'caution' ? 'Caution' : 'Scanning surroundings';
  const cueColorClass = direction === 'stop' ? 'text-red-600' : direction === 'caution' ? 'text-amber-500' : 'text-primary';

  if (isImmersive) {
    return (
      <div className="flex-1 flex min-h-0 flex-col bg-[var(--a11y-bg)] text-[var(--a11y-text)]">
        <ScreenHeader title={displayLanguage === 'ml' ? 'വിഷ്വൽ നാവിഗേറ്റർ' : 'Visual Navigator'} showBack />
        <main className="flex-1 min-h-0 p-2">
        <section onTouchStart={handleCameraTouchStart} onTouchEnd={handleCameraTouchEnd} className="relative h-full w-full overflow-hidden rounded-[2rem] border-2 border-primary shadow-xl">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          <div className="absolute top-4 left-4 flex items-center gap-2 rounded-full bg-[var(--a11y-surface)] px-4 py-2 text-xs font-extrabold text-[var(--a11y-text)] shadow-lg"><span className={`h-2.5 w-2.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : isCameraReady ? 'bg-primary' : 'bg-gray-400'}`} />{isActive ? ui.live : isCameraReady ? ui.cameraReady : ui.cameraOff}</div>
          <button onClick={toggleAudio} className="absolute top-4 right-4 rounded-full bg-[var(--a11y-surface)] px-4 py-2 text-xs font-extrabold text-[var(--a11y-text)] shadow-lg flex items-center gap-2">{isAudioOn ? <Volume2 size={18} className="text-primary" /> : <VolumeX size={18} />}{ui.audio} {isAudioOn ? ui.on : ui.off}</button>
          <button onClick={() => setIsImmersive(false)} className="absolute top-16 left-4 rounded-full bg-black/65 px-4 py-2 text-sm font-bold text-white flex items-center gap-1"><ChevronUp size={18} />{ui.transcriptView}</button>
          <div className="absolute top-28 left-1/2 w-[min(88%,25rem)] -translate-x-1/2 rounded-3xl bg-[var(--a11y-surface)] p-4 text-center shadow-xl"><div className="flex justify-center items-center gap-2 text-primary font-bold"><Navigation size={20} />{ui.latest}</div><p className="mt-1 text-lg font-extrabold text-[var(--a11y-text)]">{lastGuidance}</p></div>
          <div className="absolute inset-x-0 bottom-36 flex flex-col items-center pointer-events-none"><div className="rounded-full border-2 border-[var(--a11y-text)] bg-[var(--a11y-surface)] p-6 shadow-2xl"><DirectionIcon key={direction} size={74} strokeWidth={3} className={`${cueColorClass} transition-transform duration-500 animate-pulse ${directionMotionClass}`} /></div><span className="mt-2 rounded-full bg-black/55 px-4 py-1 text-sm font-bold text-white">{cueLabel}</span></div>
          <div className="absolute bottom-6 inset-x-4 grid grid-cols-3 gap-3"><button onClick={toggleAudio} className="rounded-2xl bg-[var(--a11y-surface)] py-4 text-sm font-bold text-[var(--a11y-text)] flex flex-col items-center gap-1">{isAudioOn ? <Volume2 size={23} className="text-primary" /> : <VolumeX size={23} />}{ui.audio}</button><button onClick={isActive || isConnecting ? () => stopNavigator() : startNavigator} className={`rounded-2xl py-4 text-sm font-bold flex flex-col items-center gap-1 ${isActive || isConnecting ? 'bg-red-600 text-white' : 'bg-primary text-white'}`}>{isActive || isConnecting ? <><Square size={22} fill="currentColor" />{ui.stop}</> : <><Navigation size={22} />{ui.start}</>}</button><button onClick={toggleMute} disabled={!isActive} className="rounded-2xl bg-[var(--a11y-surface)] py-4 text-sm font-bold text-[var(--a11y-text)] disabled:opacity-50 flex flex-col items-center gap-1">{isMuted ? <MicOff size={23} /> : <Mic size={23} />}{isMuted ? ui.unmute : ui.mute}</button></div>
        </section>
        </main>
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--a11y-bg)] text-[var(--a11y-text)]">
      <ScreenHeader title={displayLanguage === 'ml' ? 'വിഷ്വൽ നാവിഗേറ്റർ' : 'Visual Navigator'} showBack />
      <main className="flex-1 min-h-0 overflow-y-auto p-4 pb-24 max-w-2xl w-full mx-auto space-y-4">
        <section onTouchStart={handleCameraTouchStart} onTouchEnd={handleCameraTouchEnd} className="relative aspect-[3/4] sm:aspect-video overflow-hidden rounded-3xl border-2 border-primary bg-black shadow-xl">
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
          {!isCameraReady && !isConnecting && <div className="absolute inset-0 grid place-items-center bg-black/65 p-8 text-center"><Camera size={48} className="text-primary mb-3" /><p className="font-bold">Allow camera access to preview your surroundings.</p></div>}
          <div className="absolute top-3 left-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold"><span className={`h-2 w-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : isCameraReady ? 'bg-sky-400' : 'bg-gray-400'}`} />{isActive ? 'LIVE' : isCameraReady ? 'CAMERA READY' : 'CAMERA OFF'}</div>
          <button onClick={() => setIsImmersive(true)} className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-xs font-bold text-white flex items-center gap-1"><ChevronDown size={16} />{ui.cameraOnly}</button>
        </section>
        <section className="rounded-3xl border border-gray-200 bg-[var(--a11y-surface)] p-5 shadow-sm"><div className="flex items-center gap-2 text-primary font-bold"><Navigation size={20} />{ui.latest}</div><div className="mt-3 flex gap-3"><div className="rounded-2xl bg-primary/10 p-3 h-fit"><DirectionIcon key={direction} size={30} className={`${cueColorClass} transition-transform duration-500 ${directionMotionClass}`} /></div><div><p aria-live="polite" className="text-lg font-bold leading-relaxed">{lastGuidance}</p><p className="mt-1 text-sm text-[var(--a11y-text-muted)]">{navigationCue.cue}</p></div></div></section>
        <section className="rounded-3xl border border-gray-200 bg-[var(--a11y-surface)] p-4 shadow-sm"><div className="flex items-center gap-2 text-primary font-bold"><Volume2 size={18} />{ui.liveTranscript}</div><div className="mt-3 min-h-24 max-h-44 overflow-y-auto text-sm leading-relaxed">{guidanceLog.length ? <p className="rounded-xl bg-primary/5 p-3">{guidanceLog.map((entry) => entry.text).join(' ')}</p> : <p className="text-[var(--a11y-text-muted)]">{status}</p>}</div></section>
        <p className="text-center text-sm text-[var(--a11y-text-muted)]">{status}</p>
        <div className="grid grid-cols-3 gap-3">
          <button onClick={toggleAudio} className="min-h-touch rounded-2xl border border-gray-300 bg-[var(--a11y-surface)] font-bold flex flex-col items-center justify-center gap-1">{isAudioOn ? <Volume2 size={20} className="text-primary" /> : <VolumeX size={20} />}Audio</button>
          <button onClick={isActive || isConnecting ? () => stopNavigator() : startNavigator} className={`min-h-touch rounded-2xl font-bold flex flex-col items-center justify-center gap-1 ${isActive || isConnecting ? 'bg-red-600 text-white' : 'bg-primary text-white'}`}>{isActive || isConnecting ? <><Square size={18} />Stop</> : <><Navigation size={18} />Start</>}</button>
          <button onClick={toggleMute} disabled={!isActive} className="min-h-touch rounded-2xl border border-gray-300 bg-[var(--a11y-surface)] font-bold flex flex-col items-center justify-center gap-1 disabled:opacity-40">{isMuted ? <MicOff size={20} /> : <Mic size={20} />}{isMuted ? 'Unmute' : 'Mute'}</button>
        </div>
        <p className="rounded-xl bg-primary/10 border border-primary/30 p-3 text-xs"><HelpCircle size={15} className="inline mr-2 text-primary" />Use this as an assistive description tool, not as a replacement for a cane, guide dog, trained mobility support, or personal judgement.</p>
      </main>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
