
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../services/api";

const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const fallbackImage =
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1400&q=85";

const getImageUrl = (imagePath) => {
  if (!imagePath) return fallbackImage;

  if (imagePath.startsWith("http")) return imagePath;

  return `${API_ORIGIN}/${imagePath.replace(/^\/+/, "")}`;
};

function DestinationDetails() {
  const { id } = useParams();

  const [destination, setDestination] = useState(null);
  const [blogs, setBlogs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDestinationDetails = async () => {
      try {
        setLoading(true);
        setError("");

        const [destinationResponse, blogResponse] = await Promise.all([
          api.get(`/destinations/${id}`),
          api.get("/blogs"),
        ]);

        const destinationData = destinationResponse.data.data;
        const publishedBlogs = blogResponse.data.data || [];

        setDestination(destinationData);

        setBlogs(
          publishedBlogs.filter(
            (blog) =>
              Number(blog.destination_id) ===
              Number(destinationData.destination_id)
          )
        );
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load destination details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDestinationDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <p>Loading destination details...</p>
      </div>
    );
  }

  if (error || !destination) {
    return (
      <div className="container py-5">

        <div className="alert alert-danger">
          {error || "Destination not found."}
        </div>

        <Link to="/explore" className="btn btn-outline-primary">
          ← Back to Explore
        </Link>

      </div>
    );
  }

  const location = [
    destination.city,
    destination.state_region,
    destination.country,
  ]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="destination-details-page">

      {/* =====================================
          DESTINATION HERO
      ====================================== */}

      <section
        style={{
          minHeight: "350px",
          display: "flex",
          alignItems: "center",
          backgroundImage: `linear-gradient(rgba(20,46,64,0.72), rgba(20,46,64,0.72)), url("${fallbackImage}")`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          color: "#fff",
        }}
      >
        <div className="container py-5">

          <Link
            to="/explore"
            style={{
              color: "#fff",
              textDecoration: "none",
              display: "inline-block",
              marginBottom: "25px",
            }}
          >
            ← Back to Explore
          </Link>

          <h1
            style={{
              fontSize: "clamp(32px, 5vw, 52px)",
              fontWeight: 700,
            }}
          >
            {destination.destination_name}
          </h1>

          <p style={{ fontSize: "18px" }}>
            <i className="bi bi-geo-alt"></i> {location}
          </p>

        </div>
      </section>

      {/* =====================================
          DESTINATION INFORMATION
      ====================================== */}

      <section className="container py-5">

        <div className="row g-4">

          <div className="col-lg-8">

            <span className="text-uppercase text-info fw-bold">
              Discover this destination
            </span>

            <h2 className="mt-2">
              About {destination.destination_name}
            </h2>

            <p
              className="mt-3"
              style={{
                color: "#6F8798",
                lineHeight: 1.9,
                fontSize: "16px",
              }}
            >
              {destination.description ||
                `Explore ${destination.destination_name}, ${destination.country}, and discover travel experiences shared by the TravelTales community.`}
            </p>

          </div>

          <div className="col-lg-4">

            <div
              className="p-4 rounded"
              style={{
                background: "#F3F8FA",
                border: "1px solid #DCE7EC",
              }}
            >
              <h4>Destination Information</h4>

              <p className="mb-2 mt-3">
                <strong>Destination:</strong>
                <br />
                {destination.destination_name}
              </p>

              {destination.city && (
                <p className="mb-2">
                  <strong>City:</strong>
                  <br />
                  {destination.city}
                </p>
              )}

              {destination.state_region && (
                <p className="mb-2">
                  <strong>State / Region:</strong>
                  <br />
                  {destination.state_region}
                </p>
              )}

              <p className="mb-0">
                <strong>Country:</strong>
                <br />
                {destination.country}
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================
          PUBLISHED BLOGS FOR THIS DESTINATION
      ====================================== */}

      <section
        className="py-5"
        style={{ background: "#F3F8FA" }}
      >
        <div className="container">

          <div className="text-center mb-5">

            <span className="text-uppercase fw-bold text-info">
              Stories from Travellers
            </span>

            <h2 className="mt-2">
              Travel Stories from {destination.destination_name}
            </h2>

            <p className="text-secondary">
              Explore experiences shared by travellers who visited this place.
            </p>

          </div>

          {blogs.length === 0 ? (
            <div className="text-center py-4">

              <h4>No published stories yet</h4>

              <p className="text-secondary">
                Be the first to share your experience from this destination.
              </p>

              <Link
                to="/create-blog"
                className="btn btn-primary"
              >
                Share Your Story
              </Link>

            </div>
          ) : (
            <div className="row g-4">

              {blogs.map((blog) => (
                <div
                  className="col-md-6 col-lg-4"
                  key={blog.blog_id}
                >

                  <article className="card h-100 border-0 shadow-sm">

                    <img
                      src={getImageUrl(blog.cover_image)}
                      alt={blog.title}
                      className="card-img-top"
                      style={{
                        height: "220px",
                        objectFit: "cover",
                      }}
                    />

                    <div className="card-body d-flex flex-column">

                      <span className="text-info small fw-semibold">
                        {blog.category_name || "Travel"}
                      </span>

                      <h3 className="h5 mt-2">
                        {blog.title}
                      </h3>

                      <p className="text-secondary small">
                        By {blog.author_name || "Traveller"}
                      </p>

                      <p style={{ lineHeight: 1.7 }}>
                        {blog.story
                          ? `${blog.story.slice(0, 130)}${
                              blog.story.length > 130 ? "..." : ""
                            }`
                          : "Read this travel experience."}
                      </p>

                      <Link
                        to={`/blogs/${blog.blog_id}`}
                        className="btn btn-outline-primary mt-auto"
                      >
                        Read Full Story →
                      </Link>

                    </div>

                  </article>

                </div>
              ))}

            </div>
          )}

        </div>
      </section>

      {/* =====================================
          BACK TO EXPLORE
      ====================================== */}

      <section className="container text-center py-5">

        <h3>Want to explore more destinations?</h3>

        <Link
          to="/explore"
          className="btn btn-primary mt-3"
        >
          Explore More Destinations
        </Link>

      </section>

    </div>
  );
}

export default DestinationDetails;
