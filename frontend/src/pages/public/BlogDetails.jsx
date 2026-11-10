
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./BlogDetails.css";

const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (imagePath.startsWith("http")) return imagePath;

  return `${API_ORIGIN}/${imagePath.replace(/^\/+/, "")}`;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=1400&q=85";

function BlogDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Lightbox image state.
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(`/blogs/${id}`);

        setBlog(response.data.data);
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load this travel story."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchBlog();
  }, [id]);

  // Close image viewer when Escape is pressed.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedImage(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Prevent background scrolling while the image viewer is open.
  useEffect(() => {
    if (selectedImage) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [selectedImage]);

  // Open an image in the lightbox.
  function handleImageClick(src, alt) {
    if (!src) return;

    setSelectedImage({ src, alt });
  }

  if (loading) {
    return (
      <div className="blog-details-message">
        <h2>Loading travel story...</h2>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="blog-details-message">
        <button className="back-btn" onClick={() => navigate("/explore")}>
          ← Back to Explore
        </button>
        <h2>{error || "Travel story not found."}</h2>
      </div>
    );
  }

  const images = blog.images || [];
  const coverImage = getImageUrl(blog.cover_image) || fallbackImage;

  return (
    <div className="blog-details-page">
      <div className="details-navbar">
        <button
          className="back-btn"
          onClick={() => navigate("/explore")}
        >
          ← Back to Explore
        </button>

        <span className="details-logo">✧ TravelTales</span>
      </div>

      <article className="blog-article">
        <div className="article-heading">
          <div className="article-meta">
            <span className="article-category">
              {blog.category_name || "Travel"}
            </span>

            <span>
              {blog.destination_name}
              {blog.country ? `, ${blog.country}` : ""}
            </span>
          </div>

          <h1>{blog.title}</h1>

          <div className="article-author">
            {blog.author_image ? (
              <img
                className="author-avatar-image"
                src={getImageUrl(blog.author_image)}
                alt={blog.author_name || "Author"}
              />
            ) : (
              <div className="author-avatar">
                {(blog.author_name || "T").charAt(0).toUpperCase()}
              </div>
            )}

            <div>
              <p className="author-name">
                By {blog.author_name || "Traveller"}
              </p>

              <p className="article-date">
                {blog.published_at
                  ? new Date(blog.published_at).toLocaleDateString()
                  : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Cover Image - Click to Open */}
        <div className="article-cover">
          <img
            src={coverImage}
            alt={blog.title}
            className="clickable-blog-image"
            onClick={() => handleImageClick(coverImage, blog.title)}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = fallbackImage;
            }}
          />
          <span className="image-zoom-hint">
            <i className="bi bi-zoom-in"></i> Click to enlarge
          </span>
        </div>

        <div className="article-content">
          <h2>About This Journey</h2>
          <p>{blog.story}</p>

          <h2>Travel Tips</h2>
          <p>{blog.travel_tips || "No travel tips added."}</p>
        </div>

        {/* Additional Images - Click to Open */}
        {images.length > 0 && (
          <div className="additional-images">
            <h2>More Memories</h2>

            <div className="image-gallery">
              {images.map((image) => {
                const imageUrl = getImageUrl(image.image_path);

                return (
                  <div
                    className="gallery-image-wrapper"
                    key={image.image_id}
                    onClick={() =>
                      handleImageClick(
                        imageUrl,
                        image.image_caption || blog.title
                      )
                    }
                    role="button"
                    tabIndex={0}
                    aria-label={`Enlarge ${image.image_caption || "blog image"}`}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleImageClick(
                          imageUrl,
                          image.image_caption || blog.title
                        );
                      }
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={image.image_caption || blog.title}
                      className="clickable-blog-image"
                    />

                    <span className="gallery-zoom-icon">
                      <i className="bi bi-zoom-in"></i>
                    </span>

                    {image.image_caption && (
                      <p className="gallery-image-caption">
                        {image.image_caption}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {blog.author_bio && (
          <div className="blog-author-bio">
            <h2>About the Author</h2>
            <p>{blog.author_bio}</p>
          </div>
        )}
      </article>

      {/* Full-Screen Image Viewer */}
      {selectedImage && (
        <div
          className="image-lightbox"
          onClick={() => setSelectedImage(null)}
          role="presentation"
        >
          <button
            type="button"
            className="lightbox-close"
            onClick={() => setSelectedImage(null)}
            aria-label="Close image viewer"
          >
            <i className="bi bi-x-lg"></i>
          </button>

          <div
            className="lightbox-image-container"
            onClick={(event) => event.stopPropagation()}
          >
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="lightbox-image"
            />

            {selectedImage.alt && (
              <p className="lightbox-caption">
                {selectedImage.alt}
              </p>
            )}
          </div>

          <span className="lightbox-instruction">
            Press ESC or click outside to close
          </span>
        </div>
      )}
    </div>
  );
}

export default BlogDetails;
