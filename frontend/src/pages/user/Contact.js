import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import useSSE from "../../hooks/useSSE";
import "./css/Contact.css";

/* ─────────────────────────────────────────────────────────────
   Icon map — returns an SVG icon for each contact type
───────────────────────────────────────────────────────────── */
const ICONS = {
  phone: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.01 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/>
    </svg>
  ),
  email: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
      <polyline points="22,6 12,13 2,6"/>
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  ),
  address: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
};

const TYPE_COLORS = {
  phone:     "#2D6A4F",
  email:     "#8B1A1A",
  whatsapp:  "#25D366",
  facebook:  "#1877F2",
  instagram: "#E1306C",
  address:   "#C4622D",
};

/* Is the value a URL? */
const isLink = (val) => /^https?:\/\//i.test(val.trim());

/* Build a clickable href for each type.
   Email → Gmail compose URL (opens in new tab directly in Gmail) */
const buildHref = (type, value) => {
  if (type === "phone")    return `tel:${value.replace(/\s/g, "")}`;
  if (type === "email")    return `https://mail.google.com/mail/?view=cm&to=${encodeURIComponent(value.trim())}`;
  if (type === "whatsapp") return `https://wa.me/${value.replace(/\D/g, "")}`;
  if (isLink(value))       return value;
  return null;
};

/* ─────────────────────────────────────────────────────────────
   ContactItem row
───────────────────────────────────────────────────────────── */
const ContactRow = ({ item }) => {
  const href  = buildHref(item.type, item.value);
  const color = TYPE_COLORS[item.type] || "#8B1A1A";

  return (
    <div className="cu-row">
      <span className="cu-row__icon" style={{ color }}>
        {ICONS[item.type]}
      </span>
      <div className="cu-row__body">
        {item.tag && <span className="cu-row__tag">{item.tag}</span>}
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="cu-row__link">
            {item.value}
          </a>
        ) : (
          <span className="cu-row__value">{item.value}</span>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Map embed (OpenStreetMap — no API key needed)
───────────────────────────────────────────────────────────── */
const MapEmbed = ({ lat, lng, label }) => {
  const googleUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  const osmSrc    = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="cu-map-wrap">
      <iframe
        title={label || "Office Location"}
        src={osmSrc}
        className="cu-map-iframe"
        loading="lazy"
        allowFullScreen
      />
      <a
        href={googleUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="cu-map-btn"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
          <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
          <polyline points="15 3 21 3 21 9"/>
          <line x1="10" y1="14" x2="21" y2="3"/>
        </svg>
        View on Google Maps
      </a>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Contact Page
───────────────────────────────────────────────────────────── */
const Contact = () => {
  const [items,    setItems]    = useState([]);
  const [settings, setSettings] = useState({ lat: 26.8065, lng: 87.2846, locationLabel: "Our Office" });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const fetchContact = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await api.getContact();
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setItems(data.items);
      setSettings(data.settings);
    } catch {
      setError("Could not load contact information.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContact(); }, [fetchContact]);

  // Real-time: refetch when admin changes contact info
  useSSE("contact", fetchContact);

  return (
    <div className="cu-page">
      {/* Hero */}
      <div className="cu-hero">
        <span className="cu-hero__eyebrow">Get in Touch</span>
        <h1 className="cu-hero__title">Contact Us</h1>
        <div className="cu-hero__line" />
        <p className="cu-hero__sub">
          We'd love to hear from you. Reach out through any of the channels below.
        </p>
      </div>

      {loading ? (
        <div className="cu-loading"><div className="cu-spinner" /><p>Loading…</p></div>
      ) : error ? (
        <div className="cu-error">⚠ {error}</div>
      ) : (
        <div className="cu-body">
          {/* ── Left: contact items ── */}
          <div className="cu-left">
            <h2 className="cu-left__heading">Reach Us</h2>
            {items.length === 0 ? (
              <p className="cu-left__empty">No contact details available yet.</p>
            ) : (
              <div className="cu-list">
                {items.map((item) => (
                  <ContactRow key={item._id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* ── Right: map ── */}
          <div className="cu-right">
            <h2 className="cu-right__heading">
              {settings.locationLabel || "Our Office"}
            </h2>
            <MapEmbed
              lat={settings.lat}
              lng={settings.lng}
              label={settings.locationLabel}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Contact;
