import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, ExternalLink, Film, Loader2, Play, ShieldCheck } from 'lucide-react';
import type { AcademyLesson } from './academyTypes';
import { Card } from './AcademyShared';

interface Scene {
  heading: string;
  body: string;
  label: string;
}

export function LocalLessonVideo({ lesson }: { lesson: AcademyLesson }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const animationRef = useRef<number | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const externalVideoUrl = lesson.video_url ? safeExternalVideoUrl(lesson.video_url) : null;
  const externalVideoSource = externalVideoUrl ? videoSource(externalVideoUrl) : null;

  const scenes = useMemo<Scene[]>(() => [
    { label: `BEGINNER · LESSON ${String(lesson.order).padStart(2, '0')}`, heading: lesson.title, body: 'A short visual briefing generated locally from this lesson.', },
    ...lesson.sections.map((section, index) => ({
      label: `KEY IDEA ${String(index + 1).padStart(2, '0')} · ${lesson.sections.length} TOPICS`,
      heading: section.heading,
      body: firstSentences(section.body),
    })),
    { label: 'RED-LAB ACADEMY · RECAP', heading: 'Keep the security goal in view', body: lesson.objectives.slice(0, 2).join(' · '), },
  ], [lesson]);

  useEffect(() => () => {
    if (animationRef.current !== null) window.cancelAnimationFrame(animationRef.current);
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
    if (videoUrl) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  useEffect(() => {
    if (videoUrl && videoRef.current) void videoRef.current.play().catch(() => undefined);
  }, [videoUrl]);

  const createVideo = () => {
    const canvas = canvasRef.current;
    if (!canvas || typeof MediaRecorder === 'undefined' || !canvas.captureStream) {
      setError('This browser does not support locally generated video playback.');
      return;
    }

    setError('');
    setProgress(0);
    setGenerating(true);
    const context = canvas.getContext('2d');
    if (!context) {
      setGenerating(false);
      setError('Could not prepare the video canvas.');
      return;
    }

    canvas.width = 1280;
    canvas.height = 720;
    const stream = canvas.captureStream(24);
    const mimeType = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'].find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) {
      stream.getTracks().forEach((track) => track.stop());
      setGenerating(false);
      setError('This browser does not support the local video format.');
      return;
    }

    const chunks: BlobPart[] = [];
    let recorder: MediaRecorder;
    try {
      recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 1_500_000 });
    } catch {
      stream.getTracks().forEach((track) => track.stop());
      setGenerating(false);
      setError('Could not start the local video recorder.');
      return;
    }
    recorderRef.current = recorder;

    recorder.ondataavailable = (event) => { if (event.data.size > 0) chunks.push(event.data); };
    recorder.onerror = () => {
      setGenerating(false);
      setError('The local video could not be created.');
      stream.getTracks().forEach((track) => track.stop());
    };
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      recorderRef.current = null;
      animationRef.current = null;
      setGenerating(false);
      const blob = new Blob(chunks, { type: mimeType });
      if (blob.size === 0) {
        setError('The generated video was empty. Please try again.');
        return;
      }
      setVideoUrl(URL.createObjectURL(blob));
      recorderRef.current = null;
      animationRef.current = null;
    };

    const sceneDuration = 1_800;
    const totalDuration = scenes.length * sceneDuration;
    const startedAt = performance.now();
    let lastProgress = -1;
    recorder.start(200);

    const renderFrame = (now: number) => {
      if (recorder.state !== 'recording') return;
      const elapsed = Math.min(totalDuration, now - startedAt);
      const sceneIndex = Math.min(scenes.length - 1, Math.floor(elapsed / sceneDuration));
      drawScene(context, canvas.width, canvas.height, scenes[sceneIndex], lesson.title, sceneIndex, scenes.length, elapsed / totalDuration);
      const nextProgress = Math.min(100, Math.round(elapsed / totalDuration * 100));
      if (nextProgress !== lastProgress) {
        lastProgress = nextProgress;
        setProgress(nextProgress);
      }
      if (elapsed >= totalDuration) {
        animationRef.current = null;
        recorder.stop();
        return;
      }
      animationRef.current = window.requestAnimationFrame(renderFrame);
    };
    animationRef.current = window.requestAnimationFrame(renderFrame);
  };

  return <Card className="overflow-hidden">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#293140] px-4 py-3">
      <div className="flex items-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF3B4E]/10 text-[#FF8A4C]"><Film size={16} /></span><div><p className="text-xs font-semibold">Lesson videos</p><p className="mt-0.5 text-[10px] text-[#9BA5B5]">A local visual explainer and selected learning resources</p></div></div>
      {videoUrl && <a href={videoUrl} download={`redlab-lesson-${lesson.order}.webm`} className="inline-flex items-center gap-1.5 rounded-lg border border-[#293140] bg-[#171C26] px-2.5 py-1.5 text-[10px] font-medium text-[#CBD2DC] transition hover:border-[#596477] hover:text-white"><Download size={12} /> Save video</a>}
    </div>
    <div className="p-4 sm:p-5">
      {externalVideoUrl && <div className="mb-4 flex flex-col gap-3 rounded-lg border border-[#60A5FA]/20 bg-[#60A5FA]/5 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-semibold text-[#DCEBFF]">Recommended video</p><p className="mt-1 text-[10px] leading-relaxed text-[#9BA5B5]">A related lesson from {externalVideoSource}. It opens on that service when selected.</p></div>
        <a href={externalVideoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#60A5FA]/30 bg-[#11151D] px-3 py-2 text-xs font-semibold text-[#BFDBFE] transition hover:border-[#60A5FA]/60 hover:bg-[#171C26]"><Play size={13} /> Watch external video <ExternalLink size={12} /></a>
      </div>}
      <canvas ref={canvasRef} aria-hidden="true" className={`mb-4 aspect-video w-full rounded-lg border border-[#293140] bg-[#0B0D12] ${videoUrl ? 'hidden' : 'block'}`} />
      {videoUrl && <video ref={videoRef} controls playsInline preload="metadata" src={videoUrl} className="mb-4 aspect-video w-full rounded-lg border border-[#293140] bg-[#0B0D12]" aria-label={`Video lesson: ${lesson.title}`} />}
      {!videoUrl && <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-xs leading-relaxed text-[#9BA5B5]">Creates a short, silent WebM explainer from the lesson topics. It is rendered and played locally on this device.</p>
        <button type="button" disabled={generating} onClick={createVideo} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#FF3B4E] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#e6354a] disabled:cursor-wait disabled:opacity-60">{generating ? <><Loader2 size={14} className="animate-spin" /> Creating {progress}%</> : <><Play size={14} /> Create and play video</>}</button>
      </div>}
      {generating && <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#0B0D12]"><div className="h-full rounded-full bg-[#FF3B4E] transition-[width] duration-200" style={{ width: `${progress}%` }} /></div>}
      {error && <p role="status" className="mt-3 text-xs text-[#FF8A4C]">{error}</p>}
      <p className="mt-4 flex items-center gap-1.5 border-t border-[#293140] pt-3 text-[10px] text-[#748095]"><ShieldCheck size={12} className="text-[#34D399]" /> The explainer is generated locally. External videos open only when you choose to watch them.</p>
    </div>
  </Card>;
}

function videoSource(url: string) {
  const hostname = new URL(url).hostname.toLowerCase();
  if (hostname === 'youtu.be' || hostname.endsWith('youtube.com')) return 'YouTube';
  if (hostname.endsWith('vimeo.com')) return 'Vimeo';
  if (hostname.endsWith('cisco.com')) return 'Cisco';
  return hostname;
}

function safeExternalVideoUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const trustedHost = hostname === 'youtu.be'
      || hostname === 'youtube.com' || hostname.endsWith('.youtube.com')
      || hostname === 'vimeo.com' || hostname.endsWith('.vimeo.com')
      || hostname === 'cisco.com' || hostname.endsWith('.cisco.com');
    return url.protocol === 'https:' && trustedHost ? url.href : null;
  } catch {
    return null;
  }
}

