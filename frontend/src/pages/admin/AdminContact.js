import React, { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import api from "../../utils/api";
import "./css/AdminContact.css";

// Fix Leaflet's default marker icon (broken in webpack builds)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon   from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl:       markerIcon,
  shadowUrl:     markerShadow,
});

/* ─────────────────────────────────────────────────────────────
   Constants
───────────────────────────────────────────────────────────── */
const TYPES = [
  { value: "phone",     label: "Phone"     },
  { value: "email",     label: "Email"     },
  { value: "whatsapp",  label: "WhatsApp"  },
  { value: "facebook",  label: "Facebook"  },
  { value: "instagram", label: "Instagram" },
  { value: "youtube",   label: "YouTube"   },
  { value: "address",   label: "Address"   },
];

const TYPE_ICONS = {
  phone: "📞", email: "✉️", whatsapp: "💬",
  facebook: "📘", instagram: "📸", youtube: "▶️", address: "📍",
};

const TYPE_COLORS = {
  phone: "#2D6A4F", email: "#8B1A1A", whatsapp: "#25D366",
  facebook: "#1877F2", instagram: "#E1306C", youtube: "#FF0000", address: "#C4622D",
};

const isLink = (val) => /^https?:\/\//i.test((val || "").trim());

const BLANK_FORM = { type: "phone", tag: "", value: "" };

