
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./ManageUsers.css";

const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

function getInitials(name = "") {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getProfileImageUrl(image) {
  if (!image) return null;

  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }

  return `${API_ORIGIN}${image.startsWith("/") ? "" : "/"}${image}`;
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ManageUsers() {
  const { user: loggedInUser } = useAuth();

  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [roleFilter, setRoleFilter] = useState("All");

  const [selectedUser, setSelectedUser] = useState(null);

  // EDIT USER STATES
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    email: "",
    bio: "",
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // LOADING STATES
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [updatingRoleUserId, setUpdatingRoleUserId] = useState(null);

  // ALERT STATES
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // ==========================================
  // FETCH ALL USERS
  // GET /api/users
  // ==========================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/users");

      if (response.data.success) {
        setUsers(response.data.data || []);
      } else {
        setError(response.data.message || "Failed to retrieve users.");
      }
    } catch (error) {
      console.error("Fetch users error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load users. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ==========================================
  // USER STATISTICS
  // ==========================================

  const totalUsers = users.length;

  const activeUsers = users.filter(
    (user) => user.account_status === "ACTIVE"
  ).length;

  const inactiveUsers = users.filter(
    (user) => user.account_status === "INACTIVE"
  ).length;

  const adminCount = users.filter(
    (user) => user.role === "ADMIN"
  ).length;

  // ==========================================
  // SEARCH AND FILTER
  // ==========================================

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        (user.full_name || "").toLowerCase().includes(search) ||
        (user.email || "").toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" ||
        user.account_status === statusFilter;

      const matchesRole =
        roleFilter === "All" ||
        user.role === roleFilter;

      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, searchTerm, statusFilter, roleFilter]);

  // ==========================================
  // VIEW USER DETAILS
  // GET /api/users/:id
  // ==========================================

  const handleViewUser = async (userId) => {
    try {
      setDetailsLoading(true);
      setSelectedUser(null);
      setError("");

      const response = await api.get(`/users/${userId}`);

      if (response.data.success) {
        setSelectedUser(response.data.data);
      } else {
        setError(
          response.data.message || "Unable to retrieve user details."
        );
      }
    } catch (error) {
      console.error("Get user details error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to retrieve user details."
      );
    } finally {
      setDetailsLoading(false);
    }
  };

  // ==========================================
  // ACTIVATE / DEACTIVATE USER
  // PATCH /api/users/:id/status
  // ==========================================

  const handleStatusToggle = async (user) => {
    const newStatus =
      user.account_status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    const action = newStatus === "ACTIVE" ? "activate" : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${user.full_name}'s account?`
    );

    if (!confirmed) return;

    try {
      setUpdatingUserId(user.user_id);
      setError("");
      setSuccessMessage("");

      const response = await api.patch(
        `/users/${user.user_id}/status`,
        {
          account_status: newStatus,
        }
      );

      if (response.data.success) {
        const updatedUser = response.data.data;

        setUsers((previousUsers) =>
          previousUsers.map((item) =>
            item.user_id === user.user_id
              ? { ...item, ...updatedUser }
              : item
          )
        );

        setSelectedUser((previousUser) =>
          previousUser?.user_id === user.user_id
            ? { ...previousUser, ...updatedUser }
            : previousUser
        );

        setSuccessMessage(
          response.data.message ||
            "Account status updated successfully."
        );
      }
    } catch (error) {
      console.error("Update user status error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to update account status."
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  // ==========================================
  // PROMOTE / DEMOTE USER ROLE
  // PATCH /api/users/:id/role
  // ==========================================

  const handleRoleChange = async (targetUser, newRole) => {
    const isSelf =
      Number(targetUser.user_id) === Number(loggedInUser?.user_id);

    if (isSelf) {
      setError("You cannot change your own role.");
      return;
    }

    if (
      targetUser.role === "ADMIN" &&
      newRole === "USER" &&
      adminCount <= 1
    ) {
      setError("You cannot demote the last remaining admin.");
      return;
    }

    const action = newRole === "ADMIN" ? "promote" : "demote";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${targetUser.full_name} ${
        newRole === "ADMIN" ? "to Admin" : "to User"
      }?`
    );

    if (!confirmed) return;

    try {
      setUpdatingRoleUserId(targetUser.user_id);
      setError("");
      setSuccessMessage("");

      const response = await api.patch(
        `/users/${targetUser.user_id}/role`,
        { role: newRole }
      );

      if (response.data.success) {
        const updatedUser = response.data.data;

        setUsers((previousUsers) =>
          previousUsers.map((item) =>
            item.user_id === updatedUser.user_id
              ? { ...item, ...updatedUser }
              : item
          )
        );

        setSelectedUser((previousUser) =>
          previousUser?.user_id === updatedUser.user_id
            ? { ...previousUser, ...updatedUser }
            : previousUser
        );

        setSuccessMessage(
          response.data.message || "User role updated successfully."
        );
      }
    } catch (error) {
      console.error("Update user role error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to update user role."
      );
    } finally {
      setUpdatingRoleUserId(null);
    }
  };

  // ==========================================
  // OPEN EDIT USER MODAL
  // ==========================================

  const handleOpenEdit = (user) => {
    setEditingUser(user);

    setEditForm({
      full_name: user.full_name || "",
      email: user.email || "",
      bio: user.bio || "",
    });

    setError("");
    setSuccessMessage("");
  };

  // ==========================================
  // HANDLE EDIT FORM INPUTS
  // ==========================================

  const handleEditChange = (event) => {
    const { name, value } = event.target;

    setEditForm((previousForm) => ({
      ...previousForm,
      [name]: value,
    }));
  };

  // ==========================================
  // UPDATE USER
  // PUT /api/users/:id
  // ==========================================

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!editingUser) return;

    try {
      setSavingEdit(true);
      setError("");
      setSuccessMessage("");

      const payload = {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        bio: editForm.bio.trim() || null,
        profile_image: editingUser.profile_image || null,
      };

      const response = await api.put(
        `/users/${editingUser.user_id}`,
        payload
      );

      if (response.data.success) {
        const updatedUser = response.data.data;

        setUsers((previousUsers) =>
          previousUsers.map((user) =>
            user.user_id === updatedUser.user_id
              ? { ...user, ...updatedUser }
              : user
          )
        );

        setSelectedUser((previousUser) =>
          previousUser?.user_id === updatedUser.user_id
            ? { ...previousUser, ...updatedUser }
            : previousUser
        );

        setEditingUser(null);

        setSuccessMessage(
          response.data.message || "User updated successfully."
        );
      }
    } catch (error) {
      console.error("Update user error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to update user details."
      );
    } finally {
      setSavingEdit(false);
    }
  };

  // ==========================================
  // DELETE USER
  // DELETE /api/users/:id
  // ==========================================

  const handleDeleteUser = async (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${user.full_name}'s account?\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setDeletingUserId(user.user_id);
      setError("");
      setSuccessMessage("");

      const response = await api.delete(`/users/${user.user_id}`);

      if (response.data.success) {
        setUsers((previousUsers) =>
          previousUsers.filter(
            (item) => item.user_id !== user.user_id
          )
        );

        setSelectedUser((previousUser) =>
          previousUser?.user_id === user.user_id
            ? null
            : previousUser
        );

        setSuccessMessage(
          response.data.message || "User deleted successfully."
        );
      }
    } catch (error) {
      console.error("Delete user error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to delete this user."
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  // ==========================================
  // RENDER USER AVATAR
  // ==========================================

  const UserAvatar = ({ user, className = "user-avatar" }) => {
    const imageUrl = getProfileImageUrl(user.profile_image);

    return (
      <div className={className}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={user.full_name}
            onError={(event) => {
              event.currentTarget.style.display = "none";
              event.currentTarget.parentElement.textContent =
                getInitials(user.full_name);
            }}
          />
        ) : (
          getInitials(user.full_name)
        )}
      </div>
    );
  };

  // ==========================================
  // ROLE ACTION BUTTON
  // ==========================================

  const RoleActionButton = ({ targetUser }) => {
    const isSelf =
      Number(targetUser.user_id) === Number(loggedInUser?.user_id);

    const isAdmin = targetUser.role === "ADMIN";
    const isLastAdmin = isAdmin && adminCount <= 1;

    if (isSelf) {
      return (
        <button
          type="button"
          className="user-role-action-button"
          disabled
          title="You cannot change your own role"
        >
          Your account
        </button>
      );
    }

    if (isAdmin) {
      return (
        <button
          type="button"
          className="user-demote-button"
          disabled={
            updatingRoleUserId === targetUser.user_id ||
            isLastAdmin
          }
          title={
            isLastAdmin
              ? "The last remaining admin cannot be demoted"
              : "Demote this admin to a normal user"
          }
          onClick={() => handleRoleChange(targetUser, "USER")}
        >
          {updatingRoleUserId === targetUser.user_id
            ? "Updating..."
            : "Demote to User"}
        </button>
      );
    }

    return (
      <button
        type="button"
        className="user-promote-button"
        disabled={updatingRoleUserId === targetUser.user_id}
        onClick={() => handleRoleChange(targetUser, "ADMIN")}
      >
        {updatingRoleUserId === targetUser.user_id
          ? "Updating..."
          : "Promote to Admin"}
      </button>
    );
  };

  return (
    <div className="admin-dashboard manage-users-page">
      {/* SIDEBAR */}

      <aside className="admin-sidebar">
        <Link to="/" className="admin-brand">
          <span className="admin-brand-icon">
            <i className="bi bi-compass"></i>
          </span>

          <span className="admin-brand-name">
            <strong>TravelTales</strong>
            <small>ADMIN WORKSPACE</small>
          </span>
        </Link>

        <nav className="admin-navigation">
          <NavLink
            to="/admin/dashboard"
            end
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            <i className="bi bi-grid"></i>
            <span>Overview</span>
          </NavLink>

          <NavLink
            to="/admin/users"
            end
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            <i className="bi bi-people"></i>
            <span>Users</span>
          </NavLink>

          <NavLink to="/admin/blogs" className="admin-nav-link">
            <i className="bi bi-journal-richtext"></i>
            <span>Blogs</span>
            <small>8</small>
          </NavLink>

          <NavLink to="/admin/messages" className="admin-nav-link">
            <i className="bi bi-envelope"></i>
            <span>Contact Messages</span>
            <small>5</small>
          </NavLink>
        </nav>

        <div className="admin-sidebar-bottom">
          <Link to="/" className="admin-website-link">
            <i className="bi bi-box-arrow-up-right"></i>
            <span>View website</span>
          </Link>
        </div>
      </aside>

      {/* MAIN AREA */}

      <main className="admin-main">
        {/* TOPBAR */}

        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <span>Admin</span>
            <i className="bi bi-chevron-right"></i>
            <strong>Users</strong>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-date">
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>

            <button
              type="button"
              className="admin-notification"
              aria-label="Notifications"
            >
              <i className="bi bi-bell"></i>
            </button>

            <div className="admin-user-avatar">AD</div>
          </div>
        </header>

        {/* PAGE CONTENT */}

        <div className="admin-content">
          {/* PAGE HEADER */}

          <section className="users-page-header">
            <div>
              <span className="admin-eyebrow">
                COMMUNITY MANAGEMENT
              </span>

              <h1>Manage users</h1>

              <p>
                View registered travellers and manage their account access.
              </p>
            </div>
          </section>

          {/* SUCCESS MESSAGE */}

          {successMessage && (
            <div className="alert alert-success" role="alert">
              <i className="bi bi-check-circle me-2"></i>
              {successMessage}

              <button
                type="button"
                className="btn-close float-end"
                aria-label="Close"
                onClick={() => setSuccessMessage("")}
              ></button>
            </div>
          )}

          {/* ERROR MESSAGE */}

          {error && (
            <div className="alert alert-danger" role="alert">
              <i className="bi bi-exclamation-circle me-2"></i>
              {error}

              <button
                type="button"
                className="btn-close float-end"
                aria-label="Close"
                onClick={() => setError("")}
              ></button>
            </div>
          )}

          {/* USER STATISTICS */}

          <section className="users-stats-grid">
            <article className="users-stat-card">
              <div className="users-stat-icon">
                <i className="bi bi-people"></i>
              </div>

              <div>
                <span>Total users</span>
                <h2>{loading ? "—" : totalUsers}</h2>
              </div>
            </article>

            <article className="users-stat-card">
              <div className="users-stat-icon success">
                <i className="bi bi-person-check"></i>
              </div>

              <div>
                <span>Active users</span>
                <h2>{loading ? "—" : activeUsers}</h2>
              </div>
            </article>

            <article className="users-stat-card">
              <div className="users-stat-icon warning">
                <i className="bi bi-person-dash"></i>
              </div>

              <div>
                <span>Inactive users</span>
                <h2>{loading ? "—" : inactiveUsers}</h2>
              </div>
            </article>
          </section>

          {/* USERS TABLE CARD */}

          <section className="users-table-section">
            <div className="users-table-heading">
              <div>
                <h2>Registered users</h2>
                <p>Manage the accounts registered on TravelTales.</p>
              </div>

              <span className="users-count-label">
                {loading
                  ? "Loading..."
                  : `${filteredUsers.length} users found`}
              </span>
            </div>

            {/* FILTER AND SEARCH TOOLBAR */}

            <div className="users-toolbar">
              <div className="users-filter-group">
                <label htmlFor="statusFilter">Account status</label>

                <select
                  id="statusFilter"
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(event.target.value)
                  }
                >
                  <option value="All">All statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>

              <div className="users-filter-group">
                <label htmlFor="roleFilter">User role</label>

                <select
                  id="roleFilter"
                  value={roleFilter}
                  onChange={(event) =>
                    setRoleFilter(event.target.value)
                  }
                >
                  <option value="All">All roles</option>
                  <option value="USER">User</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>

              <div className="users-search-box">
                <i className="bi bi-search"></i>

                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(event.target.value)
                  }
                  aria-label="Search users by name or email"
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                  >
                    <i className="bi bi-x-circle"></i>
                  </button>
                )}
              </div>
            </div>

            {/* USERS TABLE */}

            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Role</th>
                    <th>Joined date</th>
                    <th>Blogs</th>
                    <th>Account status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6" className="users-empty-state">
                        <i className="bi bi-arrow-repeat"></i>
                        <strong>Loading users...</strong>
                        <span>
                          Please wait while we retrieve user records.
                        </span>
                      </td>
                    </tr>
                  ) : filteredUsers.length > 0 ? (
                    filteredUsers.map((user) => (
                      <tr key={user.user_id}>
                        {/* USER DETAILS */}

                        <td>
                          <div className="user-profile-cell">
                            <UserAvatar user={user} />

                            <div className="user-identity">
                              <strong>{user.full_name}</strong>
                              <span>{user.email}</span>
                            </div>
                          </div>
                        </td>

                        {/* ROLE */}

                        <td>
                          <span
                            className={`user-role ${(user.role || "USER").toLowerCase()}`}
                          >
                            {user.role === "ADMIN" ? "Admin" : "User"}
                          </span>
                        </td>

                        {/* JOINED DATE */}

                        <td>{formatDate(user.created_at)}</td>

                        {/* BLOG COUNT */}

                        <td>
                          <span className="user-blog-count">
                            {user.blogs ?? 0}
                          </span>
                        </td>

                        {/* ACCOUNT STATUS */}

                        <td>
                          <span
                            className={`user-account-status ${(user.account_status || "").toLowerCase()}`}
                          >
                            <span></span>

                            {user.account_status === "ACTIVE"
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        {/* ACTIONS */}

                        <td>
                          <div className="user-actions">
                            <button
                              type="button"
                              className="user-view-button"
                              onClick={() =>
                                handleViewUser(user.user_id)
                              }
                            >
                              <i className="bi bi-eye"></i>
                              View
                            </button>

                            <button
                              type="button"
                              className="user-view-button"
                              onClick={() => handleOpenEdit(user)}
                            >
                              <i className="bi bi-pencil"></i>
                              Edit
                            </button>

                            <RoleActionButton targetUser={user} />

                            <button
                              type="button"
                              className="user-delete-button"
                              disabled={
                                deletingUserId === user.user_id ||
                                user.role === "ADMIN"
                              }
                              title={
                                user.role === "ADMIN"
                                  ? "Administrator accounts cannot be deleted"
                                  : "Delete user"
                              }
                              onClick={() => handleDeleteUser(user)}
                            >
                              {deletingUserId === user.user_id ? (
                                "Deleting..."
                              ) : (
                                <>
                                  <i className="bi bi-trash3"></i>
                                  Delete
                                </>
                              )}
                            </button>

                            <button
                              type="button"
                              disabled={
                                updatingUserId === user.user_id
                              }
                              className={
                                user.account_status === "ACTIVE"
                                  ? "user-toggle-button deactivate"
                                  : "user-toggle-button activate"
                              }
                              onClick={() =>
                                handleStatusToggle(user)
                              }
                            >
                              {updatingUserId === user.user_id
                                ? "Updating..."
                                : user.account_status === "ACTIVE"
                                  ? "Deactivate"
                                  : "Activate"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="users-empty-state">
                        <i className="bi bi-search"></i>
                        <strong>No users found</strong>
                        <span>
                          Try changing your search or filters.
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* TABLE FOOTER */}

            <div className="users-table-footer">
              Showing {loading ? 0 : filteredUsers.length} of {totalUsers} users
            </div>
          </section>

          {/* FOOTER */}

          <footer className="admin-footer">
            © 2026 TravelTales. All rights reserved.
          </footer>
        </div>
      </main>

      {/* ======================================
          EDIT USER MODAL
      ====================================== */}

      {editingUser && (
        <div
          className="user-modal-backdrop"
          onClick={() => !savingEdit && setEditingUser(null)}
        >
          <div
            className="user-details-modal edit-user-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-user-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="user-modal-header">
              <div>
                <span className="admin-eyebrow">
                  ACCOUNT MANAGEMENT
                </span>

                <h2 id="edit-user-modal-title">Edit user</h2>
              </div>

              <button
                type="button"
                disabled={savingEdit}
                onClick={() => setEditingUser(null)}
                aria-label="Close edit user modal"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="edit-user-form">
                <div className="edit-user-field">
                  <label htmlFor="editFullName">Full name</label>

                  <input
                    id="editFullName"
                    type="text"
                    name="full_name"
                    value={editForm.full_name}
                    onChange={handleEditChange}
                    minLength={2}
                    maxLength={100}
                    required
                    placeholder="Enter full name"
                  />
                </div>

                <div className="edit-user-field">
                  <label htmlFor="editEmail">Email address</label>

                  <input
                    id="editEmail"
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    maxLength={150}
                    required
                    placeholder="Enter email address"
                  />
                </div>

                <div className="edit-user-field">
                  <label htmlFor="editBio">Bio</label>

                  <textarea
                    id="editBio"
                    name="bio"
                    value={editForm.bio}
                    onChange={handleEditChange}
                    maxLength={500}
                    rows={4}
                    placeholder="Write something about this user..."
                  />

                  <small>{editForm.bio.length}/500 characters</small>
                </div>

                <div className="edit-user-field">
                  <label htmlFor="editRole">Account role</label>

                  <input
                    id="editRole"
                    type="text"
                    value={
                      editingUser.role === "ADMIN" ? "Admin" : "User"
                    }
                    disabled
                  />

                  <small>
                    Use the Promote or Demote action to change a user's role.
                  </small>
                </div>
              </div>

              <div className="user-modal-actions">
                <button
                  type="button"
                  className="user-modal-close"
                  disabled={savingEdit}
                  onClick={() => setEditingUser(null)}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="user-modal-activate"
                  disabled={savingEdit}
                >
                  {savingEdit ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        aria-hidden="true"
                      ></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg me-1"></i>
                      Save changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILS LOADING MODAL */}

      {detailsLoading && (
        <div className="user-modal-backdrop">
          <div className="user-details-modal text-center">
            <i className="bi bi-arrow-repeat fs-3"></i>
            <p className="mt-3 mb-0">Loading user details...</p>
          </div>
        </div>
      )}

      {/* ======================================
          USER DETAILS MODAL
      ====================================== */}

      {selectedUser && (
        <div
          className="user-modal-backdrop"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="user-details-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="user-modal-header">
              <div>
                <span className="admin-eyebrow">
                  ACCOUNT INFORMATION
                </span>

                <h2 id="user-modal-title">User details</h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                aria-label="Close user details"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="user-modal-profile">
              <UserAvatar
                user={selectedUser}
                className="user-modal-avatar"
              />

              <h3>{selectedUser.full_name}</h3>
              <span>{selectedUser.email}</span>
            </div>

            <div className="user-details-list">
              <div>
                <span>User ID</span>
                <strong>#{selectedUser.user_id}</strong>
              </div>

              <div>
                <span>Role</span>
                <strong>
                  {selectedUser.role === "ADMIN" ? "Admin" : "User"}
                </strong>
              </div>

              <div>
                <span>Joined date</span>
                <strong>{formatDate(selectedUser.created_at)}</strong>
              </div>

              <div>
                <span>Bio</span>
                <strong>{selectedUser.bio || "Not provided"}</strong>
              </div>

              <div>
                <span>Account status</span>

                <strong
                  className={
                    selectedUser.account_status === "ACTIVE"
                      ? "modal-active"
                      : "modal-inactive"
                  }
                >
                  {selectedUser.account_status === "ACTIVE"
                    ? "Active"
                    : "Inactive"}
                </strong>
              </div>
            </div>

            <div className="user-modal-actions">
              <button
                type="button"
                className="user-modal-close"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>

              <RoleActionButton targetUser={selectedUser} />

              <button
                type="button"
                className="user-delete-button"
                disabled={
                  deletingUserId === selectedUser.user_id ||
                  selectedUser.role === "ADMIN"
                }
                onClick={() => handleDeleteUser(selectedUser)}
              >
                {deletingUserId === selectedUser.user_id
                  ? "Deleting..."
                  : (
                    <>
                      <i className="bi bi-trash3 me-1"></i>
                      Delete user
                    </>
                  )}
              </button>

              <button
                type="button"
                disabled={
                  updatingUserId === selectedUser.user_id
                }
                className={
                  selectedUser.account_status === "ACTIVE"
                    ? "user-modal-deactivate"
                    : "user-modal-activate"
                }
                onClick={() => handleStatusToggle(selectedUser)}
              >
                {updatingUserId === selectedUser.user_id
                  ? "Updating..."
                  : selectedUser.account_status === "ACTIVE"
                    ? "Deactivate account"
                    : "Activate account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
