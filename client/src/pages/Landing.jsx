import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Check,
  CircleHelp,
  CircleMinus,
  CircleX,
  Fingerprint,
  Image as ImageIcon,
  Lock,
  Play,
  Radar,
  ScanLine,
  Search,
  ShieldCheck,
  UploadCloud,
  Zap,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import Reveal from '../components/Reveal.jsx';
import { useAuth } from '../auth.jsx';

const mountain =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=700&q=85';

const stats = [
  { value: '< 1s', label: 'Verify a copy' },
  { value: 'Invisible', label: 'Zero visible change' },
  { value: 'Forensic', label: 'Unique signed payload' },
  { value: 'Web-wide', label: 'Sighting tracker' },
];

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Protect',
    lead: 'Turn every image into traceable property.',
    body: 'Embed a unique forensic signature that proves ownership — without changing how your image looks.',
  },
  {
    icon: Search,
    title: 'Verify',
    lead: 'Check any suspect image against your assets.',
    body: 'Our engine confirms matches with cryptographic evidence, never visual guesswork.',
  },
  {
    icon: Radar,
    title: 'Track',
    lead: 'See where your images surface online.',
    body: 'Record confirmed sightings across the web and keep evidence tied to the original.',
  },
];

const survives = [
  'JPEG compression',
  'Resizing & cropping',
  'Instagram / X re-encode',
  'WhatsApp compression',
  'Screenshots',
  'Mild blur, noise & contrast',
];

const outcomes = [
  {
    icon: BadgeCheck,
    title: 'Matched',
    body: 'Forensic match found. This image is yours.',
    tone: 'matched',
  },
  {
    icon: CircleHelp,
    title: 'Unknown owner',
    body: 'A signature is present, but the owner is not in our records.',
    tone: 'unknown',
  },
  {
    icon: CircleMinus,
    title: 'Not found',
    body: 'No matching signature found in the database.',
    tone: 'missing',
  },
  {
    icon: CircleX,
    title: 'Invalid',
    body: 'The file is corrupted or not a valid image.',
    tone: 'invalid',
  },
];

