import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./Profile.css";

const API_ORIGIN = "http://localhost:5000";

const getImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  return `${API_ORIGIN}/${image.replace(/^\/+/, "")}`;
};

const getInitials = (name) =>
  (name || "Traveller")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

function Profile() {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    full_name: user?.full_name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    profile_image: user?.profile_image || "",
    role: user?.role || "USER",
  });

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    bio: "",
    profile_image: "",
  });

  const [blogs, setBlogs] = useState([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError("");

        const [profileResponse, blogsResponse] = await Promise.all([
          api.get("/users/profile"),
          api.get("/blogs/user"),
        ]);

        if (!active) return;

        const profileData =
          profileResponse.data.data || profileResponse.data.user;

        if (profileData) {
          setProfile({
            full_name: profileData.full_name || "",
            email: profileData.email || "",
            bio: profileData.bio || "",
            profile_image: profileData.profile_image || "",
            role: profileData.role || user?.role || "USER",
          });
        }

        setBlogs(blogsResponse.data.data || []);
      } catch (err) {
        console.error("Profile loading failed:", err);

        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load profile information.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  const startEditing = () => {
    setFormData({
      full_name: profile.full_name,
      email: profile.email,
      bio: profile.bio,
      profile_image: profile.profile_image,
    });

    setError("");
    setMessage("");
    setEditing(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleCancel = () => {
    setEditing(false);
    setError("");
    setFormData({
      full_name: profile.full_name,
      email: profile.email,
      bio: profile.bio,
      profile_image: profile.profile_image,
    });
  };

  const handleSave = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await api.put("/users/profile", {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        bio: formData.bio.trim(),
        profile_image: formData.profile_image.trim(),
      });

      const updatedProfile = response.data.data || response.data.user;

      if (!updatedProfile) {
        throw new Error("Updated profile was not returned by the server.");
      }

      setProfile({
        full_name: updatedProfile.full_name || "",
        email: updatedProfile.email || "",
        bio: updatedProfile.bio || "",
        profile_image: updatedProfile.profile_image || "",
        role: updatedProfile.role || profile.role,
      });

      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Profile update failed:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to update your profile.",
      );
    } finally {
      setSaving(false);
    }
  };

  const fullName = profile.full_name || user?.full_name || "Traveller";
  const profileImage = getImageUrl(profile.profile_image);

  const publishedBlogs = blogs.filter((blog) => blog.status === "PUBLISHED");

  const draftBlogs = blogs.filter((blog) => blog.status !== "PUBLISHED");

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="profile-loader"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* PROFILE HEADER */}
      <div className="profile-topbar">
        <div className="profile-topbar-inner">
          <Link to="/" className="profile-back-link">
            <i className="bi bi-arrow-left"></i>
            Back to Home
          </Link>

          <h1>My Profile</h1>
        </div>
      </div>

      <main className="profile-container">
        {error && (
          <div className="profile-error" role="alert">
            <i className="bi bi-exclamation-circle"></i>
            {error}
          </div>
        )}

        {message && (
          <div className="profile-success" role="status">
            <i className="bi bi-check-circle"></i>
            {message}
          </div>
        )}

        {/* PROFILE INFORMATION */}
        <section className="profile-info-card">
          <div className="profile-info-heading">
            <div>
              <span className="profile-eyebrow">YOUR ACCOUNT</span>
              <h2>Profile Information</h2>
              <p>Manage your personal TravelTales information.</p>
            </div>

            {!editing && (
              <button
                type="button"
                className="profile-edit-link"
                onClick={startEditing}
              >
                <i className="bi bi-pencil-square"></i>
                Edit Profile
              </button>
            )}
          </div>

          <div className="profile-user-section">
            <div className="profile-large-avatar">
              {profileImage && (
                <img
                  src={profileImage}
                  alt={fullName}
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />
              )}

              <span>{getInitials(fullName)}</span>
            </div>

            <div className="profile-user-heading">
              <h3>{fullName}</h3>
              <p>{profile.email || "Email not available"}</p>

              <span className="profile-member-badge">
                <i className="bi bi-patch-check-fill"></i>
                TravelTales Member
              </span>
            </div>
          </div>

          {editing ? (
            <form className="profile-edit-form" onSubmit={handleSave}>
              <div className="profile-form-grid">
                <div className="profile-form-group">
                  <label htmlFor="full_name">Full Name</label>
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    value={formData.full_name}
                    onChange={handleChange}
                    maxLength="100"
                    required
                  />
                </div>

                <div className="profile-form-group">
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    maxLength="150"
                    required
                  />
                </div>

                <div className="profile-form-group profile-form-full">
                  <label htmlFor="bio">About Me</label>
                  <textarea
                    id="bio"
                    name="bio"
                    rows="4"
                    maxLength="500"
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself and your travel interests..."
                  />
                </div>

                <div className="profile-form-group profile-form-full">
                  <label htmlFor="profile_image">Profile Image URL</label>
                  <input
                    id="profile_image"
                    name="profile_image"
                    type="url"
                    value={formData.profile_image}
                    onChange={handleChange}
                    placeholder="https://example.com/profile.jpg"
                  />

                  <small>Enter a publicly accessible image URL.</small>
                </div>
              </div>

              {formData.profile_image && (
                <div className="profile-edit-preview">
                  <img
                    src={getImageUrl(formData.profile_image)}
                    alt="Profile preview"
                    onError={(event) => {
                      event.currentTarget.style.display = "none";
                    }}
                  />
                  <span>Profile image preview</span>
                </div>
              )}

              <div className="profile-form-actions">
                <button type="submit" disabled={saving}>
                  <i className="bi bi-check-lg"></i>
                  {saving ? "Saving..." : "Save Changes"}
                </button>

                <button
                  type="button"
                  className="profile-cancel-button"
                  onClick={handleCancel}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details-grid">
              <div className="profile-detail-item">
                <span>Full Name</span>
                <strong>{profile.full_name || "Not provided"}</strong>
              </div>

              <div className="profile-detail-item">
                <span>Email Address</span>
                <strong>{profile.email || "Not provided"}</strong>
              </div>

              <div className="profile-detail-item">
                <span>Account Type</span>
                <strong>{profile.role}</strong>
              </div>

              <div className="profile-detail-item">
                <span>About Me</span>
                <strong>{profile.bio || "No bio added yet."}</strong>
              </div>
            </div>
          )}
        </section>

        {/* BLOG STATISTICS */}
        <section className="profile-stats-grid">
          <div className="profile-stat-card">
            <div className="profile-stat-icon">
              <i className="bi bi-journal-richtext"></i>
            </div>
            <div>
              <span>Total Stories</span>
              <h3>{blogs.length}</h3>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="profile-stat-icon published-icon">
              <i className="bi bi-globe"></i>
            </div>
            <div>
              <span>Published Stories</span>
              <h3>{publishedBlogs.length}</h3>
            </div>
          </div>

          <div className="profile-stat-card">
            <div className="profile-stat-icon draft-icon">
              <i className="bi bi-pencil-square"></i>
            </div>
            <div>
              <span>Unpublished Stories</span>
              <h3>{draftBlogs.length}</h3>
            </div>
          </div>
        </section>

        {/* MY TRAVEL STORIES */}
        <section className="profile-stories-section">
          <div className="profile-section-heading">
            <div>
              <span className="profile-eyebrow">YOUR JOURNEY</span>
              <h2>My Travel Stories</h2>
              <p>All your travel experiences in one place.</p>
            </div>

            <Link to="/create-blog" className="profile-create-button">
              <i className="bi bi-plus-lg"></i>
              Create Story
            </Link>
          </div>

          {blogs.length === 0 ? (
            <div className="profile-empty">
              <div className="profile-empty-icon">
                <i className="bi bi-journal-plus"></i>
              </div>

              <h3>Your journey starts here!</h3>
              <p>
                You haven't created any travel stories yet. Share your first
                adventure with the community.
              </p>

              <Link to="/create-blog" className="profile-create-button">
                <i className="bi bi-plus-lg"></i>
                Create Your First Story
              </Link>
            </div>
          ) : (
            <div className="profile-stories-grid">
              {blogs.map((blog) => {
                const isPublished = blog.status === "PUBLISHED";

                return (
                  <article className="profile-story-card" key={blog.blog_id}>
                    <div className="profile-story-image">
                      {blog.cover_image ? (
                        <img
                          src={getImageUrl(blog.cover_image)}
                          alt={blog.title}
                          onError={(event) => {
                            event.currentTarget.style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="profile-story-placeholder">
                          <i className="bi bi-image"></i>
                        </div>
                      )}

                      <span
                        className={`profile-story-status ${
                          isPublished ? "status-published" : "status-draft"
                        }`}
                      >
                        {blog.status || "DRAFT"}
                      </span>
                    </div>

                    <div className="profile-story-body">
                      <div className="profile-story-location">
                        <i className="bi bi-geo-alt-fill"></i>
                        {blog.destination_name || "Travel Story"}
                        {blog.country ? `, ${blog.country}` : ""}
                      </div>

                      <h3>{blog.title}</h3>

                      <p className="profile-story-description">
                        {blog.story || "Explore this travel experience."}
                      </p>

                      <div className="profile-story-meta">
                        <span>
                          <i className="bi bi-calendar3"></i>
                          {blog.travel_date
                            ? new Date(blog.travel_date).toLocaleDateString()
                            : "Date not specified"}
                        </span>

                        <span>
                          <i className="bi bi-eye"></i>
                          {blog.views || 0} views
                        </span>
                      </div>

                      <div className="profile-story-actions">
                        {isPublished ? (
                          <Link
                            to={`/blogs/${blog.blog_id}`}
                            className="profile-view-story"
                          >
                            Read Story
                            <i className="bi bi-arrow-up-right"></i>
                          </Link>
                        ) : (
                          <Link
                            to={`/edit-blog/${blog.blog_id}`}
                            className="profile-view-story"
                          >
                            Edit Story
                            <i className="bi bi-pencil"></i>
                          </Link>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Profile;
