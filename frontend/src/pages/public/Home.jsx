
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDestinations } from "../../services/destinationService";
import api from "../../services/api";
import "./Home.css";

const fallbackImages = [
  "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=900&q=85",
];

const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

function getBlogImageUrl(imagePath) {
  if (!imagePath) {
    return null;
  }

  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  return `${API_ORIGIN}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const dateString = String(dateValue);

  const date = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(dateString)
      ? `${dateString}T00:00:00`
      : dateString
  );

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function Home() {
  const { isAuthenticated } = useAuth();

  // Logged-in users can create blogs.
  // Logged-out users must log in first.
  const storyPath = isAuthenticated ? "/create-blog" : "/login";

  // Destination states.
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Popular blog states.
  const [blogs, setBlogs] = useState([]);
  const [blogsLoading, setBlogsLoading] = useState(true);
  const [blogsError, setBlogsError] = useState("");

  // Fetch featured destinations.
  useEffect(() => {
    const fetchDestinations = async () => {
      try {
        const response = await getDestinations();
        const records = response.data || [];

        setDestinations(records.slice(0, 3));
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load destinations."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDestinations();
  }, []);

  // Fetch published blogs for the Popular Travel Stories section.
  useEffect(() => {
    const fetchPopularBlogs = async () => {
      try {
        setBlogsLoading(true);
        setBlogsError("");

        // Public API: only published blogs are returned.
        const response = await api.get("/blogs");

        const records = response.data?.data || [];

        // Sort by views (highest first) and display three blogs.
        const popularBlogs = [...records]
          .sort((a, b) => (b.views || 0) - (a.views || 0))
          .slice(0, 3);

        setBlogs(popularBlogs);
      } catch (err) {
        console.error("Error fetching popular blogs:", err);

        setBlogsError(
          err.response?.data?.message ||
            "Unable to load travel stories right now."
        );
      } finally {
        setBlogsLoading(false);
      }
    };

    fetchPopularBlogs();
  }, []);

  return (
    <div className="home-page">

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>

        <div className="container hero-content">
          <span className="hero-tag">YOUR JOURNEY, YOUR STORY</span>

          <h1>
            Discover Places.<br />
            Share <span>Stories.</span><br />
            Create Memories.
          </h1>

          <p>
            Explore beautiful destinations, read real travel experiences
            and share your own adventures with travellers around the world.
          </p>

          <div className="hero-buttons">
            <Link to="/explore" className="btn-primary-custom">
              Explore Destinations →
            </Link>

            <Link to={storyPath} className="btn-outline-custom">
              Share Your Story
            </Link>
          </div>
        </div>

        <div className="hero-scroll-indicator">
          <span></span>
          Scroll to explore
        </div>
      </section>

      {/* Introduction Section */}
      <section className="intro-section section-padding">
        <div className="container">
          <div className="section-heading text-center">
            <span className="section-label">WELCOME TO TRAVELTALES</span>

            <h2>
              Every Destination Has <span>A Story</span>
            </h2>

            <p>
              Travel is more than visiting places. It is about experiences,
              discoveries and memories worth sharing.
            </p>
          </div>

          <div className="row g-4 intro-features">
            <div className="col-md-4">
              <div className="feature-item">
                <div className="feature-icon">🌍</div>
                <h4>Discover Places</h4>
                <p>Find interesting destinations for your next adventure.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="feature-item">
                <div className="feature-icon">📖</div>
                <h4>Read Experiences</h4>
                <p>Explore travel stories shared by other travellers.</p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="feature-item">
                <div className="feature-icon">✍️</div>
                <h4>Share Your Stories</h4>
                <p>Publish your travel memories and inspire others.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Destinations */}
      <section className="destinations-section section-padding">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-label">EXPLORE THE WORLD</span>
              <h2>
                Featured <span>Destinations</span>
              </h2>
              <p>Discover places for your next travel experience.</p>
            </div>

            <Link to="/explore" className="text-link">
              Explore All Destinations →
            </Link>
          </div>

          {loading && <p>Loading destinations...</p>}

          {error && (
            <div className="alert alert-danger">
              {error}
            </div>
          )}

          {!loading && !error && destinations.length === 0 && (
            <p>No active destinations available right now.</p>
          )}

          <div className="row g-4">
            {destinations.map((destination, index) => (
              <div
                className="col-md-6 col-lg-4"
                key={destination.destination_id}
              >
                <article className="destination-card">
                  <div className="destination-image-wrapper">
                    <img
                      src={
                        destination.image ||
                        destination.cover_image ||
                        fallbackImages[index % fallbackImages.length]
                      }
                      alt={destination.destination_name}
                      className="destination-image"
                      loading="lazy"
                    />
                  </div>

                  <div className="destination-content">
                    <h3>{destination.destination_name}</h3>

                    <p>
                      {destination.description ||
                        `${destination.city || ""} ${
                          destination.state_region || ""
                        } ${destination.country}`}
                    </p>

                    <Link to="/explore" className="card-link">
                      Discover More →
                    </Link>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Travel Stories */}
      <section className="popular-section section-padding">
        <div className="container">
          <div className="section-header">
            <div>
              <span className="section-label">STORIES THAT INSPIRE</span>
              <h2>
                Popular Travel <span>Stories</span>
              </h2>
              <p>Read experiences shared by our travel community.</p>
            </div>

            <Link to="/explore" className="text-link">
              View All Stories →
            </Link>
          </div>

          {/* Loading */}
          {blogsLoading && (
            <div className="text-center py-5">
              <p>Loading travel stories...</p>
            </div>
          )}

          {/* Error */}
          {!blogsLoading && blogsError && (
            <div className="alert alert-danger">
              {blogsError}
            </div>
          )}

          {/* Empty State */}
          {!blogsLoading && !blogsError && blogs.length === 0 && (
            <div className="text-center py-5">
              <p>
                No published travel stories are available right now.
              </p>

              <Link to={storyPath} className="card-link">
                Share Your Story →
              </Link>
            </div>
          )}

          {/* Blog Cards */}
          {!blogsLoading && !blogsError && blogs.length > 0 && (
            <div className="row g-4">
              {blogs.map((blog, index) => (
                <div className="col-md-6 col-lg-4" key={blog.blog_id}>
                  <article className="destination-card popular-blog-card">
                    <div className="destination-image-wrapper">
                      <img
                        src={
                          getBlogImageUrl(blog.cover_image) ||
                          fallbackImages[index % fallbackImages.length]
                        }
                        alt={blog.title}
                        className="destination-image"
                        loading="lazy"
                      />
                    </div>

                    <div className="destination-content">
                      {blog.category_name && (
                        <span className="section-label">
                          {blog.category_name}
                        </span>
                      )}

                      <h3>{blog.title}</h3>

                      <p>
                        {blog.story
                          ? `${blog.story.slice(0, 120)}${
                              blog.story.length > 120 ? "..." : ""
                            }`
                          : "Read this travel experience shared by our community."}
                      </p>

                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <small className="text-muted">
                          By {blog.author_name || "Traveller"}
                        </small>

                        <small className="text-muted">
                          <i className="bi bi-eye me-1"></i>
                          {(blog.views || 0).toLocaleString("en-IN")}
                        </small>
                      </div>

                      {blog.destination_name && (
                        <p className="mb-2">
                          <i className="bi bi-geo-alt me-1"></i>
                          {blog.destination_name}
                        </p>
                      )}

                      {blog.travel_date && (
                        <small className="text-muted d-block mb-3">
                          Travel date: {formatDate(blog.travel_date)}
                        </small>
                      )}

                      <Link to="/explore" className="card-link">
                        Explore Stories →
                      </Link>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call To Action */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <span className="section-label">YOUR STORY MATTERS</span>

            <h2>
              Every Traveller Has<br />
              A Story Worth Sharing.
            </h2>

            <p>
              Become a part of TravelTales. Share your adventures and
              inspire fellow travellers.
            </p>

            <Link to={storyPath} className="btn-primary-custom">
              {isAuthenticated ? "Create Your Story →" : "Join TravelTales →"}
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}

export default Home;
