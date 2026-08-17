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

/**
 * Test switch, read from the environment so it can be flipped in Vercel without a code change.
 *
 * Set CSP_ALLOW_PRETA_SCRIPT=false to drop the Preta hosts from script-src ONLY. That is the
 * exact failure the onboarding CSP check exists to catch: the tag is still in the page, so an
 * HTML scrape reports it installed, while the browser refuses to load the script.
 *
 * Default is ALLOW, deliberately - a missing or misspelled variable must not silently break
 * personalisation on a live site. Blocking is something you opt into.
 *
 * Note this is a plain server-side variable, NOT NEXT_PUBLIC_: it is only read here, at build
 * and server start. Changing it in Vercel therefore needs a redeploy to take effect, because
 * production bakes these headers at build time.
 *
 * While it is false the site really does lose personalisation, and the anti-flicker guard in
 * layout.js hides the page for its full 1.5s timeout before revealing it - the loader that
 * normally clears the guard never runs. That blink is the symptom, not a bug.
 *
 * connect-src deliberately keeps the hosts, so the failure has one cause rather than two.
 */
const CSP_ALLOW_PRETA_SCRIPT = process.env.CSP_ALLOW_PRETA_SCRIPT !== 'false';

const csp = [
    "default-src 'self'",
    // 'unsafe-inline' is required by this site's own inline scripts - see the note above.
    `script-src 'self' 'unsafe-inline'${CSP_ALLOW_PRETA_SCRIPT ? ' ' + PRETA_HOSTS.join(' ') : ''} https://www.googletagmanager.com`,
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