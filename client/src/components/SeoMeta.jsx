import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = import.meta.env.VITE_PUBLIC_SITE_URL || 'https://proofmark.netlify.app';
const DEFAULT_TITLE = 'ProofMark - Invisible Image Watermarking & Ownership Tracking';
const DEFAULT_DESCRIPTION =
  'ProofMark embeds invisible forensic signatures into images so creators can prove ownership, verify copies, and track where protected images appear online.';

const ROUTES = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonical: '/',
    robots: 'index, follow, max-image-preview:large',
  },
  '/login': {
    title: 'Sign in to ProofMark',
    description: 'Sign in to manage your protected images and verification records.',
    canonical: '/login',
    robots: 'noindex, nofollow',
  },
  '/register': {
    title: 'Create your ProofMark account',
    description: 'Create a ProofMark account and start protecting traceable image copies.',
    canonical: '/register',
    robots: 'noindex, nofollow',
  },
};

function absoluteUrl(path) {
  return new URL(path, SITE_URL).toString();
}

function ensureMeta(selector, create) {
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = create();
    document.head.appendChild(tag);
  }
  return tag;
}

function setNamedMeta(name, content) {
  const tag = ensureMeta(`meta[name="${name}"]`, () => {
    const meta = document.createElement('meta');
    meta.setAttribute('name', name);
    return meta;
  });
  tag.setAttribute('content', content);
}

function setPropertyMeta(property, content) {
  const tag = ensureMeta(`meta[property="${property}"]`, () => {
    const meta = document.createElement('meta');
    meta.setAttribute('property', property);
    return meta;
  });
  tag.setAttribute('content', content);
}

export default function SeoMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const route =
      ROUTES[pathname] ||
      (pathname.startsWith('/app')
        ? {
            title: 'ProofMark Dashboard',
            description: 'Manage protected images, verification evidence, and tracking records in ProofMark.',
            canonical: pathname,
            robots: 'noindex, nofollow',
          }
        : ROUTES['/']);

    const canonicalUrl = absoluteUrl(route.canonical);
    const ogImage = absoluteUrl('/og-image.png');

    document.title = route.title;
    document.documentElement.lang = 'en';
    setNamedMeta('description', route.description);
    setNamedMeta('robots', route.robots);
    setPropertyMeta('og:url', canonicalUrl);
    setPropertyMeta('og:title', route.title);
    setPropertyMeta('og:description', route.description);
    setPropertyMeta('og:image', ogImage);
    setNamedMeta('twitter:title', route.title);
    setNamedMeta('twitter:description', route.description);
    setNamedMeta('twitter:image', ogImage);

    const canonical = ensureMeta('link[rel="canonical"]', () => {
      const link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      return link;
    });
    canonical.setAttribute('href', canonicalUrl);
  }, [pathname]);

  return null;
}
