import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  CircleHelp,
  CircleMinus,
  CircleX,
  Fingerprint,
  Globe2,
  Lock,
  Play,
  Radar,
  Search,
  ShieldCheck,
  UploadCloud,
} from 'lucide-react';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../auth.jsx';

const mountain =
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=700&q=85';

const pillars = [
  {
    icon: ShieldCheck,
    title: 'Property',
    lead: 'Turn every image into traceable property.',
    body: 'Embed a unique forensic signature that proves ownership without changing your image.',
  },
  {
    icon: Search,
    title: 'Verify',
    lead: 'Check any suspect image against your protected assets.',
    body: 'Our verification engine confirms matches with forensic evidence, not visual guesswork.',
  },
  {
    icon: Radar,
    title: 'Track',
    lead: 'See where your images surface across the web.',
    body: 'Record confirmed sightings and keep evidence tied to the original property.',
  },
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
    body: "A signature is present, but we do not know who owns it.",
    tone: 'unknown',
  },
  {
    icon: CircleMinus,
    title: 'Not found',
    body: 'No matching signature found in our database.',
    tone: 'missing',
  },
  {
    icon: CircleX,
    title: 'Invalid',
    body: 'The image is corrupted or not a valid file.',
    tone: 'invalid',
  },
];

export default function Landing() {
  const { token } = useAuth();
  const appHref = token ? '/app' : '/register';

  return (
    <main className="pm-landing">
      <header className="pm-land-nav">
        <Link to="/" className="pm-land-brand" aria-label="ProofMark home">
          <Logo tone="light" size="sm" />
          <span className="pm-land-tagline">Trace your images.</span>
        </Link>
        <nav aria-label="Landing navigation">
          <a href="#how">How it works</a>
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
          <h1>Prove an image is yours. Anywhere it travels.</h1>
          <p>
            ProofMark embeds an invisible forensic signature into your images, so when a
            copy shows up online, you can prove where it came from.
          </p>
          <div className="pm-hero-actions">
            <Link className="pm-land-primary" to={appHref}>Protect your first image</Link>
            <Link className="pm-land-secondary" to={token ? '/verify' : '/login'}>
              <Play size={18} />
              <span>See how verification works</span>
            </Link>
          </div>
        </div>

        <div className="pm-watermark-flow" aria-label="Watermark flow preview">
          <article>
            <span>Original</span>
            <img src={mountain} alt="Original landscape before ProofMark protection" />
          </article>
          <div className="pm-flow-arrow" aria-hidden="true">→</div>
          <article className="pm-payload-card">
            <span>Invisible payload</span>
            <div>
              <Fingerprint size={32} />
              <code>payload #4F2A9C</code>
            </div>
          </article>
          <div className="pm-flow-arrow" aria-hidden="true">→</div>
          <article>
            <span>Protected ✓</span>
            <img src={mountain} alt="Protected landscape after ProofMark watermark" />
            <BadgeCheck className="pm-proof-stamp" size={72} />
          </article>
          <p>The signature is invisible. The proof is real.</p>
        </div>
      </section>

      <section className="pm-pillar-grid" aria-label="ProofMark capabilities">
        {pillars.map((item) => {
          const Icon = item.icon;
          return (
            <article className="pm-dark-card pm-pillar" key={item.title}>
              <span><Icon size={28} /></span>
              <h2>{item.title}</h2>
              <h3>{item.lead}</h3>
              <p>{item.body}</p>
            </article>
          );
        })}
      </section>

      <section className="pm-dark-card pm-how" id="how">
        <h2>How it works</h2>
        <div className="pm-how-grid">
          <article>
            <strong>1</strong>
            <span><UploadCloud size={34} /></span>
            <h3>Upload your original</h3>
            <p>Upload the image you own. We keep it safe.</p>
          </article>
          <ArrowRight className="pm-step-arrow" size={24} />
          <article>
            <strong>2</strong>
            <span><Fingerprint size={34} /></span>
            <h3>We embed an invisible payload</h3>
            <code>payload #4F2A9C</code>
            <p>ProofMark embeds a unique forensic signature into your image.</p>
          </article>
          <ArrowRight className="pm-step-arrow" size={24} />
          <article>
            <strong>3</strong>
            <span><Search size={34} /></span>
            <h3>Verify or track copies later</h3>
            <p>Verify any image in seconds or track where your images appear online.</p>
          </article>
        </div>
      </section>

      <section className="pm-dark-card pm-outcomes">
        <h2>Verification outcomes</h2>
        <p>We only claim ownership on a real forensic match, never on a visual guess.</p>
        <div className="pm-outcome-grid">
          {outcomes.map((item) => {
            const Icon = item.icon;
            return (
              <article className={`pm-outcome ${item.tone}`} key={item.title}>
                <Icon size={24} />
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="pm-dark-card pm-cta" id="pricing">
        <h2>Your images are already out there. Start protecting them.</h2>
        <form onSubmit={(event) => event.preventDefault()}>
          <input type="email" placeholder="Enter your email" aria-label="Email address" />
          <Link className="pm-land-primary" to={appHref}>Get started</Link>
        </form>
        <p><Lock size={16} /> No credit card required. Start for free.</p>
      </section>

      <footer className="pm-land-footer">
        <div>
          <Logo tone="light" size="sm" />
          <p>Trace your images.</p>
          <small>© 2026 ProofMark.</small>
        </div>
        <nav>
          <strong>Product</strong>
          <a href="#how">How it works</a>
          <Link to={token ? '/verify' : '/login'}>Verify</Link>
          <a href="#pricing">Pricing</a>
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
          <span><Globe2 size={26} /></span>
          <strong>FairPlay Africa</strong>
          <p>For creators. For culture. For fairness.</p>
        </div>
      </footer>
    </main>
  );
}
