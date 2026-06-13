import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CircleAlert,
  Download,
  Fingerprint,
  Globe2,
  ImagePlus,
  Radar,
  ShieldCheck,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../auth.jsx';

const problems = [
  {
    icon: CircleAlert,
    title: 'You send it once. It travels forever.',
    text: 'A picture can be forwarded, reposted, downloaded, and screenshotted long after the original context disappears.',
  },
  {
    icon: Globe2,
    title: 'Screenshots erase the trail.',
    text: 'Visible credits and filenames vanish quickly. The proof needs to live inside the image itself.',
  },
  {
    icon: Fingerprint,
    title: 'Evidence needs to be immediate.',
    text: 'When a suspicious copy appears, you should be able to verify it, trace it, and export proof without waiting.',
  },
];

const steps = [
  { icon: ImagePlus, label: 'Upload', text: 'Start with the image you are about to send, post, or publish.' },
  { icon: ShieldCheck, label: 'Protect', text: 'ProofMark creates a new traceable version for sharing.' },
  { icon: BadgeCheck, label: 'Verify', text: 'Check a suspect upload or public image URL against your property.' },
  { icon: Radar, label: 'Track', text: 'Record sightings and download evidence when a match is confirmed.' },
];

export default function Landing() {
  const { token } = useAuth();
  const appHref = token ? '/app' : '/register';

  return (
    <main className="landing-shell">
      <header className="landing-nav">
        <Logo />
        <nav aria-label="Landing navigation">
          <a href="#problem">Problem</a>
          <a href="#how">How it works</a>
          <Link to="/login">Sign in</Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="hero-orbit" aria-hidden="true" />
        <h1>
          <span>Make every</span>
          <span>image you</span>
          <span>share</span>
          <span>traceable.</span>
        </h1>
        <p>
          Upload the image before you share it. ProofMark returns a protected copy that can
          be verified, tracked, and tied back to your property.
        </p>
        <div className="landing-actions">
          <Link className="landing-primary" to={appHref}>
            Protect your first image
            <ArrowRight size={18} />
          </Link>
          <Link className="landing-secondary" to="/login">Open dashboard</Link>
        </div>

        <div className="proof-visual" aria-label="ProofMark product preview">
          <div className="proof-window">
            <div className="proof-window-bar">
              <span />
              <span />
              <span />
            </div>
            <div className="proof-grid">
              <div className="proof-image-card">
                <div className="proof-image">
                  <div className="scan-corner top-left" />
                  <div className="scan-corner top-right" />
                  <div className="scan-corner bottom-left" />
                  <div className="scan-corner bottom-right" />
                  <span>PM</span>
                </div>
                <strong>campaign-cover-proofmark.png</strong>
                <small>Payload #2048 / Standard</small>
              </div>
              <div className="proof-report-card">
                <span className="report-status"><BadgeCheck size={16} /> Match confirmed</span>
                <h3>Verification report</h3>
                <div className="report-row"><span>Source</span><strong>Public URL</strong></div>
                <div className="report-row"><span>Confidence</span><strong>100%</strong></div>
                <div className="report-row"><span>Evidence</span><strong>Ready</strong></div>
                <button type="button"><Download size={16} /> Export report</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="problem">
        <div className="section-kicker">The problem</div>
        <h2>The moment an image leaves you, proof should travel with it.</h2>
        <div className="problem-grid">
          {problems.map((item) => {
            const Icon = item.icon;
            return (
              <article className="problem-card" key={item.title}>
                <Icon size={22} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-section how-section" id="how">
        <div className="section-kicker">How we work</div>
        <h2>Protect the image first. Let everything else become evidence.</h2>
        <div className="how-track">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article className="how-step" key={step.label}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <Icon size={23} />
                <h3>{step.label}</h3>
                <p>{step.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <footer className="landing-footer">
        <Logo size="sm" />
        <p>Protect what you share, prove what is yours, and keep a record when it appears elsewhere.</p>
        <div>
          <Link to="/login">Sign in</Link>
          <Link to={appHref}>Get started</Link>
        </div>
      </footer>
    </main>
  );
}