/* ─────────────────────────────────────────────────────────────
   ClickableMap — inner component that listens for map clicks
   and moves the marker to the clicked position
───────────────────────────────────────────────────────────── */
const ClickHandler = ({ onPick }) => {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

/* ─────────────────────────────────────────────────────────────
   AdminContact
───────────────────────────────────────────────────────────── */
const AdminContact = () => {
  const [items,    setItems]    = useState([]);
  const [settings, setSettings] = useState({ lat: 26.8065, lng: 87.2846, locationLabel: "Our Office" });
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState("");

  /* add / edit form */
  const [formOpen,   setFormOpen]   = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form,       setForm]       = useState(BLANK_FORM);
  const [formError,  setFormError]  = useState("");
  const [saving,     setSaving]     = useState(false);

  /* delete confirm */
  const [deleteTarget, setDeleteTarget] = useState(null);

  /* location — picked directly on the map */
  const [pin,       setPin]       = useState({ lat: 26.8065, lng: 87.2846 });
  const [mapKey,    setMapKey]    = useState(0);   // force map remount when saved location loads
  const [locLabel,  setLocLabel]  = useState("Our Office");
  const [locSaving, setLocSaving] = useState(false);
  const [locMsg,    setLocMsg]    = useState("");

  /* ── fetch ── */
  const fetchContact = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await api.getContact();
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setItems(data.items);
      setSettings(data.settings);
      setPin({ lat: data.settings.lat, lng: data.settings.lng });
      setMapKey((k) => k + 1);   // remount map so it centres on the saved pin
      setLocLabel(data.settings.locationLabel || "Our Office");
    } catch {
      setError("Could not load contact data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchContact(); }, [fetchContact]);

  /* ── when admin clicks the map ── */
  const handleMapPick = (lat, lng) => {
    setPin({ lat, lng });
    setLocMsg("");
  };

  /* ── save location ── */
  const handleSaveLocation = async () => {
    setLocSaving(true);
    setLocMsg("");
    try {
      const res  = await api.updateContactLocation({
        lat: pin.lat,
        lng: pin.lng,
        locationLabel: locLabel,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSettings(data.settings);
      setLocMsg("✓ Location saved");
      setTimeout(() => setLocMsg(""), 2500);
    } catch (e) {
      setLocMsg("Failed: " + e.message);
    } finally {
      setLocSaving(false);
    }
  };

  /* ── contact item helpers ── */
  const openAdd = () => {
    setEditTarget(null);
    setForm(BLANK_FORM);
    setFormError("");
    setFormOpen(true);
  };

  const openEdit = (item) => {
    setEditTarget(item);
    setForm({ type: item.type, tag: item.tag || "", value: item.value });
    setFormError("");
    setFormOpen(true);
  };

  const closeForm = () => { setFormOpen(false); setFormError(""); };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.value.trim()) { setFormError("Value is required."); return; }
    setSaving(true);
    setFormError("");
    try {
      const payload = { type: form.type, tag: form.tag.trim(), value: form.value.trim() };
      const res  = editTarget
        ? await api.updateContactItem(editTarget._id, payload)
        : await api.createContactItem(payload);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchContact();
      closeForm();
    } catch (e) {
      setFormError(e.message || "Failed to save.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res  = await api.deleteContactItem(deleteTarget._id);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchContact();
    } catch (e) {
      alert("Delete failed: " + e.message);
    } finally {
      setDeleteTarget(null);
    }
  };

  /* ── render ── */
  return (
    <div className="ac-page">

      {loading ? (
        <div className="ac-loading"><div className="ac-spinner" /><p>Loading…</p></div>
      ) : error ? (
        <div className="ac-error">⚠ {error}</div>
      ) : (
        <div className="ac-body">

          {/* ══ LEFT — contact items ══ */}
          <div className="ac-left">
            <div className="ac-left__header">
              <h2 className="ac-section-title">Contact Details</h2>
              <button className="ac-add-btn" onClick={openAdd}>+ Add Contact</button>
            </div>

            {items.length === 0 ? (
              <div className="ac-empty">No contact items yet. Add one above.</div>
            ) : (
              <div className="ac-list">
                {items.map((item) => (
                  <div key={item._id} className="ac-item">
                    <span className="ac-item__icon" style={{ color: TYPE_COLORS[item.type] }}>
                      {TYPE_ICONS[item.type]}
                    </span>
                    <div className="ac-item__body">
                      <div className="ac-item__meta">
                        <span
                          className="ac-item__type-badge"
                          style={{ background: `${TYPE_COLORS[item.type]}18`, color: TYPE_COLORS[item.type] }}
                        >
                          {item.type}
                        </span>
                        {item.tag && <span className="ac-item__tag">{item.tag}</span>}
                      </div>
                      {isLink(item.value) ? (
                        <a href={item.value} target="_blank" rel="noopener noreferrer" className="ac-item__link">
                          🔗 {item.value}
                        </a>
                      ) : (
                        <span className="ac-item__value">{item.value}</span>
                      )}
                    </div>
                    <div className="ac-item__actions">
                      <button className="ac-item-btn ac-item-btn--edit"   onClick={() => openEdit(item)}>✏</button>
                      <button className="ac-item-btn ac-item-btn--delete" onClick={() => setDeleteTarget(item)}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add / Edit inline form */}
            {formOpen && (
              <div className="ac-form-card">
                <div className="ac-form-card__header">
                  <h3>{editTarget ? "Edit Contact" : "Add Contact"}</h3>
                  <button className="ac-form-card__close" onClick={closeForm}>✕</button>
                </div>

                {formError && <div className="ac-form-error">⚠ {formError}</div>}

                <form className="ac-form" onSubmit={handleSave}>
                  <div className="ac-field">
                    <label>Type</label>
                    <select
                      value={form.type}
                      onChange={(e) => setForm({ ...form, type: e.target.value })}
                    >
                      {TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {TYPE_ICONS[t.value]} {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="ac-field">
                    <label>Tag <span className="ac-field__opt">(optional)</span></label>
                    <input
                      type="text"
                      placeholder='e.g. "Office", "HR", "Support"'
                      value={form.tag}
                      onChange={(e) => setForm({ ...form, tag: e.target.value })}
                    />
                  </div>

                  <div className="ac-field">
                    <label>
                      {form.type === "phone"     && "Phone Number"}
                      {form.type === "email"     && "Email Address"}
                      {form.type === "whatsapp"  && "WhatsApp Number"}
                      {form.type === "facebook"  && "Facebook URL"}
                      {form.type === "instagram" && "Instagram URL"}
                      {form.type === "youtube"   && "YouTube URL"}
                      {form.type === "address"   && "Address"}
                    </label>
                    {form.type === "address" ? (
                      <textarea
                        rows={3}
                        placeholder="Full address…"
                        value={form.value}
                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                        required
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder={
                          form.type === "phone"     ? "+977 9800000000" :
                          form.type === "email"     ? "info@pasakhala.org" :
                          form.type === "whatsapp"  ? "+977 9800000000" :
                          form.type === "youtube"   ? "https://youtube.com/@pasakhala" :
                          "https://..."
                        }
                        value={form.value}
                        onChange={(e) => setForm({ ...form, value: e.target.value })}
                        required
                      />
                    )}
                    {isLink(form.value) && (
                      <small className="ac-field__link-hint">🔗 Will be shown as a clickable link</small>
                    )}
                  </div>

                  <div className="ac-form__actions">
                    <button type="button" className="ac-btn ac-btn--cancel" onClick={closeForm}>Cancel</button>
                    <button type="submit" className="ac-btn ac-btn--save" disabled={saving}>
                      {saving ? "Saving…" : editTarget ? "Update" : "Add"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* ══ RIGHT — clickable map + location label ══ */}
          <div className="ac-right">
            <h2 className="ac-section-title">Office Location</h2>

            {/* Instruction banner */}
            <div className="ac-map-hint">
              📍 Click anywhere on the map to set the office location
            </div>

            {/* Leaflet clickable map — key forces remount when saved location loads */}
            <div className="ac-map-container">
              <MapContainer
                key={mapKey}
                center={[pin.lat, pin.lng]}
                zoom={14}
                className="ac-leaflet-map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ClickHandler onPick={handleMapPick} />
                <Marker position={[pin.lat, pin.lng]} />
              </MapContainer>
            </div>

            {/* Selected coordinates display */}
            <div className="ac-coords-display">
              <span className="ac-coords-display__label">Selected:</span>
              <span className="ac-coords-display__val">
                {pin.lat.toFixed(6)}, {pin.lng.toFixed(6)}
              </span>
            </div>

            {/* Location label + save */}
            <div className="ac-loc-form">
              <div className="ac-field">
                <label>Location Label</label>
                <input
                  type="text"
                  placeholder='e.g. "PasaKhala Office, Dharan"'
                  value={locLabel}
                  onChange={(e) => setLocLabel(e.target.value)}
                />
              </div>

              <div className="ac-loc-form__footer">
                <button
                  type="button"
                  className="ac-btn ac-btn--save"
                  onClick={handleSaveLocation}
                  disabled={locSaving}
                >
                  {locSaving ? "Saving…" : "Save Location"}
                </button>
                {locMsg && (
                  <span className={`ac-loc-msg ${locMsg.startsWith("✓") ? "ac-loc-msg--ok" : "ac-loc-msg--err"}`}>
                    {locMsg}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM ══ */}
      {deleteTarget && (
        <div className="ac-backdrop" onClick={() => setDeleteTarget(null)}>
          <div className="ac-confirm" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Contact?</h3>
            <p>
              Remove <strong>{deleteTarget.type}</strong>
              {deleteTarget.tag ? ` (${deleteTarget.tag})` : ""}: <em>{deleteTarget.value}</em>?
              This cannot be undone.
            </p>
            <div className="ac-confirm__actions">
              <button className="ac-btn ac-btn--cancel" onClick={() => setDeleteTarget(null)}>Cancel</button>
              <button className="ac-btn ac-btn--delete" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminContact;
