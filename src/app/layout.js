import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import "./globals.css";
import ClientShell from "@/components/ClientShell";
import { createPretaContextToken } from "@/lib/preta-token";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Read the logged-in user's Preta attributes from the saasify_session cookie (set at
// login — 24h, contains { pretaUser: { plan, role, has_paid, ... } }). We sign these
// SERVER-SIDE on every request and hand the loader a fresh JWT via window.__PRETA_CTX__.
// This replaces the old data-ctx-endpoint fetch of /users/preta-token, which relied on
// the short-lived saasify_access_token and was returning 401 — leaving every
// personalized element hidden until the user logged in again.
async function getPretaContext() {
  let pretaUser = null;

  try {
    const raw = (await cookies()).get("saasify_session")?.value;
    if (!raw) return { pretaUser: null, token: null };
    pretaUser = JSON.parse(decodeURIComponent(raw)).pretaUser || null;
  } catch (e) {
    console.error("[Preta] session parse error:", e?.message);
    return { pretaUser: null, token: null };
  }

  if (!pretaUser) return { pretaUser: null, token: null };

  // Signing is attempted separately so a failure here does not take pretaUser down with
  // it. Only the token needs PRETA_PRIVATE_KEY; window.pretaUser drives client-side
  // targeting on its own. Catching both together meant a missing key silently removed
  // ALL personalization and left nothing in the page to point at the cause.
  let token = null;
  try {
    token = await createPretaContextToken(pretaUser);
  } catch (e) {
    console.error(
      "[Preta] context sign failed — PRETA_PRIVATE_KEY missing or invalid.",
      "Rules that require a verified context will not match.",
      e?.message
    );
  }

  return { pretaUser, token };
}

export default async function RootLayout({ children }) {
  const { pretaUser, token } = await getPretaContext();

  return (
    <html lang="en">
      <head>
        {/* Preta anti-flicker — hide instantly, reveal once the loader injects. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){document.documentElement.style.opacity='0';var t=setTimeout(function(){document.documentElement.style.opacity='';},1500);window.__preta_af_clear=function(){clearTimeout(t);document.documentElement.style.transition='opacity .15s';document.documentElement.style.opacity='1';setTimeout(function(){document.documentElement.style.transition='';document.documentElement.style.opacity='';},200);};})();",
          }}
        />
        {/* Preta context — signed server-side, exposed for the loader BEFORE it runs.
            window.pretaUser feeds client-side targeting; window.__PRETA_CTX__ is the
            signed JWT the edge verifies (data-ctx-var). No network fetch → no 401. */}
        {(pretaUser || token) && (
          <script
            dangerouslySetInnerHTML={{
              __html: [
                pretaUser ? `window.pretaUser=${JSON.stringify(pretaUser)};` : "",
                token ? `window.__PRETA_CTX__=${JSON.stringify(token)};` : "",
              ].join(""),
            }}
          />
        )}
        {/* Preta loader — v2 (this site runs on the 1.1 dashboard). Context comes from the
            window var above, so there is no /users/preta-token fetch to fail. */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          src="https://loader-v2.pretasystems.com/boot?d=saas-tan-omega.vercel.app"
          data-api="https://app.pretasystems.com/v2/api"
          data-ctx-var="__PRETA_CTX__"
          data-debug="true"
        ></script>
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* App-shell wrapper the loader keys off for clean banner layout. */}
        <div id="__next">
          <ClientShell>{children}</ClientShell>
        </div>
      </body>
    </html>
  );
}
