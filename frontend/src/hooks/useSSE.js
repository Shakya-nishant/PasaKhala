/**
 * useSSE — subscribes to the backend SSE stream and calls
 * the provided callback whenever a matching topic is broadcast.
 *
 * Usage:
 *   useSSE("notices", fetchNotices);
 *   useSSE(["events","classes"], refetch);
 *
 * The hook reconnects automatically if the connection drops.
 */
import { useEffect, useRef } from "react";

const BASE_URL =
  (window._env_ && window._env_.REACT_APP_API_URL) ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:5000";

const SSE_URL = `${BASE_URL}/api/sse/updates`;

/**
 * @param {string | string[]} topics  — topic(s) to listen for
 * @param {Function}          onUpdate — called when a matching event arrives
 */
function useSSE(topics, onUpdate) {
  const topicsRef   = useRef(topics);
  const onUpdateRef = useRef(onUpdate);

  // Keep refs current without re-subscribing
  useEffect(() => { topicsRef.current   = topics;   }, [topics]);
  useEffect(() => { onUpdateRef.current = onUpdate; }, [onUpdate]);

  useEffect(() => {
    let es;
    let retryTimer;
    let unmounted = false;

    const connect = () => {
      if (unmounted) return;

      es = new EventSource(SSE_URL);

      es.onmessage = (e) => {
        try {
          const { topic } = JSON.parse(e.data);
          const watched = Array.isArray(topicsRef.current)
            ? topicsRef.current
            : [topicsRef.current];
          if (watched.includes(topic)) {
            onUpdateRef.current();
          }
        } catch (_) { /* ignore malformed frames */ }
      };

      es.onerror = () => {
        es.close();
        if (!unmounted) {
          // Reconnect after 5 s
          retryTimer = setTimeout(connect, 5000);
        }
      };
    };

    connect();

    return () => {
      unmounted = true;
      clearTimeout(retryTimer);
      if (es) es.close();
    };
  }, []); // intentionally empty — refs handle updates
}

export default useSSE;
