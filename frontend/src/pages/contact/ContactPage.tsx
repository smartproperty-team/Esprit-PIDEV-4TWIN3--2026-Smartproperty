import {
  Mail,
  MapPin,
  PhoneCall,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { HomeFooter, HomeNavbar } from "../../components/layout";
import "./ContactPage.css";

const SUPPORT_EMAIL = "smartproperty.tn@gmail.com";
const OUTLOOK_COMPOSE_URL = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(SUPPORT_EMAIL)}`;

export default function ContactPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(SUPPORT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleOpenOutlook = () => {
    window.open(OUTLOOK_COMPOSE_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="contact-page">
      <HomeNavbar />

      <main className="contact-page__main">
        <section className="contact-hero">
          <div className="contact-hero__copy">
            <span className="contact-eyebrow">
              <Sparkles size={16} />
              Reach the SmartProperty team
            </span>
            <h1>Contact SmartProperty</h1>
            <p>
              Open Outlook in one click and write directly to our support inbox.
              No form fields, no backend, and no extra steps.
            </p>

            <div className="contact-hero__actions">
              <button
                type="button"
                onClick={handleOpenOutlook}
                className="contact-button contact-button--primary"
              >
                <Send size={18} />
                Open Outlook
              </button>
              <button
                type="button"
                className="contact-button contact-button--secondary"
                onClick={handleCopyEmail}
              >
                <Mail size={18} />
                {copied ? "Email copied" : "Copy email address"}
              </button>
            </div>
          </div>

          <aside className="contact-hero__panel">
            <div className="contact-info-card">
              <span className="contact-info-card__label">Support inbox</span>
              <span className="contact-info-card__email">{SUPPORT_EMAIL}</span>
              <p>
                Outlook will open a new compose window with this address already
                set.
              </p>
            </div>

            <div className="contact-info-grid">
              <div>
                <ShieldCheck size={18} />
                <strong>Privacy first</strong>
                <span>
                  You control the message before it leaves your inbox.
                </span>
              </div>
              <div>
                <MapPin size={18} />
                <strong>SmartProperty.tn</strong>
                <span>Tunisia-focused property platform and support.</span>
              </div>
              <div>
                <PhoneCall size={18} />
                <strong>Fast follow-up</strong>
                <span>Use Outlook to add any details you want to share.</span>
              </div>
            </div>
          </aside>
        </section>

        <section
          className="contact-form-shell"
          aria-labelledby="contact-form-title"
        >
          <div className="contact-form-intro">
            <h2 id="contact-form-title">Simple, direct, and clean</h2>
            <p>
              Click once to open Outlook and send your message the classic way.
              If you prefer, you can also copy the support email below.
            </p>
          </div>

          <div className="contact-quick-actions">
            <button
              type="button"
              className="contact-button contact-button--primary contact-button--wide"
              onClick={handleOpenOutlook}
            >
              <Send size={18} />
              Open Outlook to compose
            </button>
            <Link
              className="contact-button contact-button--secondary"
              to="/properties"
            >
              Browse properties instead
            </Link>
          </div>

          <p className="contact-status contact-status--success">
            Outlook opens with the support address prefilled. Nothing is sent
            until you review and press send.
          </p>
        </section>
      </main>

      <HomeFooter />
    </div>
  );
}
