import { useCallback, useEffect, useRef, useState } from 'react';
import { Lang } from '../types';

interface SpeechRecognitionEventLike {
  results: {
    [index: number]: {
      isFinal: boolean;
      [subIndex: number]: { transcript: string };
    };
    length: number;
  };
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function useVoiceInput(lang: Lang, onFinalTranscript?: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isSupported = Boolean(getSpeechRecognitionCtor());

  const stopListening = useCallback(() => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // ignore
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setErrorMsg(
        lang === 'hi'
          ? 'इस ब्राउज़र में माइक्रोफ़ोन वॉइस उपलब्ध नहीं है। नीचे दिए बटन या टाइपिंग का उपयोग करें।'
          : 'Voice input is not supported in this browser. Use quick chips or typing.'
      );
      return;
    }

    setErrorMsg(null);
    setTranscript('');

    try {
      recognitionRef.current?.abort();
    } catch {
      // ignore
    }

    const recognition = new Ctor();
    recognition.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      let combined = '';
      let isFinal = false;
      for (let i = 0; i < event.results.length; i++) {
        combined += event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          isFinal = true;
        }
      }
      const cleaned = combined.trim();
      setTranscript(cleaned);
      if (isFinal && cleaned) {
        onFinalTranscript?.(cleaned);
      }
    };

    recognition.onerror = (event: { error: string }) => {
      setIsListening(false);
      if (event.error === 'not-allowed') {
        setErrorMsg(
          lang === 'hi'
            ? 'माइक्रोफ़ोन की अनुमति दें ताकि आप बोलकर खोज सकें।'
            : 'Please allow microphone permission to speak.'
        );
      } else if (event.error === 'no-speech') {
        setErrorMsg(
          lang === 'hi'
            ? 'आवाज़ सुनाई नहीं दी। कृपया फिर से बोलें।'
            : 'No speech detected. Please try again.'
        );
      } else {
        setErrorMsg(
          lang === 'hi'
            ? 'आवाज़ पहचानने में दिक्कत आई। फिर कोशिश करें या टाइप करें।'
            : 'Could not recognize voice. Please retry or type.'
        );
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  }, [lang, onFinalTranscript]);

  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // ignore
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    errorMsg,
    startListening,
    stopListening,
    clearError: () => setErrorMsg(null),
  };
}

export function useVoiceSpeak(lang: Lang) {
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  const stop = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(null);
  }, []);

  const speak = useCallback(
    (text: string, id?: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        return;
      }
      const targetId = id || text.slice(0, 32);
      if (speakingId === targetId) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'hi' ? 'hi-IN' : 'en-IN';
      utterance.rate = 0.94;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find((v) =>
          lang === 'hi' ? v.lang.toLowerCase().startsWith('hi') : v.lang.toLowerCase() === 'en-in'
        ) || voices.find((v) => v.lang.toLowerCase().startsWith(lang === 'hi' ? 'hi' : 'en'));
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => setSpeakingId(targetId);
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);

      window.speechSynthesis.speak(utterance);
    },
    [lang, speakingId]
  );

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { speak, stop, speakingId };
}
