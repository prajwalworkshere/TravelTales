import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../services/api";
import "./Explore.css";

const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const fallbackImages = [
  "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1599661046827-dacff0c0f09a?auto=format&fit=crop&w=900&q=85",
];

const storyFallbackImage =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=85";

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (imagePath.startsWith("http")) return imagePath;

  return `${API_ORIGIN}/${imagePath.replace(/^\/+/, "")}`;
};

function Explore() {
  const [destinations, setDestinations] = useState([]);
  const [blogs, setBlogs] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loadingDestinations, setLoadingDestinations] = useState(true);
  const [loadingBlogs, setLoadingBlogs] = useState(true);

  const [destinationError, setDestinationError] = useState("");
  const [blogError, setBlogError] = useState("");

  // Search and filter states
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Stories");
  const [sortOrder, setSortOrder] = useState("newest");

  useEffect(() => {
    const fetchExploreData = async () => {
      try {
        setLoadingDestinations(true);
        setDestinationError("");

        const response = await api.get("/destinations");
        setDestinations(response.data.data || []);
      } catch (err) {
        setDestinationError(
          err.response?.data?.message || "Unable to load destinations.",
        );
      } finally {
        setLoadingDestinations(false);
      }
    };

    const fetchPublishedBlogs = async () => {
      try {
        setLoadingBlogs(true);
        setBlogError("");

        const response = await api.get("/blogs");
        setBlogs(response.data.data || []);
      } catch (err) {
        setBlogError(
          err.response?.data?.message ||
            "Unable to load published travel stories.",
        );
      } finally {
        setLoadingBlogs(false);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        setCategories(response.data.data || []);
      } catch (err) {
        console.error("Unable to load categories:", err);
      }
    };

    fetchExploreData();
    fetchPublishedBlogs();
    fetchCategories();
  }, []);

  // Filter and sort published stories
  const filteredBlogs = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    let result = blogs.filter((blog) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          blog.title,
          blog.story,
          blog.destination_name,
          blog.country,
          blog.author_name,
          blog.category_name,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(normalizedSearch),
          );

      const matchesCategory =
        selectedCategory === "All Stories" ||
        (blog.category_name || "").toLowerCase() ===
          selectedCategory.toLowerCase();

      return matchesSearch && matchesCategory;
    });

    result = [...result].sort((a, b) => {
      const dateA = new Date(a.published_at || a.created_at || 0).getTime();

      const dateB = new Date(b.published_at || b.created_at || 0).getTime();

      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [blogs, searchTerm, selectedCategory, sortOrder]);

  const handleSearch = (event) => {
    event.preventDefault();
    setSearchTerm(searchInput);
  };

  const handleCategoryChange = (categoryName) => {
    setSelectedCategory(categoryName);
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setSelectedCategory("All Stories");
    setSortOrder("newest");
  };

  return (
    <div className="explore-page">
      {/* =====================================
          HERO SECTION
      ====================================== */}

      <section className="explore-hero">
        <div className="explore-hero-overlay">
          <div className="container">
            <div className="explore-hero-content">
              <span className="explore-subtitle">
                DISCOVER • EXPLORE • EXPERIENCE
              </span>

              <h1>
                Explore the World,
                <br />
                One Story at a Time
              </h1>

              <p>
                Discover amazing destinations and explore unforgettable travel
                experiences shared by travellers around the world.
              </p>

              <a href="#travel-stories" className="explore-hero-btn">
                Explore Stories
                <i className="bi bi-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================
          DESTINATIONS SECTION
      ====================================== */}

      <section className="explore-destinations section-padding">
        <div className="container">
          <div className="explore-section-heading">
            <span className="section-label">FIND YOUR NEXT DESTINATION</span>

            <h2>Popular Destinations</h2>

            <p>
              Explore beautiful places and get inspired for your next journey.
            </p>
          </div>

          {loadingDestinations && (
            <p className="text-center py-4">Loading destinations...</p>
          )}

          {destinationError && (
            <div className="alert alert-danger">{destinationError}</div>
          )}

          {!loadingDestinations &&
            !destinationError &&
            destinations.length === 0 && (
              <p className="text-center py-4">
                No active destinations are currently available.
              </p>
            )}

          {!loadingDestinations &&
            !destinationError &&
            destinations.length > 0 && (
              <div className="row g-4">
                {destinations.map((destination, index) => (
                  <div
                    className="col-md-6 col-lg-4"
                    key={destination.destination_id}
                  >
                    <article className="destination-card">
                      <div className="destination-image">
                        <img
                          src={
                            getImageUrl(
                              destination.image || destination.cover_image,
                            ) || fallbackImages[index % fallbackImages.length]
                          }
                          alt={destination.destination_name}
                          loading="lazy"
                        />
                      </div>

                      <div className="destination-content">
                        <span className="destination-location">
                          <i className="bi bi-geo-alt"></i>
                          {[
                            destination.city,
                            destination.state_region,
                            destination.country,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </span>

                        <h3>{destination.destination_name}</h3>

                        <p>
                          {destination.description ||
                            "Discover this beautiful destination with TravelTales."}
                        </p>

                        <Link
                          to={`/destinations/${destination.destination_id}`}
                          className="destination-link"
                        >
                          Explore Destination
                          <i className="bi bi-arrow-right"></i>
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
          TRAVEL STORIES - SEARCH AND FILTER
      ====================================== */}

      <section className="explore-stories section-padding" id="travel-stories">
        <div className="container">
          {/* Search Heading */}

          <div className="explore-search-heading">
            <span className="section-label">THE WORLD THROUGH YOUR EYES</span>

            <h2>Explore Travel Stories</h2>

            <p>
              A new perspective is just a story away. Find real experiences,
              local discoveries, and inspiration for your next journey.
            </p>
          </div>

          {/* Search Bar */}

          <form className="story-search-form" onSubmit={handleSearch}>
            <div className="story-search-input-wrapper">
              <i className="bi bi-search"></i>

              <input
                type="text"
                placeholder="Search stories, destinations, or travel experiences..."
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />

              {searchInput && (
                <button
                  type="button"
                  className="story-search-clear"
                  onClick={() => {
                    setSearchInput("");
                    setSearchTerm("");
                  }}
                  aria-label="Clear search"
                >
                  <i className="bi bi-x-circle"></i>
                </button>
              )}
            </div>

            <button type="submit" className="story-search-btn">
              Search Stories
            </button>
          </form>

          {/* Category Filters and Sorting */}

          <div className="story-filter-toolbar">
            <div className="story-category-filters">
              <button
                type="button"
                className={`story-category-btn ${
                  selectedCategory === "All Stories" ? "active" : ""
                }`}
                onClick={() => handleCategoryChange("All Stories")}
              >
                All Stories
              </button>

              {categories.map((category) => (
                <button
                  type="button"
                  key={category.category_id}
                  className={`story-category-btn ${
                    selectedCategory === category.category_name ? "active" : ""
                  }`}
                  onClick={() => handleCategoryChange(category.category_name)}
                >
                  {category.category_name}
                </button>
              ))}
            </div>

            <div className="story-sort-wrapper">
              <label htmlFor="storySort">Sort by:</label>

              <select
                id="storySort"
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>

          {/* Published Stories */}

          <div className="story-results-heading">
            <div>
              <h2>
                {searchTerm || selectedCategory !== "All Stories"
                  ? "Matching Travel Stories"
                  : "Latest Travel Stories"}
              </h2>

              <p>Get inspired by experiences shared by fellow travellers.</p>
            </div>

            {!loadingBlogs && (
              <span className="story-results-count">
                {filteredBlogs.length}{" "}
                {filteredBlogs.length === 1 ? "Story" : "Stories"}
              </span>
            )}
          </div>

          {loadingBlogs && (
            <p className="text-center py-5">Loading travel stories...</p>
          )}

          {blogError && <div className="alert alert-danger">{blogError}</div>}

          {!loadingBlogs && !blogError && filteredBlogs.length === 0 && (
            <div className="stories-empty-state">
              <i className="bi bi-search"></i>

              <h3>No matching travel stories found.</h3>

              <p>Try another search term or choose a different category.</p>

              <button
                type="button"
                className="story-reset-btn"
                onClick={clearFilters}
              >
                <i className="bi bi-arrow-counterclockwise"></i>
                Clear Filters
              </button>
            </div>
          )}

          {!loadingBlogs && !blogError && filteredBlogs.length > 0 && (
            <div className="row g-4">
              {filteredBlogs.map((blog) => (
                <div className="col-md-6 col-lg-4" key={blog.blog_id}>
                  <article className="story-card">
                    <div className="story-image">
                      <img
                        src={
                          getImageUrl(blog.cover_image) || storyFallbackImage
                        }
                        alt={blog.title}
                        loading="lazy"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = storyFallbackImage;
                        }}
                      />
                    </div>

                    <div className="story-content">
                      <span className="story-destination">
                        <i className="bi bi-geo-alt"></i>

                        {[blog.destination_name, blog.country]
                          .filter(Boolean)
                          .join(", ")}
                      </span>

                      <h3>{blog.title}</h3>

                      <p>
                        {blog.story
                          ? `${blog.story.slice(0, 140)}${
                              blog.story.length > 140 ? "..." : ""
                            }`
                          : "Read this travel experience shared with TravelTales."}
                      </p>

                      <div className="story-footer">
                        <span>
                          <i className="bi bi-person-circle"></i>
                          {blog.author_name || "Traveller"}
                        </span>

                        <span>
                          <i className="bi bi-tag"></i>
                          {blog.category_name || "Travel"}
                        </span>
                      </div>

                      <Link
                        to={`/blogs/${blog.blog_id}`}
                        className="destination-link mt-3"
                      >
                        Read Full Story
                        <i className="bi bi-arrow-right"></i>
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
          CALL TO ACTION
      ====================================== */}

      <section className="explore-cta">
        <div className="container">
          <div className="explore-cta-content">
            <span>YOUR NEXT ADVENTURE STARTS HERE</span>

            <h2>
              Every Journey Has a Story.
              <br />
              What's Yours?
            </h2>

            <p>
              Join TravelTales and share your travel experiences with the world.
            </p>

            <Link to="/register" className="explore-cta-btn">
              Join TravelTales
              <i className="bi bi-arrow-right"></i>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Explore;
