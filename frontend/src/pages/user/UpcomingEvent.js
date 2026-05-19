import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import useSSE from "../../hooks/useSSE";
import "./css/UpcomingEvent.css";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-NP", {
    weekday: "long",
    year:    "numeric",
    month:   "long",
    day:     "numeric",
  });

/* ─────────────────────────────────────────────────────────────
   UpcomingEvent — user-facing, read-only
   Layout: left image (4:3) | right title, description, location, date
───────────────────────────────────────────────────────────── */
const UpcomingEvent = () => {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await api.getEvents();
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      // API returns soonest first — already sorted
      setEvents(data);
    } catch {
      setError("Could not load events. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Real-time: refetch when admin changes events
  useSSE("events", fetchEvents);

  return (
    <div className="ue-page">

      {/* Hero */}
      <div className="ue-hero">
        <span className="ue-hero__eyebrow">What's Happening</span>
        <h1 className="ue-hero__title">Upcoming Events</h1>
        <div className="ue-hero__line" />
        <p className="ue-hero__sub">
          Join us for our upcoming cultural programs, celebrations, and community gatherings.
        </p>
      </div>

      {/* Content */}
      <div className="ue-body">
        {loading ? (
          <div className="ue-loading">
            <div className="ue-spinner" />
            <p>Loading events…</p>
          </div>
        ) : error ? (
          <div className="ue-error">⚠ {error}</div>
        ) : events.length === 0 ? (
          <div className="ue-empty">
            <span>📅</span>
            <p>No upcoming events at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="ue-list">
            {events.map((ev, idx) => (
              <article key={ev._id} className="ue-card">

                {/* Left — image 4:3 */}
                <div className="ue-card__img-wrap">
                  {ev.image ? (
                    <img
                      src={ev.image}
                      alt={ev.title}
                      className="ue-card__img"
                    />
                  ) : (
                    <div className="ue-card__img-placeholder">
                      <span>📅</span>
                    </div>
                  )}
                  {/* Upcoming order badge */}
                  <span className="ue-card__order-badge">
                    #{idx + 1}
                  </span>
                </div>

                {/* Right — details */}
                <div className="ue-card__body">
                  <h2 className="ue-card__title">{ev.title}</h2>
                  <p className="ue-card__desc">{ev.description}</p>

                  <div className="ue-card__meta">
                    <div className="ue-card__meta-item">
                      <span className="ue-card__meta-icon">📍</span>
                      <div>
                        <span className="ue-card__meta-label">Location</span>
                        <span className="ue-card__meta-val">{ev.location}</span>
                      </div>
                    </div>
                    <div className="ue-card__meta-item">
                      <span className="ue-card__meta-icon">🗓</span>
                      <div>
                        <span className="ue-card__meta-label">Date</span>
                        <span className="ue-card__meta-val">{fmtDate(ev.eventDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UpcomingEvent;
