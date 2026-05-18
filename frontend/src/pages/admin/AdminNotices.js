import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import "./css/AdminNotices.css";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-NP", {
    year: "numeric", month: "short", day: "numeric",
  });

const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-NP", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

// Convert a Date to the value format required by <input type="datetime-local">
const toDatetimeLocal = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  // Pad to YYYY-MM-DDTHH:MM
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const isExpired = (d) => new Date(d) <= new Date();

const BLANK_FORM = {
  notice:     "",
  postedDate: toDatetimeLocal(new Date()),
  expiresAt:  "",
};

/* ─────────────────────────────────────────────────────────────
   AdminNotices
───────────────────────────────────────────────────────────── */
const AdminNotices = () => {
  const [notices,     setNotices]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [form,        setForm]        = useState(BLANK_FORM);
  const [formError,   setFormError]   = useState("");
  const [saving,      setSaving]      = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── fetch all notices (including expired — admin sees everything) ── */
  const fetchNotices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await api.adminGetNotices();
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setNotices(data);
    } catch {
      setError("Could not load notices.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNotices(); }, [fetchNotices]);

  /* ── modal helpers ── */
  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...BLANK_FORM, postedDate: toDatetimeLocal(new Date()) });
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (n) => {
    setEditTarget(n);
    setForm({
      notice:     n.notice,
      postedDate: toDatetimeLocal(n.postedDate),
      expiresAt:  toDatetimeLocal(n.expiresAt),
    });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setFormError(""); };

  /* ── save ── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.notice.trim()) { setFormError("Notice text is required."); return; }
    if (!form.expiresAt)     { setFormError("Expiry date and time is required."); return; }

    const expiry = new Date(form.expiresAt);
    if (!editTarget && expiry <= new Date()) {
      setFormError("Expiry date must be in the future.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        notice:     form.notice.trim(),
        postedDate: form.postedDate ? new Date(form.postedDate).toISOString() : new Date().toISOString(),
        expiresAt:  expiry.toISOString(),
      };
      const res  = editTarget
        ? await api.updateNotice(editTarget._id, payload)
        : await api.createNotice(payload);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchNotices();
      closeModal();
    } catch (e) {
      setFormError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res  = await api.deleteNotice(deleteTarget._id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchNotices();
    } catch (e) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  /* ── render ── */
  return (
    <div className="an">

      {/* ── Header bar ── */}
      <div className="an__bar">
        <div>
          <p className="an__bar-sub">
            Notices expire and are automatically removed on their set date and time.
            Newest notices appear first on the public board.
          </p>
        </div>
        <button className="an__add-btn" onClick={openCreate}>+ New Notice</button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="an__loading"><div className="an__spinner" /><p>Loading…</p></div>
      ) : error ? (
        <div className="an__error">⚠ {error}</div>
      ) : notices.length === 0 ? (
        <div className="an__empty">
          <span>📢</span>
          <p>No notices yet. Create the first one above.</p>
        </div>
      ) : (
        <div className="an__list">
          {notices.map((n) => {
            const expired = isExpired(n.expiresAt);
            return (
              <div key={n._id} className={`an__card ${expired ? "an__card--expired" : ""}`}>
                {/* Status badge */}
                <span className={`an__status ${expired ? "an__status--expired" : "an__status--active"}`}>
                  {expired ? "Expired" : "Active"}
                </span>

                {/* Notice text */}
                <p className="an__text">{n.notice}</p>

                {/* Dates */}
                <div className="an__dates">
                  <span className="an__date-item">
                    <span className="an__date-label">Posted</span>
                    <span className="an__date-val">{fmtDate(n.postedDate)}</span>
                  </span>
                  <span className="an__date-sep">·</span>
                  <span className="an__date-item">
                    <span className="an__date-label">Expires</span>
                    <span className={`an__date-val ${expired ? "an__date-val--expired" : ""}`}>
                      {fmtDateTime(n.expiresAt)}
                    </span>
                  </span>
                </div>

                {/* Actions */}
                <div className="an__actions">
                  <button className="an__btn an__btn--edit"   onClick={() => openEdit(n)}>✏ Edit</button>
                  <button className="an__btn an__btn--delete" onClick={() => setDeleteTarget(n)}>🗑 Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ CREATE / EDIT MODAL ══ */}
      {modalOpen && (
        <div className="an-backdrop" onClick={closeModal}>
          <div className="an-modal" onClick={(e) => e.stopPropagation()}>

            <button className="an-modal__close" onClick={closeModal} aria-label="Close">✕</button>
            <h2 className="an-modal__title">
              {editTarget ? "Edit Notice" : "Create Notice"}
            </h2>

            {formError && <div className="an-modal__error">⚠ {formError}</div>}

            <form className="an-modal__form" onSubmit={handleSave}>

              {/* Notice text */}
              <div className="an-field">
                <label htmlFor="an-notice">Notice</label>
                <textarea
                  id="an-notice"
                  rows={5}
                  placeholder="Write the notice here…"
                  value={form.notice}
                  onChange={(e) => setForm({ ...form, notice: e.target.value })}
                  required
                />
                <small>{form.notice.length} characters</small>
              </div>

              {/* Posted date */}
              <div className="an-field">
                <label htmlFor="an-posted">Posted Date</label>
                <input
                  id="an-posted"
                  type="datetime-local"
                  value={form.postedDate}
                  onChange={(e) => setForm({ ...form, postedDate: e.target.value })}
                />
                <small>Defaults to today. You can backdate if needed.</small>
              </div>

              {/* Expiry date + time */}
              <div className="an-field">
                <label htmlFor="an-expires">
                  Expiry Date &amp; Time <span className="an-field__req">*</span>
                </label>
                <input
                  id="an-expires"
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  required
                />
                <small>Notice will be automatically deleted at this date and time.</small>
              </div>

              <div className="an-modal__actions">
                <button type="button" className="an-action an-action--cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="an-action an-action--save" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Update Notice" : "Create Notice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ══ */}
      {deleteTarget && (
        <div className="an-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="an-modal an-modal--sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="an-modal__title">Delete Notice?</h2>
            <p className="an-modal__body">
              This notice will be permanently removed and cannot be recovered.
            </p>
            <div className="an-modal__actions">
              <button className="an-action an-action--cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="an-action an-action--delete" onClick={handleDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotices;
