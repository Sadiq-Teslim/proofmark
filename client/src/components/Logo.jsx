export default function Logo({ size = 'md', lockup = true, tone = 'dark' }) {
  return (
    <span className={`pm-logo pm-logo-${size} pm-logo-${tone}`} aria-label="ProofMark">
      <svg viewBox="0 0 48 48" role="img" aria-hidden="true">
        <path className="pm-logo-shield" d="M24 5.5 38.5 10v12.8c0 9.8-5.6 16.1-14.5 19.7C15.1 39 9.5 32.6 9.5 22.8V10L24 5.5Z" />
        <path className="pm-logo-mark" d="M18.1 24.4 22 28.2l8.2-9" />
        <path className="pm-logo-scan" d="M15.2 14.7h5.2M27.6 33.3h5.2M33.3 15.2v5.2M14.7 27.6v5.2" />
      </svg>
      {lockup && <strong>ProofMark</strong>}
    </span>
  );
}
