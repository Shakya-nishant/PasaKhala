import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import pasakhalaLogo from "../../assets/PasaKhala Logo.jpg";
import "./css/ClassDetail.css";

/* ── Helpers ────────────────────────────────────────────────── */
const fmt = (d) =>
  new Date(d).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const isPast = (d) => new Date(d) < new Date();

/* ── Apply Modal ────────────────────────────────────────────── */
const ApplyModal = ({ cls, onClose }) => {
  const [form, setForm] = useState({
    name: "",
    address: "",
    contact: "",
    email: "",
    age: "",
    parentPermission: false,
  });
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const isMinor = parseInt(form.age) < 18 && form.age !== "";

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isMinor && !form.parentPermission) {
      setError("Parent permission is required for applicants under 18.");
      return;
    }
    setLoading(true);
    try {
      const res  = await api.applyToClass(cls._id, { ...form, age: parseInt(form.age) });
      const data = await res.json();
      if (!res.ok) setError(data.message || "Application failed.");
      else         setSuccess(data.message);
    } catch {
      setError("Cannot connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="apply-backdrop" onClick={onClose}>
      <div className="apply-modal" onClick={(e) => e.stopPropagation()}>
        <button className="apply-modal__close" onClick={onClose} aria-label="Close">✕</button>
        <h2 className="apply-modal__title">Apply for {cls.title}</h2>
        <p className="apply-modal__sub">Fill in your details to submit your application.</p>

        {success ? (
          <div className="apply-modal__success">
            <span>✓</span>
            <p>{success}</p>
            <button className="apply-modal__btn" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form className="apply-modal__form" onSubmit={handleSubmit}>
            {error && <div className="apply-modal__error">⚠ {error}</div>}

            <div className="form-row">
              <div className="form-group">
                <label>Full Name</label>
                <input name="name" type="text" placeholder="Your full name"
                  value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Age</label>
                <input name="age" type="number" placeholder="Your age" min="1" max="120"
                  value={form.age} onChange={handleChange} required />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <input name="address" type="text" placeholder="Your address"
                value={form.address} onChange={handleChange} required />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Contact Number</label>
                <input name="contact" type="tel" placeholder="98XXXXXXXX"
                  value={form.contact} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input name="email" type="email" placeholder="you@email.com"
                  value={form.email} onChange={handleChange} required />
              </div>
            </div>

            {isMinor && (
              <div className="apply-modal__minor">
                <div className="minor-alert">
                  👨‍👩‍👦 Applicant is under 18 — parental permission required
                </div>
                <label className="toggle-label">
                  <div className="toggle-wrap">
                    <input name="parentPermission" type="checkbox"
                      checked={form.parentPermission} onChange={handleChange}
                      className="toggle-input" />
                    <span className="toggle-slider" />
                  </div>
                  <span>I confirm that a parent or guardian has given permission for this application</span>
                </label>
              </div>
            )}

            <button type="submit" className="apply-modal__btn"
              disabled={loading || (isMinor && !form.parentPermission)}>
              {loading ? "Submitting…" : "Submit Application"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

/* ── Seat Bar ───────────────────────────────────────────────── */
const SeatBar = ({ used, total }) => {
  const pct = Math.min(100, Math.round((used / total) * 100));
  const isCritical = pct >= 80;
  return (
    <div className="seat-bar">
      <div className="seat-bar__track">
        <div
          className={`seat-bar__fill ${isCritical ? "seat-bar__fill--critical" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="seat-bar__label">
        {total - used} of {total} seats available
      </span>
    </div>
  );
};

/* ── Class Card ─────────────────────────────────────────────── */
const ClassCard = ({ cls }) => {
  const [showForm, setShowForm] = useState(false);

  const deadlinePast   = isPast(cls.formDeadline);
  const seatsAvailable = cls.seatsAvailable ?? (cls.totalSeats - (cls.applicationsCount || 0));
  const seatsUsed      = cls.totalSeats - seatsAvailable;
  const seatsFull      = seatsAvailable <= 0;
  const canApply       = !deadlinePast && !seatsFull;

  // Determine closed reason for the status tag
  let closedReason = "";
  if (seatsFull && deadlinePast) closedReason = "Seats Full & Deadline Over";
  else if (seatsFull)            closedReason = "Seats Full";
  else if (deadlinePast)         closedReason = "Deadline Passed";

  return (
    <>
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
                {canApply ? "Open" : "Closed"}
              </span>
            </div>
            <p className="class-card__desc">{cls.description}</p>
          </div>

          {/* Meta grid */}
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
            <div className="class-card__meta-item">
              <span className="class-card__meta-icon">🪑</span>
              <div>
                <span className="class-card__meta-label">Seats</span>
                <span className={`class-card__meta-value ${seatsFull ? "class-card__meta-value--warn" : ""}`}>
                  {seatsAvailable} / {cls.totalSeats} available
                  {seatsFull && <span className="class-card__meta-tag">Full</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Seat progress bar */}
          <SeatBar used={seatsUsed} total={cls.totalSeats} />

          {/* Action */}
          <div className="class-card__action">
            {canApply ? (
              <button className="class-card__apply-btn" onClick={() => setShowForm(true)}>
                Apply Now →
              </button>
            ) : (
              <div className="class-card__closed-pill">
                <span className="class-card__closed-icon">⛔</span>
                <span>{closedReason}</span>
              </div>
            )}
          </div>
        </div>
      </article>

      {showForm && <ApplyModal cls={cls} onClose={() => setShowForm(false)} />}
    </>
  );
};

/* ── Main Page ──────────────────────────────────────────────── */
const ClassDetail = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.getClasses();
        if (!res.ok) throw new Error("Failed to load classes.");
        const data = await res.json();
        setClasses(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <main className="class-page">

      {/* ── Hero ── */}
      <div className="class-hero">
        <span className="class-hero__eyebrow">Learn with us</span>
        <h1 className="class-hero__title">Our Cultural Classes</h1>
        <div className="class-hero__line" />
        <p className="class-hero__sub">
          Join our curated classes in traditional music, dance, language, and art —
          taught by experienced community instructors.
        </p>
      </div>

      {/* ── Body ── */}
      <div className="class-body">
        {loading ? (
          <div className="class-loading">
            <div className="class-spinner" />
            <p>Loading classes…</p>
          </div>
        ) : error ? (
          <div className="class-error">⚠ {error}</div>
        ) : classes.length === 0 ? (
          <div className="class-empty">
            <span>🎭</span>
            <p>No upcoming classes at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="class-list">
            {classes.map((cls) => (
              <ClassCard key={cls._id} cls={cls} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default ClassDetail;
