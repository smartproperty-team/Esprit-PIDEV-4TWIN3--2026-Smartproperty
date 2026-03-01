import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const VOICE_STORAGE_KEY = "smartproperty.readAloud.voiceURI";
const RATE_STORAGE_KEY = "smartproperty.readAloud.rate";

export function useReadAloud() {
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voiceURI, setVoiceURIState] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(VOICE_STORAGE_KEY) || "";
  });
  const [rate, setRateState] = useState<number>(() => {
    if (typeof window === "undefined") return 1;
    const stored = localStorage.getItem(RATE_STORAGE_KEY);
    if (!stored) return 1;
    const parsed = Number(stored);
    return Number.isFinite(parsed) ? Math.min(2, Math.max(0.5, parsed)) : 1;
  });

  const isSupported =
    typeof window !== "undefined" &&
    "speechSynthesis" in window &&
    "SpeechSynthesisUtterance" in window;

  const loadVoices = useCallback(() => {
    if (!isSupported) return;
    setVoices(window.speechSynthesis.getVoices());
  }, [isSupported]);

  useEffect(() => {
    if (!isSupported) return;

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, [isSupported, loadVoices]);

  useEffect(() => {
    if (!isSupported) return;

    return () => {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
      setIsSpeaking(false);
      setIsPaused(false);
    };
  }, [isSupported]);

  const selectedVoice = useMemo(() => {
    if (!voiceURI) return null;
    return voices.find((voice) => voice.voiceURI === voiceURI) || null;
  }, [voices, voiceURI]);

  const setVoiceURI = useCallback((nextVoiceURI: string) => {
    setVoiceURIState(nextVoiceURI);
    if (typeof window !== "undefined") {
      localStorage.setItem(VOICE_STORAGE_KEY, nextVoiceURI);
    }
  }, []);

  const setRate = useCallback((nextRate: number) => {
    const normalizedRate = Math.min(2, Math.max(0.5, nextRate));
    setRateState(normalizedRate);
    if (typeof window !== "undefined") {
      localStorage.setItem(RATE_STORAGE_KEY, String(normalizedRate));
    }
  }, []);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    if (!window.speechSynthesis.speaking) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    if (!window.speechSynthesis.paused) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
    setIsSpeaking(true);
  }, [isSupported]);

  const start = useCallback(
    (text: string) => {
      if (!isSupported) return false;

      const normalizedText = text.replace(/\s+/g, " ").trim();
      if (!normalizedText) return false;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(normalizedText);
      utterance.rate = rate;
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
      };
      utterance.onpause = () => {
        setIsPaused(true);
      };
      utterance.onresume = () => {
        setIsPaused(false);
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
        setIsPaused(false);
        utteranceRef.current = null;
      };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
      return true;
    },
    [isSupported, rate, selectedVoice],
  );

  return {
    isSupported,
    voices,
    voiceURI,
    setVoiceURI,
    rate,
    setRate,
    isSpeaking,
    isPaused,
    start,
    pause,
    resume,
    stop,
  };
}
