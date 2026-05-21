import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import "./css/AdminClasses.css";

/* ── Helpers ────────────────────────────────────────────────── */
const toInputDate = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");
const fmt = (d) =>
  new Date(d).toLocaleDateString("en-NP", { year: "numeric", month: "short", day: "numeric" });

const emptyForm = {
  title: "", description: "", startDate: "", formDeadline: "", googleFormLink: "",
};

/* ── Class Form Modal ───────────────────────────────────────── */
const ClassFormModal = ({ editing, onClose, onSave }) => {
  const [form, setForm] = useState(
    editing ? {
      title:          editing.title,
      description:    editing.description,
      startDate:      toInputDate(editing.startDate),
      formDeadline:   toInputDate(editing.formDeadline),
      googleFormLink: editing.googleFormLink || "",
    } : emptyForm
  );
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // totalSeats defaults to a large number since we no longer track seats
      const payload = { ...form, totalSeats: editing?.totalSeats || 9999 };
      const res  = editing
        ? await api.adminUpdateClass(editing._id, payload)
        : await api.adminCreateClass(payload);
      const data = await res.json();
      if (!res.ok) setError(data.message || "Save failed.");
      else onSave();
    } catch { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="class-form-modal" onClick={(e) => e.stopPropagation()}>
        <button className="class-form-modal__close" onClick={onClose}>✕</button>
        <h2 className="class-form-modal__title">{editing ? "Edit Class" : "Create New Class"}</h2>
        {error && <div className="class-form-modal__error">⚠ {error}</div>}

        <form className="class-form" onSubmit={handleSubmit}>
          <div className="cf-group">
            <label>Class Title</label>
            <input name="title" type="text" placeholder="e.g. Classical Music Workshop"
              value={form.title} onChange={handleChange} required />
          </div>
          <div className="cf-group">
            <label>Description</label>
            <textarea name="description" rows={3} placeholder="Describe the class…"
              value={form.description} onChange={handleChange} required />
          </div>
          <div className="cf-row">
            <div className="cf-group">
              <label>Class Start Date</label>
              <input name="startDate" type="date" value={form.startDate} onChange={handleChange} required />
            </div>
            <div className="cf-group">
              <label>Application Deadline</label>
              <input name="formDeadline" type="date" value={form.formDeadline} onChange={handleChange} required />
            </div>
          </div>
          <div className="cf-group">
            <label>Google Form Link <span className="cf-optional">(Application URL)</span></label>
            <input name="googleFormLink" type="url"
              placeholder="https://docs.google.com/forms/..."
              value={form.googleFormLink} onChange={handleChange} />
            <small className="cf-hint">Users will be redirected here when they click "Apply Now"</small>
          </div>
          <button type="submit" className="cf-submit" disabled={loading}>
            {loading ? "Saving…" : editing ? "Update Class" : "Create Class"}
          </button>
        </form>
      </div>
    </div>
  );
};

/* ── Main AdminClasses ──────────────────────────────────────── */
const AdminClasses = () => {
  const [classes,    setClasses]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [deleting,   setDeleting]   = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetClasses();
      if (!res.ok) throw new Error("Failed to load classes.");
      setClasses(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadClasses(); }, []);

  const handleDelete = async (id) => {
    try {
      const res = await api.adminDeleteClass(id);
      if (!res.ok) throw new Error("Delete failed.");
      setDeleting(null); loadClasses();
    } catch (err) { alert(err.message); }
  };

  const handleToggleClose = async (cls) => {
    setTogglingId(cls._id);
    try {
      const res = await api.adminUpdateClass(cls._id, { isClosed: !cls.isClosed });
      if (!res.ok) throw new Error("Toggle failed.");
      loadClasses();
    } catch (err) { alert(err.message); }
    finally { setTogglingId(null); }
  };

  const handleSave = () => { setShowForm(false); setEditing(null); loadClasses(); };

  return (
    <div className="admin-classes">
      <div className="admin-classes__header">
        <div>
          <h1 className="admin-classes__title">Classes</h1>
          <p className="admin-classes__sub">Manage cultural class listings.</p>
        </div>
        <button className="admin-classes__create-btn"
          onClick={() => { setEditing(null); setShowForm(true); }}>
          + New Class
        </button>
      </div>

      {error && <div className="admin-classes__error">⚠ {error}</div>}

      {loading ? (
        <div className="admin-classes__loading"><div className="ac-spinner" /><p>Loading…</p></div>
      ) : classes.length === 0 ? (
        <div className="admin-classes__empty"><p>No classes yet. Create your first class above.</p></div>
      ) : (
        <div className="ac-table-wrap">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Start Date</th>
                <th>Deadline</th>
                <th>Google Form</th>
                <th>Status</th>
                <th>Close Class</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => {
                const deadlinePast = new Date(cls.formDeadline) < new Date();
                const started      = new Date(cls.startDate)    < new Date();
                const isClosed     = cls.isClosed;

                let statusKey = "active";
                if (isClosed)     statusKey = "closed";
                else if (started) statusKey = "ended";
                else if (deadlinePast) statusKey = "closed";

                const statusLabel = {
                  active: "Active",
                  closed: isClosed ? "Closed by Admin" : "Deadline Over",
                  ended:  "Started",
                }[statusKey];

                return (
                  <tr key={cls._id}>
                    <td className="ac-table__name">{cls.title}</td>
                    <td>{fmt(cls.startDate)}</td>
                    <td className={deadlinePast ? "ac-table__warn" : ""}>{fmt(cls.formDeadline)}</td>
                    <td>
                      {cls.googleFormLink
                        ? <a href={cls.googleFormLink} target="_blank" rel="noopener noreferrer"
                            className="ac-form-link">View Form ↗</a>
                        : <span className="ac-no-link">—</span>}
                    </td>
                    <td>
                      <span className={`ac-status ac-status--${statusKey}`}>{statusLabel}</span>
                    </td>
                    <td>
                      <label className="ac-toggle"
                        title={isClosed ? "Click to reopen" : "Click to close class"}>
                        <input type="checkbox" checked={isClosed}
                          disabled={togglingId === cls._id}
                          onChange={() => handleToggleClose(cls)}
                          className="ac-toggle__input" />
                        <span className="ac-toggle__slider" />
                        <span className="ac-toggle__label">{isClosed ? "Closed" : "Open"}</span>
                      </label>
                    </td>
                    <td>
                      <div className="ac-actions">
                        <button className="ac-btn ac-btn--edit"
                          onClick={() => { setEditing(cls); setShowForm(true); }}>Edit</button>
                        <button className="ac-btn ac-btn--delete"
                          onClick={() => setDeleting(cls)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <ClassFormModal editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave} />
      )}

      {deleting && (
        <div className="drawer-backdrop" onClick={() => setDeleting(null)}>
          <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Class?</h3>
            <p>Are you sure you want to delete <strong>{deleting.title}</strong>? This cannot be undone.</p>
            <div className="delete-confirm__actions">
              <button className="dc-btn dc-btn--cancel" onClick={() => setDeleting(null)}>Cancel</button>
              <button className="dc-btn dc-btn--confirm" onClick={() => handleDelete(deleting._id)}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminClasses;
