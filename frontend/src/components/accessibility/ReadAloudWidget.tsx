import { Pause, Play, Settings2, Square, Volume2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useReadAloud } from "../../hooks/useReadAloud";

type ReadAloudWidgetProps = {
  mode?: "floating" | "inline";
  showLabel?: boolean;
  className?: string;
};

function collectReadableText(): string {
  const root = document.querySelector("main") || document.body;

  const nodes = root.querySelectorAll(
    "h1,h2,h3,h4,h5,h6,p,li,label,legend,th,td,blockquote,figcaption,[role='heading'],[aria-live='polite'],[aria-live='assertive']",
  );

  const parts: string[] = [];

  nodes.forEach((node) => {
    const element = node as HTMLElement;

    if (element.hidden) return;
    if (element.getAttribute("aria-hidden") === "true") return;
    if (element.closest("[aria-hidden='true']")) return;

    const text = element.textContent?.replace(/\s+/g, " ").trim();
    if (!text) return;

    parts.push(text);
  });

  return parts.join(". ").slice(0, 24000);
}

export default function ReadAloudWidget({
  mode = "floating",
  showLabel = true,
  className = "",
}: ReadAloudWidgetProps) {
  const location = useLocation();
  const {
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
  } = useReadAloud();
  const [statusMessage, setStatusMessage] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    stop();
    setSettingsOpen(false);
  }, [location.pathname, stop]);

  const primaryLabel = useMemo(() => {
    if (!isSpeaking && !isPaused) return "Read aloud";
    if (isSpeaking) return "Pause";
    return "Resume";
  }, [isPaused, isSpeaking]);

  const handlePrimaryAction = () => {
    if (!isSupported) {
      setStatusMessage("Read aloud is not supported in this browser.");
      return;
    }

    if (!isSpeaking && !isPaused) {
      const text = collectReadableText();
      const hasStarted = start(text);
      setStatusMessage(
        hasStarted
          ? "Reading started."
          : "No readable content found on this page.",
      );
      return;
    }

    if (isSpeaking) {
      pause();
      setStatusMessage("Reading paused.");
      return;
    }

    resume();
    setStatusMessage("Reading resumed.");
  };

  const handleStop = () => {
    stop();
    setStatusMessage("Reading stopped.");
  };

  const wrapperClass =
    mode === "floating"
      ? `fixed bottom-4 right-4 z-[80] ${className}`
      : `relative z-50 ${className}`;

  const settingsPanelClass =
    mode === "floating"
      ? "mb-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl"
      : "absolute right-0 top-full mt-2 w-72 rounded-xl border border-gray-200 bg-white p-3 shadow-xl";

  return (
    <div className={wrapperClass}>
      <span className="sr-only" aria-live="polite">
        {statusMessage}
      </span>

      {settingsOpen && (
        <div id="read-aloud-settings" className={settingsPanelClass}>
          <h3 className="mb-2 text-sm font-semibold text-gray-900">
            Read Aloud Settings
          </h3>

          <label
            className="mb-1 block text-xs font-medium text-gray-700"
            htmlFor="read-aloud-voice"
          >
            Voice
          </label>
          <select
            id="read-aloud-voice"
            value={voiceURI}
            onChange={(event) => setVoiceURI(event.target.value)}
            className="mb-3 w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm text-gray-800"
          >
            <option value="">Default voice</option>
            {voices.map((voice) => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>

          <label
            className="mb-1 block text-xs font-medium text-gray-700"
            htmlFor="read-aloud-rate"
          >
            Speed: {rate.toFixed(1)}x
          </label>
          <input
            id="read-aloud-rate"
            type="range"
            min={0.5}
            max={2}
            step={0.1}
            value={rate}
            onChange={(event) => setRate(Number(event.target.value))}
            className="w-full"
          />
        </div>
      )}

      <div className="flex items-center gap-1 rounded-full border border-indigo-200 bg-white/95 p-1 shadow-lg backdrop-blur-sm">
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={!isSupported}
          className={`inline-flex h-10 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            isSpeaking || isPaused
              ? "bg-indigo-600 text-white hover:bg-indigo-700"
              : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          }`}
          aria-label={primaryLabel}
          title={primaryLabel}
        >
          {!isSpeaking && !isPaused && <Volume2 className="h-4 w-4" />}
          {isSpeaking && <Pause className="h-4 w-4" />}
          {isPaused && <Play className="h-4 w-4" />}
          {showLabel && (
            <span className="hidden sm:inline">{primaryLabel}</span>
          )}
        </button>

        {(isSpeaking || isPaused) && (
          <button
            type="button"
            onClick={handleStop}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-indigo-700 transition-colors hover:bg-indigo-100"
            aria-label="Stop reading"
            title="Stop reading"
          >
            <Square className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={() => setSettingsOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full text-indigo-700 transition-colors hover:bg-indigo-100"
          aria-label="Read aloud settings"
          aria-expanded={settingsOpen}
          aria-controls="read-aloud-settings"
          title="Read aloud settings"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
