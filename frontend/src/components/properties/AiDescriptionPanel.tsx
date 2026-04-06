// ===========================================
// SmartProperty - AI Description Panel
// ===========================================

import { useState } from "react";
import { useTranslation } from "../../i18n";
import {
  propertyService,
  type AiDescriptionLength,
  type AiDescriptionTone,
  type AiPropertySnapshot,
  type GeneratedVariant,
} from "../../services/property.service";

const ALL_LENGTHS: AiDescriptionLength[] = ["short", "medium", "long"];
const TONES: AiDescriptionTone[] = ["professional", "warm", "luxury"];
const COMMON_LANGS = ["en", "fr", "es", "de", "it", "pt", "ar"];

interface AiDescriptionPanelProps {
  open: boolean;
  onClose: () => void;
  snapshot: AiPropertySnapshot;
  propertyId?: string;
  onApply: (text: string) => void;
}

export default function AiDescriptionPanel({
  open,
  onClose,
  snapshot,
  propertyId,
  onApply,
}: AiDescriptionPanelProps) {
  const t = useTranslation();
  const formStrings = t.properties.form.aiDescription;

  const [tone, setTone] = useState<AiDescriptionTone>("professional");
  const [lengths, setLengths] = useState<AiDescriptionLength[]>(["medium"]);
  const [sourceLanguage, setSourceLanguage] = useState<string>("en");
  const [targetLanguages, setTargetLanguages] = useState<string[]>(["en"]);
  const [hintKeywords, setHintKeywords] = useState<string>("");
  const [variants, setVariants] = useState<GeneratedVariant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const toggleLength = (value: AiDescriptionLength) => {
    setLengths((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const toggleTargetLanguage = (lang: string) => {
    setTargetLanguages((prev) =>
      prev.includes(lang) ? prev.filter((v) => v !== lang) : [...prev, lang],
    );
  };

  const handleGenerate = async () => {
    if (lengths.length === 0 || targetLanguages.length === 0) {
      setError(formStrings.errorEmpty);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const response = await propertyService.generateAiDescription({
        propertyId,
        propertySnapshot: snapshot,
        tone,
        lengths,
        sourceLanguage,
        targetLanguages,
        hintKeywords: hintKeywords
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setVariants(response.variants);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;
      if (status === 504) {
        setError(formStrings.errorTimeout);
      } else {
        setError(formStrings.errorGeneric);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="ai-description-panel"
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: 24,
          width: "min(720px, 92vw)",
          maxHeight: "90vh",
          overflow: "auto",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div>
            <h3 style={{ margin: 0 }}>{formStrings.title}</h3>
            <p style={{ margin: "4px 0 0", color: "#555", fontSize: 14 }}>
              {formStrings.subtitle}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={formStrings.close}
            style={{
              background: "transparent",
              border: "none",
              fontSize: 22,
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <label
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              {formStrings.tone}
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as AiDescriptionTone)}
              style={{ width: "100%" }}
            >
              {TONES.map((value) => (
                <option key={value} value={value}>
                  {formStrings.toneOptions[value]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
            >
              {formStrings.sourceLanguage}
            </label>
            <select
              value={sourceLanguage}
              onChange={(e) => setSourceLanguage(e.target.value)}
              style={{ width: "100%" }}
            >
              {COMMON_LANGS.map((lang) => (
                <option key={lang} value={lang}>
                  {lang.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset
          style={{
            border: "1px solid #e2e2e2",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <legend style={{ fontWeight: 600 }}>{formStrings.lengths}</legend>
          {ALL_LENGTHS.map((value) => (
            <label
              key={value}
              style={{ marginRight: 16, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={lengths.includes(value)}
                onChange={() => toggleLength(value)}
              />{" "}
              {formStrings.lengthOptions[value]}
            </label>
          ))}
        </fieldset>

        <fieldset
          style={{
            border: "1px solid #e2e2e2",
            borderRadius: 8,
            padding: 12,
            marginBottom: 16,
          }}
        >
          <legend style={{ fontWeight: 600 }}>
            {formStrings.targetLanguages}
          </legend>
          {COMMON_LANGS.map((lang) => (
            <label
              key={lang}
              style={{ marginRight: 12, cursor: "pointer" }}
            >
              <input
                type="checkbox"
                checked={targetLanguages.includes(lang)}
                onChange={() => toggleTargetLanguage(lang)}
              />{" "}
              {lang.toUpperCase()}
            </label>
          ))}
        </fieldset>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{ display: "block", fontWeight: 600, marginBottom: 6 }}
          >
            {formStrings.hintKeywords}
          </label>
          <input
            type="text"
            value={hintKeywords}
            onChange={(e) => setHintKeywords(e.target.value)}
            placeholder={formStrings.hintKeywordsPlaceholder}
            style={{ width: "100%" }}
          />
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: "#fdecea",
              color: "#a32020",
              padding: 10,
              borderRadius: 6,
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? formStrings.generating : formStrings.generate}
          </button>
          {variants.length > 0 && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="btn-secondary"
            >
              {formStrings.retry}
            </button>
          )}
        </div>

        {variants.length === 0 && !loading && !error && (
          <p style={{ color: "#888" }}>{formStrings.noVariants}</p>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {variants.map((variant) => (
            <div
              key={`${variant.length}-${variant.language}`}
              style={{
                border: "1px solid #e2e2e2",
                borderRadius: 8,
                padding: 12,
              }}
              data-testid={`ai-variant-${variant.length}-${variant.language}`}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                  fontSize: 13,
                  color: "#555",
                }}
              >
                <strong>
                  {variant.length.toUpperCase()} • {variant.language.toUpperCase()}{" "}
                  • {variant.tone}
                </strong>
                <span>
                  {formStrings.words.replace(
                    "{{count}}",
                    String(variant.wordCount),
                  )}
                </span>
              </div>
              <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{variant.text}</p>
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onApply(variant.text)}
                >
                  {formStrings.apply}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
