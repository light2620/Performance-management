import React, { useEffect, useMemo, useState } from "react";
import "./style.css";
import { IoSearch } from "react-icons/io5";
import { LuPencil, LuTrash2 } from "react-icons/lu";
import { tokenService } from "../../Apis/tokenService";
import { getAllUser } from "../../Apis/UserApi";
import axiosInstance from "../../Apis/axiosInstance";
import CreateUser from "../Createuser/Createuser";
import { deleteUserApi } from "../../Apis/UserApi";

const API_BASE = "users/";

// helpers
const cls = (...x) => x.filter(Boolean).join(" ");
const fullName = (u) => `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim();
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "—";
const timeAgo = (iso) => {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.max(1, Math.floor(diff / 1000));
  const mins = Math.floor(sec / 60);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
  if (hrs > 0) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  if (mins > 0) return `${mins} minute${mins > 1 ? "s" : ""} ago`;
  return "just now";
};

export default function UserManagement() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [pageUrl, setPageUrl] = useState(API_BASE); // current endpoint
  const [meta, setMeta] = useState({ count: 0, next: null, previous: null });
  const [showCreateUserModal,setShowCreateUserModal] = useState(false);

  useEffect(() => {
    const url = new URL(API_BASE, window.location.origin);
    if (search.trim()) url.searchParams.set("search", search.trim());
    if (ordering) url.searchParams.set("ordering", ordering);
    setPageUrl(url.pathname + url.search);
  }, [search, ordering]);

   const fetchUsers = async () => {
      setLoading(true);
      setErr("");
      try {
        const token = tokenService.getAccess
          ? tokenService.getAccess()
          : tokenService.get?.();
        const res = await axiosInstance.get(pageUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const { results, count, next, previous } = res.data;
        setRows(results || []);
        setMeta({ count: count ?? 0, next, previous });
      } catch (e) {
        setErr("Something went wrong, try again…");
      } finally {
        setLoading(false);
      }
    };
  // fetch data
  useEffect(() => {
   
    fetchUsers();
  }, [pageUrl]);

  // simple debounce for search typing
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setSearch(q), 400);
    return () => clearTimeout(t);
  }, [q]);

  const statusPill = (u) => {
    if (u.is_active) return <span className="user-mgmt-pill user-mgmt-pill--green">Active</span>;
    return <span className="user-mgmt-pill user-mgmt-pill--gray">Inactive</span>;
  };

  const orderedLabel = useMemo(() => {
    switch (ordering) {
      case "-created_at": return "Newest";
      case "created_at": return "Oldest";
      case "first_name": return "First name (A–Z)";
      case "-first_name": return "First name (Z–A)";
      case "updated_at": return "Last active (oldest)";
      case "-updated_at": return "Last active (newest)";
      default: return "Sort";
    }
  }, [ordering]);

  const handleDelete = async(id) => {
    console.log(id)
    try{
         await deleteUserApi(id);
        await fetchUsers();

    }catch(err){
        console.log(err)
    }
  } 

  return (
    <div className="user-mgmt-wrapper">
      <div className="user-mgmt-header">
        <h2>User Management</h2>
        <div className="user-mgmt-actions">
          <button className="user-mgmt-btn user-mgmt-btn--ghost" onClick={() => window.print()}>
            Export
          </button>
          <button className="user-mgmt-btn user-mgmt-btn--primary" onClick={() => setShowCreateUserModal(true)}>
            + Add User
          </button>
        </div>
      </div>
      <p className="user-mgmt-subtitle">
        Manage all users in one place. Control access, assign roles, and monitor activity across your platform.
      </p>

      <div className="user-mgmt-toolbar">
        <div className="user-mgmt-search">
          <IoSearch className="user-mgmt-search-icon" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search"
          />
        </div>

        <div className="user-mgmt-selects">
          <select
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
            className="user-mgmt-select"
            title="Sort"
          >
            <option value="-created_at">Newest</option>
            <option value="created_at">Oldest</option>
            <option value="first_name">First name (A–Z)</option>
            <option value="-first_name">First name (Z–A)</option>
            <option value="-updated_at">Last active (newest)</option>
            <option value="updated_at">Last active (oldest)</option>
          </select>
        </div>
      </div>

      <div className="user-mgmt-table-card">
        <div className="user-mgmt-table-scroll">
          <table className="user-mgmt-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>
                  <input type="checkbox" />
                </th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Role</th>
                <th>Department</th>
                <th>Joined Date</th>
                <th>Last Active</th>
                <th style={{ width: 90, textAlign: "center" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={10} className="center muted">
                    Loading…
                  </td>
                </tr>
              )}

              {!loading && err && (
                <tr>
                  <td colSpan={10} className="center error">
                    {err}
                  </td>
                </tr>
              )}

              {!loading && !err && rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="center muted">
                    No users found.
                  </td>
                </tr>
              )}

              {!loading &&
                !err &&
                rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <input type="checkbox" />
                    </td>

                    {/* Full name with avatar */}
                    <td>
                      <div className="user-mgmt-user-cell">
                        <div className="user-mgmt-user-meta">
                          <div className="user-mgmt-name">{fullName(u) || "—"}</div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="muted">{u.company_email || u.personal_email || "—"}</td>

                    {/* Phone */}
                    <td className="muted">{u.phone || "—"}</td>

                    {/* Status pill */}
                    <td>{statusPill(u)}</td>

                    {/* Role */}
                    <td>{(u.role || "").charAt(0).toUpperCase() + (u.role || "").slice(1)}</td>

                    {/* Department */}
                    <td>{u.department?.dept_name || "—"}</td>

                    {/* Joined */}
                    <td className="muted">{fmtDate(u.created_at)}</td>

                    {/* Last Active */}
                    <td className="muted">{timeAgo(u.updated_at)}</td>

                    {/* Actions */}
                    <td className="user-mgmt-actions">
                      <button className="user-mgmt-icon-btn" title="Edit">
                        <LuPencil />
                      </button>
                      <button 
                      onClick={() => handleDelete(u.id)}
                      className="user-mgmt-icon-btn danger" title="Delete">
                        <LuTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* footer */}
        <div className="user-mgmt-table-footer">
          <div className="muted">Rows: {rows.length} • Total: {meta.count}</div>
          <div className="user-mgmt-pager">
            <button
              className="user-mgmt-btn user-mgmt-btn--ghost"
              disabled={!meta.previous}
              onClick={() => meta.previous && setPageUrl(new URL(meta.previous, window.location.origin).pathname + new URL(meta.previous, window.location.origin).search)}
            >
              ‹ Prev
            </button>
            <button
              className="user-mgmt-btn user-mgmt-btn--ghost"
              disabled={!meta.next}
              onClick={() => meta.next && setPageUrl(new URL(meta.next, window.location.origin).pathname + new URL(meta.next, window.location.origin).search)}
            >
              Next ›
            </button>
          </div>
        </div>
      </div>
      {showCreateUserModal && <CreateUser onClose={() => setShowCreateUserModal(false)} fetchUsers={fetchUsers} />}
    </div>
  );
}
