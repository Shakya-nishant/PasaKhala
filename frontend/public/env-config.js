// Runtime environment configuration
// Override this file per deployment/instance to point to a different backend.
// This is loaded BEFORE React starts, so window._env_ is available at runtime.
//
// Example for instance on port 3001 pointing to backend on port 5001:
//   window._env_ = { REACT_APP_API_URL: "http://localhost:5001" };
//
// If not set here, the app falls back to the value in .env (REACT_APP_API_URL).
window._env_ = {
  REACT_APP_API_URL: "", // leave empty to use the .env default
};
