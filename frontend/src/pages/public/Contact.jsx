
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./Contact.css";

function Contact() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    subject: "",
    message: ""
  });

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));

    setSuccessMessage("");
    setErrorMessage("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    if (!formData.subject.trim() || !formData.message.trim()) {
      setErrorMessage("Please complete all fields.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await api.post("/contact", {
        subject: formData.subject.trim(),
        message: formData.message.trim()
      });

      setSuccessMessage(
        response.data.message || "Your message was submitted successfully."
      );

      setFormData({
        subject: "",
        message: ""
      });
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
        "Unable to submit your message. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="contact-page">
      <section className="contact-hero">
        <div className="contact-hero-overlay">
          <div className="container text-center">
            <span className="contact-eyebrow">
              WE WOULD LOVE TO HEAR FROM YOU
            </span>
            <h1>Get In Touch</h1>
            <p>
              Have a question, suggestion, or travel story to share?
              Let's connect.
            </p>
          </div>
        </div>
      </section>

      <section className="contact-section">
        <div className="container">
          <div className="row g-5">
            <div className="col-lg-5">
              <div className="contact-info">
                <span className="contact-section-label">
                  CONTACT TRAVELTALES
                </span>

                <h2>Let's Start a Conversation</h2>

                <p className="contact-description">
                  Whether you have a question about our platform or want
                  to share feedback, we are happy to hear from you.
                </p>

                <div className="contact-info-card">
                  <div className="contact-icon">
                    <i className="bi bi-envelope"></i>
                  </div>
                  <div>
                    <h5>Email Us</h5>
                    <p>Contact us through the message form.</p>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-icon">
                    <i className="bi bi-geo-alt"></i>
                  </div>
                  <div>
                    <h5>Our Location</h5>
                    <p>Travel begins everywhere.</p>
                  </div>
                </div>

                <div className="contact-info-card">
                  <div className="contact-icon">
                    <i className="bi bi-chat-dots"></i>
                  </div>
                  <div>
                    <h5>Share Your Thoughts</h5>
                    <p>Your feedback helps us improve TravelTales.</p>
                  </div>
                </div>

                {!isAuthenticated && (
                  <div className="contact-note">
                    <i className="bi bi-info-circle"></i>
                    <p>
                      Please <Link to="/login">log in</Link> to submit
                      a contact message.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-7">
              <div className="contact-form-wrapper">
                <div className="contact-form-heading">
                  <h3>Send Us a Message</h3>
                  <p>Fill in the details below and let us know how we can help.</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="mb-4">
                    <label htmlFor="subject" className="form-label">
                      Subject
                    </label>
                    <input
                      type="text"
                      className="form-control contact-input"
                      id="subject"
                      name="subject"
                      placeholder="Enter message subject"
                      value={formData.subject}
                      onChange={handleChange}
                      maxLength={200}
                      required
                    />
                  </div>

                  <div className="mb-4">
                    <label htmlFor="message" className="form-label">
                      Your Message
                    </label>
                    <textarea
                      className="form-control contact-input contact-textarea"
                      id="message"
                      name="message"
                      rows="6"
                      placeholder="Write your message here..."
                      value={formData.message}
                      onChange={handleChange}
                      maxLength={2000}
                      required
                    />

                    <div className="character-count">
                      {formData.message.length}/2000 characters
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="alert alert-danger" role="alert">
                      {errorMessage}
                    </div>
                  )}

                  {successMessage && (
                    <div className="alert alert-success" role="status">
                      {successMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    className="contact-submit-btn"
                    disabled={loading}
                  >
                    {loading ? "Sending..." : "Send Message"}
                    <i className="bi bi-arrow-right"></i>
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="contact-bottom-cta">
        <div className="container text-center">
          <h2>Ready for Your Next Adventure?</h2>
          <p>
            Discover beautiful destinations and explore stories shared
            by travellers around the world.
          </p>
          <Link to="/explore" className="contact-explore-btn">
            Explore Destinations
            <i className="bi bi-arrow-right"></i>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default Contact;
