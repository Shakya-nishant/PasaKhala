import React, { useState, useEffect, useRef, useCallback } from "react";
import api from "../../utils/api";
import "./css/AdminMembers.css";

/* ─────────────────────────────────────────────────────────────
   Image compression helper
   - Target: ≤ 200 KB output
   - Max dimension: 1200 px on the longest side (portrait photos)
   - Iteratively lowers JPEG quality until the target is met
   - PNG / transparent images converted to JPEG (white bg)
───────────────────────────────────────────────────────────── */
const MAX_DIMENSION = 1200;
const TARGET_BYTES  = 200 * 1024;
const QUALITY_START = 0.85;
const QUALITY_MIN   = 0.30;
const QUALITY_STEP  = 0.08;

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload  = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload  = () => {
        let { width, height } = img;
        if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
          if (width >= height) {
            height = Math.round((height / width) * MAX_DIMENSION);
            width  = MAX_DIMENSION;
          } else {
            width  = Math.round((width / height) * MAX_DIMENSION);
            height = MAX_DIMENSION;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const byteSize = (b64) =>
          Math.round((b64.length - b64.indexOf(",") - 1) * 0.75);

        let quality = QUALITY_START;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);
        while (byteSize(dataUrl) > TARGET_BYTES && quality > QUALITY_MIN) {
          quality = Math.max(QUALITY_MIN, quality - QUALITY_STEP);
          dataUrl = canvas.toDataURL("image/jpeg", quality);
        }
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

// "column" is the DB field name — in the UI we call it "Row"
const BLANK_FORM = { name: "", title: "", image: "", column: 1 };

/* ─────────────────────────────────────────────────────────────
   MemberCard — card-in-card, 3:4 photo, admin controls
───────────────────────────────────────────────────────────── */
const MemberCard = ({ member, onEdit, onDelete }) => (
  <div className="amc-wrap">
    <div className="amc-frame">
      <div className="amc-inner">
        <div className="amc-photo-wrap">
          {member.image ? (
            <img src={member.image} alt={member.name} className="amc-photo" />
          ) : (
            <div className="amc-photo-placeholder"><span>👤</span></div>
          )}
        </div>
        <div className="amc-info">
          <h3 className="amc-name">{member.name}</h3>
          <p  className="amc-role">{member.title}</p>
          <span className="amc-row-badge">Row {member.column}</span>
        </div>
      </div>
    </div>
    <div className="amc-controls">
      <button className="amc-btn amc-btn--edit"   onClick={onEdit}>✏ Edit</button>
      <button className="amc-btn amc-btn--delete" onClick={onDelete}>🗑 Delete</button>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   AdminMembers
───────────────────────────────────────────────────────────── */
const AdminMembers = () => {
  const [members,    setMembers]    = useState([]);
  const [totalRows,  setTotalRows]  = useState(3);   // "totalColumns" in DB = total rows in UI
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  const [rowInput,   setRowInput]   = useState(3);
  const [rowSaving,  setRowSaving]  = useState(false);
  const [rowMsg,     setRowMsg]     = useState("");

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState(BLANK_FORM);
  const [imgPreview,   setImgPreview]   = useState("");
  const [formError,    setFormError]    = useState("");
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fileRef = useRef();

  /* ── fetch ── */
  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await api.getMembers();
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMembers(data.members);
      setTotalRows(data.totalColumns);   // DB calls it totalColumns
      setRowInput(data.totalColumns);
    } catch {
      setError("Could not load members. Is the server running?");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  /*
    Group members by their row number (stored as "column" in DB).
    grouped = { 1: [...], 2: [...], 3: [...] }
  */
  const grouped = {};
  for (let r = 1; r <= totalRows; r++) grouped[r] = [];
  members.forEach((m) => {
    if (m.column >= 1 && m.column <= totalRows) grouped[m.column].push(m);
  });

  const MAX_PER_ROW = 4;

  /* ── save total rows ── */
  const handleSaveRows = async () => {
    const val = parseInt(rowInput, 10);
    if (isNaN(val) || val < 1 || val > 10) {
      setRowMsg("Must be between 1 and 10.");
      return;
    }
    setRowSaving(true);
    setRowMsg("");
    try {
      const res  = await api.updateColumnsSettings(val);  // API param name unchanged
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setTotalRows(data.totalColumns);
      setRowInput(data.totalColumns);
      setRowMsg("✓ Saved");
      setTimeout(() => setRowMsg(""), 2000);
    } catch (e) {
      setRowMsg("Failed: " + e.message);
    } finally {
      setRowSaving(false);
    }
  };

  /* ── modal helpers ── */
  const openCreate = () => {
    setEditTarget(null);
    setForm({ ...BLANK_FORM, column: 1 });
    setImgPreview("");
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (m) => {
    setEditTarget(m);
    setForm({ name: m.name, title: m.title, image: m.image || "", column: m.column });
    setImgPreview(m.image || "");
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setFormError(""); };

  /* ── image upload ── */
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const b64 = await compressImage(file);
      setImgPreview(b64);
      setForm((f) => ({ ...f, image: b64 }));
    } catch {
      setFormError("Could not process image. Please try another file.");
    }
  };

  /* ── save member ── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.title.trim()) {
      setFormError("Name and title are required.");
      return;
    }
    const row = parseInt(form.column, 10);
    if (isNaN(row) || row < 1 || row > totalRows) {
      setFormError(`Row must be between 1 and ${totalRows}.`);
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const payload = {
        name:   form.name.trim(),
        title:  form.title.trim(),
        image:  form.image,
        column: row,   // DB field is "column"
      };
      const res  = editTarget
        ? await api.updateMember(editTarget._id, payload)
        : await api.createMember(payload);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchMembers();
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
      const res  = await api.deleteMember(deleteTarget._id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchMembers();
    } catch (e) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  /* ── render ── */
  return (
    <div className="am">

      {/* ══ ACTION BAR ══ */}
      <div className="am__bar">
        <div className="am__row-setting">
          <span className="am__row-label">Total Rows</span>
          <input
            type="number"
            min={1}
            max={10}
            value={rowInput}
            onChange={(e) => setRowInput(e.target.value)}
            className="am__row-input"
          />
          <button
            className="am__btn am__btn--apply"
            onClick={handleSaveRows}
            disabled={rowSaving}
          >
            {rowSaving ? "Saving…" : "Apply"}
          </button>
          {rowMsg && (
            <span className={`am__row-msg ${rowMsg.startsWith("✓") ? "am__row-msg--ok" : "am__row-msg--err"}`}>
              {rowMsg}
            </span>
          )}
          <span className="am__row-hint">
            Currently {totalRows} row{totalRows !== 1 ? "s" : ""}
          </span>
        </div>

        <button className="am__btn am__btn--add" onClick={openCreate}>
          + Add Member
        </button>
      </div>

      {/* ══ MEMBER GRID ══ */}
      {loading ? (
        <div className="am__loading"><div className="am__spinner" /><p>Loading…</p></div>
      ) : error ? (
        <div className="am__error">⚠ {error}</div>
      ) : members.length === 0 ? (
        <div className="am__empty"><span>👥</span><p>No members yet. Add the first one above.</p></div>
      ) : (
        /*
          Layout:
          ─────────────────────────────────────────────────
          .am__grid  — flex-column, stacks rows top-to-bottom

          Each .am__grid-row = one row (Row 1, Row 2, Row 3…)
            • Has a label on the left: "Row 1", "Row 2"…
            • Members in that row sit side-by-side, centred

          Members in a row:
            • 1 member  → justify-content: center
            • 2+ members → justify-content: center with gap
          ─────────────────────────────────────────────────
        */
        <div className="am__grid">
          {Array.from({ length: totalRows }, (_, i) => i + 1).map((rowNum) => {
            const rowMembers = grouped[rowNum] || [];

            return (
              <div key={rowNum} className="am__grid-row">
                {/* Row label */}
                <div className="am__row-label-tag">
                  Row {rowNum}
                </div>

                {/* Cards in this row, centred horizontally */}
                <div className="am__row-cards">
                  {rowMembers.length === 0 ? (
                    <div className="am__row-empty">
                      <span>empty</span>
                    </div>
                  ) : (
                    rowMembers.map((m) => (
                      <MemberCard
                        key={m._id}
                        member={m}
                        onEdit={()   => openEdit(m)}
                        onDelete={() => setDeleteTarget(m)}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ══ ADD / EDIT MODAL ══ */}
      {modalOpen && (
        <div className="am-backdrop" onClick={closeModal}>
          <div className="am-modal" onClick={(e) => e.stopPropagation()}>

            <button className="am-modal__close" onClick={closeModal} aria-label="Close">✕</button>
            <h2 className="am-modal__title">
              {editTarget ? "Edit Member" : "Add Member"}
            </h2>

            {formError && <div className="am-modal__error">⚠ {formError}</div>}

            <form className="am-modal__form" onSubmit={handleSave}>

              {/* Photo — 3:4 preview */}
              <div className="am-img-picker">
                <div
                  className="am-img-preview"
                  onClick={() => fileRef.current.click()}
                  title="Click to upload photo"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && fileRef.current.click()}
                >
                  {imgPreview ? (
                    <img src={imgPreview} alt="Preview" />
                  ) : (
                    <div className="am-img-placeholder">
                      <span>📷</span>
                      <small>Click to upload</small>
                      <small>Auto-compressed to ≤ 200 KB</small>
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
                    className="am-img-remove"
                    onClick={() => { setImgPreview(""); setForm((f) => ({ ...f, image: "" })); }}
                  >
                    Remove photo
                  </button>
                )}
              </div>

              {/* Name */}
              <div className="am-field">
                <label htmlFor="am-name">Full Name</label>
                <input
                  id="am-name"
                  type="text"
                  placeholder="e.g. Anita Shrestha"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              {/* Title */}
              <div className="am-field">
                <label htmlFor="am-title">Title / Designation</label>
                <input
                  id="am-title"
                  type="text"
                  placeholder="e.g. Cultural Secretary"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
              </div>

              {/* Row selector — pill buttons labeled "Row 1", "Row 2"… */}
              <div className="am-field">
                <label>Place in Row</label>
                <div className="am-row-btns">
                  {Array.from({ length: totalRows }, (_, i) => i + 1).map((r) => {
                    const count    = grouped[r]?.length || 0;
                    const isFull   = count >= MAX_PER_ROW;
                    // when editing, the member's current row is not "extra" in that row
                    const isCurrentRow = editTarget && editTarget.column === r;
                    const effectiveFull = isFull && !isCurrentRow;

                    return (
                      <button
                        key={r}
                        type="button"
                        className={`am-row-btn ${form.column === r ? "am-row-btn--active" : ""} ${effectiveFull ? "am-row-btn--full" : ""}`}
                        onClick={() => !effectiveFull && setForm({ ...form, column: r })}
                        aria-pressed={form.column === r}
                        disabled={effectiveFull}
                        title={effectiveFull ? `Row ${r} is full (${MAX_PER_ROW}/${MAX_PER_ROW})` : `Row ${r} — ${count}/${MAX_PER_ROW} members`}
                      >
                        Row {r}
                        <span className="am-row-btn__count">
                          {isCurrentRow ? count : count}/{MAX_PER_ROW}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <small>
                  Member will appear in Row {form.column} · max {MAX_PER_ROW} per row
                </small>
              </div>

              {/* Actions */}
              <div className="am-modal__actions">
                <button type="button" className="am-action am-action--cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="am-action am-action--save" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Update Member" : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ══ */}
      {deleteTarget && (
        <div className="am-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="am-modal am-modal--sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="am-modal__title">Delete Member?</h2>
            <p className="am-modal__body">
              Remove <strong>{deleteTarget.name}</strong> from the members list?
              This cannot be undone.
            </p>
            <div className="am-modal__actions">
              <button className="am-action am-action--cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="am-action am-action--delete" onClick={handleDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMembers;
