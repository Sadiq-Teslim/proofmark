import { useEffect, useRef, useState } from 'react';

// Wraps a section and adds `is-in` when it scrolls into view, so children can
// animate in (with optional CSS stagger via the `--d` custom property).
export default function Reveal({ children, className = '', as: Tag = 'section', ...rest }) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`pm-reveal ${shown ? 'is-in' : ''} ${className}`.trim()} {...rest}>
      {children}
    </Tag>
  );
}
