import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import logo from "../../assets/PasaKhala Logo.jpg";
import groupImage from "../../assets/group_image.png";
import "./css/Header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "About Us", path: "/about" },
    { label: "Member", path: "/member" },
    { label: "Upcoming Event", path: "/upcoming-event" },
    { label: "Class Detail", path: "/class-detail" },
    { label: "Contact Us", path: "/contact" },
    { label: "Notice", path: "/notice" },
    { label: "Album", path: "/album" },
  ];

  return (
    <header className="header">
      {/* Top Brand Bar */}
      <div className="header__brand">
        <div className="header__logo-wrap">
          <img src={logo} alt="PasaKhala Logo" className="header__logo" />
        </div>
        <div className="header__identity">
          <h1 className="header__orgname">पासा खल:</h1>
          <p className="header__slogan">हाम्रो संस्कृति, हाम्रो परिचय</p>
        </div>
        <div className="header__deco" aria-hidden="true">
          <img src={groupImage} alt="Group" className="header__group-image" />
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="navbar">
        <button
          className={`navbar__hamburger ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle navigation"
        >
          <span />
          <span />
          <span />
        </button>
        <ul className={`navbar__list ${menuOpen ? "navbar__list--open" : ""}`}>
          {navLinks.map((link) => (
            <li key={link.path} className="navbar__item">
              <NavLink
                to={link.path}
                className={({ isActive }) =>
                  `navbar__link ${isActive ? "navbar__link--active" : ""}`
                }
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header;
