import { Link } from "react-router-dom";
import "./About.css";

function About() {
  return (
    <div className="about-page">
      {/* ==============================
                ABOUT HERO SECTION
            ============================== */}
      <section className="about-hero">
        <div className="about-hero-overlay"></div>

        <div className="container about-hero-content">
          <span className="about-label">GET TO KNOW US</span>

          <h1>
            More Than Travel.
            <br />A Collection of <span>Stories.</span>
          </h1>

          <p>
            Every journey has a story, every destination holds an experience,
            and every traveller has a memory worth sharing.
          </p>

          <Link to="/" className="about-hero-link">
            Back to Home →
          </Link>
        </div>
      </section>

      {/* ==============================
                WHO WE ARE
            ============================== */}
      <section className="about-intro section-padding">
        <div className="container">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <div className="about-image-wrapper">
                <img
                  src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1100&q=85"
                  alt="Beautiful mountain lake surrounded by nature"
                  className="about-main-image"
                />
              </div>
            </div>

            <div className="col-lg-6">
              <div className="about-text-content">
                <span className="section-label">WHO WE ARE</span>

                <h2>
                  Welcome to <span>TravelTales</span>
                </h2>

                <p>
                  TravelTales is a travel blogging and destination discovery
                  platform created for people who love exploring new places and
                  sharing their experiences.
                </p>

                <p>
                  We believe that travelling is not just about reaching a
                  destination. It is about the people we meet, the places we
                  discover, the experiences we collect and the memories we
                  create along the way.
                </p>

                <p>
                  TravelTales brings travellers and their stories together in
                  one place, helping others discover destinations through real
                  travel experiences.
                </p>

                <Link to="/explore" className="about-primary-btn">
                  Explore Destinations →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
                MISSION AND VISION
            ============================== */}
      <section className="mission-section section-padding">
        <div className="container">
          <div className="section-heading text-center">
            <span className="section-label">WHAT DRIVES US</span>

            <h2>
              Our Mission <span>& Vision</span>
            </h2>

            <p>
              We want to make travel experiences easier to discover and more
              meaningful to share.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-6">
              <div className="mission-card">
                <div className="mission-icon">🎯</div>

                <h3>Our Mission</h3>

                <p>
                  Our mission is to create a platform where travellers can share
                  their journeys, discover destinations and learn from the real
                  experiences of others.
                </p>
              </div>
            </div>

            <div className="col-md-6">
              <div className="mission-card vision-card">
                <div className="mission-icon">🌍</div>

                <h3>Our Vision</h3>

                <p>
                  Our vision is to build a community of travellers connected
                  through stories, discoveries and a shared passion for
                  exploring the world.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
                WHY TRAVELTALES
            ============================== */}
      <section className="why-section section-padding">
        <div className="container">
          <div className="section-heading text-center">
            <span className="section-label">THE TRAVELTALES EXPERIENCE</span>

            <h2>
              Why Choose <span>TravelTales?</span>
            </h2>

            <p>
              Everything you need to discover places and share your travel
              experiences.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-6 col-lg-4">
              <div className="why-card">
                <div className="why-icon">🧭</div>

                <h3>Discover Destinations</h3>

                <p>
                  Explore different destinations and find inspiration for your
                  next journey.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="why-card">
                <div className="why-icon">📚</div>

                <h3>Real Travel Stories</h3>

                <p>
                  Read travel experiences shared by people who have explored
                  those places.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="why-card">
                <div className="why-icon">✍️</div>

                <h3>Share Your Journey</h3>

                <p>
                  Create travel blogs and share your adventures with fellow
                  travellers.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="why-card">
                <div className="why-icon">📸</div>

                <h3>Capture Memories</h3>

                <p>
                  Preserve your travel experiences through stories and
                  photographs.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="why-card">
                <div className="why-icon">💡</div>

                <h3>Get Travel Inspiration</h3>

                <p>
                  Discover ideas, tips and experiences that can inspire your
                  next trip.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-4">
              <div className="why-card">
                <div className="why-icon">🤝</div>

                <h3>Connect Through Stories</h3>

                <p>
                  Discover different perspectives through the journeys of other
                  travellers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==============================
                JOIN OUR JOURNEY
            ============================== */}
      <section className="about-cta">
        <div className="container">
          <div className="about-cta-content">
            <span className="about-label">YOUR NEXT CHAPTER STARTS HERE</span>

            <h2>
              The World Is Waiting.
              <br />
              What's Your Story?
            </h2>

            <p>
              Join TravelTales, explore new destinations and share the
              experiences that make your journey unique.
            </p>

            <div className="about-cta-buttons">
              <Link to="/register" className="about-primary-btn">
                Join TravelTales →
              </Link>

              <Link to="/explore" className="about-secondary-btn">
                Explore Stories
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
