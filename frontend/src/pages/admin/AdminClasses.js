import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import "./css/AdminClasses.css";

/* ── Helpers ────────────────────────────────────────────────── */
const toInputDate = (d) => (d ? new Date(d).toISOString().split("T")[0] : "");
const fmt = (d) =>
  new Date(d).toLocaleDateString("en-NP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const emptyForm = {
  title: "",
  description: "",
  startDate: "",
  formDeadline: "",
  totalSeats: "",
};

/* ── Applications Drawer ────────────────────────────────────── */
const ApplicationsDrawer = ({ cls, onClose }) => {
  const [apps, setApps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  const [removing, setRemoving] = useState(null); // appId being confirmed
  const [removeErr, setRemoveErr] = useState("");

  const loadApps = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.adminGetApplications(cls._id);
      if (!res.ok) throw new Error("Failed to load applications.");
      const data = await res.json();
      setApps(data.applications);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadApps(); }, [cls._id]);

  const handleRemove = async (appId) => {
    setRemoveErr("");
    try {
      const res = await api.adminRemoveApplication(cls._id, appId);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Remove failed.");
      setRemoving(null);
      loadApps();
    } catch (err) {
      setRemoveErr(err.message);
    }
  };

  const handleDownload = () => {
    const downloadUrl = api.adminDownloadApplications(cls._id);
    fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${cls.title}_applications.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  const seatsUsed = apps.length;
  const seatsTotal = cls.totalSeats;
  const seatsLeft = seatsTotal - seatsUsed;

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="apps-drawer" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="apps-drawer__header">
          <div>
            <h2 className="apps-drawer__title">Applications — {cls.title}</h2>
            <div className="apps-drawer__seat-row">
              <span className="apps-drawer__seat-chip apps-drawer__seat-chip--used">
                {seatsUsed} Applied
              </span>
              <span className="apps-drawer__seat-chip apps-drawer__seat-chip--left">
                {seatsLeft} Remaining
              </span>
              <span className="apps-drawer__seat-chip apps-drawer__seat-chip--total">
                {seatsTotal} Total
              </span>
            </div>
          </div>
          <div className="apps-drawer__actions">
            <button className="apps-drawer__download-btn" onClick={handleDownload}>
              ⬇ Download CSV
            </button>
            <button className="apps-drawer__close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        {loading && <div className="apps-drawer__loading">Loading…</div>}
        {error   && <div className="apps-drawer__error">⚠ {error}</div>}

        {!loading && !error && apps.length === 0 && (
          <div className="apps-drawer__empty">No applications yet.</div>
        )}

        {!loading && apps.length > 0 && (
          <div className="apps-drawer__table-wrap">
            <table className="apps-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Address</th>
                  <th>Age</th>
                  <th>Parent Perm.</th>
                  <th>Applied</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {apps.map((a, i) => (
                  <tr key={a._id}>
                    <td>{i + 1}</td>
                    <td className="apps-table__name">{a.name}</td>
                    <td>{a.email}</td>
                    <td>{a.contact}</td>
                    <td>{a.address}</td>
                    <td>{a.age}</td>
                    <td>
                      {a.age < 18 ? (
                        <span className={`perm-badge perm-badge--${a.parentPermission ? "yes" : "no"}`}>
                          {a.parentPermission ? "Yes" : "No"}
                        </span>
                      ) : (
                        <span className="perm-badge perm-badge--na">N/A</span>
                      )}
                    </td>
                    <td>{fmt(a.createdAt)}</td>
                    <td>
                      <button
                        className="apps-table__remove-btn"
                        onClick={() => { setRemoving(a._id); setRemoveErr(""); }}
                        title="Remove applicant"
                      >
                        🗑 Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Inline remove confirm */}
        {removing && (
          <div className="apps-drawer__confirm-bar">
            <span>Remove this applicant? This cannot be undone.</span>
            {removeErr && <span className="apps-drawer__confirm-err">{removeErr}</span>}
            <div className="apps-drawer__confirm-btns">
              <button className="dc-btn dc-btn--cancel" onClick={() => setRemoving(null)}>Cancel</button>
              <button className="dc-btn dc-btn--confirm" onClick={() => handleRemove(removing)}>Yes, Remove</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Class Form Modal ───────────────────────────────────────── */
const ClassFormModal = ({ editing, onClose, onSave }) => {
  const [form, setForm] = useState(
    editing
      ? {
          title: editing.title,
          description: editing.description,
          startDate: toInputDate(editing.startDate),
          formDeadline: toInputDate(editing.formDeadline),
          totalSeats: editing.totalSeats,
        }
      : emptyForm
  );
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = editing
        ? await api.adminUpdateClass(editing._id, { ...form, totalSeats: parseInt(form.totalSeats) })
        : await api.adminCreateClass({ ...form, totalSeats: parseInt(form.totalSeats) });
      const data = await res.json();
      if (!res.ok) { setError(data.message || "Save failed."); }
      else { onSave(); }
    } catch {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="class-form-modal" onClick={(e) => e.stopPropagation()}>
        <button className="class-form-modal__close" onClick={onClose}>✕</button>
        <h2 className="class-form-modal__title">
          {editing ? "Edit Class" : "Create New Class"}
        </h2>

        {error && <div className="class-form-modal__error">⚠ {error}</div>}

        <form className="class-form" onSubmit={handleSubmit}>
          <div className="cf-group">
            <label>Class Title</label>
            <input name="title" type="text" placeholder="e.g. Classical Music Workshop"
              value={form.title} onChange={handleChange} required />
          </div>
          <div className="cf-group">
            <label>Description</label>
            <textarea name="description" rows={4} placeholder="Describe the class…"
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
          <div className="cf-group cf-group--sm">
            <label>Total Seats</label>
            <input name="totalSeats" type="number" min="1" placeholder="e.g. 20"
              value={form.totalSeats} onChange={handleChange} required />
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
  const [classes, setClasses]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState("");
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null);
  const [viewingApps, setViewingApps] = useState(null);
  const [deleting, setDeleting]     = useState(null);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const res = await api.adminGetClasses();
      if (!res.ok) throw new Error("Failed to load classes.");
      const data = await res.json();
      setClasses(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadClasses(); }, []);

  const handleDelete = async (id) => {
    try {
      const res = await api.adminDeleteClass(id);
      if (!res.ok) throw new Error("Delete failed.");
      setDeleting(null);
      loadClasses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = () => {
    setShowForm(false);
    setEditing(null);
    loadClasses();
  };

  return (
    <div className="admin-classes">
      <div className="admin-classes__header">
        <div>
          <h1 className="admin-classes__title">Classes</h1>
          <p className="admin-classes__sub">Manage cultural class listings and applications.</p>
        </div>
        <button
          className="admin-classes__create-btn"
          onClick={() => { setEditing(null); setShowForm(true); }}
        >
          + New Class
        </button>
      </div>

      {error && <div className="admin-classes__error">⚠ {error}</div>}

      {loading ? (
        <div className="admin-classes__loading">
          <div className="ac-spinner" />
          <p>Loading…</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="admin-classes__empty">
          <p>No classes yet. Create your first class above.</p>
        </div>
      ) : (
        <div className="ac-table-wrap">
          <table className="ac-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Start Date</th>
                <th>Deadline</th>
                <th>Seats (Used / Total)</th>
                <th>Available</th>
                <th>Status</th>
                <th>Applications</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => {
                const deadlinePast  = new Date(cls.formDeadline) < new Date();
                const started       = new Date(cls.startDate) < new Date();
                const used          = cls.applicationsCount ?? (cls.totalSeats - (cls.seatsAvailable ?? 0));
                const available     = cls.seatsAvailable ?? (cls.totalSeats - used);
                const seatsFull     = available <= 0;
                return (
                  <tr key={cls._id}>
                    <td className="ac-table__name">{cls.title}</td>
                    <td>{fmt(cls.startDate)}</td>
                    <td className={deadlinePast ? "ac-table__warn" : ""}>{fmt(cls.formDeadline)}</td>
                    <td>
                      <span className="ac-seats-used">{used}</span>
                      <span className="ac-seats-sep"> / </span>
                      <span className="ac-seats-total">{cls.totalSeats}</span>
                    </td>
                    <td>
                      <span className={`ac-seats-avail ${seatsFull ? "ac-seats-avail--full" : ""}`}>
                        {seatsFull ? "Full" : available}
                      </span>
                    </td>
                    <td>
                      <span className={`ac-status ${started ? "ac-status--ended" : deadlinePast || seatsFull ? "ac-status--closed" : "ac-status--active"}`}>
                        {started ? "Started" : deadlinePast ? "Deadline Over" : seatsFull ? "Seats Full" : "Active"}
                      </span>
                    </td>
                    <td>
                      <button className="ac-apps-btn" onClick={() => setViewingApps(cls)}>
                        View / Manage
                      </button>
                    </td>
                    <td>
                      <div className="ac-actions">
                        <button className="ac-btn ac-btn--edit"
                          onClick={() => { setEditing(cls); setShowForm(true); }}>
                          Edit
                        </button>
                        <button className="ac-btn ac-btn--delete" onClick={() => setDeleting(cls)}>
                          Delete
                        </button>
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
        <ClassFormModal
          editing={editing}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSave={handleSave}
        />
      )}

      {viewingApps && (
        <ApplicationsDrawer cls={viewingApps} onClose={() => setViewingApps(null)} />
      )}

      {deleting && (
        <div className="drawer-backdrop" onClick={() => setDeleting(null)}>
          <div className="delete-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Class?</h3>
            <p>
              Are you sure you want to delete <strong>{deleting.title}</strong>?
              All applications will also be deleted. This cannot be undone.
            </p>
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
