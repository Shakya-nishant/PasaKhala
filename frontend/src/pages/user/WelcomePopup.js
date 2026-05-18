import React, { useState, useEffect } from "react";
import "./css/WelcomePopup.css";
import jojolapaImg from "../../assets/jojolapa.png";

const WelcomePopup = () => {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    // Show popup only once per session
    const seen = sessionStorage.getItem("pk_welcome_seen");
    if (!seen) {
      const t = setTimeout(() => setVisible(true), 400);
      return () => clearTimeout(t);
    }
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setVisible(false);
      sessionStorage.setItem("pk_welcome_seen", "true");
    }, 500);
  };

  if (!visible) return null;

  return (
    <div
      className={`wpopup-backdrop ${closing ? "wpopup-backdrop--out" : ""}`}
      onClick={handleClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className={`wpopup ${closing ? "wpopup--out" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="wpopup__corner wpopup__corner--tl" aria-hidden="true" />
        <span className="wpopup__corner wpopup__corner--tr" aria-hidden="true" />
        <span className="wpopup__corner wpopup__corner--bl" aria-hidden="true" />
        <span className="wpopup__corner wpopup__corner--br" aria-hidden="true" />

        <p className="wpopup__nepali">ज्वजलपा / नमस्ते</p>

        <div className="wpopup__img-wrap" aria-hidden="true">
          <img
            src={jojolapaImg}
            alt="Jojolapa — traditional Newari welcome gesture"
            className="wpopup__img"
          />
        </div>

        <h2 className="wpopup__title">Welcome to Pasa Khala</h2>
        <p className="wpopup__sub">
          We are happy to have you here.
        </p>
        <p className="wpopup__desc">
          Explore and enjoy our community — a home for Nepali culture,
          traditions, and togetherness.
        </p>

        <div className="wpopup__divider" aria-hidden="true" />

        <button className="wpopup__btn" onClick={handleClose}>
          Enter &amp; Explore →
        </button>
      </div>
    </div>
  );
};

export default WelcomePopup;
