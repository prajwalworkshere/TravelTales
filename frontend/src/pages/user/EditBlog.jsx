import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../services/api";
import "./CreateBlog.css";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api"
).replace(/\/api\/?$/, "");

const getImageUrl = (imagePath) => {
  if (!imagePath) return "";

  if (imagePath.startsWith("http")) return imagePath;

  return `${API_ORIGIN}/${imagePath.replace(/^\/+/, "")}`;
};

function EditBlog() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [destinations, setDestinations] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [blog, setBlog] = useState(null);

  const [customDestination, setCustomDestination] = useState("");
  const [customCountry, setCustomCountry] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    destination_id: "",
    category_id: "",
    travel_date: "",
    story: "",
    travel_tips: "",
  });

  const [coverImage, setCoverImage] = useState(null);
  const [additionalImages, setAdditionalImages] = useState([]);

  // Fetch blog, destinations and categories.
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError("");

        const [blogResponse, destinationResponse, categoryResponse] =
          await Promise.all([
            api.get(`/blogs/edit/${id}`),
            api.get("/destinations"),
            api.get("/categories"),
          ]);

        const blogData = blogResponse.data.data;

        setBlog(blogData);
        setDestinations(destinationResponse.data.data || []);
        setCategories(categoryResponse.data.data || []);

        setFormData({
          title: blogData.title || "",
          destination_id: String(blogData.destination_id || ""),
          category_id: String(blogData.category_id || ""),
          travel_date: blogData.travel_date
            ? String(blogData.travel_date).slice(0, 10)
            : "",
          story: blogData.story || "",
          travel_tips: blogData.travel_tips || "",
        });
      } catch (err) {
        setError(
          err.response?.data?.message || "Unable to load the blog for editing.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const validateImage = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Only JPG, JPEG, PNG, WEBP and GIF images are allowed.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: Image must be smaller than 5 MB.`;
    }

    return null;
  };

  const handleCoverChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const validationError = validateImage(file);

    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setError("");
    setCoverImage(file);
  };

  const handleAdditionalImages = (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    const remainingSlots = 5 - additionalImages.length;

    const validFiles = [];
    const errors = [];

    selectedFiles.slice(0, remainingSlots).forEach((file) => {
      const validationError = validateImage(file);

      if (validationError) {
        errors.push(validationError);
      } else {
        validFiles.push(file);
      }
    });

    if (selectedFiles.length > remainingSlots) {
      errors.push(`You can add only ${remainingSlots} more image(s).`);
    }

    setAdditionalImages((previous) => [...previous, ...validFiles]);
    setError(errors.join(" "));
    event.target.value = "";
  };

  const removeNewImage = (index) => {
    setAdditionalImages((previous) =>
      previous.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (
      formData.destination_id === "other" &&
      (!customDestination.trim() || !customCountry.trim())
    ) {
      setError("Please enter both destination name and country.");
      return;
    }

    const data = new FormData();

    data.append("title", formData.title.trim());
    data.append("destination_id", formData.destination_id);
    data.append("customDestination", customDestination.trim());
    data.append("customCountry", customCountry.trim());
    data.append("category_id", formData.category_id);
    data.append("travel_date", formData.travel_date);
    data.append("story", formData.story.trim());
    data.append("travel_tips", formData.travel_tips.trim());

    if (coverImage) {
      data.append("coverImage", coverImage);
    }

    additionalImages.forEach((image) => {
      data.append("additionalImages", image);
    });

    try {
      setSubmitting(true);

      const response = await api.put(`/blogs/${id}`, data);

      setSuccess(response.data.message || "Blog updated successfully.");

      setTimeout(() => {
        navigate("/my-blogs");
      }, 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update your blog.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="create-blog-page">
        <div className="container text-center py-5">Loading blog...</div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error || "Blog not found."}</div>
        <Link to="/my-blogs">Back to My Blogs</Link>
      </div>
    );
  }

  return (
    <div className="create-blog-page">
      <div className="create-blog-container">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/my-blogs")}
        >
          ← Back to My Blogs
        </button>

        <div className="create-blog-heading">
          <h1>Edit Your Travel Story</h1>
          <p>Update your experience and save your changes.</p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}

        <form className="create-blog-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">Blog Title</label>
            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              maxLength={200}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="destination_id">Destination</label>

              <select
                id="destination_id"
                name="destination_id"
                value={formData.destination_id}
                onChange={handleChange}
                required
              >
                <option value="">Select destination</option>

                {destinations.map((destination) => (
                  <option
                    key={destination.destination_id}
                    value={destination.destination_id}
                  >
                    {destination.destination_name}, {destination.country}
                  </option>
                ))}

                <option value="other">Other / Add New Destination</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="travel_date">Travel Date</label>

              <input
                id="travel_date"
                type="date"
                name="travel_date"
                value={formData.travel_date}
                onChange={handleChange}
              />
            </div>
          </div>

          {formData.destination_id === "other" && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="customDestination">Destination Name</label>

                <input
                  id="customDestination"
                  value={customDestination}
                  onChange={(event) => setCustomDestination(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="customCountry">Country</label>

                <input
                  id="customCountry"
                  value={customCountry}
                  onChange={(event) => setCustomCountry(event.target.value)}
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="category_id">Category</label>

            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              required
            >
              <option value="">Select category</option>

              {categories.map((category) => (
                <option key={category.category_id} value={category.category_id}>
                  {category.category_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="story">Travel Story</label>

            <textarea
              id="story"
              name="story"
              rows="8"
              value={formData.story}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="travel_tips">Travel Tips</label>

            <textarea
              id="travel_tips"
              name="travel_tips"
              rows="4"
              value={formData.travel_tips}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Current Cover Image</label>

            {blog.cover_image && (
              <div className="image-preview">
                <img
                  src={
                    coverImage
                      ? URL.createObjectURL(coverImage)
                      : getImageUrl(blog.cover_image)
                  }
                  alt="Blog cover"
                />
                <p>{coverImage ? coverImage.name : "Current cover image"}</p>
              </div>
            )}

            <label htmlFor="coverImage">Replace Cover Image (Optional)</label>

            <input
              id="coverImage"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              onChange={handleCoverChange}
            />
          </div>

          {blog.images?.length > 0 && (
            <div className="form-group">
              <label>Existing Additional Images</label>

              <div className="additional-images-preview">
                {blog.images.map((image) => (
                  <div className="image-preview" key={image.image_id}>
                    <img
                      src={getImageUrl(image.image_path)}
                      alt={image.image_caption || "Blog image"}
                    />
                  </div>
                ))}
              </div>

              <p className="character-count">
                Existing images are retained when you save your changes.
              </p>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="additionalImages">
              Add More Images (Maximum 5)
            </label>

            <input
              id="additionalImages"
              type="file"
              accept=".jpg,.jpeg,.png,.webp,.gif"
              multiple
              onChange={handleAdditionalImages}
              disabled={additionalImages.length >= 5}
            />

            <p className="character-count">
              {additionalImages.length}/5 new images selected
            </p>

            <div className="additional-images-preview">
              {additionalImages.map((image, index) => (
                <div className="image-preview" key={`${image.name}-${index}`}>
                  <img src={URL.createObjectURL(image)} alt={image.name} />

                  <button
                    type="button"
                    className="remove-image-btn"
                    onClick={() => removeNewImage(index)}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-buttons">
            <button
              type="button"
              className="draft-btn"
              onClick={() => navigate("/my-blogs")}
              disabled={submitting}
            >
              Cancel
            </button>

            <button type="submit" className="publish-btn" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>

          <p className="blog-review-note">
            Saving changes will return this blog to DRAFT status for admin
            review.
          </p>
        </form>
      </div>
    </div>
  );
}

export default EditBlog;