export default function Landing() {
  const { token } = useAuth();
  const appHref = token ? '/app' : '/register';

  return (
    <main className="pm-landing">
      <div className="pm-aurora" aria-hidden="true">
        <span className="pm-blob pm-blob-1" />
        <span className="pm-blob pm-blob-2" />
        <span className="pm-blob pm-blob-3" />
        <span className="pm-grid" />
      </div>

      <header className="pm-land-nav">
        <Link to="/" className="pm-land-brand" aria-label="ProofMark home">
          <Logo tone="light" size="sm" />
          <span className="pm-land-tagline">Trace your images.</span>
        </Link>
        <nav aria-label="Landing navigation">
          <a href="#how">How it works</a>
          <a href="#survives">Survives</a>
          <Link to={token ? '/verify' : '/login'}>Verify</Link>
          <a href="#pricing">Pricing</a>
        </nav>
        <div className="pm-land-actions">
          <Link className="pm-land-signin" to="/login">Sign in</Link>
          <Link className="pm-land-primary" to={appHref}>Get started</Link>
        </div>
      </header>

      <section className="pm-land-hero">
        <div className="pm-hero-copy">
          <h1>
            Prove an image is yours.
            <span className="pm-grad"> Anywhere it travels.</span>
          </h1>
          <p>
            ProofMark embeds an invisible forensic signature into your images, so when a
            copy shows up online, you can prove exactly where it came from.
          </p>
          <div className="pm-hero-actions">
            <Link className="pm-land-primary" to={appHref}>
              Protect your first image
              <ArrowRight size={18} />
            </Link>
            <Link className="pm-land-secondary" to={token ? '/verify' : '/login'}>
              <Play size={16} />
              <span>See verification</span>
            </Link>
          </div>
          <ul className="pm-hero-trust">
            <li><Check size={15} /> Invisible to the eye</li>
            <li><Check size={15} /> Survives social re-uploads</li>
            <li><Check size={15} /> Free to start</li>
          </ul>
        </div>

        <div className="pm-hero-visual">
          <div className="pm-watermark-flow" aria-label="Watermark flow preview">
            <article className="pm-shot">
              <span>Original</span>
              <div className="pm-frame">
                <img src={mountain} alt="Original landscape before ProofMark protection" />
              </div>
            </article>
            <div className="pm-flow-arrow" aria-hidden="true"><ArrowRight size={20} /></div>
            <article className="pm-payload-card">
              <span>Invisible payload</span>
              <div>
                <Fingerprint size={30} />
                <code>payload #4F2A9C</code>
              </div>
            </article>
            <div className="pm-flow-arrow" aria-hidden="true"><ArrowRight size={20} /></div>
            <article className="pm-shot">
              <span>Protected</span>
              <div className="pm-frame pm-frame-live">
                <img src={mountain} alt="Protected landscape after ProofMark watermark" />
                <span className="pm-scanbeam" aria-hidden="true" />
                <BadgeCheck className="pm-proof-stamp" size={40} />
              </div>
            </article>
            <p>The signature is invisible. The proof is real.</p>
          </div>
        </div>
      </section>

      <Reveal className="pm-stat-strip" aria-label="ProofMark at a glance">
        {stats.map((item, i) => (
          <div className="pm-stat pm-stagger" key={item.label} style={{ '--d': `${i * 80}ms` }}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </Reveal>

      <Reveal className="pm-pillar-grid" aria-label="ProofMark capabilities">
        {pillars.map((item, i) => {
          const Icon = item.icon;
          return (
            <article
              className="pm-dark-card pm-pillar pm-stagger"
              key={item.title}
              style={{ '--d': `${i * 110}ms` }}
            >
              <span className="pm-icon-tile"><Icon size={26} /></span>
              <h2>{item.title}</h2>
              <h3>{item.lead}</h3>
              <p>{item.body}</p>
              <Link className="pm-card-link" to={appHref}>
                Learn more <ArrowRight size={15} />
              </Link>
            </article>
          );
        })}
      </Reveal>

      <Reveal className="pm-dark-card pm-survive" id="survives">
        <div className="pm-survive-head">
          <span className="pm-eyebrow"><Zap size={15} /> Built tough</span>
          <h2>Built to survive the real internet.</h2>
          <p>
            Images get compressed, resized, screenshotted and re-uploaded as they spread.
            ProofMark&apos;s signature is engineered to hold through all of it.
          </p>
        </div>
        <div className="pm-survive-grid">
          {survives.map((label, i) => (
            <span className="pm-chip pm-stagger" key={label} style={{ '--d': `${i * 70}ms` }}>
              <Check size={16} /> {label}
            </span>
          ))}
        </div>
      </Reveal>

      <Reveal className="pm-dark-card pm-how" id="how">
        <h2>How it works</h2>
        <div className="pm-how-grid">
          <article className="pm-stagger" style={{ '--d': '0ms' }}>
            <strong>1</strong>
            <span className="pm-icon-tile"><UploadCloud size={30} /></span>
            <h3>Upload your original</h3>
            <p>Upload the image you own. We keep the source safe.</p>
          </article>
          <ArrowRight className="pm-step-arrow" size={22} />
          <article className="pm-stagger" style={{ '--d': '140ms' }}>
            <strong>2</strong>
            <span className="pm-icon-tile"><ScanLine size={30} /></span>
            <h3>We embed an invisible payload</h3>
            <code>payload #4F2A9C</code>
            <p>A unique forensic signature is woven into the pixels.</p>
          </article>
          <ArrowRight className="pm-step-arrow" size={22} />
          <article className="pm-stagger" style={{ '--d': '280ms' }}>
            <strong>3</strong>
            <span className="pm-icon-tile"><Search size={30} /></span>
            <h3>Verify or track copies</h3>
            <p>Verify any image in seconds, or track where it appears online.</p>
          </article>
        </div>
      </Reveal>

      <Reveal className="pm-dark-card pm-outcomes">
        <h2>Verification you can trust</h2>
        <p>We only claim ownership on a real forensic match — never on a visual guess.</p>
        <div className="pm-outcome-grid">
          {outcomes.map((item, i) => {
            const Icon = item.icon;
            return (
              <article
                className={`pm-outcome ${item.tone} pm-stagger`}
                key={item.title}
                style={{ '--d': `${i * 90}ms` }}
              >
                <Icon size={22} />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            );
          })}
        </div>
      </Reveal>

      <Reveal className="pm-dark-card pm-cta" id="pricing">
        <div className="pm-cta-copy">
          <span className="pm-eyebrow"><ImageIcon size={15} /> Start free</span>
          <h2>Your images are already out there. Start protecting them.</h2>
        </div>
        <form onSubmit={(event) => event.preventDefault()}>
          <input type="email" placeholder="Enter your email" aria-label="Email address" />
          <Link className="pm-land-primary" to={appHref}>Get started</Link>
          <p><Lock size={15} /> No credit card required.</p>
        </form>
      </Reveal>

      <footer className="pm-land-footer">
        <div>
          <Logo tone="light" size="sm" />
          <p>Trace your images.</p>
          <small>© 2026 ProofMark.</small>
        </div>
        <nav>
          <strong>Product</strong>
          <a href="#how">How it works</a>
          <a href="#survives">Survives</a>
          <Link to={token ? '/verify' : '/login'}>Verify</Link>
        </nav>
        <nav>
          <strong>Resources</strong>
          <a href="#how">Help center</a>
          <a href="#how">Guides</a>
          <a href="#how">API</a>
        </nav>
        <nav>
          <strong>Company</strong>
          <a href="#pricing">About</a>
          <a href="#pricing">Contact</a>
          <a href="#pricing">Privacy</a>
        </nav>
        <div className="pm-fairplay-mark">
          <img src="/fairplay-africa.png" alt="FairPlay Africa" />
          <p>For creators. For culture. For fairness.</p>
        </div>
      </footer>
    </main>
  );
}
