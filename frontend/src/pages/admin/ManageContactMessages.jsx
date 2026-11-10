import { useCallback, useEffect, useState } from "react";

import "./ManageContactMessages.css";

import {
  getContactMessages,
  getContactMessageStats,
  getContactMessageById,
  updateContactMessageStatus,
} from "../../services/adminContactService";

// ==========================================
// MANAGE CONTACT MESSAGES COMPONENT
// ==========================================

function ManageContactMessages() {
  // ==========================================
  // STATES
  // ==========================================

  const [messages, setMessages] = useState([]);

  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    read: 0,
    resolved: 0,
  });

  const [searchTerm, setSearchTerm] = useState("");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedMessage, setSelectedMessage] = useState(null);

  const [loading, setLoading] = useState(true);

  const [detailLoading, setDetailLoading] = useState(false);

  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [error, setError] = useState("");

  const [detailError, setDetailError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // HELPER: GET ERROR MESSAGE
  // ==========================================

  const getErrorMessage = (error, fallback) => {
    return error.response?.data?.message || error.message || fallback;
  };

  // ==========================================
  // API: FETCH CONTACT MESSAGES
  // ==========================================

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getContactMessages({
        search: searchTerm.trim(),
        status: statusFilter,
      });

      if (response.success) {
        setMessages(response.data || []);
      } else {
        setMessages([]);
        setError("Unable to retrieve contact messages.");
      }
    } catch (error) {
      console.error("Fetch contact messages error:", error);

      setMessages([]);

      setError(getErrorMessage(error, "Unable to load contact messages."));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  // ==========================================
  // API: FETCH MESSAGE STATISTICS
  // ==========================================

  const fetchStats = useCallback(async () => {
    try {
      const response = await getContactMessageStats();

      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Fetch contact message statistics error:", error);
    }
  }, []);

  // ==========================================
  // INITIAL DATA + SEARCH/FILTER
  // ==========================================

  useEffect(() => {
    // Debounce search to avoid sending an API
    // request for every individual keystroke.

    const timer = setTimeout(() => {
      fetchMessages();
    }, 300);

    return () => clearTimeout(timer);
  }, [fetchMessages]);

  // Fetch statistics when the component loads.
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ==========================================
  // API: VIEW MESSAGE DETAILS
  // ==========================================

  const handleViewMessage = async (messageId) => {
    try {
      setSelectedMessage(null);
      setDetailLoading(true);
      setDetailError("");
      setError("");

      const response = await getContactMessageById(messageId);

      if (response.success) {
        setSelectedMessage(response.data);
      } else {
        setDetailError("Unable to retrieve message details.");
      }
    } catch (error) {
      console.error("Get message details error:", error);

      setDetailError(
        getErrorMessage(error, "Unable to retrieve message details."),
      );
    } finally {
      setDetailLoading(false);
    }
  };

  // ==========================================
  // API: UPDATE MESSAGE STATUS
  // ==========================================

  const handleStatusChange = async (messageId, newStatus) => {
    try {
      setUpdatingStatus(true);
      setDetailError("");
      setSuccessMessage("");

      const response = await updateContactMessageStatus(messageId, newStatus);

      if (response.success) {
        // Update selected modal message.
        setSelectedMessage(response.data);

        // Update the message in the current list.
        setMessages((previousMessages) =>
          previousMessages.map((message) =>
            message.message_id === messageId ? response.data : message,
          ),
        );

        // Refresh statistics from the database.
        await fetchStats();

        // Refresh the current list so status filtering
        // remains accurate after a status change.
        await fetchMessages();

        setSuccessMessage("Message status updated successfully.");
      } else {
        setDetailError(response.message || "Unable to update message status.");
      }
    } catch (error) {
      console.error("Update message status error:", error);

      setDetailError(
        getErrorMessage(error, "Unable to update message status."),
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  // ==========================================
  // HELPER: STATUS CSS CLASS
  // ==========================================

  const getStatusClass = (status) => {
    switch (status) {
      case "NEW":
        return "message-status-new";

      case "READ":
        return "message-status-read";

      case "RESOLVED":
        return "message-status-resolved";

      default:
        return "";
    }
  };

  // ==========================================
  // HELPER: FORMAT DATE
  // ==========================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // CLOSE MODAL
  // ==========================================

  const closeModal = () => {
    if (updatingStatus) {
      return;
    }

    setSelectedMessage(null);
    setDetailError("");
    setSuccessMessage("");
  };

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="manage-messages-page">
      {/* Page heading */}

      <div className="messages-page-header">
        <div>
          <p className="messages-breadcrumb">
            Admin Dashboard / Contact Messages
          </p>

          <h1>Manage Contact Messages</h1>

          <p className="messages-page-description">
            View messages submitted by users and manage their status.
          </p>
        </div>
      </div>

      {/* Summary cards */}

      <div className="messages-stats-grid">
        <div className="message-stat-card">
          <div className="message-stat-icon total-icon">
            <i className="bi bi-envelope"></i>
          </div>

          <div>
            <p>Total Messages</p>
            <h2>{stats.total}</h2>
          </div>
        </div>

        <div className="message-stat-card">
          <div className="message-stat-icon new-icon">
            <i className="bi bi-envelope-exclamation"></i>
          </div>

          <div>
            <p>New Messages</p>
            <h2>{stats.new}</h2>
          </div>
        </div>

        <div className="message-stat-card">
          <div className="message-stat-icon read-icon">
            <i className="bi bi-envelope-open"></i>
          </div>

          <div>
            <p>Read Messages</p>
            <h2>{stats.read}</h2>
          </div>
        </div>

        <div className="message-stat-card">
          <div className="message-stat-icon resolved-icon">
            <i className="bi bi-check-circle"></i>
          </div>

          <div>
            <p>Resolved Messages</p>
            <h2>{stats.resolved}</h2>
          </div>
        </div>
      </div>

      {/* Messages section */}

      <div className="messages-content-card">
        <div className="messages-toolbar">
          <div>
            <h2>Contact Messages</h2>
            <p>Review and manage user enquiries.</p>
          </div>

          <div className="messages-controls">
            <div className="messages-search">
              <i className="bi bi-search"></i>

              <input
                type="text"
                placeholder="Search name, email or subject..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter messages by status"
            >
              <option value="ALL">All Statuses</option>
              <option value="NEW">New</option>
              <option value="READ">Read</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Error message */}

        {error && (
          <div className="alert alert-danger mx-3" role="alert">
            {error}
            <button
              type="button"
              className="btn btn-sm btn-outline-danger ms-3"
              onClick={() => {
                fetchMessages();
                fetchStats();
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Messages table */}

        <div className="messages-table-wrapper">
          <table className="messages-table">
            <thead>
              <tr>
                <th>Sender</th>
                <th>Subject</th>
                <th>Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="messages-empty">
                    <i className="bi bi-arrow-repeat"></i>
                    <p>Loading contact messages...</p>
                  </td>
                </tr>
              ) : messages.length > 0 ? (
                messages.map((message) => (
                  <tr key={message.message_id}>
                    <td>
                      <div className="message-sender">
                        <strong>{message.full_name}</strong>
                        <span>{message.email}</span>
                      </div>
                    </td>

                    <td className="message-subject">{message.subject}</td>

                    <td className="message-date">
                      {formatDate(message.created_at)}
                    </td>

                    <td>
                      <span
                        className={`message-status ${getStatusClass(message.status)}`}
                      >
                        {message.status}
                      </span>
                    </td>

                    <td>
                      <button
                        type="button"
                        className="message-view-button"
                        onClick={() => handleViewMessage(message.message_id)}
                      >
                        <i className="bi bi-eye"></i>
                        View
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="messages-empty">
                    <i className="bi bi-inbox"></i>
                    <p>No contact messages found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="messages-table-footer">
          Showing {messages.length} messages
        </div>
      </div>

      {/* Message details modal */}

      {detailLoading && (
        <div className="alert alert-info mt-3" role="status">
          Loading message details...
        </div>
      )}

      {detailError && !selectedMessage && (
        <div className="alert alert-danger mt-3" role="alert">
          {detailError}
        </div>
      )}

      {selectedMessage && (
        <div className="message-modal-backdrop" onClick={closeModal}>
          <div
            className="message-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="message-modal-header">
              <div>
                <p>Message Details</p>
                <h2>{selectedMessage.subject}</h2>
              </div>

              <button
                type="button"
                className="message-modal-close"
                onClick={closeModal}
                aria-label="Close message details"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="message-modal-body">
              <div className="message-detail-row">
                <span>From</span>
                <strong>{selectedMessage.full_name}</strong>
              </div>

              <div className="message-detail-row">
                <span>Email</span>
                <strong>{selectedMessage.email}</strong>
              </div>

              <div className="message-detail-row">
                <span>Date</span>
                <strong>{formatDate(selectedMessage.created_at)}</strong>
              </div>

              <div className="message-detail-row">
                <span>Status</span>

                <strong
                  className={`message-status ${getStatusClass(selectedMessage.status)}`}
                >
                  {selectedMessage.status}
                </strong>
              </div>

              <div className="message-body-content">
                <h3>Message</h3>
                <p>{selectedMessage.message}</p>
              </div>

              {/* Status update */}

              <div className="message-status-actions">
                <label htmlFor="messageStatus">Update Message Status</label>

                <select
                  id="messageStatus"
                  value={selectedMessage.status}
                  disabled={updatingStatus}
                  onChange={(event) =>
                    handleStatusChange(
                      selectedMessage.message_id,
                      event.target.value,
                    )
                  }
                >
                  <option value="NEW">New</option>
                  <option value="READ">Read</option>
                  <option value="RESOLVED">Resolved</option>
                </select>
              </div>

              {updatingStatus && (
                <p className="text-muted mt-2">Updating message status...</p>
              )}

              {detailError && (
                <div className="alert alert-danger mt-3">{detailError}</div>
              )}

              {successMessage && (
                <div className="alert alert-success mt-3">{successMessage}</div>
              )}
            </div>

            <div className="message-modal-footer">
              <button
                type="button"
                onClick={closeModal}
                disabled={updatingStatus}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageContactMessages;
