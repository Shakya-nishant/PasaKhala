import React, { useState, useEffect, useCallback, useRef } from "react";
import api from "../../utils/api";
import "./css/Album.css";

/* ─────────────────────────────────────────────────────────────
   Lightbox — full-screen image viewer
───────────────────────────────────────────────────────────── */
const Lightbox = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);

  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const img = images[idx];

  return (
    <div className="lb-backdrop" onClick={onClose}>
      <div className="lb-box" onClick={(e) => e.stopPropagation()}>
        <button className="lb-close" onClick={onClose} aria-label="Close">✕</button>

        {images.length > 1 && (
          <button className="lb-arrow lb-arrow--prev" onClick={prev} aria-label="Previous">‹</button>
        )}

        <div className="lb-img-wrap">
          <img src={img.url} alt={img.caption || `image ${idx + 1}`} className="lb-img" />
        </div>

        {images.length > 1 && (
          <button className="lb-arrow lb-arrow--next" onClick={next} aria-label="Next">›</button>
        )}

        <div className="lb-footer">
          {img.caption && <p className="lb-caption">{img.caption}</p>}
          <span className="lb-counter">{idx + 1} / {images.length}</span>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   MasonryGrid — Pinterest-style masonry using CSS columns
───────────────────────────────────────────────────────────── */
const MasonryGrid = ({ images, onImageClick }) => {
  if (!images.length) return null;
  return (
    <div className="masonry">
      {images.map((img, i) => (
        <div
          key={img._id || i}
          className="masonry__item"
          onClick={() => onImageClick(i)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && onImageClick(i)}
          aria-label={img.caption || `Image ${i + 1}`}
        >
          <img
            src={img.url}
            alt={img.caption || `image ${i + 1}`}
            loading="lazy"
          />
          {img.caption && (
            <div className="masonry__caption">{img.caption}</div>
          )}
        </div>
      ))}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   AlbumModal — opens when user clicks an album card
   Shows all images in that album as a masonry grid
───────────────────────────────────────────────────────────── */
const AlbumModal = ({ album, onClose }) => {
  const [lbIndex, setLbIndex] = useState(null);

  return (
    <div className="album-modal-backdrop" onClick={onClose}>
      <div className="album-modal" onClick={(e) => e.stopPropagation()}>
        <div className="album-modal__header">
          <div>
            <h2 className="album-modal__title">{album.name}</h2>
            {album.description && (
              <p className="album-modal__desc">{album.description}</p>
            )}
            <span className="album-modal__count">
              {album.images.length} photo{album.images.length !== 1 ? "s" : ""}
            </span>
          </div>
          <button className="album-modal__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="album-modal__body">
          {album.images.length === 0 ? (
            <div className="album-modal__empty">
              <span>🖼</span>
              <p>No photos in this album yet.</p>
            </div>
          ) : (
            <MasonryGrid
              images={album.images}
              onImageClick={(i) => setLbIndex(i)}
            />
          )}
        </div>
      </div>

      {lbIndex !== null && (
        <Lightbox
          images={album.images}
          startIndex={lbIndex}
          onClose={() => setLbIndex(null)}
        />
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   AlbumCard — horizontal scrollable card
───────────────────────────────────────────────────────────── */
const AlbumCard = ({ album, onClick }) => {
  const cover = album.images[album.coverIndex] || album.images[0];
  const count = album.images.length;

  return (
    <div className="album-card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
      aria-label={`Open album: ${album.name}`}
    >
      <div className="album-card__thumb">
        {cover ? (
          <img src={cover.url} alt={album.name} loading="lazy" />
        ) : (
          <div className="album-card__thumb-placeholder">🖼</div>
        )}
        <div className="album-card__overlay">
          <span className="album-card__overlay-icon">▶</span>
        </div>
      </div>
      <div className="album-card__info">
        <h3 className="album-card__name">{album.name}</h3>
        <span className="album-card__count">{count} photo{count !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   AlbumRow — horizontally scrollable row of album cards
───────────────────────────────────────────────────────────── */
const AlbumRow = ({ albums, onAlbumClick }) => {
  const rowRef = useRef();

  const scroll = (dir) => {
    rowRef.current.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  return (
    <div className="album-row-wrap">
      {albums.length > 3 && (
        <button className="album-row__arrow album-row__arrow--left" onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
      )}
      <div className="album-row" ref={rowRef}>
        {albums.map((album) => (
          <AlbumCard key={album._id} album={album} onClick={() => onAlbumClick(album)} />
        ))}
      </div>
      {albums.length > 3 && (
        <button className="album-row__arrow album-row__arrow--right" onClick={() => scroll(1)} aria-label="Scroll right">›</button>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────
   Main Album Page
───────────────────────────────────────────────────────────── */
const AlbumPage = () => {
  const [albums,   setAlbums]   = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");
  const [openAlbum, setOpenAlbum] = useState(null);
  const [lbIndex,   setLbIndex]   = useState(null);

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
      setError("Could not load gallery. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const hasContent = albums.length > 0 || memories.length > 0;

  return (
    <main className="album-page">

      {/* ── Hero ── */}
      <div className="album-hero">
        <span className="album-hero__eyebrow">Our Gallery</span>
        <h1 className="album-hero__title">Albums & Memories</h1>
        <div className="album-hero__line" />
        <p className="album-hero__sub">
          Relive our cultural moments — browse albums from events, classes, and celebrations,
          or scroll through our collection of memories.
        </p>
      </div>

      {/* ── Body ── */}
      <div className="album-body">
        {loading ? (
          <div className="album-loading">
            <div className="album-spinner" />
            <p>Loading gallery…</p>
          </div>
        ) : error ? (
          <div className="album-error">⚠ {error}</div>
        ) : !hasContent ? (
          <div className="album-empty">
            <span>📷</span>
            <p>No photos yet. Check back soon!</p>
          </div>
        ) : (
          <>
            {/* ── Albums section ── */}
            {albums.length > 0 && (
              <section className="album-section">
                <div className="album-section__heading-row">
                  <h2 className="album-section__heading">Albums</h2>
                  <div className="album-section__line" />
                  <span className="album-section__count">{albums.length} album{albums.length !== 1 ? "s" : ""}</span>
                </div>
                <AlbumRow albums={albums} onAlbumClick={setOpenAlbum} />
              </section>
            )}

            {/* ── Memories section ── */}
            {memories.length > 0 && (
              <section className="album-section album-section--memories">
                <div className="album-section__heading-row">
                  <h2 className="album-section__heading">Memories</h2>
                  <div className="album-section__line" />
                  <span className="album-section__count">{memories.length} photo{memories.length !== 1 ? "s" : ""}</span>
                </div>
                <p className="album-section__sub">
                  Moments captured outside of albums — a living scrapbook of our community.
                </p>
                <MasonryGrid
                  images={memories}
                  onImageClick={(i) => setLbIndex(i)}
                />
              </section>
            )}
          </>
        )}
      </div>

      {/* Album modal */}
      {openAlbum && (
        <AlbumModal album={openAlbum} onClose={() => setOpenAlbum(null)} />
      )}

      {/* Memories lightbox */}
      {lbIndex !== null && (
        <Lightbox
          images={memories}
          startIndex={lbIndex}
          onClose={() => setLbIndex(null)}
        />
      )}
    </main>
  );
};

export default AlbumPage;
