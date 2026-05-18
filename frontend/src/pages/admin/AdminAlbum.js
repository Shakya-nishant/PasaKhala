import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../../utils/api";
import "./css/AdminAlbum.css";

/* ─────────────────────────────────────────────────────────────
   Image compression helper
   - Target: ≤ 200 KB output
   - Max dimension: 1600 px on the longest side
   - Iteratively lowers JPEG quality until the target is met
   - PNG / transparent images are converted to JPEG (white bg)
───────────────────────────────────────────────────────────── */
const TARGET_BYTES   = 200 * 1024;   // 200 KB
const MAX_DIMENSION  = 1600;         // px — longest side cap
const QUALITY_START  = 0.85;
const QUALITY_MIN    = 0.30;
const QUALITY_STEP   = 0.08;

const compressImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        // ── 1. Calculate scaled dimensions ──────────────────
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

        // ── 2. Draw onto canvas ──────────────────────────────
        const canvas = document.createElement("canvas");
        canvas.width  = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        // White background so transparent PNGs become white JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // ── 3. Iteratively compress until ≤ TARGET_BYTES ────
        let quality = QUALITY_START;
        let dataUrl = canvas.toDataURL("image/jpeg", quality);

        // base64 → byte size: each base64 char ≈ 0.75 bytes
        const byteSize = (b64) => Math.round((b64.length - b64.indexOf(",") - 1) * 0.75);

        while (byteSize(dataUrl) > TARGET_BYTES && quality > QUALITY_MIN) {
          quality  = Math.max(QUALITY_MIN, quality - QUALITY_STEP);
          dataUrl  = canvas.toDataURL("image/jpeg", quality);
        }

        resolve({ url: dataUrl, caption: "" });
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

const readFilesAsBase64 = (files) =>
  Promise.all(Array.from(files).map(compressImage));

/* shared constant */
const MAX_ALBUM_IMAGES = 10;

