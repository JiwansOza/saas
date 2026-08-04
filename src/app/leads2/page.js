"use client";

/**
 * Leads received from Preta for THIS site.
 *
 * Preta runs this site's forms in `direct` mode: the visitor's browser posts the payload straight
 * to our backend, which writes it to MongoDB. Preta keeps only metadata.
 *
 * That backend is shared with the other demo site, so every request here is scoped by domain —
 * without it this page would list the other site's submissions as if they were ours.
 */

import { useCallback, useEffect, useState } from "react";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

/** The domain Preta files this site's submissions under — must match the loader's ?d= value. */
const SITE_DOMAIN = "saas-tan-omega.vercel.app";

function formatTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return (
    d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
    " " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  );
}

export default function Leads2Page() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(
        `${BACKEND_URL}/leads?domain=${encodeURIComponent(SITE_DOMAIN)}`,
        { cache: "no-store" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads(data.leads || []);
      setError("");
    } catch (e) {
      // The backend runs on Render's free tier, which sleeps when idle — the first request
      // after a lull can take ~30s or time out.
      setError(
        `${e.message || "Could not load leads"} — the backend may be waking up, try again in a moment.`
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    // Poll so a submission made in another tab shows up without a manual refresh.
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, [load]);

  const deleteLead = useCallback(async (id) => {
    setDeletingId(id);
    try {
      const res = await fetch(`${BACKEND_URL}/leads/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      // Drop it locally rather than refetching — the 5s poll would otherwise briefly
      // re-show the row before the next fetch lands.
      setLeads((prev) => prev.filter((l) => l.id !== id));
    } catch (e) {
      setError(`Could not delete lead — ${e.message}`);
    } finally {
      setDeletingId(null);
    }
  }, []);

  const deleteAll = useCallback(async () => {
    if (!confirm(`Delete all ${leads.length} leads for this site? This cannot be undone.`)) return;
    try {
      // Scoped to this domain — the backend is shared, and an unscoped delete would take the
      // other site's leads with it.
      const res = await fetch(
        `${BACKEND_URL}/leads?confirm=yes&domain=${encodeURIComponent(SITE_DOMAIN)}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLeads([]);
    } catch (e) {
      setError(`Could not delete leads — ${e.message}`);
    }
  }, [leads.length]);

  // Form fields vary per element, so build the columns from whatever actually arrived.
  const fieldKeys = [...new Set(leads.flatMap((l) => Object.keys(l.formData || {})))];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Leads</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Form submissions from <span className="font-medium">{SITE_DOMAIN}</span>, delivered
            straight to this site’s backend. Preta never receives this data.
          </p>
        </div>
        <div className="flex gap-2">
          {leads.length > 0 && (
            <button
              onClick={deleteAll}
              className="rounded-lg border border-red-500/30 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/10"
            >
              Delete all
            </button>
          )}
          <button
            onClick={load}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-500 ring-1 ring-red-500/20">
          {error}
        </div>
      )}

      {loading ? (
        <p className="py-16 text-center text-muted-foreground">Loading…</p>
      ) : leads.length === 0 ? (
        <div className="rounded-xl border border-dashed py-20 text-center">
          <p className="font-medium">No leads yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Submit a form on this site and it will appear here within a few seconds. If nothing
            arrives, check that the delivery endpoint in Preta points at{" "}
            <code className="rounded bg-muted px-1 py-0.5">{BACKEND_URL}/leads</code>, and that the
            backend allows CORS from this site — without it the browser cannot deliver, and in
            direct mode there is no retry.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="whitespace-nowrap px-4 py-3 font-medium">Received</th>
                {/* Which form this came from. pathname alone is not enough — one page can carry
                    a hero form and a footer form, and both would look identical without this. */}
                <th className="whitespace-nowrap px-4 py-3 font-medium">Form</th>
                {fieldKeys.map((k) => (
                  <th key={k} className="whitespace-nowrap px-4 py-3 font-medium">
                    {k}
                  </th>
                ))}
                <th className="whitespace-nowrap px-4 py-3 font-medium">Page</th>
                <th className="w-px whitespace-nowrap px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {formatTime(lead.receivedAt)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {lead.formName || lead.elementType ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{lead.formName || "Untitled form"}</span>
                        {lead.elementType && (
                          <span className="text-xs capitalize text-muted-foreground">
                            {lead.elementType.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                    ) : (
                      // Leads captured before naming shipped carry no name — show the id rather
                      // than a dash, so they can still be traced back to an element.
                      <span className="font-mono text-xs text-muted-foreground">
                        {lead.elementId || "—"}
                      </span>
                    )}
                  </td>
                  {fieldKeys.map((k) => (
                    <td key={k} className="px-4 py-3">
                      {lead.formData?.[k] || <span className="text-muted-foreground">—</span>}
                    </td>
                  ))}
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {lead.pathname || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button
                      onClick={() => deleteLead(lead.id)}
                      disabled={deletingId === lead.id}
                      className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-40"
                    >
                      {deletingId === lead.id ? "Deleting…" : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {leads.length > 0 && (
        <p className="mt-4 text-xs text-muted-foreground">
          Showing {leads.length} lead{leads.length === 1 ? "" : "s"} · refreshes every 5s
        </p>
      )}
    </div>
  );
}
