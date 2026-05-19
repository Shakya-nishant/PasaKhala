import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../utils/api";
import logo from "../../assets/PasaKhala Logo.jpg";
import "./css/Home.css";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-NP", {
    year: "numeric", month: "long", day: "numeric",
  });

const fmtPosted = (d) =>
  new Date(d).toLocaleDateString("en-NP", {
    year: "numeric", month: "short", day: "numeric",
  });

const isPast = (d) => new Date(d) < new Date();

/* ─────────────────────────────────────────────────────────────
   Skeleton loader block
───────────────────────────────────────────────────────────── */
const Skeleton = ({ className }) => <div className={`skeleton ${className || ""}`} />;

/* ─────────────────────────────────────────────────────────────
   Home
───────────────────────────────────────────────────────────── */
const Home = () => {
  const [events,  setEvents]  = useState([]);
  const [notices, setNotices] = useState([]);
  const [classes, setClasses] = useState([]);
  const [members, setMembers] = useState([]);

  const [loadingEvents,  setLoadingEvents]  = useState(true);
  const [loadingNotices, setLoadingNotices] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(true);

  /* fetch all in parallel */
  useEffect(() => {
    api.getEvents()
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d) ? d.slice(0, 3) : []))
      .catch(() => setEvents([]))
      .finally(() => setLoadingEvents(false));

    api.getNotices()
      .then((r) => r.json())
      .then((d) => setNotices(Array.isArray(d) ? d.slice(0, 3) : []))
      .catch(() => setNotices([]))
      .finally(() => setLoadingNotices(false));

    api.getClasses()
      .then((r) => r.json())
      .then((d) => setClasses(Array.isArray(d) ? d.slice(0, 4) : []))
      .catch(() => setClasses([]))
      .finally(() => setLoadingClasses(false));

    api.getMembers()
      .then((r) => r.json())
      .then((d) => {
        // Only show members from row 1 and row 2 (column 1 and 2)
        const row1and2 = Array.isArray(d?.members)
          ? d.members.filter((m) => m.column === 1 || m.column === 2)
          : [];
        setMembers(row1and2);
      })
      .catch(() => setMembers([]))
      .finally(() => setLoadingMembers(false));
  }, []);

  return (
    <main className="home">

      {/* ══════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════ */}
      <section className="hero">
        <div className="hero__overlay" aria-hidden="true" />
        <div className="hero__content">
          <p className="hero__eyebrow">ज्वजलपा · स्वागतम् · Welcome</p>
          <h2 className="hero__title">पासा खल</h2>
          <div className="hero__title-line" aria-hidden="true" />
          <div className="hero__logo-wrap">
            <img src={logo} alt="PasaKhala Logo" className="hero__logo" />
          </div>
          <p className="hero__subtitle">
            Preserving our roots, celebrating our culture,<br />
            and uniting our community — one tradition at a time.
          </p>
          <div className="hero__actions">
            <Link to="/upcoming-event" className="btn btn--primary">Upcoming Events</Link>
            <Link to="/about"          className="btn btn--outline">About Us</Link>
          </div>
          <div className="hero__deco-symbols" aria-hidden="true">
            <span className="hero__deco-line" />
            <span className="hero__deco-sym">❖</span>
            <span className="hero__deco-line" />
            <span className="hero__deco-sym">॥</span>
            <span className="hero__deco-line" />
            <span className="hero__deco-sym">❖</span>
            <span className="hero__deco-line" />
          </div>
        </div>
        <div className="hero__scroll-hint" aria-hidden="true"><span>↓</span></div>
      </section>

      {/* ══════════════════════════════════════════════════
          ABOUT STRIP — static mission/vision/community
      ══════════════════════════════════════════════════ */}
      <section className="about-strip">
        <div className="about-strip__inner">
          <div className="about-strip__block">
            <span className="about-strip__icon">🪔</span>
            <h3>Our Mission</h3>
            <p>Promote and preserve Nepali cultural heritage through education, events, and community engagement.</p>
          </div>
          <div className="about-strip__divider" aria-hidden="true" />
          <div className="about-strip__block">
            <span className="about-strip__icon">🎭</span>
            <h3>Our Vision</h3>
            <p>A vibrant community where every generation stays connected to their cultural identity and traditions.</p>
          </div>
          <div className="about-strip__divider" aria-hidden="true" />
          <div className="about-strip__block">
            <span className="about-strip__icon">🤝</span>
            <h3>Our Community</h3>
            <p>A growing family of members dedicated to keeping our language, art, and customs alive and thriving.</p>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          UPCOMING EVENTS — live from DB
      ══════════════════════════════════════════════════ */}
      <section className="section events-section">
        <div className="section__header">
          <span className="section__eyebrow">What's happening</span>
          <h2 className="section__title">Upcoming Events</h2>
          <div className="section__line" aria-hidden="true" />
        </div>

        {loadingEvents ? (
          <div className="events-grid">
            {[1, 2, 3].map((i) => (
              <div key={i} className="event-card event-card--skeleton">
                <div className="event-card__img-wrap skeleton" />
                <div className="event-card__body">
                  <Skeleton className="skeleton--badge" />
                  <Skeleton className="skeleton--title" />
                  <Skeleton className="skeleton--line" />
                  <Skeleton className="skeleton--line" />
                  <Skeleton className="skeleton--line skeleton--short" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="home-empty">
            <span>📅</span>
            <p>No upcoming events at the moment. Check back soon!</p>
          </div>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <article key={event._id} className="event-card">
                <div className="event-card__img-wrap">
                  {event.image
                    ? <img src={event.image} alt={event.title} className="event-card__img" />
                    : <div className="event-card__img-placeholder"><span>📅</span></div>
                  }
                </div>
                <div className="event-card__body">
                  <div className="event-card__date-badge">
                    📅 {fmtDate(event.eventDate)}
                  </div>
                  <h3 className="event-card__title">{event.title}</h3>
                  <p className="event-card__location">📍 {event.location}</p>
                  <p className="event-card__desc">{event.description}</p>
                  <Link to="/upcoming-event" className="event-card__link">
                    Learn more →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="section__cta">
          <Link to="/upcoming-event" className="btn btn--primary">View All Events</Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          NOTICE BOARD — live from DB
      ══════════════════════════════════════════════════ */}
      <section className="notice-section">
        <div className="notice-section__inner">
          <div className="section__header section__header--light">
            <span className="section__eyebrow section__eyebrow--light">Stay informed</span>
            <h2 className="section__title section__title--light">Notice Board</h2>
            <div className="section__line section__line--light" aria-hidden="true" />
          </div>

          {loadingNotices ? (
            <ul className="notice-list">
              {[1, 2, 3].map((i) => (
                <li key={i} className="notice-item">
                  <span className="notice-item__dot" />
                  <div style={{ flex: 1 }}>
                    <Skeleton className="skeleton--notice-date" />
                    <Skeleton className="skeleton--notice-text" />
                  </div>
                </li>
              ))}
            </ul>
          ) : notices.length === 0 ? (
            <div className="home-empty home-empty--light">
              <span>📢</span>
              <p>No active notices right now.</p>
            </div>
          ) : (
            <ul className="notice-list">
              {notices.map((n) => (
                <li key={n._id} className="notice-item">
                  <span className="notice-item__dot" aria-hidden="true" />
                  <div>
                    <time className="notice-item__date">
                      {fmtPosted(n.postedDate || n.createdAt)}
                    </time>
                    <p className="notice-item__text">{n.notice}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <Link to="/notice" className="btn btn--outline-light">All Notices</Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          CLASSES — live from DB
      ══════════════════════════════════════════════════ */}
      <section className="section class-section">
        <div className="class-section__inner">
          <div className="class-section__text">
            <span className="section__eyebrow">Learn with us</span>
            <h2 className="section__title">Our Cultural Classes</h2>
            <p className="class-section__desc">
              Join our curated classes in traditional music, classical dance,
              Nepali language, and cultural arts — taught by experienced
              community instructors who carry generations of knowledge.
            </p>
            <Link to="/class-detail" className="btn btn--primary">Explore Classes</Link>
          </div>

          <div className="class-section__cards">
            {loadingClasses ? (
              [1, 2, 3, 4].map((i) => (
                <div key={i} className="class-pill class-pill--skeleton">
                  <Skeleton className="skeleton--pill-title" />
                  <Skeleton className="skeleton--pill-meta" />
                </div>
              ))
            ) : classes.length === 0 ? (
              /* fallback static pills if no classes in DB */
              ["🎵 Classical Music", "💃 Folk Dance", "📖 Nepali Language", "🎨 Traditional Art"].map((cls, i) => (
                <div key={i} className="class-pill">{cls}</div>
              ))
            ) : (
              classes.map((cls) => {
                const deadlinePast   = isPast(cls.formDeadline);
                const seatsAvailable = cls.seatsAvailable ?? (cls.totalSeats - (cls.applicationsCount || 0));
                const seatsFull      = seatsAvailable <= 0;
                const open           = !deadlinePast && !seatsFull;
                return (
                  <div key={cls._id} className={`class-pill ${open ? "" : "class-pill--closed"}`}>
                    <span className="class-pill__title">{cls.title}</span>
                    <span className="class-pill__meta">
                      {open
                        ? `${seatsAvailable} seat${seatsAvailable !== 1 ? "s" : ""} left`
                        : deadlinePast ? "Deadline passed" : "Seats full"}
                    </span>
                    <span className={`class-pill__dot ${open ? "class-pill__dot--open" : "class-pill__dot--closed"}`} />
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          MEMBERS SPOTLIGHT — live from DB
      ══════════════════════════════════════════════════ */}
      {(loadingMembers || members.length > 0) && (
        <section className="section members-section">
          <div className="section__header">
            <span className="section__eyebrow">The people behind it</span>
            <h2 className="section__title">Our Board Members</h2>
            <div className="section__line" aria-hidden="true" />
          </div>

          {loadingMembers ? (
            <div className="members-grid">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="member-card member-card--skeleton">
                  <Skeleton className="skeleton--avatar" />
                  <Skeleton className="skeleton--member-name" />
                  <Skeleton className="skeleton--member-role" />
                </div>
              ))}
            </div>
          ) : (
            <div className="members-grid">
              {members.map((m) => (
                <div key={m._id} className="member-card">
                  <div className="member-card__photo-wrap">
                    {m.image ? (
                      <img src={m.image} alt={m.name} className="member-card__photo" />
                    ) : (
                      <div className="member-card__photo-placeholder">
                        <span>👤</span>
                      </div>
                    )}
                  </div>
                  <h3 className="member-card__name">{m.name}</h3>
                  <p  className="member-card__role">{m.title}</p>
                </div>
              ))}
            </div>
          )}

          <div className="section__cta">
            <Link to="/member" className="btn btn--primary">View All Members</Link>
          </div>
        </section>
      )}

    </main>
  );
};

export default Home;