/* ─────────────────────────────────────────────────────────────
   ImagePickerZone — drag-and-drop / click to pick images
───────────────────────────────────────────────────────────── */
const ImagePickerZone = ({ onPick, multiple = true }) => {
  const inputRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (files) => {
    if (!files || !files.length) return;
    const imgs = await readFilesAsBase64(files);
    onPick(imgs);
  };

  return (
    <div
      className={`img-picker ${dragging ? "img-picker--drag" : ""}`}
      onClick={() => inputRef.current.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
    >
      <span className="img-picker__icon">🖼</span>
      <p className="img-picker__text">
        {dragging ? "Drop images here" : "Click or drag images here"}
      </p>
      <p className="img-picker__hint">JPG, PNG, WEBP — auto-compressed to ≤ 200 KB</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        style={{ display: "none" }}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   ImagePreviewGrid — shows picked images before upload
───────────────────────────────────────────────────────────── */
const ImagePreviewGrid = ({ images, onRemove }) => {
  if (!images.length) return null;
  return (
    <div className="img-preview-grid">
      {images.map((img, i) => (
        <div key={i} className="img-preview-item">
          <img src={img.url} alt={`preview-${i}`} />
          <button
            type="button"
            className="img-preview-item__remove"
            onClick={() => onRemove(i)}
            aria-label="Remove"
          >✕</button>
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   AlbumImageGrid — images inside an album (admin view)
───────────────────────────────────────────────────────────── */
const AlbumImageGrid = ({ album, onRemoveImage, onAddImages }) => {
  const [picked, setPicked] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const currentCount = album.images.length;
  const slots        = MAX_ALBUM_IMAGES - currentCount;
  const isFull       = slots <= 0;

  const handlePick = (imgs) => {
    setErr("");
    const remaining = MAX_ALBUM_IMAGES - currentCount - picked.length;
    if (remaining <= 0) {
      setErr(`Album is full (${MAX_ALBUM_IMAGES}/${MAX_ALBUM_IMAGES} images).`);
      return;
    }
    const allowed = imgs.slice(0, remaining);
    const dropped = imgs.length - allowed.length;
    setPicked((p) => [...p, ...allowed]);
    if (dropped > 0)
      setErr(`Only ${allowed.length} image${allowed.length !== 1 ? "s" : ""} added — album limit of ${MAX_ALBUM_IMAGES} would be exceeded.`);
  };

  const handleUpload = async () => {
    if (!picked.length) return;
    setSaving(true); setErr("");
    try {
      const res  = await api.addImagesToAlbum(album._id, picked);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPicked([]);
      if (data.skipped) setErr(`Note: ${data.skipped} image${data.skipped !== 1 ? "s" : ""} skipped — album limit reached.`);
      onAddImages();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="album-img-grid-wrap">
      {/* Capacity bar */}
      <div className="album-img-grid__capacity">
        <div className="album-img-grid__capacity-bar">
          <div
            className={`album-img-grid__capacity-fill ${isFull ? "album-img-grid__capacity-fill--full" : ""}`}
            style={{ width: `${(currentCount / MAX_ALBUM_IMAGES) * 100}%` }}
          />
        </div>
        <span className={`album-img-grid__capacity-label ${isFull ? "album-img-grid__capacity-label--full" : ""}`}>
          {currentCount} / {MAX_ALBUM_IMAGES} images {isFull ? "— Album full" : `— ${slots} slot${slots !== 1 ? "s" : ""} remaining`}
        </span>
      </div>

      {/* Existing images */}
      {album.images.length === 0 ? (
        <p className="album-img-grid__empty">No images yet. Add some below.</p>
      ) : (
        <div className="album-img-grid">
          {album.images.map((img) => (
            <div key={img._id} className="album-img-grid__item">
              <img src={img.url} alt={img.caption || "album image"} />
              <button
                className="album-img-grid__del"
                onClick={() => onRemoveImage(album._id, img._id)}
                title="Remove image"
              >🗑</button>
            </div>
          ))}
        </div>
      )}

      {/* Add more images — hidden when full */}
      {!isFull && (
        <div className="album-img-grid__add">
          <ImagePickerZone onPick={handlePick} />
          <ImagePreviewGrid images={picked} onRemove={(i) => { setPicked((p) => p.filter((_, idx) => idx !== i)); setErr(""); }} />
          {err && <p className="album-img-grid__err">⚠ {err}</p>}
          {picked.length > 0 && (
            <button className="album-img-grid__upload-btn" onClick={handleUpload} disabled={saving}>
              {saving ? "Uploading…" : `Upload ${picked.length} image${picked.length > 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      )}

      {isFull && (
        <div className="album-img-grid__full-msg">
          🔒 Album is full ({MAX_ALBUM_IMAGES}/{MAX_ALBUM_IMAGES}). Remove an image to add a new one.
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   AlbumCard — collapsible card for one album
───────────────────────────────────────────────────────────── */
const AlbumCard = ({ album, onDelete, onRefresh }) => {
  const [open, setOpen] = useState(false);

  const handleRemoveImage = async (albumId, imgId) => {
    try {
      const res  = await api.removeImageFromAlbum(albumId, imgId);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onRefresh();
    } catch (e) {
      alert("Remove failed: " + e.message);
    }
  };

  const coverImg = album.images[album.coverIndex] || album.images[0];

  return (
    <div className={`album-card ${open ? "album-card--open" : ""}`}>
      <div className="album-card__header" onClick={() => setOpen((o) => !o)}>
        <div className="album-card__cover-wrap">
          {coverImg ? (
            <img src={coverImg.url} alt="cover" className="album-card__cover" />
          ) : (
            <div className="album-card__cover-placeholder">🖼</div>
          )}
        </div>
        <div className="album-card__info">
          <h3 className="album-card__name">{album.name}</h3>
          {album.description && (
            <p className="album-card__desc">{album.description}</p>
          )}
          <span className="album-card__count">{album.images.length} image{album.images.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="album-card__actions" onClick={(e) => e.stopPropagation()}>
          <button className="alb-btn alb-btn--delete" onClick={() => onDelete(album)}>
            🗑 Delete Album
          </button>
          <span className="album-card__chevron">{open ? "▲" : "▼"}</span>
        </div>
      </div>

      {open && (
        <div className="album-card__body">
          <AlbumImageGrid
            album={album}
            onRemoveImage={handleRemoveImage}
            onAddImages={onRefresh}
          />
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MemoriesSection — standalone images
───────────────────────────────────────────────────────────── */
const MemoriesSection = ({ memories, onRefresh }) => {
  const [picked, setPicked]   = useState([]);
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState("");

  const handleUpload = async () => {
    if (!picked.length) return;
    setSaving(true); setErr("");
    try {
      const res  = await api.addMemories(picked);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPicked([]);
      onRefresh();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res  = await api.deleteMemory(id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onRefresh();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  return (
    <div className="memories-section">
      <div className="memories-section__header">
        <h3 className="memories-section__title">📸 Memories</h3>
        <p className="memories-section__sub">
          Images uploaded without an album — shown in the Memories section on the public page.
        </p>
      </div>

      {memories.length === 0 ? (
        <p className="memories-section__empty">No memories yet.</p>
      ) : (
        <div className="memories-grid">
          {memories.map((mem) => (
            <div key={mem._id} className="memories-grid__item">
              <img src={mem.url} alt={mem.caption || "memory"} />
              <button
                className="memories-grid__del"
                onClick={() => handleDelete(mem._id)}
                title="Delete"
              >🗑</button>
            </div>
          ))}
        </div>
      )}

      <div className="memories-section__add">
        <ImagePickerZone onPick={(imgs) => setPicked((p) => [...p, ...imgs])} />
        <ImagePreviewGrid images={picked} onRemove={(i) => setPicked((p) => p.filter((_, idx) => idx !== i))} />
        {err && <p className="memories-section__err">⚠ {err}</p>}
        {picked.length > 0 && (
          <button className="memories-section__upload-btn" onClick={handleUpload} disabled={saving}>
            {saving ? "Uploading…" : `Upload ${picked.length} image${picked.length > 1 ? "s" : ""}`}
          </button>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   CreateAlbumModal
───────────────────────────────────────────────────────────── */
const CreateAlbumModal = ({ onClose, onCreated }) => {
  const [name, setName]     = useState("");
  const [desc, setDesc]     = useState("");
  const [picked, setPicked] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState("");

  const handlePick = (imgs) => {
    setErr("");
    const remaining = MAX_ALBUM_IMAGES - picked.length;
    if (remaining <= 0) {
      setErr(`Maximum ${MAX_ALBUM_IMAGES} images per album.`);
      return;
    }
    const allowed = imgs.slice(0, remaining);
    const dropped = imgs.length - allowed.length;
    setPicked((p) => [...p, ...allowed]);
    if (dropped > 0)
      setErr(`Only ${allowed.length} image${allowed.length !== 1 ? "s" : ""} added — limit of ${MAX_ALBUM_IMAGES} per album.`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setErr("Album name is required."); return; }
    setSaving(true); setErr("");
    try {
      const res  = await api.createAlbum({ name, description: desc });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const albumId = data.album._id;

      if (picked.length) {
        const res2  = await api.addImagesToAlbum(albumId, picked);
        const data2 = await res2.json();
        if (!res2.ok) throw new Error(data2.message);
      }

      onCreated();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="aa-backdrop" onClick={onClose}>
      <div className="aa-modal" onClick={(e) => e.stopPropagation()}>
        <button className="aa-modal__close" onClick={onClose}>✕</button>
        <h2 className="aa-modal__title">Create New Album</h2>

        {err && <div className="aa-modal__error">⚠ {err}</div>}

        <form className="aa-modal__form" onSubmit={handleSubmit}>
          <div className="aa-field">
            <label htmlFor="alb-name">Album Name <span className="aa-req">*</span></label>
            <input
              id="alb-name"
              type="text"
              placeholder='e.g. "Dashain 2081"'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="aa-field">
            <label htmlFor="alb-desc">Description <span className="aa-field__opt">(optional)</span></label>
            <input
              id="alb-desc"
              type="text"
              placeholder="Short description of this album"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
            />
          </div>

          <div className="aa-field">
            <label>
              Initial Images{" "}
              <span className="aa-field__opt">
                (optional — max {MAX_ALBUM_IMAGES}, {picked.length}/{MAX_ALBUM_IMAGES} selected)
              </span>
            </label>
            {picked.length < MAX_ALBUM_IMAGES && (
              <ImagePickerZone onPick={handlePick} />
            )}
            <ImagePreviewGrid
              images={picked}
              onRemove={(i) => { setPicked((p) => p.filter((_, idx) => idx !== i)); setErr(""); }}
            />
            {picked.length >= MAX_ALBUM_IMAGES && (
              <p className="aa-field__limit-msg">
                🔒 Maximum {MAX_ALBUM_IMAGES} images reached for this album.
              </p>
            )}
          </div>

          <div className="aa-modal__actions">
            <button type="button" className="aa-action aa-action--cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="aa-action aa-action--save" disabled={saving}>
              {saving ? "Creating…" : "Create Album"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   AdminAlbum — main component
───────────────────────────────────────────────────────────── */
const AdminAlbum = () => {
  const [albums,   setAlbums]   = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [tab, setTab] = useState("albums"); // "albums" | "memories"

  const fetchAll = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [aRes, mRes] = await Promise.all([api.getAlbums(), api.getMemories()]);
      const [aData, mData] = await Promise.all([aRes.json(), mRes.json()]);
      if (!aRes.ok) throw new Error(aData.message);
      if (!mRes.ok) throw new Error(mData.message);
      setAlbums(aData);
      setMemories(mData);
    } catch (e) {
      setError("Could not load gallery data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleDeleteAlbum = async () => {
    if (!deleteTarget) return;
    try {
      const res  = await api.deleteAlbum(deleteTarget._id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDeleteTarget(null);
      fetchAll();
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  return (
    <div className="admin-album">

      {/* Top bar */}
      <div className="admin-album__bar">
        <p className="admin-album__bar-sub">
          Manage albums and standalone memory images. Albums appear as scrollable rows on the public page; memories appear in the Memories masonry grid.
        </p>
        <button className="admin-album__create-btn" onClick={() => setShowCreate(true)}>
          + New Album
        </button>
      </div>

      {/* Tabs */}
      <div className="admin-album__tabs">
        <button
          className={`admin-album__tab ${tab === "albums" ? "admin-album__tab--active" : ""}`}
          onClick={() => setTab("albums")}
        >
          🗂 Albums ({albums.length})
        </button>
        <button
          className={`admin-album__tab ${tab === "memories" ? "admin-album__tab--active" : ""}`}
          onClick={() => setTab("memories")}
        >
          📸 Memories ({memories.length})
        </button>
      </div>

      {loading ? (
        <div className="admin-album__loading">
          <div className="admin-album__spinner" />
          <p>Loading…</p>
        </div>
      ) : error ? (
        <div className="admin-album__error">⚠ {error}</div>
      ) : (
        <>
          {tab === "albums" && (
            <div className="admin-album__albums">
              {albums.length === 0 ? (
                <div className="admin-album__empty">
                  <span>🗂</span>
                  <p>No albums yet. Click "+ New Album" to create one.</p>
                </div>
              ) : (
                albums.map((album) => (
                  <AlbumCard
                    key={album._id}
                    album={album}
                    onDelete={setDeleteTarget}
                    onRefresh={fetchAll}
                  />
                ))
              )}
            </div>
          )}

          {tab === "memories" && (
            <MemoriesSection memories={memories} onRefresh={fetchAll} />
          )}
        </>
      )}

      {/* Create album modal */}
      {showCreate && (
        <CreateAlbumModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchAll(); }}
        />
      )}

      {/* Delete album confirm */}
      {deleteTarget && (
        <div className="aa-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="aa-modal aa-modal--sm" onClick={(e) => e.stopPropagation()}>
            <h2 className="aa-modal__title">Delete Album?</h2>
            <p className="aa-modal__body">
              Delete album <strong>"{deleteTarget.name}"</strong> and all {deleteTarget.images.length} image{deleteTarget.images.length !== 1 ? "s" : ""} inside it? This cannot be undone.
            </p>
            <div className="aa-modal__actions">
              <button className="aa-action aa-action--cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="aa-action aa-action--delete" onClick={handleDeleteAlbum}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlbum;
