
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  getBlogs,
  getBlogById,
  updateBlogStatus,
  deleteBlog,
} from "../../services/adminBlogService";

import "./ManageBlogs.css";

function ManageBlogs() {
  // Blog records received from the backend.
  const [blogs, setBlogs] = useState([]);

  // Search, filter and pagination.
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    limit: 10,
    totalBlogs: 0,
    totalPages: 0,
  });

  // Statistics received from the backend.
  const [statistics, setStatistics] = useState({
    total: 0,
    published: 0,
    hidden: 0,
  });

  // Loading and error states.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Blog details modal.
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Extract a useful error message from Axios errors.
  function getErrorMessage(error) {
    return (
      error.response?.data?.message ||
      error.message ||
      "Something went wrong. Please try again."
    );
  }

  // Format dates received from MySQL.
  function formatDate(dateValue) {
    if (!dateValue) {
      return "Not available";
    }

    const dateString = String(dateValue);

    const date = new Date(
      /^\d{4}-\d{2}-\d{2}$/.test(dateString)
        ? `${dateString}T00:00:00`
        : dateString
    );

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  // Return the appropriate CSS class for a blog status.
  function getStatusClass(status) {
    if (status === "PUBLISHED") {
      return "blog-status-published";
    }

    if (status === "HIDDEN") {
      return "blog-status-hidden";
    }

    return "blog-status-draft";
  }

  // API 1: Fetch blogs from the backend.
  const fetchBlogs = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        setError("");

        const params = {
          page,
          limit: 10,
        };

        if (statusFilter !== "ALL") {
          params.status = statusFilter;
        }

        if (searchTerm.trim()) {
          params.search = searchTerm.trim();
        }

        const response = await getBlogs(params);

        setBlogs(response.data || []);
        setPagination(
          response.pagination || {
            currentPage: page,
            limit: 10,
            totalBlogs: 0,
            totalPages: 0,
          }
        );
      } catch (error) {
        console.error("Error fetching blogs:", error);
        setError(getErrorMessage(error));
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    },
    [statusFilter, searchTerm]
  );

  // Fetch the complete blog list whenever search/filter/page changes.
  useEffect(() => {
    const timer = setTimeout(
      () => {
        fetchBlogs(currentPage);
      },
      searchTerm ? 400 : 0
    );

    return () => clearTimeout(timer);
  }, [fetchBlogs, currentPage, searchTerm]);

  // Fetch overall statistics.
  const fetchStatistics = useCallback(async () => {
    try {
      const [allResponse, publishedResponse, hiddenResponse] =
        await Promise.all([
          getBlogs({ page: 1, limit: 1 }),
          getBlogs({ page: 1, limit: 1, status: "PUBLISHED" }),
          getBlogs({ page: 1, limit: 1, status: "HIDDEN" }),
        ]);

      setStatistics({
        total: allResponse.pagination?.totalBlogs || 0,
        published: publishedResponse.pagination?.totalBlogs || 0,
        hidden: hiddenResponse.pagination?.totalBlogs || 0,
      });
    } catch (error) {
      console.error("Error fetching blog statistics:", error);
    }
  }, []);

  useEffect(() => {
    fetchStatistics();
  }, [fetchStatistics]);

  // API 2: Open complete blog details.
  async function handleViewBlog(blogId) {
    try {
      setDetailLoading(true);
      setSelectedBlog(null);
      setError("");

      const response = await getBlogById(blogId);

      setSelectedBlog(response.data);
    } catch (error) {
      console.error("Error fetching blog details:", error);
      setError(getErrorMessage(error));
    } finally {
      setDetailLoading(false);
    }
  }

  // API 3: Publish or hide a blog.
  async function handleStatusChange(blog) {
    const newStatus =
      blog.status === "PUBLISHED" ? "HIDDEN" : "PUBLISHED";

    const confirmed = window.confirm(
      newStatus === "PUBLISHED"
        ? "Are you sure you want to publish this blog?"
        : "Are you sure you want to hide this blog?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(blog.blog_id);
      setError("");
      setSuccess("");

      await updateBlogStatus(blog.blog_id, newStatus);

      setSuccess(
        newStatus === "PUBLISHED"
          ? "Blog published successfully."
          : "Blog hidden successfully."
      );

      await fetchBlogs(currentPage);
      await fetchStatistics();

      if (selectedBlog?.blog_id === blog.blog_id) {
        const detailResponse = await getBlogById(blog.blog_id);
        setSelectedBlog(detailResponse.data);
      }
    } catch (error) {
      console.error("Error updating blog status:", error);
      setError(getErrorMessage(error));
    } finally {
      setActionLoadingId(null);
    }
  }

  // API 4: Permanently delete a blog.
  async function handleDeleteBlog(blogId) {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this blog? This action cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoadingId(blogId);
      setError("");
      setSuccess("");

      await deleteBlog(blogId);

      setSelectedBlog(null);
      setSuccess("Blog deleted successfully.");

      await fetchStatistics();
      await fetchBlogs(currentPage);
    } catch (error) {
      console.error("Error deleting blog:", error);
      setError(getErrorMessage(error));
    } finally {
      setActionLoadingId(null);
    }
  }

  // Change status filter and start from the first page.
  function handleFilterChange(event) {
    setStatusFilter(event.target.value);
    setCurrentPage(1);
  }

  // Change search term and start from the first page.
  function handleSearchChange(event) {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  }

  // Pagination controls.
  function handlePreviousPage() {
    if (currentPage > 1) {
      setCurrentPage((previousPage) => previousPage - 1);
    }
  }

  function handleNextPage() {
    if (currentPage < pagination.totalPages) {
      setCurrentPage((previousPage) => previousPage + 1);
    }
  }

  return (
    <div className="manage-blogs-layout">
      {/* Sidebar */}
      <aside className="manage-blogs-sidebar">
        <div className="manage-blogs-brand">
          <i className="bi bi-compass-fill"></i>
          <span>TravelTales</span>
        </div>

        <p className="manage-blogs-sidebar-label">MAIN MENU</p>

        <nav className="manage-blogs-navigation">
          <Link to="/admin/dashboard" className="manage-blogs-nav-link">
            <i className="bi bi-grid-1x2-fill"></i>
            <span>Dashboard</span>
          </Link>

          <Link to="/admin/users" className="manage-blogs-nav-link">
            <i className="bi bi-people-fill"></i>
            <span>Manage Users</span>
          </Link>

          <Link to="/admin/blogs" className="manage-blogs-nav-link active">
            <i className="bi bi-journal-richtext"></i>
            <span>Manage Blogs</span>
          </Link>
        </nav>

        <div className="manage-blogs-sidebar-bottom">
          <Link to="/" className="manage-blogs-nav-link">
            <i className="bi bi-house-door-fill"></i>
            <span>Back to Website</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="manage-blogs-main">
        {/* Topbar */}
        <header className="manage-blogs-topbar">
          <div>
            <p>Administration</p>
            <h2>Manage Blogs</h2>
          </div>

          <div className="manage-blogs-profile">
            <div className="manage-blogs-avatar">A</div>

            <div>
              <strong>Administrator</strong>
              <span>Admin</span>
            </div>
          </div>
        </header>

        <div className="manage-blogs-content">
          {/* Page Heading */}
          <section className="manage-blogs-heading">
            <h1>Blog Management</h1>

            <p>
              Review, monitor, and manage travel stories submitted by users.
            </p>
          </section>

          {/* Success Message */}
          {success && (
            <div className="alert alert-success" role="alert">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          {/* Statistics */}
          <section className="manage-blogs-statistics">
            <div className="manage-blogs-stat-card">
              <div className="manage-blogs-stat-icon total-icon">
                <i className="bi bi-journal-text"></i>
              </div>

              <div>
                <p>Total Blogs</p>
                <h3>{statistics.total}</h3>
              </div>
            </div>

            <div className="manage-blogs-stat-card">
              <div className="manage-blogs-stat-icon published-icon">
                <i className="bi bi-check-circle-fill"></i>
              </div>

              <div>
                <p>Published</p>
                <h3>{statistics.published}</h3>
              </div>
            </div>

            <div className="manage-blogs-stat-card">
              <div className="manage-blogs-stat-icon hidden-icon">
                <i className="bi bi-eye-slash-fill"></i>
              </div>

              <div>
                <p>Hidden</p>
                <h3>{statistics.hidden}</h3>
              </div>
            </div>
          </section>

          {/* Blogs Table */}
          <section className="manage-blogs-table-section">
            <div className="manage-blogs-table-header">
              <div>
                <h3>All Managed Blogs</h3>
                <p>Manage draft, published and hidden travel stories.</p>
              </div>

              <span className="manage-blogs-count">
                {pagination.totalBlogs} Blogs
              </span>
            </div>

            {/* Search and Filter */}
            <div className="manage-blogs-toolbar">
              <div className="manage-blogs-search">
                <i className="bi bi-search"></i>

                <input
                  type="text"
                  placeholder="Search title or author..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>

              <select
                className="manage-blogs-filter"
                value={statusFilter}
                onChange={handleFilterChange}
              >
                <option value="ALL">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="HIDDEN">Hidden</option>
              </select>
            </div>

            {/* Table */}
            <div className="manage-blogs-table-wrapper">
              <table className="manage-blogs-table">
                <thead>
                  <tr>
                    <th>Blog</th>
                    <th>Author</th>
                    <th>Travel Date</th>
                    <th>Views</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="6">
                        <div className="manage-blogs-empty">
                          <p>Loading blogs...</p>
                        </div>
                      </td>
                    </tr>
                  ) : blogs.length > 0 ? (
                    blogs.map((blog) => (
                      <tr key={blog.blog_id}>
                        <td>
                          <div className="manage-blogs-title-cell">
                            <strong>{blog.title}</strong>
                            <span>Blog #{blog.blog_id}</span>
                          </div>
                        </td>

                        <td>{blog.author_name}</td>

                        <td>{formatDate(blog.travel_date)}</td>

                        <td>
                          <span className="manage-blogs-views">
                            <i className="bi bi-eye"></i>
                            {(blog.views || 0).toLocaleString("en-IN")}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`manage-blogs-status ${getStatusClass(blog.status)}`}
                          >
                            {blog.status}
                          </span>
                        </td>

                        <td>
                          <div className="manage-blogs-actions">
                            {/* View */}
                            <button
                              type="button"
                              className="manage-blogs-action-btn view-btn"
                              title="View blog"
                              onClick={() => handleViewBlog(blog.blog_id)}
                              disabled={actionLoadingId === blog.blog_id}
                            >
                              <i className="bi bi-eye"></i>
                            </button>

                            {/* Publish or Hide */}
                            <button
                              type="button"
                              className={`manage-blogs-action-btn ${
                                blog.status === "PUBLISHED"
                                  ? "hide-btn"
                                  : "publish-btn"
                              }`}
                              title={
                                blog.status === "PUBLISHED"
                                  ? "Hide blog"
                                  : "Publish blog"
                              }
                              onClick={() => handleStatusChange(blog)}
                              disabled={actionLoadingId === blog.blog_id}
                            >
                              <i
                                className={
                                  blog.status === "PUBLISHED"
                                    ? "bi bi-eye-slash"
                                    : "bi bi-check-lg"
                                }
                              ></i>
                            </button>

                            {/* Delete */}
                            <button
                              type="button"
                              className="manage-blogs-action-btn delete-btn"
                              title="Delete blog"
                              onClick={() => handleDeleteBlog(blog.blog_id)}
                              disabled={actionLoadingId === blog.blog_id}
                            >
                              <i className="bi bi-trash3"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">
                        <div className="manage-blogs-empty">
                          <i className="bi bi-search"></i>
                          <h4>No blogs found</h4>
                          <p>Try changing your search or status filter.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {!loading && pagination.totalPages > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 24px",
                  borderTop: "1px solid #DCE7EC",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "13px", color: "#6F8798" }}>
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage <= 1}
                  >
                    Previous
                  </button>

                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= pagination.totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="manage-blogs-footer">
          © 2026 TravelTales. All rights reserved.
        </footer>
      </main>

      {/* Blog Details Modal */}
      {detailLoading && (
        <div className="manage-blogs-modal-overlay">
          <div className="manage-blogs-modal">
            <div className="manage-blogs-modal-body">
              <p>Loading blog details...</p>
            </div>
          </div>
        </div>
      )}

      {selectedBlog && (
        <div
          className="manage-blogs-modal-overlay"
          onClick={() => setSelectedBlog(null)}
        >
          <div
            className="manage-blogs-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="manage-blogs-modal-header">
              <div>
                <span>Blog Details</span>
                <h3>{selectedBlog.title}</h3>
              </div>

              <button
                type="button"
                className="manage-blogs-modal-close"
                onClick={() => setSelectedBlog(null)}
                aria-label="Close blog details"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="manage-blogs-modal-body">
              <div className="manage-blogs-detail-meta">
                <div>
                  <span>Author</span>
                  <strong>{selectedBlog.author_name}</strong>
                </div>

                <div>
                  <span>Author Email</span>
                  <strong>{selectedBlog.author_email}</strong>
                </div>

                <div>
                  <span>Travel Date</span>
                  <strong>{formatDate(selectedBlog.travel_date)}</strong>
                </div>

                <div>
                  <span>Views</span>
                  <strong>
                    {(selectedBlog.views || 0).toLocaleString("en-IN")}
                  </strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong
                    className={`manage-blogs-status ${getStatusClass(selectedBlog.status)}`}
                  >
                    {selectedBlog.status}
                  </strong>
                </div>

                <div>
                  <span>Published On</span>
                  <strong>{formatDate(selectedBlog.published_at)}</strong>
                </div>
              </div>

              <div className="manage-blogs-detail-section">
                <h4>Travel Story</h4>
                <p>{selectedBlog.story || "No travel story available."}</p>
              </div>

              <div className="manage-blogs-detail-section">
                <h4>Travel Tips</h4>
                <p>
                  {selectedBlog.travel_tips || "No travel tips available."}
                </p>
              </div>

              {/* Additional blog images */}
              {selectedBlog.images?.length > 0 && (
                <div className="manage-blogs-detail-section">
                  <h4>Blog Images</h4>

                  {selectedBlog.images.map((image) => (
                    <div key={image.image_id}>
                      <p>{image.image_caption || "Blog image"}</p>
                      <p>{image.image_path}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="manage-blogs-modal-footer">
              <button
                type="button"
                className="modal-delete-btn"
                onClick={() => handleDeleteBlog(selectedBlog.blog_id)}
                disabled={actionLoadingId === selectedBlog.blog_id}
              >
                <i className="bi bi-trash3"></i>
                Delete Blog
              </button>

              <button
                type="button"
                className="modal-close-action"
                onClick={() => setSelectedBlog(null)}
              >
                Close
              </button>

              <button
                type="button"
                className={
                  selectedBlog.status === "PUBLISHED"
                    ? "modal-hide-btn"
                    : "modal-publish-btn"
                }
                onClick={() => handleStatusChange(selectedBlog)}
                disabled={actionLoadingId === selectedBlog.blog_id}
              >
                {selectedBlog.status === "PUBLISHED"
                  ? "Hide Blog"
                  : "Publish Blog"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageBlogs;
