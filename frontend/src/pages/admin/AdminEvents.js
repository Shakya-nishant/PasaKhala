import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../../utils/api";
import "./css/AdminEvents.css";

/* ─────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────── */
const toBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const toDatetimeLocal = (d) => {
  if (!d) return "";
  const dt  = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
};

const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-NP", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

const isPast = (d) => new Date(d) <= new Date();

const BLANK_FORM = { title: "", description: "", location: "", eventDate: "", image: "" };

/* ─────────────────────────────────────────────────────────────
   AdminEvents
───────────────────────────────────────────────────────────── */
const AdminEvents = () => {
  const [events,      setEvents]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");

  const [modalOpen,   setModalOpen]   = useState(false);
  const [editTarget,  setEditTarget]  = useState(null);
  const [form,        setForm]        = useState(BLANK_FORM);
  const [imgPreview,  setImgPreview]  = useState("");
  const [formError,   setFormError]   = useState("");
  const [saving,      setSaving]      = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  const fileRef = useRef();

  /* ── fetch ── */
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await api.adminGetEvents();
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setEvents(data);
    } catch {
      setError("Could not load events.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  /* ── modal helpers ── */
  const openCreate = () => {
    setEditTarget(null);
    setForm(BLANK_FORM);
    setImgPreview("");
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (ev) => {
    setEditTarget(ev);
    setForm({
      title:       ev.title,
      description: ev.description,
      location:    ev.location,
      eventDate:   toDatetimeLocal(ev.eventDate),
      image:       ev.image || "",
    });
    setImgPreview(ev.image || "");
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setFormError(""); };

  /* ── image upload ── */
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setFormError("Image must be under 5 MB."); return; }
    const b64 = await toBase64(file);
    setImgPreview(b64);
    setForm((f) => ({ ...f, image: b64 }));
  };

  /* ── save ── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim())       { setFormError("Title is required.");       return; }
    if (!form.description.trim()) { setFormError("Description is required."); return; }
    if (!form.location.trim())    { setFormError("Location is required.");    return; }
    if (!form.eventDate)          { setFormError("Event date is required.");  return; }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim(),
        location:    form.location.trim(),
        eventDate:   new Date(form.eventDate).toISOString(),
        image:       form.image,
      };
      const res  = editTarget
        ? await api.updateEvent(editTarget._id, payload)
        : await api.createEvent(payload);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchEvents();
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
      const res  = await api.deleteEvent(deleteTarget._id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchEvents();
    } catch (e) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  /* ── render ── */
  return (
    <div className="ae">

      {/* ── Top bar ── */}
      <div className="ae__bar">
        <p className="ae__bar-sub">
          Events are sorted by date — soonest first. Each event is automatically
          deleted after its date and time passes.
        </p>
        <button className="ae__add-btn" onClick={openCreate}>+ New Event</button>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="ae__loading"><div className="ae__spinner" /><p>Loading…</p></div>
      ) : error ? (
        <div className="ae__error">⚠ {error}</div>
      ) : events.length === 0 ? (
        <div className="ae__empty">
          <span>📅</span>
          <p>No events yet. Create the first one above.</p>
        </div>
      ) : (
        <div className="ae__list">
          {events.map((ev) => {
            const past = isPast(ev.eventDate);
            return (
              <div key={ev._id} className={`ae__card ${past ? "ae__card--past" : ""}`}>

                {/* Image thumbnail */}
                {ev.image ? (
                  <div className="ae__card-img">
                    <img src={ev.image} alt={ev.title} />
                  </div>
                ) : (
                  <div className="ae__card-img ae__card-img--empty">
                    <span>🖼</span>
                  </div>
                )}

                {/* Info */}
                <div className="ae__card-body">
                  <div className="ae__card-top">
                    <h3 className="ae__card-title">{ev.title}</h3>
                    <span className={`ae__status ${past ? "ae__status--past" : "ae__status--upcoming"}`}>
                      {past ? "Past" : "Upcoming"}
                    </span>
                  </div>
                  <p className="ae__card-desc">{ev.description}</p>
                  <div className="ae__card-meta">
                    <span className="ae__meta-item">
                      <span className="ae__meta-icon">📍</span>{ev.location}
                    </span>
                    <span className="ae__meta-item">
                      <span className="ae__meta-icon">🗓</span>
                      <span className={past ? "ae__meta-past" : ""}>{fmtDateTime(ev.eventDate)}</span>
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="ae__card-actions">
                  <button className="ae__btn ae__btn--edit"   onClick={() => openEdit(ev)}>✏ Edit</button>
                  <button className="ae__btn ae__btn--delete" onClick={() => setDeleteTarget(ev)}>🗑 Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ CREATE / EDIT MODAL ══ */}
      {modalOpen && (
        <div className="ae-backdrop" onClick={closeModal}>
          <div className="ae-modal" onClick={(e) => e.stopPropagation()}>

            <button className="ae-modal__close" onClick={closeModal} aria-label="Close">✕</button>
            <h2 className="ae-modal__title">
              {editTarget ? "Edit Event" : "Create Event"}
            </h2>

            {formError && <div className="ae-modal__error">⚠ {formError}</div>}

            <form className="ae-modal__form" onSubmit={handleSave}>

              {/* Image upload — 4:3 preview */}
              <div className="ae-img-picker">
                <div
                  className="ae-img-preview"
                  onClick={() => fileRef.current.click()}
                  title="Click to upload image"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && fileRef.current.click()}
                >
                  {imgPreview ? (
                    <img src={imgPreview} alt="Preview" />
                  ) : (
                    <div className="ae-img-placeholder">
                      <span>🖼</span>
                      <small>Click to upload</small>
                      <small>4 : 3 ratio recommended</small>
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleImageChange}
                />
                {imgPreview && (
                  <button
                    type="button"
                    className="ae-img-remove"
                    onClick={() => { setImgPreview(""); setForm((f) => ({ ...f, image: "" })); }}
                  >
                    Remove image
                  </button>
                )}
              </div>

              {/* Title */}
              <div className="ae-field">
                <label htmlFor="ae-title">Title <span className="ae-req">*</span></label>
                <input
                  id="ae-title" type="text"
                  placeholder="e.g. Teej Celebration 2082"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              {/* Description */}
              <div className="ae-field">
                <label htmlFor="ae-desc">Description <span className="ae-req">*</span></label>
                <textarea
                  id="ae-desc" rows={4}
                  placeholder="Describe the event…"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              {/* Location */}
              <div className="ae-field">
                <label htmlFor="ae-loc">Location <span className="ae-req">*</span></label>
                <input
                  id="ae-loc" type="text"
                  placeholder="e.g. PasaKhala Hall, Dharan"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  required
                />
              </div>

              {/* Event date + time */}
              <div className="ae-field">
                <label htmlFor="ae-date">
                  Event Date &amp; Time <span className="ae-req">*</span>
                </label>
                <input
                  id="ae-date"
                  type="datetime-local"
                  value={form.eventDate}
                  onChange={(e) => setForm({ ...form, eventDate: e.target.value })}
                  required
                />
                <small>Event is automatically deleted after this date and time.</small>
              </div>

              <div className="ae-modal__actions">
                <button type="button" className="ae-action ae-action--cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="ae-action ae-action--save" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Update Event" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ══ */}
      {deleteTarget && (
        <div className="ae-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="ae-modal ae-modal--sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="ae-modal__title">Delete Event?</h2>
            <p className="ae-modal__body">
              Permanently delete <strong>{deleteTarget.title}</strong>? This cannot be undone.
            </p>
            <div className="ae-modal__actions">
              <button className="ae-action ae-action--cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="ae-action ae-action--delete" onClick={handleDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
