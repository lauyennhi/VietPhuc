/**
 * Vietnamese voice input via the Web Speech API (Chrome, Edge, Safari).
 * Returns `supported: false` where the browser has no speech recognition.
 */

import { useEffect, useRef, useState } from 'react';

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
}

function getRecognition(): (new () => SpeechRecognitionLike) | undefined {
  if (typeof window === 'undefined') return undefined;
  const w = window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

export function useVoiceInput(currentText: string, onText: (text: string) => void) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const ref = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(Boolean(getRecognition()));
    return () => ref.current?.stop();
  }, []);

  const toggle = () => {
    if (listening) {
      ref.current?.stop();
      return;
    }
    const Recognition = getRecognition();
    if (!Recognition) return;
    const recognition = new Recognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = true;
    recognition.continuous = false;
    const base = currentText.trim();
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results).map((r) => r[0]?.transcript ?? '').join(' ').trim();
      onText(base ? `${base} ${transcript}` : transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    ref.current = recognition;
    setListening(true);
    recognition.start();
  };

  return { supported, listening, toggle };
}
