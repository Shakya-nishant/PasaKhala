// src/utils/api.js

// Keep runtime env support (important for deployment with multiple frontends)
const BASE_URL =
  (window._env_ && window._env_.REACT_APP_API_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

const authHeader = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

const api = {
  // ───────────────── AUTH ─────────────────
  adminSignup: (data) =>
    fetch(`${BASE_URL}/api/auth/admin-signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  adminLogin: (data) =>
    fetch(`${BASE_URL}/api/auth/admin-login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  verifyToken: () =>
    fetch(`${BASE_URL}/api/auth/verify`, {
      method: "GET",
      headers: authHeader(),
    }),

  // ─────────────── PUBLIC CLASSES ───────────────
  getClasses: () => fetch(`${BASE_URL}/api/classes`),

  getClass: (id) => fetch(`${BASE_URL}/api/classes/${id}`),

  applyToClass: (id, data) =>
    fetch(`${BASE_URL}/api/classes/${id}/apply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  // ─────────────── ADMIN CLASSES ───────────────
  adminGetClasses: () =>
    fetch(`${BASE_URL}/api/classes/admin/all`, {
      headers: authHeader(),
    }),

  adminCreateClass: (data) =>
    fetch(`${BASE_URL}/api/classes/admin/create`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  adminUpdateClass: (id, data) =>
    fetch(`${BASE_URL}/api/classes/admin/${id}`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  adminDeleteClass: (id) =>
    fetch(`${BASE_URL}/api/classes/admin/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    }),

  adminGetApplications: (id) =>
    fetch(`${BASE_URL}/api/classes/admin/${id}/applications`, {
      headers: authHeader(),
    }),

  adminDownloadApplications: (id) =>
    `${BASE_URL}/api/classes/admin/${id}/applications/download`,

  // ─────────────── MEMBERS (NEW MODULE) ───────────────
  getMembers: () => fetch(`${BASE_URL}/api/members`),

  createMember: (data) =>
    fetch(`${BASE_URL}/api/members`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  updateMember: (id, data) =>
    fetch(`${BASE_URL}/api/members/${id}`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  deleteMember: (id) =>
    fetch(`${BASE_URL}/api/members/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    }),

  updateColumnsSettings: (totalColumns) =>
    fetch(`${BASE_URL}/api/members/settings`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify({ totalColumns }),
    }),

  // ─────────────── CONTACT ───────────────
  getContact: () => fetch(`${BASE_URL}/api/contact`),

  createContactItem: (data) =>
    fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  updateContactItem: (id, data) =>
    fetch(`${BASE_URL}/api/contact/${id}`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  deleteContactItem: (id) =>
    fetch(`${BASE_URL}/api/contact/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    }),

  updateContactLocation: (data) =>
    fetch(`${BASE_URL}/api/contact/settings/location`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  // ─────────────── NOTICES ───────────────
  getNotices: () => fetch(`${BASE_URL}/api/notices`),

  adminGetNotices: () =>
    fetch(`${BASE_URL}/api/notices/admin/all`, { headers: authHeader() }),

  createNotice: (data) =>
    fetch(`${BASE_URL}/api/notices`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  updateNotice: (id, data) =>
    fetch(`${BASE_URL}/api/notices/${id}`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  deleteNotice: (id) =>
    fetch(`${BASE_URL}/api/notices/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    }),

  // ─────────────── EVENTS ───────────────
  getEvents: () => fetch(`${BASE_URL}/api/events`),

  adminGetEvents: () =>
    fetch(`${BASE_URL}/api/events/admin/all`, { headers: authHeader() }),

  createEvent: (data) =>
    fetch(`${BASE_URL}/api/events`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  updateEvent: (id, data) =>
    fetch(`${BASE_URL}/api/events/${id}`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  deleteEvent: (id) =>
    fetch(`${BASE_URL}/api/events/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    }),

  // ─────────────── ABOUT US ───────────────
  getAbout: () => fetch(`${BASE_URL}/api/about`),

  createAbout: (data) =>
    fetch(`${BASE_URL}/api/about`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  updateAbout: (id, data) =>
    fetch(`${BASE_URL}/api/about/${id}`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  deleteAbout: (id) =>
    fetch(`${BASE_URL}/api/about/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    }),

  // ─────────────── ADMIN REMOVE APPLICATION ───────────────
  adminRemoveApplication: (classId, appId) =>
    fetch(`${BASE_URL}/api/classes/admin/${classId}/applications/${appId}`, {
      method: "DELETE",
      headers: authHeader(),
    }),

  // ─────────────── ALBUMS ───────────────
  getAlbums: () => fetch(`${BASE_URL}/api/albums`),

  createAlbum: (data) =>
    fetch(`${BASE_URL}/api/albums`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  updateAlbum: (id, data) =>
    fetch(`${BASE_URL}/api/albums/${id}`, {
      method: "PUT",
      headers: authHeader(),
      body: JSON.stringify(data),
    }),

  deleteAlbum: (id) =>
    fetch(`${BASE_URL}/api/albums/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    }),

  addImagesToAlbum: (id, images) =>
    fetch(`${BASE_URL}/api/albums/${id}/images`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ images }),
    }),

  removeImageFromAlbum: (albumId, imgId) =>
    fetch(`${BASE_URL}/api/albums/${albumId}/images/${imgId}`, {
      method: "DELETE",
      headers: authHeader(),
    }),

  // ─────────────── MEMORIES ───────────────
  getMemories: () => fetch(`${BASE_URL}/api/albums/memories`),

  addMemories: (images) =>
    fetch(`${BASE_URL}/api/albums/memories`, {
      method: "POST",
      headers: authHeader(),
      body: JSON.stringify({ images }),
    }),

  deleteMemory: (id) =>
    fetch(`${BASE_URL}/api/albums/memories/${id}`, {
      method: "DELETE",
      headers: authHeader(),
    }),
};

export default api;