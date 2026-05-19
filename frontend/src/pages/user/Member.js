import React, { useState, useEffect, useCallback } from "react";
import api from "../../utils/api";
import useSSE from "../../hooks/useSSE";
import "./css/Member.css";

/* ─────────────────────────────────────────────────────────────
   MemberCard — read-only, card-in-card, 3:4 photo
───────────────────────────────────────────────────────────── */
const MemberCard = ({ member }) => (
  <div className="mc-wrap">
    <div className="mc-frame">
      <div className="mc-inner">
        <div className="mc-photo-wrap">
          {member.image ? (
            <img src={member.image} alt={member.name} className="mc-photo" />
          ) : (
            <div className="mc-photo-placeholder"><span>👤</span></div>
          )}
        </div>
        <div className="mc-info">
          <h3 className="mc-name">{member.name}</h3>
          <p  className="mc-role">{member.title}</p>
        </div>
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────
   Member Page — user-facing, view only
   Layout: rows stacked top-to-bottom.
   Members in the same row sit side-by-side, centred.
───────────────────────────────────────────────────────────── */
const Member = () => {
  const [members,   setMembers]   = useState([]);
  const [totalRows, setTotalRows] = useState(3);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res  = await api.getMembers();
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMembers(data.members);
      setTotalRows(data.totalColumns); // DB field name is totalColumns
    } catch {
      setError("Could not load members. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  // Real-time: refetch when admin changes members
  useSSE("members", fetchMembers);

  // Group by row number (stored as "column" in DB)
  const grouped = {};
  for (let r = 1; r <= totalRows; r++) grouped[r] = [];
  members.forEach((m) => {
    if (m.column >= 1 && m.column <= totalRows) grouped[m.column].push(m);
  });

  return (
    <div className="mp">

      {/* Hero */}
      <div className="mp__hero">
        <span className="mp__eyebrow">Our People</span>
        <h1 className="mp__title">Meet Our Board Members</h1>
        <div className="mp__line" />
        <p className="mp__sub">
          The dedicated individuals who carry our culture forward with pride and purpose.
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="mp__loading">
          <div className="mp__spinner" />
          <p>Loading members…</p>
        </div>
      ) : error ? (
        <div className="mp__error">⚠ {error}</div>
      ) : members.length === 0 ? (
        <div className="mp__empty">
          <span>🪔</span>
          <p>No members to display yet.</p>
        </div>
      ) : (
        /*
          .mp__grid  — flex-column, rows stacked top → bottom
          Each .mp__grid-row = one row
            Members in that row: flex-row, justify-content: center
            Empty rows are hidden on user side
        */
        <div className="mp__grid">
          {Array.from({ length: totalRows }, (_, i) => i + 1).map((rowNum) => {
            const rowMembers = grouped[rowNum] || [];
            if (rowMembers.length === 0) return null; // hide empty rows

            return (
              <div key={rowNum} className="mp__grid-row">
                <div className="mp__row-cards">
                  {rowMembers.map((m) => (
                    <MemberCard key={m._id} member={m} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Member;
