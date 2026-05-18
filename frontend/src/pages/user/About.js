import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
// Import Quill's output CSS so bold/italic/headings/lists render correctly
import "react-quill-new/dist/quill.snow.css";
import "./css/About.css";

/* ─────────────────────────────────────────────────────────────
   About Us — user-facing, read-only rich-text display
   Renders the HTML saved by the Quill editor exactly as written.
───────────────────────────────────────────────────────────── */
const About = () => {
  const [sections, setSections] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  const fetchAbout = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await api.getAbout();
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSections(data);
    } catch {
      setError("Could not load content. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAbout(); }, [fetchAbout]);

  return (
    <div className="au-page">

      {/* Hero */}
      <div className="au-hero">
        <span className="au-hero__eyebrow">Who We Are</span>
        <h1 className="au-hero__title">About Us</h1>
        <div className="au-hero__line" />
        <p className="au-hero__sub">
          Learn about our mission, history, and the community that drives us forward.
        </p>
      </div>

      {/* Content */}
      <div className="au-body">
        {loading ? (
          <div className="au-loading">
            <div className="au-spinner" />
            <p>Loading…</p>
          </div>
        ) : error ? (
          <div className="au-error">⚠ {error}</div>
        ) : sections.length === 0 ? (
          <div className="au-empty">
            <span>📖</span>
            <p>Content coming soon.</p>
          </div>
        ) : (
          <div className="au-sections">
            {sections.map((s) => (
              <section key={s._id} className="au-section">
                {s.title && (
                  <h2 className="au-section__heading">{s.title}</h2>
                )}
                {/*
                  "ql-editor" class applies Quill's built-in typography:
                  headings, bold, italic, underline, lists, links, blockquotes.
                  Our About.css then overrides colours to match the site theme.
                */}
                <div
                  className="au-section__content ql-editor"
                  dangerouslySetInnerHTML={{ __html: s.content }}
                />
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default About;
