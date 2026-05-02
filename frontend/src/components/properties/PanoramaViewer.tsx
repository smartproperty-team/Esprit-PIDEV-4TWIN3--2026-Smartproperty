import "photo-sphere-viewer/dist/photo-sphere-viewer.css";
import { useEffect, useRef } from "react";

export default function PanoramaViewer({
  src,
  altText,
}: {
  src: string;
  altText?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      if (!containerRef.current) return;

      const { Viewer } = await import("photo-sphere-viewer");

      if (!mounted || !containerRef.current) return;

      viewerRef.current = new Viewer({
        container: containerRef.current,
        panorama: src,
        touchmoveTwoFingers: false,
        navbar: ["autorotate", "zoom", "fullscreen"],
      });
    }

    init();

    return () => {
      mounted = false;
      try {
        viewerRef.current?.destroy();
      } catch {
        // noop
      }
      viewerRef.current = null;
    };
  }, [src]);

  return (
    <div
      ref={containerRef}
      style={{ width: "100%", height: 480 }}
      aria-label={altText}
    />
  );
}
