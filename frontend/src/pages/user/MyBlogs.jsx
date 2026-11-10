import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./MyBlogs.css";

const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (imagePath.startsWith("http")) return imagePath;

  return `${API_ORIGIN}/${imagePath.replace(/^\/+/, "")}`;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=85";

function MyBlogs() {
  const navigate = useNavigate();

  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyBlogs = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/blogs/user");

        setBlogs(response.data.data || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load your travel stories.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMyBlogs();
  }, []);

  const handleDelete = async (blogId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this travel story?",
    );

    if (!confirmDelete) return;

    try {
      const response = await api.delete(`/blogs/${blogId}`);

      alert(response.data.message || "Blog deleted successfully.");

      setBlogs((previousBlogs) =>
        previousBlogs.filter((blog) => blog.blog_id !== blogId),
      );
    } catch (err) {
      alert(err.response?.data?.message || "Unable to delete this blog.");
    }
  };

  const publishedCount = blogs.filter(
    (blog) => blog.status === "PUBLISHED",
  ).length;

  const draftCount = blogs.filter((blog) => blog.status === "DRAFT").length;

  const hiddenCount = blogs.filter((blog) => blog.status === "HIDDEN").length;

  if (loading) {
    return (
      <div className="my-blogs-message">
        <h2>Loading your travel stories...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-blogs-message">
        <h2>Unable to load your blogs</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="my-blogs-page">
      <div className="my-blogs-header">
        <span className="my-blogs-label">YOUR TRAVEL JOURNAL</span>

        <h1>My Travel Stories</h1>

        <p>Manage and revisit all the journeys you have shared.</p>

        <Link to="/create-blog" className="my-blogs-create-btn">
          <i className="bi bi-plus-circle"></i>
          Create New Story
        </Link>
      </div>

      <div className="my-blogs-stats">
        <div className="my-blog-stat">
          <h3>{blogs.length}</h3>
          <p>Total Stories</p>
        </div>

        <div className="my-blog-stat">
          <h3>{publishedCount}</h3>
          <p>Published</p>
        </div>

        <div className="my-blog-stat">
          <h3>{draftCount}</h3>
          <p>Pending / Draft</p>
        </div>

        <div className="my-blog-stat">
          <h3>{hiddenCount}</h3>
          <p>Hidden</p>
        </div>
      </div>

      <div className="my-blogs-container">
        {blogs.length === 0 ? (
          <div className="my-blogs-empty">
            <i className="bi bi-journal-richtext"></i>
            <h2>You haven't shared any stories yet.</h2>
            <p>Your travel experiences deserve to be shared.</p>

            <Link to="/create-blog" className="my-blogs-create-btn">
              Share Your First Story
            </Link>
          </div>
        ) : (
          <div className="row g-4">
            {blogs.map((blog) => (
              <div className="col-md-6 col-lg-4" key={blog.blog_id}>
                <article className="my-blog-card">
                  <div className="my-blog-image">
                    <img
                      src={getImageUrl(blog.cover_image) || fallbackImage}
                      alt={blog.title}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackImage;
                      }}
                    />

                    <span
                      className={`my-blog-status status-${(
                        blog.status || "DRAFT"
                      ).toLowerCase()}`}
                    >
                      {blog.status || "DRAFT"}
                    </span>
                  </div>

                  <div className="my-blog-content">
                    <span className="my-blog-category">
                      {blog.category_name || "Travel"}
                    </span>

                    <h2>{blog.title}</h2>

                    <p className="my-blog-destination">
                      <i className="bi bi-geo-alt"></i>
                      {blog.destination_name || "Destination not specified"}
                      {blog.country ? `, ${blog.country}` : ""}
                    </p>

                    <div className="my-blog-meta">
                      <span>
                        <i className="bi bi-eye"></i> {blog.views || 0} views
                      </span>

                      <span>
                        {blog.travel_date
                          ? new Date(blog.travel_date).toLocaleDateString()
                          : ""}
                      </span>
                    </div>

                    <div className="my-blog-actions">
                      {blog.status === "PUBLISHED" ? (
                        <Link
                          to={`/blogs/${blog.blog_id}`}
                          className="my-blog-view-btn"
                        >
                          View Story
                        </Link>
                      ) : (
                        <span className="my-blog-not-published">
                          Awaiting publication
                        </span>
                      )}

                      <Link
                        to={`/edit-blog/${blog.blog_id}`}
                        className="my-blog-edit-btn"
                      >
                        Edit
                      </Link>

                      <button
                        type="button"
                        className="my-blog-delete-btn"
                        onClick={() => handleDelete(blog.blog_id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyBlogs;
