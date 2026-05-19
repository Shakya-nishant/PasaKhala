import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css/Footer.css";

const Footer = () => {
  const navigate = useNavigate();
  const [lastClick, setLastClick] = useState(0);

  // Detect double-click on "PASA KHALA" text to go to admin signup
  const handlePasaKhalaClick = () => {
    const now = Date.now();
    if (now - lastClick < 400) {
      navigate("/admin-signup");
    }
    setLastClick(now);
  };

  return (
    <footer className="footer">
      <div className="footer__topbar" aria-hidden="true" />

      <div className="footer__inner">

        {/* Cultural ornament */}
        <div className="footer__ornament-row" aria-hidden="true">
          <span className="footer__ornament-line" />
          <span className="footer__ornament-symbol">॥</span>
          <span className="footer__ornament-line" />
        </div>

        {/* Thank you */}
        <div className="footer__thankyou">
          <p className="footer__thankyou-text">
            हाम्रो वेबसाइटमा आउनु भएकोमा धन्यवाद।
          </p>
          <p className="footer__thankyou-sub">
            Thank you for visiting us — your connection to our culture matters deeply.
          </p>
        </div>

        {/* Cultural values */}
        <div className="footer__values" aria-label="Our values">
          <span className="footer__value-item">🪔 संस्कृति</span>
          <span className="footer__value-dot" aria-hidden="true" />
          <span className="footer__value-item">🎭 परम्परा</span>
          <span className="footer__value-dot" aria-hidden="true" />
          <span className="footer__value-item">🤝 समुदाय</span>
          <span className="footer__value-dot" aria-hidden="true" />
          <span className="footer__value-item">🌸 एकता</span>
        </div>

        <div className="footer__divider" aria-hidden="true" />

        {/* Hidden admin entry — double-click to access */}
        <div className="footer__brand-row">
          <span
            className="footer__brand-text"
            onDoubleClick={handlePasaKhalaClick}
            onClick={handlePasaKhalaClick}
            title="© PasaKhala"
          >
            PASA KHALA
          </span>
          <span className="footer__copy">
            &copy; {new Date().getFullYear()} · Pasa Khala Dharan · All rights reserved
          </span>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
