import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

import "./CreateBlog.css";

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function CreateBlog() {
  const navigate = useNavigate();

  const [destinations, setDestinations] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

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

  // ==========================================
  // FETCH DESTINATIONS AND CATEGORIES
  // ==========================================

  useEffect(() => {
    const fetchFormOptions = async () => {
      try {
        setLoadingOptions(true);
        setError("");

        const [destinationResponse, categoryResponse] = await Promise.all([
          api.get("/destinations"),
          api.get("/categories"),
        ]);

        setDestinations(destinationResponse.data.data || []);
        setCategories(categoryResponse.data.data || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load destinations and categories.",
        );
      } finally {
        setLoadingOptions(false);
      }
    };

    fetchFormOptions();
  }, []);

  // ==========================================
  // HANDLE TEXT INPUTS
  // ==========================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ==========================================
  // VALIDATE IMAGE
  // ==========================================

  const validateImage = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return `${file.name}: Only JPG, JPEG, PNG, WEBP and GIF images are allowed.`;
    }

    if (file.size > MAX_FILE_SIZE) {
      return `${file.name}: Image must be smaller than 5 MB.`;
    }

    return null;
  };

  // ==========================================
  // HANDLE COVER IMAGE
  // ==========================================

  const handleCoverImageChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const validationError = validateImage(file);

    if (validationError) {
      setError(validationError);
      setCoverImage(null);
      event.target.value = "";
      return;
    }

    setError("");
    setCoverImage(file);
  };

  // ==========================================
  // HANDLE ADDITIONAL IMAGES
  // ==========================================

  const handleAdditionalImagesChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    const remainingSlots = 5 - additionalImages.length;
    const filesToCheck = selectedFiles.slice(0, remainingSlots);

    const validFiles = [];
    const errors = [];

    filesToCheck.forEach((file) => {
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

  // ==========================================
  // REMOVE ADDITIONAL IMAGE
  // ==========================================

  const removeAdditionalImage = (index) => {
    setAdditionalImages((previous) =>
      previous.filter((_, currentIndex) => currentIndex !== index),
    );
  };

  // ==========================================
  // SUBMIT BLOG
  // ==========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!coverImage) {
      setError("Please select a cover image.");
      return;
    }

    if (
      formData.destination_id === "other" &&
      (!customDestination.trim() || !customCountry.trim())
    ) {
      setError("Please enter both custom destination and country.");
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

    // IMPORTANT: Field name must match Multer configuration.
    data.append("coverImage", coverImage);

    additionalImages.forEach((image) => {
      data.append("additionalImages", image);
    });

    try {
      setSubmitting(true);

      // IMPORTANT:
      // Send FormData as multipart/form-data so Multer
      // can correctly receive uploaded image files.
      const response = await api.post("/blogs", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess(
        response.data.message || "Your travel story was saved successfully.",
      );

      // New blogs are saved as DRAFT for admin review.
      setTimeout(() => {
        navigate("/my-blogs");
      }, 1200);
    } catch (err) {
      console.error("Create blog error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to create your blog. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="create-blog-page">
      <div className="create-blog-container">
        <button
          type="button"
          className="back-btn"
          onClick={() => navigate("/")}
        >
          ← Back
        </button>

        <div className="create-blog-heading">
          <h1>Share Your Travel Story</h1>
          <p>Share your experiences and inspire others to explore the world.</p>
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

        {loadingOptions ? (
          <p className="text-center">Loading destinations and categories...</p>
        ) : (
          <form className="create-blog-form" onSubmit={handleSubmit}>
            {/* BLOG TITLE */}
            <div className="form-group">
              <label htmlFor="title">Blog Title</label>

              <input
                id="title"
                type="text"
                name="title"
                placeholder="Enter your travel story title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={200}
              />

              <p className="character-count">
                {formData.title.length}/200 characters
              </p>
            </div>

            {/* DESTINATION */}
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

            {/* CUSTOM DESTINATION */}
            {formData.destination_id === "other" && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="customDestination">Destination Name</label>

                  <input
                    id="customDestination"
                    type="text"
                    value={customDestination}
                    onChange={(event) =>
                      setCustomDestination(event.target.value)
                    }
                    placeholder="Enter destination name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="customCountry">Country</label>

                  <input
                    id="customCountry"
                    type="text"
                    value={customCountry}
                    onChange={(event) => setCustomCountry(event.target.value)}
                    placeholder="Enter country"
                    required
                  />
                </div>
              </div>
            )}

            {/* CATEGORY */}
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
                  <option
                    key={category.category_id}
                    value={category.category_id}
                  >
                    {category.category_name}
                  </option>
                ))}
              </select>
            </div>

            {/* TRAVEL STORY */}
            <div className="form-group">
              <label htmlFor="story">Travel Story</label>

              <textarea
                id="story"
                name="story"
                rows="8"
                placeholder="Write your complete travel experience..."
                value={formData.story}
                onChange={handleChange}
                required
              />

              <p className="character-count">
                {formData.story.length} characters
              </p>
            </div>

            {/* TRAVEL TIPS */}
            <div className="form-group">
              <label htmlFor="travel_tips">Travel Tips</label>

              <textarea
                id="travel_tips"
                name="travel_tips"
                rows="4"
                placeholder="Share useful tips for other travellers..."
                value={formData.travel_tips}
                onChange={handleChange}
              />
            </div>

            {/* COVER IMAGE */}
            <div className="form-group">
              <label htmlFor="coverImage">Cover Image (Required)</label>

              <input
                id="coverImage"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                onChange={handleCoverImageChange}
                required
              />

              {coverImage && (
                <div className="image-preview">
                  <img
                    src={URL.createObjectURL(coverImage)}
                    alt="Cover preview"
                  />

                  <p>{coverImage.name}</p>
                </div>
              )}
            </div>

            {/* ADDITIONAL IMAGES */}
            <div className="form-group">
              <label htmlFor="additionalImages">
                Additional Images (Maximum 5)
              </label>

              <input
                id="additionalImages"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.gif"
                multiple
                onChange={handleAdditionalImagesChange}
                disabled={additionalImages.length >= 5}
              />

              <p className="character-count">
                {additionalImages.length}/5 additional images selected
              </p>

              <div className="additional-images-preview">
                {additionalImages.map((image, index) => (
                  <div className="image-preview" key={`${image.name}-${index}`}>
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Additional preview ${index + 1}`}
                    />

                    <p>{image.name}</p>

                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => removeAdditionalImage(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* FORM BUTTONS */}
            <div className="form-buttons">
              <button
                type="button"
                className="draft-btn"
                onClick={() => navigate("/")}
                disabled={submitting}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="publish-btn"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit for Review"}
              </button>
            </div>

            <p className="blog-review-note">
              Your blog will be saved as a draft and submitted for admin review.
              It will become publicly visible after approval.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

export default CreateBlog;
