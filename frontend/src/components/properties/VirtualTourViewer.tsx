// ===========================================
// SmartProperty - Virtual Tour Viewer
// ===========================================

import { useTranslation } from "@/i18n";
import { useMemo } from "react";

type VirtualTourProvider =
  | "youtube"
  | "matterport"
  | "three-d-vista"
  | "external";

interface VirtualTourViewerProps {
  url?: string;
}

interface TourEmbedConfig {
  provider: VirtualTourProvider;
  embedUrl: string;
  label: string;
  canEmbed: boolean;
}

function normalizeUrl(value: string): URL | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function detectProvider(url: URL): VirtualTourProvider {
  const hostname = url.hostname.toLowerCase();

  if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
    return "youtube";
  }

  if (hostname.includes("matterport.com")) {
    return "matterport";
  }

  if (hostname.includes("3dvista.com")) {
    return "three-d-vista";
  }

  return "external";
}

function buildYoutubeEmbedUrl(url: URL): string {
  const videoIdFromSearch = url.searchParams.get("v") || undefined;
  const pathSegments = url.pathname.split("/").filter(Boolean);
  const videoIdFromPath =
    pathSegments[0] === "watch" || pathSegments[0] === "embed"
      ? undefined
      : pathSegments.pop();
  const videoId = videoIdFromSearch || videoIdFromPath || "";

  if (!videoId) {
    return url.toString();
  }

  return `https://www.youtube.com/embed/${videoId}`;
}

function buildEmbedConfig(rawUrl: string): TourEmbedConfig | null {
  const parsedUrl = normalizeUrl(rawUrl);
  if (!parsedUrl) {
    return null;
  }

  const provider = detectProvider(parsedUrl);

  if (provider === "youtube") {
    return {
      provider,
      embedUrl: buildYoutubeEmbedUrl(parsedUrl),
      label: "YouTube",
      canEmbed: true,
    };
  }

  if (provider === "matterport") {
    return {
      provider,
      embedUrl: parsedUrl.toString(),
      label: "Matterport",
      canEmbed: true,
    };
  }

  if (provider === "three-d-vista") {
    return {
      provider,
      embedUrl: parsedUrl.toString(),
      label: "3DVista",
      canEmbed: true,
    };
  }

  return {
    provider,
    embedUrl: parsedUrl.toString(),
    label: "External tour",
    canEmbed: false,
  };
}

export default function VirtualTourViewer({ url }: VirtualTourViewerProps) {
  const t = useTranslation();

  const embedConfig = useMemo(() => {
    if (!url?.trim()) {
      return null;
    }

    return buildEmbedConfig(url.trim());
  }, [url]);

  if (!embedConfig) {
    return null;
  }

  const isEmbeddedProvider =
    embedConfig.canEmbed &&
    (embedConfig.provider === "youtube" ||
      embedConfig.provider === "matterport" ||
      embedConfig.provider === "three-d-vista");

  return (
    <section className="property-virtual-tour">
      <div className="property-virtual-tour-header">
        <div>
          <h3>{t.propertyDetail.virtualTour.title}</h3>
          <p>{t.propertyDetail.virtualTour.subtitle}</p>
        </div>
        <span className="property-virtual-tour-badge">{embedConfig.label}</span>
      </div>

      <div className="property-virtual-tour-card">
        {isEmbeddedProvider ? (
          <iframe
            src={embedConfig.embedUrl}
            title={t.propertyDetail.virtualTour.iframeTitle}
            className="property-virtual-tour-frame"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-forms allow-modals allow-popups allow-presentation allow-scripts allow-same-origin"
            allow="fullscreen; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="property-virtual-tour-fallback">
            <div>
              <p>{t.propertyDetail.virtualTour.fallback}</p>
              <a
                href={embedConfig.embedUrl}
                target="_blank"
                rel="noreferrer"
                className="property-virtual-tour-link"
              >
                {t.propertyDetail.virtualTour.openInNewTab}
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="property-virtual-tour-actions">
        <a
          href={embedConfig.embedUrl}
          target="_blank"
          rel="noreferrer"
          className="property-virtual-tour-link"
        >
          {t.propertyDetail.virtualTour.openInNewTab}
        </a>
      </div>
    </section>
  );
}
