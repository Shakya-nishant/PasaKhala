import React, { useState, useEffect, useCallback } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import api from "../../utils/api";
import "./css/AdminAbout.css";

/* ─────────────────────────────────────────────────────────────
   Quill toolbar — correct key names for react-quill v2
───────────────────────────────────────────────────────────── */
const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    [{ size: ["small", false, "large", "huge"] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["link", "blockquote", "code-block"],
    [{ indent: "-1" }, { indent: "+1" }],
    [{ align: [] }],
    ["clean"],
  ],
};

const QUILL_FORMATS = [
  "header", "size",
  "bold", "italic", "underline", "strike",
  "list",
  "link", "blockquote", "code-block",
  "indent", "align",
];

const BLANK_FORM = { title: "", content: "" };

/* ─────────────────────────────────────────────────────────────
   AdminAbout
───────────────────────────────────────────────────────────── */
const AdminAbout = () => {
  const [sections,     setSections]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState("");

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [form,         setForm]         = useState(BLANK_FORM);
  const [formError,    setFormError]    = useState("");
  const [saving,       setSaving]       = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);

  /* ── fetch ── */
  const fetchAbout = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await api.getAbout();
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSections(data);
    } catch {
      setError("Could not load About Us content.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAbout(); }, [fetchAbout]);

  /* ── modal helpers ── */
  const openCreate = () => {
    setEditTarget(null);
    setForm(BLANK_FORM);
    setFormError("");
    setModalOpen(true);
  };

  const openEdit = (s) => {
    setEditTarget(s);
    setForm({ title: s.title || "", content: s.content });
    setFormError("");
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setFormError(""); };

  /* ── save ── */
  const handleSave = async (e) => {
    e.preventDefault();
    // Quill outputs "<p><br></p>" for empty — strip tags to check
    const stripped = form.content.replace(/<[^>]*>/g, "").trim();
    if (!stripped) { setFormError("Content cannot be empty."); return; }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        title:   form.title.trim(),
        content: form.content,
        order:   editTarget ? editTarget.order : sections.length,
      };
      const res  = editTarget
        ? await api.updateAbout(editTarget._id, payload)
        : await api.createAbout(payload);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchAbout();
      closeModal();
    } catch (err) {
      setFormError(err.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res  = await api.deleteAbout(deleteTarget._id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchAbout();
    } catch (err) {
      alert("Delete failed: " + err.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  /* ── render ── */
  return (
    <div className="aa">

      {/* Top bar */}
      <div className="aa__bar">
        <p className="aa__bar-sub">
          Create rich-text sections for the About Us page. Each section supports
          headings (H1–H3), bold, italic, underline, lists, links and more.
          Sections are displayed in order on the public page.
        </p>
        <button className="aa__add-btn" onClick={openCreate}>+ About Us</button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="aa__loading"><div className="aa__spinner" /><p>Loading…</p></div>
      ) : error ? (
        <div className="aa__error">⚠ {error}</div>
      ) : sections.length === 0 ? (
        <div className="aa__empty">
          <span>📝</span>
          <p>No content yet. Click "+ About Us" to add the first section.</p>
        </div>
      ) : (
        <div className="aa__list">
          {sections.map((s, idx) => (
            <div key={s._id} className="aa__card">
              <div className="aa__card-header">
                <div className="aa__card-meta">
                  <span className="aa__card-order">Section {idx + 1}</span>
                  {s.title && <h3 className="aa__card-title">{s.title}</h3>}
                </div>
                <div className="aa__card-actions">
                  <button className="aa__btn aa__btn--edit"   onClick={() => openEdit(s)}>✏ Edit</button>
                  <button className="aa__btn aa__btn--delete" onClick={() => setDeleteTarget(s)}>🗑 Delete</button>
                </div>
              </div>
              {/* Preview — uses ql-editor class so Quill styles apply */}
              <div
                className="aa__card-preview ql-editor"
                dangerouslySetInnerHTML={{ __html: s.content }}
              />
            </div>
          ))}
        </div>
      )}

      {/* ══ ADD / EDIT MODAL ══ */}
      {modalOpen && (
        <div className="aa-backdrop" onClick={closeModal}>
          <div className="aa-modal" onClick={(e) => e.stopPropagation()}>

            <button className="aa-modal__close" onClick={closeModal} aria-label="Close">✕</button>
            <h2 className="aa-modal__title">
              {editTarget ? "Edit Section" : "Add About Us Section"}
            </h2>

            {formError && <div className="aa-modal__error">⚠ {formError}</div>}

            <form className="aa-modal__form" onSubmit={handleSave}>

              {/* Optional section title */}
              <div className="aa-field">
                <label htmlFor="aa-title">
                  Section Title <span className="aa-field__opt">(optional)</span>
                </label>
                <input
                  id="aa-title"
                  type="text"
                  placeholder='e.g. "Our Mission", "Our History"'
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              {/* Rich-text editor */}
              <div className="aa-field">
                <label>Content <span className="aa-req">*</span></label>
                <div className="aa-editor-wrap">
                  <ReactQuill
                    theme="snow"
                    value={form.content}
                    onChange={(val) => setForm((f) => ({ ...f, content: val }))}
                    modules={QUILL_MODULES}
                    formats={QUILL_FORMATS}
                    placeholder="Write about your organisation here…"
                  />
                </div>
              </div>

              <div className="aa-modal__actions">
                <button type="button" className="aa-action aa-action--cancel" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="aa-action aa-action--save" disabled={saving}>
                  {saving ? "Saving…" : editTarget ? "Update Section" : "Add Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ══ */}
      {deleteTarget && (
        <div className="aa-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="aa-modal aa-modal--sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="aa-modal__title">Delete Section?</h2>
            <p className="aa-modal__body">
              {deleteTarget.title
                ? <>Delete section <strong>"{deleteTarget.title}"</strong>?</>
                : "Delete this section?"}
              {" "}This cannot be undone.
            </p>
            <div className="aa-modal__actions">
              <button className="aa-action aa-action--cancel" onClick={() => setDeleteTarget(null)}>
                Cancel
              </button>
              <button className="aa-action aa-action--delete" onClick={handleDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAbout;
