import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../utils/api";
import AdminClasses from "./AdminClasses";
import AdminMembers from "./AdminMembers";
import AdminContact from "./AdminContact";
import AdminNotices from "./AdminNotices";
import AdminEvents  from "./AdminEvents";
import AdminAbout   from "./AdminAbout";
import AdminAlbum   from "./AdminAlbum";
import logo from "../../assets/PasaKhala Logo.jpg";
import groupImage from "../../assets/group_image.png";
import "./css/AdminDashboard.css";

const AdminDashboard = ({ section: initialSection }) => {
  const navigate = useNavigate();
  const [admin,         setAdmin]         = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [activeSection, setActiveSection] = useState(initialSection || "overview");
  const [menuOpen,      setMenuOpen]      = useState(false);

  useEffect(() => {
    const verify = async () => {
      const token = localStorage.getItem("token");
      if (!token) { navigate("/admin/login"); return; }
      try {
        const res = await api.verifyToken();
        if (!res.ok) { localStorage.clear(); navigate("/admin/login"); }
        else { const data = await res.json(); setAdmin(data.admin); }
      } catch { navigate("/admin/login"); }
      finally   { setLoading(false); }
    };
    verify();
  }, [navigate]);

  const handleLogout = () => { localStorage.clear(); navigate("/"); };

  const navItems = [
    { key: "overview", label: "Overview" },
    { key: "classes",  label: "Classes"  },
    { key: "events",   label: "Events"   },
    { key: "notices",  label: "Notices"  },
    { key: "members",  label: "Members"  },
    { key: "about",    label: "About Us" },
    { key: "album",    label: "Album"    },
    { key: "contact",  label: "Contact"  },
  ];

  const activeLabel = navItems.find((n) => n.key === activeSection)?.label;

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading__spinner" />
        <p>Verifying access…</p>
      </div>
    );
  }

  return (
    <div className="dashboard">

      {/* ══ HEADER ══ */}
      <header className="dashboard__header">
        <div className="dashboard__brand">
          <div className="dashboard__logo-wrap">
            <img src={logo} alt="PasaKhala Logo" className="dashboard__logo-img" />
          </div>
          <div className="dashboard__identity">
            <h1 className="dashboard__orgname">पासा खल:</h1>
            <p className="dashboard__slogan">हाम्रो संस्कृति, हाम्रो परिचय</p>
          </div>
          <div className="dashboard__deco" aria-hidden="true">
            <img src={groupImage} alt="Group" className="dashboard__group-image" />
          </div>
        </div>

        <nav className="dashboard__navbar">
          <button
            className={`dashboard__hamburger ${menuOpen ? "open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle navigation"
          >
            <span /><span /><span />
          </button>

          <ul className={`dashboard__nav-list ${menuOpen ? "dashboard__nav-list--open" : ""}`}>
            {navItems.map((item) => (
              <li key={item.key} className="dashboard__nav-item">
                <button
                  className={`dashboard__nav-btn ${activeSection === item.key ? "dashboard__nav-btn--active" : ""}`}
                  onClick={() => { setActiveSection(item.key); setMenuOpen(false); }}
                >
                  {item.label}
                </button>
              </li>
            ))}
            <li className="dashboard__nav-item">
              <button className="dashboard__nav-btn dashboard__nav-btn--logout" onClick={handleLogout}>
                Logout
              </button>
            </li>
          </ul>
        </nav>
      </header>

      {/* ══ MAIN CONTENT ══ */}
      <main className="dashboard__main">

        <div className="dashboard__section-header">
          <span className="dashboard__section-eyebrow">Admin Panel</span>
          <h2 className="dashboard__heading">
            {activeSection === "overview" ? `Welcome back, ${admin?.name} 👋` : activeLabel}
          </h2>
          <div className="dashboard__heading-line" />
        </div>

        {/* ── Overview ── */}
        {activeSection === "overview" && (
          <>
            <div className="dashboard__cards">
              {[
                { icon: "📅", label: "Events",   color: "#8B1A1A", key: "events"  },
                { icon: "📢", label: "Notices",  color: "#C4622D", key: "notices" },
                { icon: "👥", label: "Members",  color: "#C9922A", key: "members" },
                { icon: "📚", label: "Classes",  color: "#2D6A4F", key: "classes" },
                { icon: "📖", label: "About Us", color: "#1877F2", key: "about"   },
                { icon: "🖼",  label: "Album",    color: "#7B3F00", key: "album"   },
                { icon: "📞", label: "Contact",  color: "#7A5010", key: "contact" },
              ].map((card) => (
                <div
                  key={card.label}
                  className="dashboard__card"
                  style={{ borderTopColor: card.color, cursor: "pointer" }}
                  onClick={() => setActiveSection(card.key)}
                >
                  <span className="dashboard__card-icon">{card.icon}</span>
                  <h3 className="dashboard__card-label">{card.label}</h3>
                  <p className="dashboard__card-action" style={{ color: card.color }}>
                    Manage →
                  </p>
                </div>
              ))}
            </div>

            <div className="dashboard__info">
              <h2>Admin Details</h2>
              <table className="dashboard__table">
                <tbody>
                  <tr><td>Name</td>   <td>{admin?.name}</td></tr>
                  <tr><td>Email</td>  <td>{admin?.email}</td></tr>
                  <tr><td>Contact</td><td>{admin?.contact}</td></tr>
                  <tr><td>Role</td>   <td>{admin?.role}</td></tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeSection === "classes" && <AdminClasses />}
        {activeSection === "members" && <AdminMembers />}
        {activeSection === "contact" && <AdminContact />}
        {activeSection === "notices" && <AdminNotices />}
        {activeSection === "events"  && <AdminEvents  />}
        {activeSection === "about"   && <AdminAbout   />}
        {activeSection === "album"   && <AdminAlbum   />}

      </main>
    </div>
  );
};

export default AdminDashboard;
