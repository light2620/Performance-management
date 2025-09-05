import { useEffect, useState } from "react";
import { getAllNotifications, markAsRead } from "../../Apis/NotificationApis";
import NotificationModal from "../../Components/NotificationModal/NotificationModal";
import NotificationListener from "../../Components/NotificationListener/NotificationListener";
import "./style.css";

const API_URL = "/notifications/";


const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedNotif, setSelectedNotif] = useState(null);

  // filters
  const [isRead, setIsRead] = useState("");
  const [type, setType] = useState("");
  const [ordering, setOrdering] = useState("-created_at");

  // pagination
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetchNotifications(API_URL);
  }, [isRead, type, ordering]);

  const fetchNotifications = async (url) => {
    try {
      setLoading(true);

      let query = "";
      if (isRead) query += `&is_read=${isRead}`;
      if (type) query += `&type=${type}`;
      if (ordering) query += `&ordering=${ordering}`;

      const finalUrl = url.includes("?")
        ? url
        : `${url}?${query.startsWith("&") ? query.slice(1) : query}`;

      const res = await getAllNotifications(finalUrl);
      
      setNotifications(res.data.results);
      setCount(res.data.count);
      setNextUrl(res.data.next);
      setPrevUrl(res.data.previous);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await markAsRead(id);
      await fetchNotifications(API_URL);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="notifications-container">
      {/* Header */}
      <div className="notifications-header">
        <h2 className="title">Notifications</h2>
        <button
          className="refresh-btn"
          onClick={() => {
            setIsRead("");
            setType("");
            setOrdering("-created_at");
            fetchNotifications(API_URL);
          }}
        >
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="filter-bar">
        <select value={isRead} onChange={(e) => setIsRead(e.target.value)}>
          <option value="">All</option>
          <option value="false">Unread</option>
          <option value="true">Read</option>
        </select>

        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="MERIT_AWARDED">Merit Awarded</option>
          <option value="DEMERIT_GIVEN">Demerit Given</option>
          <option value="REQUEST_APPROVED">Request Approved</option>
          <option value="REQUEST_REJECTED">Request Rejected</option>
        </select>

        <select value={ordering} onChange={(e) => setOrdering(e.target.value)}>
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
        </select>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <p className="loading">Loading...</p>
        ) : notifications.length === 0 ? (
          <p className="no-data">No notifications found.</p>
        ) : (
          <table className="notifications-table">
            <thead>
              <tr>
                
                <th>Type</th>
                <th>Status</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((n) => (
                <tr key={n.id} className={n.is_read ? "read" : "unread"}>
                 
                  <td>{n.type_display}</td>
                  <td>{n.is_read ? "Read" : "Unread"}</td>
                  <td>{new Date(n.created_at).toLocaleString()}</td>
                  <td>
                   <button
  className="mark-read-btn"
  onClick={() => {
    if (!n.is_read) {
      // only mark unread notifications
      markAsRead(n.id).catch(console.error);
    }
    setSelectedNotif({ id: n.id, message: n.message });
  }}
>
  View
</button>

                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="pagination">
        <p className="pagination-info">
          Showing {notifications.length} of {count} notifications
        </p>
        <div className="pagination-buttons">
          <button
            disabled={!prevUrl}
            onClick={() => fetchNotifications(prevUrl)}
            className="pagination-btn"
          >
            ← Prev
          </button>
          <button
            disabled={!nextUrl}
            onClick={() => fetchNotifications(nextUrl)}
            className="pagination-btn"
          >
            Next →
          </button>
        </div>
      </div>
{selectedNotif && (
  <NotificationModal
    id={selectedNotif.id}
    previewMessage={selectedNotif.message} // pass message from list
    fetchNotifications={() => fetchNotifications(API_URL)}
    onClose={() => {
        fetchNotifications(API_URL);
        setSelectedNotif(null)}}
  />
)}

    </div>
  );
};

export default Notifications;
