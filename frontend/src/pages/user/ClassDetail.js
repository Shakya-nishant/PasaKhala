import React, { useEffect, useState, useCallback } from "react";
import api from "../../utils/api";
import useSSE from "../../hooks/useSSE";
import pasakhalaLogo from "../../assets/PasaKhala Logo.jpg";
import "./css/ClassDetail.css";

/* ── Helpers ────────────────────────────────────────────────── */
const fmt = (d) =>
  new Date(d).toLocaleDateString("en-NP", {
    year: "numeric", month: "long", day: "numeric",
  });

const isPast = (d) => new Date(d) < new Date();

/* ── Class Card ─────────────────────────────────────────────── */
const ClassCard = ({ cls }) => {
  const deadlinePast = isPast(cls.formDeadline);
  const isClosed     = cls.isClosed;                    // admin manually closed
  const canApply     = !deadlinePast && !isClosed;

  // What to show on the closed pill
  const closedReason = isClosed ? "Class Full" : "Deadline Passed";

  const handleApply = () => {
    if (cls.googleFormLink) {
      window.open(cls.googleFormLink, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <article className="class-card">
      {/* Left accent strip */}
      <div className={`class-card__strip ${canApply ? "class-card__strip--open" : "class-card__strip--closed"}`} />

      {/* Logo */}
      <div className="class-card__logo-col">
        <div className="class-card__logo-wrap">
          <img src={pasakhalaLogo} alt="PasaKhala" className="class-card__logo" />
        </div>
      </div>

      {/* Body */}
      <div className="class-card__body">
        <div className="class-card__top">
          <div className="class-card__title-row">
            <h2 className="class-card__title">{cls.title}</h2>
            <span className={`class-card__badge ${canApply ? "class-card__badge--open" : "class-card__badge--closed"}`}>
              {canApply ? "Open" : isClosed ? "Class Full" : "Closed"}
            </span>
          </div>
          <p className="class-card__desc">{cls.description}</p>
        </div>

        {/* Meta — start date + deadline only, no seat details */}
        <div className="class-card__meta">
          <div className="class-card__meta-item">
            <span className="class-card__meta-icon">📅</span>
            <div>
              <span className="class-card__meta-label">Class Starts</span>
              <span className="class-card__meta-value">{fmt(cls.startDate)}</span>
            </div>
          </div>
          <div className="class-card__meta-item">
            <span className="class-card__meta-icon">⏳</span>
            <div>
              <span className="class-card__meta-label">Apply By</span>
              <span className={`class-card__meta-value ${deadlinePast ? "class-card__meta-value--warn" : ""}`}>
                {fmt(cls.formDeadline)}
                {deadlinePast && <span className="class-card__meta-tag">Expired</span>}
              </span>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="class-card__action">
          {canApply ? (
            cls.googleFormLink ? (
              <button className="class-card__apply-btn" onClick={handleApply}>
                Apply Now →
              </button>
            ) : (
              <div className="class-card__closed-pill">
                <span className="class-card__closed-icon">📋</span>
                <span>Application form coming soon</span>
              </div>
            )
          ) : (
            <div className="class-card__closed-pill class-card__closed-pill--full">
              <span className="class-card__closed-icon">⛔</span>
              <span>{closedReason}</span>
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
      const res  = await api.getClasses();
      if (!res.ok) throw new Error("Failed to load classes.");
      setClasses(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  // Real-time: refetch when admin changes classes
  useSSE("classes", fetchClasses);

  return (
    <main className="class-page">
      <div className="class-hero">
        <span className="class-hero__eyebrow">Learn with us</span>
        <h1 className="class-hero__title">Our Cultural Classes</h1>
        <div className="class-hero__line" />
        <p className="class-hero__sub">
          Join our curated classes in traditional music, dance, language, and art —
          taught by experienced community instructors.
        </p>
      </div>

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
            {classes.map((cls) => <ClassCard key={cls._id} cls={cls} />)}
          </div>
        )}
      </div>
    </main>
  );
};

export default ClassDetail;
