import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../../utils/api";
import "./css/AdminLogin.css";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    secretKey: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password || !form.secretKey) {
      setError("All fields are required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.adminLogin({
        email: form.email,
        password: form.password,
        secretKey: form.secretKey,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Login failed. Please check your credentials.");
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "admin");
        localStorage.setItem("adminName", data.admin.name);
        navigate("/admin/dashboard");
      }
    } catch {
      setError("Cannot connect to server. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      {/* Brand strip — mirrors user hero heading */}
      <div className="admin-login__brand">
        <h1 className="admin-login__brand-title">पासा खल:</h1>
        <p className="admin-login__brand-sub">हाम्रो संस्कृति, हाम्रो परिचय</p>
        <div className="admin-login__divider" />
      </div>

      <div className="admin-login__card">
        <div className="admin-login__badge">🔑 Admin Portal</div>
        <h1 className="admin-login__title">Admin Login</h1>
        <p className="admin-login__sub">
          Sign in to manage the PasaKhala website content.
        </p>

        {error && (
          <div className="admin-login__alert">
            ⚠ {error}
          </div>
        )}

        <form className="admin-login__form" onSubmit={handleSubmit} noValidate>

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
            <label htmlFor="password">Password</label>
            <div className="input-wrap">
              <input
                id="password" name="password"
                type={showPass ? "text" : "password"}
                placeholder="Your password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
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
            <label htmlFor="secretKey">Admin Secret Key</label>
            <input
              id="secretKey" name="secretKey"
              type="password"
              placeholder="Organization-issued secret key"
              value={form.secretKey}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="admin-login__submit"
            disabled={loading}
          >
            {loading ? "Signing in…" : "Login as Admin"}
          </button>
        </form>

        <div className="admin-login__footer-links">
          <span>Don't have an account?</span>
          <Link to="/admin-signup" className="admin-login__link">
            Register here →
          </Link>
        </div>

        <button className="admin-login__back" onClick={() => navigate("/")}>
          ← Back to Home
        </button>
      </div>
    </div>
  );
};

export default AdminLogin;
