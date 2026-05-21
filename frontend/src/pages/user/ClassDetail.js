import React, { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";
import useSSE from "../../hooks/useSSE";
import "./css/ClassDetail.css";

/* ── Helpers ────────────────────────────────────────────────── */
const fmt = (d) =>
  new Date(d).toLocaleDateString("en-NP", {
    year: "numeric", month: "long", day: "numeric",
  });

const isPast = (d) => new Date(d) < new Date();

/* ── Class Card — redesigned cultural layout ────────────────── */
const ClassCard = ({ cls, index }) => {
  const deadlinePast = isPast(cls.formDeadline);
  const isClosed     = cls.isClosed;
  const canApply     = !deadlinePast && !isClosed;

  const handleApply = () => {
    if (cls.googleFormLink) {
      window.open(cls.googleFormLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <article className="cc" style={{ animationDelay: `${index * 0.08}s` }}>

      {/* Top accent bar */}
      <div className={`cc__bar ${canApply ? "cc__bar--open" : "cc__bar--closed"}`} />

      <div className="cc__inner">

        {/* Header row: number badge + title + status badge */}
        <div className="cc__head">
          <span className="cc__num">0{index + 1}</span>
          <div className="cc__title-wrap">
            <h2 className="cc__title">{cls.title}</h2>
          </div>
          <span className={`cc__status ${canApply ? "cc__status--open" : "cc__status--closed"}`}>
            {canApply ? "Open" : isClosed ? "Class Full" : "Closed"}
          </span>
        </div>

        {/* Divider */}
        <div className="cc__divider" />

        {/* Description */}
        <p className="cc__desc">{cls.description}</p>

        {/* Meta pills row */}
        <div className="cc__meta">
          <div className="cc__meta-pill">
            <span className="cc__meta-icon">📅</span>
            <div>
              <span className="cc__meta-label">Starts</span>
              <span className="cc__meta-val">{fmt(cls.startDate)}</span>
            </div>
          </div>
          <div className="cc__meta-pill">
            <span className="cc__meta-icon">⏳</span>
            <div>
              <span className="cc__meta-label">Apply By</span>
              <span className={`cc__meta-val ${deadlinePast ? "cc__meta-val--warn" : ""}`}>
                {fmt(cls.formDeadline)}
              </span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="cc__action">
          {canApply ? (
            cls.googleFormLink ? (
              <button className="cc__apply-btn" onClick={handleApply}>
                Apply Now
                <span className="cc__apply-arrow">→</span>
              </button>
            ) : (
              <span className="cc__coming-soon">Application form coming soon</span>
            )
          ) : (
            <div className="cc__full-pill">
              <span>⛔</span>
              <span>{isClosed ? "Class Full" : "Deadline Passed"}</span>
            </div>
          )}
        </div>

      </div>
    </article>
  );
};

/* ── Main Page ──────────────────────────────────────────────── */
const ClassDetail = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchClasses = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await api.getClasses();
      if (!res.ok) throw new Error("Failed to load classes.");
      setClasses(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);
  useSSE("classes", fetchClasses);

  return (
    <main className="class-page">

      {/* Hero */}
      <div className="class-hero">
        <span className="class-hero__eyebrow">Learn with us</span>
        <h1 className="class-hero__title">Our Cultural Classes</h1>
        <div className="class-hero__line" />
        <p className="class-hero__sub">
          Join our curated classes in traditional music, dance, language, and art —
          taught by experienced community instructors.
        </p>
      </div>

      {/* Body */}
      <div className="class-body">
        {loading ? (
          <div className="class-loading"><div className="class-spinner" /><p>Loading classes…</p></div>
        ) : error ? (
          <div className="class-error">⚠ {error}</div>
        ) : classes.length === 0 ? (
          <div className="class-empty">
            <span>🎭</span>
            <p>No upcoming classes at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="class-list">
            {classes.map((cls, i) => <ClassCard key={cls._id} cls={cls} index={i} />)}
          </div>
        )}
      </div>
    </main>
  );
};

export default ClassDetail;
