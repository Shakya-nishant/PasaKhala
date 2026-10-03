import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../utils/api";
import "./css/AdminSignup.css";

const AdminSignup = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    contact: "",
    password: "",
    confirmPassword: "",
    secretKey: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.adminSignup({
        name: form.name,
        email: form.email,
        contact: form.contact,
        password: form.password,
        secretKey: form.secretKey,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Signup failed. Please check your details.");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "admin");
        localStorage.setItem("adminName", data.admin.name);
        setSuccess("Account created! Redirecting to dashboard…");
        setTimeout(() => navigate("/admin/dashboard"), 1500);
      }
    } catch {
      setError("Cannot connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-signup">
      {/* Brand strip — mirrors user hero heading */}
      <div className="admin-signup__brand">
        <h1 className="admin-signup__brand-title">पासा खल:</h1>
        <p className="admin-signup__brand-sub">हाम्रो संस्कृति, हाम्रो परिचय</p>
        <div className="admin-signup__divider" />
      </div>

      <div className="admin-signup__card">
        <div className="admin-signup__badge">🔐 Admin Access</div>
        <h1 className="admin-signup__title">Create Admin Account</h1>
        <p className="admin-signup__sub">
          Restricted access. A valid secret key is required to register.
        </p>

        {error && (
          <div className="admin-signup__alert admin-signup__alert--error">
            ⚠ {error}
          </div>
        )}
        {success && (
          <div className="admin-signup__alert admin-signup__alert--success">
            ✓ {success}
          </div>
        )}

        <form className="admin-signup__form" onSubmit={handleSubmit} noValidate>

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              id="name" name="name" type="text"
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email" name="email" type="email"
              placeholder="admin@pasakhala.org"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact">Contact Number</label>
            <input
              id="contact" name="contact" type="tel"
              placeholder="98XXXXXXXX"
              value={form.contact}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <input
                id="password" name="password"
                type={showPass ? "text" : "password"}
                placeholder="Min. 8 characters"
                value={form.password}
                onChange={handleChange}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="toggle-pass"
                onClick={() => setShowPass(!showPass)}
                tabIndex={-1}
              >
                {showPass ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword" name="confirmPassword"
              type={showPass ? "text" : "password"}
              placeholder="Repeat your password"
              value={form.confirmPassword}
              onChange={handleChange}
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="secretKey">Admin Secret Key</label>
            <input
              id="secretKey" name="secretKey"
              type="password"
              placeholder="Organization-issued secret key"
              value={form.secretKey}
              onChange={handleChange}
              required
            />
            <small>Contact the organization to obtain your secret key.</small>
          </div>

          <button
            type="submit"
            className="admin-signup__submit"
            disabled={loading}
          >
            {loading ? "Creating account…" : "Register as Admin"}
          </button>
        </form>

        <div className="admin-signup__footer-links">
          <span>Already have an account?</span>
          <Link to="/admin/login" className="admin-signup__link">
            Log in here →
          </Link>
        </div>

        <button className="admin-signup__back" onClick={() => navigate("/")}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default AdminSignup;
