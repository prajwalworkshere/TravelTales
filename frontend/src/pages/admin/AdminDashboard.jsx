
import { useEffect, useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";

import { getAdminDashboard } from "../../services/adminDashboardService";

import "./AdminDashboard.css";

// ==========================================
// DATE FORMATTER
// ==========================================

const formatDate = (dateValue) => {
  if (!dateValue) return "—";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ==========================================
// STATUS LABEL
// ==========================================

const getStatusLabel = (status) => {
  switch (status) {
    case "DRAFT":
      return "Pending";

    case "PUBLISHED":
      return "Published";

    case "HIDDEN":
      return "Hidden";

    default:
      return status;
  }
};

// ==========================================
// MAIN ADMIN DASHBOARD
// ==========================================

function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  // ======================================
  // FETCH DASHBOARD DATA
  // ======================================

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await getAdminDashboard();

        if (!response.success) {
          throw new Error(response.message || "Unable to load dashboard.");
        }

        setDashboardData(response.data);
      } catch (error) {
        console.error("Fetch admin dashboard error:", error);

        setError(
          error.response?.data?.message ||
            error.message ||
            "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  // ======================================
  // EXTRACT DATA
  // ======================================

  const stats = dashboardData?.stats;

  const recentBlogs = dashboardData?.recentBlogs || [];

  // ======================================
  // FILTER RECENT BLOGS
  // ======================================

  const filteredBlogs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return recentBlogs.filter((blog) => {
      let matchesFilter = true;

      if (activeFilter === "Pending") {
        matchesFilter = blog.status === "DRAFT";
      } else if (activeFilter === "Published") {
        matchesFilter = blog.status === "PUBLISHED";
      } else if (activeFilter === "Hidden") {
        matchesFilter = blog.status === "HIDDEN";
      }

      const matchesSearch =
        !normalizedSearch ||
        (blog.title || "").toLowerCase().includes(normalizedSearch) ||
        (blog.author_name || "").toLowerCase().includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [recentBlogs, activeFilter, searchTerm]);

  // ======================================
  // STATISTICS CARDS
  // ======================================

  const dashboardStats = stats
    ? [
        {
          id: 1,
          title: "Total users",
          value: stats.totalUsers,
          description: `${stats.newUsersThisMonth} new travellers this month`,
          icon: "bi-people",
        },
        {
          id: 2,
          title: "Travel blogs",
          value: stats.totalBlogs,
          description: `${stats.publishedBlogs} published · ${stats.draftBlogs} awaiting review`,
          icon: "bi-journal-richtext",
          highlight: stats.draftBlogs > 0,
        },
        {
          id: 3,
          title: "Contact messages",
          value: stats.totalMessages,
          description: `${stats.newMessages} unread messages`,
          icon: "bi-envelope",
        },
      ]
    : [];

  // ======================================
  // CURRENT DATE
  // ======================================

  const currentDate = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // ======================================
  // LOADING STATE
  // ======================================

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>

        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  // ======================================
  // ERROR STATE
  // ======================================

  if (error) {
    return (
      <div className="admin-dashboard-error">
        <i className="bi bi-exclamation-circle"></i>

        <h3>Unable to load dashboard</h3>

        <p>{error}</p>

        <button
          type="button"
          className="admin-primary-button"
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  // ======================================
  // MAIN DASHBOARD UI
  // ======================================

  return (
    <div className="admin-dashboard">
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
            className={({ isActive }) =>
              `admin-nav-link ${isActive ? "active" : ""}`
            }
          >
            <i className="bi bi-grid"></i>
            <span>Overview</span>
          </NavLink>

          <NavLink to="/admin/users" className="admin-nav-link">
            <i className="bi bi-people"></i>
            <span>Users</span>
          </NavLink>

          <NavLink to="/admin/blogs" className="admin-nav-link">
            <i className="bi bi-journal-richtext"></i>
            <span>Blogs</span>

            {stats?.draftBlogs > 0 && <small>{stats.draftBlogs}</small>}
          </NavLink>

          <NavLink to="/admin/messages" className="admin-nav-link">
            <i className="bi bi-envelope"></i>
            <span>Contact Messages</span>

            {stats?.newMessages > 0 && <small>{stats.newMessages}</small>}
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
        {/* TOP BAR */}

        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <span>Admin</span>
            <i className="bi bi-chevron-right"></i>
            <strong>Overview</strong>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-date">{currentDate}</span>

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

        {/* DASHBOARD CONTENT */}

        <div className="admin-content">
          {/* WELCOME HEADER */}

          <section className="admin-welcome-header">
            <div>
              <span className="admin-eyebrow">TRAVELTALES AT A GLANCE</span>

              <h1>Welcome back, Admin.</h1>

              <p>Here's what's happening in your travel community.</p>
            </div>

            <Link to="/admin/blogs" className="admin-primary-button">
              <i className="bi bi-journal-richtext"></i>
              Manage blogs
            </Link>
          </section>

          {/* STATISTICS */}

          <section className="admin-stats-grid">
            {dashboardStats.map((stat) => (
              <article className="admin-stat-card" key={stat.id}>
                <div className="admin-stat-heading">
                  <span>{stat.title}</span>

                  <i className={`bi ${stat.icon}`}></i>
                </div>

                <h2>{stat.value}</h2>

                <p className={stat.highlight ? "warning-text" : ""}>
                  {stat.description}
                </p>
              </article>
            ))}
          </section>

          {/* PENDING BLOG NOTICE */}

          {stats?.draftBlogs > 0 && (
            <section className="admin-pending-banner">
              <div>
                <i className="bi bi-clipboard-check"></i>

                <span>
                  {stats.draftBlogs} travel{" "}
                  {stats.draftBlogs === 1 ? "story is" : "stories are"} waiting
                  for review.
                </span>
              </div>

              <Link to="/admin/blogs">
                Review pending blogs
                <i className="bi bi-arrow-right"></i>
              </Link>
            </section>
          )}

          {/* RECENT BLOGS */}

          <section className="admin-blogs-section">
            <div className="admin-blogs-heading">
              <h2>Recent travel blogs</h2>

              <Link to="/admin/blogs">
                View all blogs
                <i className="bi bi-arrow-right"></i>
              </Link>
            </div>

            {/* FILTERS AND SEARCH */}

            <div className="admin-blog-toolbar">
              <div className="admin-blog-filters">
                {["All", "Pending", "Published", "Hidden"].map((filter) => (
                  <button
                    type="button"
                    key={filter}
                    className={activeFilter === filter ? "active" : ""}
                    onClick={() => setActiveFilter(filter)}
                  >
                    {filter}

                    {filter === "Pending" && ` (${stats?.draftBlogs || 0})`}

                    {filter === "Published" &&
                      ` (${stats?.publishedBlogs || 0})`}

                    {filter === "Hidden" && ` (${stats?.hiddenBlogs || 0})`}
                  </button>
                ))}
              </div>

              <div className="admin-blog-search">
                <i className="bi bi-search"></i>

                <input
                  type="text"
                  placeholder="Search blogs or authors..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  aria-label="Search blogs or authors"
                />
              </div>
            </div>

            {/* BLOG TABLE */}

            <div className="admin-table-wrapper">
              <table className="admin-blog-table">
                <thead>
                  <tr>
                    <th>Blog</th>
                    <th>Author</th>
                    <th>Submitted</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredBlogs.length > 0 ? (
                    filteredBlogs.map((blog) => (
                      <tr key={blog.blog_id}>
                        <td>
                          <div className="admin-blog-info">
                            {blog.cover_image ? (
                              <img
                                src={blog.cover_image}
                                alt={blog.title || "Blog cover"}
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                            ) : (
                              <div className="admin-blog-placeholder">
                                <i className="bi bi-image"></i>
                              </div>
                            )}

                            <div>
                              <strong>{blog.title}</strong>
                              <span>Blog #{blog.blog_id}</span>
                            </div>
                          </div>
                        </td>

                        <td>{blog.author_name}</td>

                        <td>{formatDate(blog.created_at)}</td>

                        <td>
                          <span
                            className={`admin-status ${blog.status.toLowerCase()}`}
                          >
                            {getStatusLabel(blog.status)}
                          </span>
                        </td>

                        <td>
                          <div className="admin-table-actions">
                            <Link
                              to="/admin/blogs"
                              className="admin-action-link"
                            >
                              {blog.status === "DRAFT" ? "Review" : "View"}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="admin-empty-state">
                        No matching blogs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* FOOTER */}

          <footer className="admin-footer">
            © 2026 TravelTales. All rights reserved.
          </footer>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;
