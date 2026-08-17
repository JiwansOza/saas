/** @type {import('next').NextConfig} */

/**
 * Content-Security-Policy for this demo site.
 *
 * Added so the Preta onboarding CSP check has something real to read: it fetches this page and
 * looks for its own hosts in script-src and connect-src.
 *
 * Two things this policy has to keep working, or the site breaks rather than the check failing:
 *
 *   'unsafe-inline' in script-src - src/app/layout.js writes three inline scripts (the
 *   anti-flicker guard, window.pretaUser, window.__PRETA_CTX__). A policy without it would kill
 *   the context the loader reads, and the page would go permanently blank behind the flicker
 *   guard. A nonce would be the proper fix; that is a bigger change than a test needs.
 *
 *   Both loader hosts - this site loads loader-v2, while the 1.1 dashboard's onboarding checks
 *   for whichever host its own NEXT_PUBLIC_LOADER_URL names (loader-v1 locally). Allowing both
 *   means the check passes for the right reason instead of failing on an env mismatch.
 *
 * To test the BLOCKED path instead, comment out the pretasystems entries in script-src and
 * watch the onboarding CSP row name the exact directives it wants back.
 */
const PRETA_HOSTS = [
    'https://loader-v1.pretasystems.com',
    'https://loader-v2.pretasystems.com',
    'https://app.pretasystems.com',
];

const csp = [
    "default-src 'self'",
    // 'unsafe-inline' is required by this site's own inline scripts - see the note above.
    `script-src 'self' 'unsafe-inline' ${PRETA_HOSTS.join(' ')} https://www.googletagmanager.com`,
    `connect-src 'self' ${PRETA_HOSTS.join(' ')} https://*.onrender.com http://localhost:4000 https://www.google-analytics.com`,
    // The loader injects styles for the elements it renders, so inline styles have to be allowed.
    "style-src 'self' 'unsafe-inline'",
    // googletagmanager appears here as well as in script-src: GTM fires tracking pixels as
    // images, and its noscript half is an iframe (see layout.js). Without frame-src those fall
    // back to default-src 'self' and are blocked - a CSP error that looks like a GTM outage.
    "img-src 'self' data: https://cdn.dribbble.com https://*.pretasystems.com https://www.googletagmanager.com https://www.google-analytics.com",
    "frame-src https://www.googletagmanager.com",
    "font-src 'self' data:",
    "frame-ancestors 'self'",
].join('; ');

const nextConfig = {
    images: {
        domains: ["cdn.dribbble.com"], // Add the external image domain here
    },
    async headers() {
        return [
            {
                // Every route, because the onboarding check reads the site root and the loader
                // runs on every page.
                source: '/:path*',
                headers: [{ key: 'Content-Security-Policy', value: csp }],
            },
        ];
    },
};

export default nextConfig;