import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import "./css/Notice.css";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-NP", {
    year: "numeric", month: "long", day: "numeric",
  });

const fmtExpiry = (d) =>
  new Date(d).toLocaleString("en-NP", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

/* How long ago / how soon */
const timeAgo = (d) => {
  const diff = Date.now() - new Date(d).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)  return "Just now";
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return fmtDate(d);
};

/* ─────────────────────────────────────────────────────────────
   Notice Page — user-facing, read-only, newest first
───────────────────────────────────────────────────────────── */
const Notice = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await api.getNotices();
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // API already returns newest first; just set
      setNotices(data);
    } catch {
      setError("Could not load notices. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  return (
    <div className="nb-page">

      {/* Hero */}
      <div className="nb-hero">
        <span className="nb-hero__eyebrow">Stay Informed</span>
        <h1 className="nb-hero__title">Notice Board</h1>
        <div className="nb-hero__line" />
        <p className="nb-hero__sub">
          Official announcements and updates from PasaKhala. Notices are removed automatically once they expire.
        </p>
      </div>

      {/* Content */}
      <div className="nb-body">
        {loading ? (
          <div className="nb-loading">
            <div className="nb-spinner" />
            <p>Loading notices…</p>
          </div>
        ) : error ? (
          <div className="nb-error">⚠ {error}</div>
        ) : notices.length === 0 ? (
          <div className="nb-empty">
            <span>📋</span>
            <p>No active notices at the moment. Check back soon.</p>
          </div>
        ) : (
          <div className="nb-list">
            {notices.map((n, idx) => (
              <article key={n._id} className={`nb-card ${idx === 0 ? "nb-card--new" : ""}`}>

                {/* NEW badge on the latest notice */}
                {idx === 0 && <span className="nb-card__new-badge">New</span>}

                {/* Notice text */}
                <p className="nb-card__text">{n.notice}</p>

                {/* Footer: posted date + expiry */}
                <div className="nb-card__footer">
                  <div className="nb-card__meta">
                    <span className="nb-card__dot" aria-hidden="true" />
                    <time className="nb-card__posted" dateTime={n.postedDate}>
                      {fmtDate(n.postedDate)}
                    </time>
                    <span className="nb-card__ago">({timeAgo(n.postedDate)})</span>
                  </div>
                  <span className="nb-card__expiry" title="Notice expires on">
                    ⏳ Until {fmtExpiry(n.expiresAt)}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notice;