function firstSentences(text: string) {
  const normalized = text.replace(/\s+/g, ' ').trim();
  return normalized.length > 240 ? `${normalized.slice(0, 237).trimEnd()}…` : normalized;
}

function drawScene(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  scene: Scene,
  lessonTitle: string,
  sceneIndex: number,
  sceneCount: number,
  progress: number,
) {
  const background = context.createLinearGradient(0, 0, width, height);
  background.addColorStop(0, '#11151D');
  background.addColorStop(1, '#0B0D12');
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);

  context.fillStyle = '#FF3B4E';
  context.fillRect(0, 0, 10, height);
  context.fillStyle = '#FF3B4E';
  context.globalAlpha = 0.12;
  context.beginPath();
  context.arc(width - 25, 70, 240, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;

  context.fillStyle = '#FF8A4C';
  context.font = '700 19px system-ui, sans-serif';
  context.fillText('RED-LAB ACADEMY', 82, 76);
  context.fillStyle = '#9BA5B5';
  context.font = '600 15px system-ui, sans-serif';
  context.fillText(scene.label.toUpperCase(), 82, 111);

  context.fillStyle = '#F3F5F8';
  context.font = '700 43px system-ui, sans-serif';
  const headingLines = wrapText(context, scene.heading, 1090);
  headingLines.slice(0, 2).forEach((line, index) => context.fillText(line, 82, 205 + index * 55));

  const bodyLines = wrapText(context, scene.body, 1030);
  const bodyStart = 325 + Math.max(0, headingLines.slice(0, 2).length - 1) * 42;
  context.fillStyle = '#B2BBC8';
  context.font = '400 25px system-ui, sans-serif';
  bodyLines.slice(0, 5).forEach((line, index) => context.fillText(line, 84, bodyStart + index * 42));

  context.fillStyle = '#748095';
  context.font = '500 15px system-ui, sans-serif';
  context.fillText(lessonTitle, 82, height - 50);
  context.fillText(`${sceneIndex + 1} / ${sceneCount}`, width - 145, height - 50);
  context.fillStyle = '#293140';
  context.fillRect(82, height - 27, width - 164, 4);
  context.fillStyle = '#FF3B4E';
  context.fillRect(82, height - 27, (width - 164) * progress, 4);
}

function wrapText(context: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (line && context.measureText(candidate).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines;
}
