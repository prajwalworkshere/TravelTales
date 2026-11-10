import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./ManageDestinations.css";

// Temporary destination records.
// These will later be fetched from the MySQL-backed API.
const initialDestinations = [
  {
    destination_id: 1,
    destination_name: "Goa Beaches",
    city: "Panaji",
    state_region: "Goa",
    country: "India",
    description:
      "Explore beautiful beaches, Portuguese heritage, local markets, and coastal food.",
    status: "ACTIVE",
  },
  {
    destination_id: 2,
    destination_name: "Manali Mountains",
    city: "Manali",
    state_region: "Himachal Pradesh",
    country: "India",
    description:
      "Discover snow-covered mountains, scenic valleys, and adventure activities.",
    status: "ACTIVE",
  },
  {
    destination_id: 3,
    destination_name: "Jaipur Heritage",
    city: "Jaipur",
    state_region: "Rajasthan",
    country: "India",
    description:
      "Experience historic forts, royal palaces, colourful markets, and Rajasthani culture.",
    status: "ACTIVE",
  },
  {
    destination_id: 4,
    destination_name: "Munnar Hills",
    city: "Munnar",
    state_region: "Kerala",
    country: "India",
    description:
      "Enjoy tea gardens, misty hills, waterfalls, and peaceful natural surroundings.",
    status: "INACTIVE",
  },
  {
    destination_id: 5,
    destination_name: "Ladakh Adventure",
    city: "Leh",
    state_region: "Ladakh",
    country: "India",
    description:
      "Explore high-altitude landscapes, monasteries, lakes, and mountain roads.",
    status: "ACTIVE",
  },
  {
    destination_id: 6,
    destination_name: "Udaipur Lakes",
    city: "Udaipur",
    state_region: "Rajasthan",
    country: "India",
    description:
      "Visit lakes, palaces, heritage hotels, and traditional markets.",
    status: "INACTIVE",
  },
];

// Empty form used when adding a new destination.
const emptyForm = {
  destination_name: "",
  city: "",
  state_region: "",
  country: "",
  description: "",
  status: "ACTIVE",
};

function ManageDestinations() {
  const [destinations, setDestinations] = useState(initialDestinations);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);

  const [formData, setFormData] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  // Destination statistics.
  const totalDestinations = destinations.length;

  const activeDestinations = destinations.filter(
    (destination) => destination.status === "ACTIVE",
  ).length;

  const inactiveDestinations = destinations.filter(
    (destination) => destination.status === "INACTIVE",
  ).length;

  // Search and filter destinations.
  const filteredDestinations = useMemo(() => {
    return destinations.filter((destination) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        destination.destination_name.toLowerCase().includes(search) ||
        destination.city.toLowerCase().includes(search) ||
        destination.state_region.toLowerCase().includes(search) ||
        destination.country.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "ALL" || destination.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [destinations, searchTerm, statusFilter]);

  // Open the form for adding a destination.
  function handleAddDestination() {
    setEditingDestination(null);
    setFormData(emptyForm);
    setFormError("");
    setIsFormOpen(true);
  }

  // Open the form with existing data for editing.
  function handleEditDestination(destination) {
    setEditingDestination(destination);

    setFormData({
      destination_name: destination.destination_name,
      city: destination.city,
      state_region: destination.state_region,
      country: destination.country,
      description: destination.description,
      status: destination.status,
    });

    setFormError("");
    setIsFormOpen(true);
    setSelectedDestination(null);
  }

  // Update form state when an input changes.
  function handleInputChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  // Add or update a destination.
  function handleSubmit(event) {
    event.preventDefault();

    const cleanedData = {
      ...formData,
      destination_name: formData.destination_name.trim(),
      city: formData.city.trim(),
      state_region: formData.state_region.trim(),
      country: formData.country.trim(),
      description: formData.description.trim(),
    };

    if (
      !cleanedData.destination_name ||
      !cleanedData.city ||
      !cleanedData.state_region ||
      !cleanedData.country ||
      !cleanedData.description
    ) {
      setFormError("Please fill in all fields.");
      return;
    }

    if (editingDestination) {
      setDestinations((previousDestinations) =>
        previousDestinations.map((destination) =>
          destination.destination_id === editingDestination.destination_id
            ? {
                ...destination,
                ...cleanedData,
              }
            : destination,
        ),
      );
    } else {
      const newDestination = {
        destination_id: Date.now(),
        ...cleanedData,
      };

      setDestinations((previousDestinations) => [
        newDestination,
        ...previousDestinations,
      ]);
    }

    setIsFormOpen(false);
    setEditingDestination(null);
    setFormData(emptyForm);
    setFormError("");
  }

  // Delete a destination after confirmation.
  function handleDeleteDestination(destinationId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this destination? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setDestinations((previousDestinations) =>
      previousDestinations.filter(
        (destination) => destination.destination_id !== destinationId,
      ),
    );

    setSelectedDestination(null);
  }

  // Toggle destination status.
  function handleStatusChange(destinationId) {
    setDestinations((previousDestinations) =>
      previousDestinations.map((destination) =>
        destination.destination_id === destinationId
          ? {
              ...destination,
              status: destination.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
            }
          : destination,
      ),
    );

    setSelectedDestination((previousDestination) => {
      if (
        !previousDestination ||
        previousDestination.destination_id !== destinationId
      ) {
        return previousDestination;
      }

      return {
        ...previousDestination,
        status: previousDestination.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      };
    });
  }

  function getStatusClass(status) {
    return status === "ACTIVE"
      ? "destination-status-active"
      : "destination-status-inactive";
  }

  return (
    <div className="manage-destinations-layout">
      {/* Sidebar */}
      <aside className="manage-destinations-sidebar">
        <div className="manage-destinations-brand">
          <i className="bi bi-compass-fill"></i>
          <span>TravelTales</span>
        </div>

        <p className="manage-destinations-sidebar-label">MAIN MENU</p>

        <nav className="manage-destinations-navigation">
          <Link to="/admin/dashboard" className="manage-destinations-nav-link">
            <i className="bi bi-grid-1x2-fill"></i>
            <span>Dashboard</span>
          </Link>

          <Link to="/admin/users" className="manage-destinations-nav-link">
            <i className="bi bi-people-fill"></i>
            <span>Manage Users</span>
          </Link>

          <Link to="/admin/blogs" className="manage-destinations-nav-link">
            <i className="bi bi-journal-richtext"></i>
            <span>Manage Blogs</span>
          </Link>

          <Link
            to="/admin/destinations"
            className="manage-destinations-nav-link active"
          >
            <i className="bi bi-geo-alt-fill"></i>
            <span>Destinations</span>
          </Link>
        </nav>

        <div className="manage-destinations-sidebar-bottom">
          <Link to="/" className="manage-destinations-nav-link">
            <i className="bi bi-house-door-fill"></i>
            <span>Back to Website</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="manage-destinations-main">
        {/* Topbar */}
        <header className="manage-destinations-topbar">
          <div>
            <p>Administration</p>
            <h2>Manage Destinations</h2>
          </div>

          <div className="manage-destinations-profile">
            <div className="manage-destinations-avatar">A</div>

            <div>
              <strong>Administrator</strong>
              <span>Admin</span>
            </div>
          </div>
        </header>

        <div className="manage-destinations-content">
          {/* Heading */}
          <section className="manage-destinations-heading">
            <div>
              <h1>Destination Management</h1>
              <p>
                Add, update, and manage travel destinations available on
                TravelTales.
              </p>
            </div>

            <button
              type="button"
              className="destination-add-btn"
              onClick={handleAddDestination}
            >
              <i className="bi bi-plus-lg"></i>
              Add Destination
            </button>
          </section>

          {/* Statistics */}
          <section className="manage-destinations-statistics">
            <div className="destination-stat-card">
              <div className="destination-stat-icon total-icon">
                <i className="bi bi-geo-alt-fill"></i>
              </div>

              <div>
                <p>Total Destinations</p>
                <h3>{totalDestinations}</h3>
              </div>
            </div>

            <div className="destination-stat-card">
              <div className="destination-stat-icon active-icon">
                <i className="bi bi-check-circle-fill"></i>
              </div>

              <div>
                <p>Active Destinations</p>
                <h3>{activeDestinations}</h3>
              </div>
            </div>

            <div className="destination-stat-card">
              <div className="destination-stat-icon inactive-icon">
                <i className="bi bi-eye-slash-fill"></i>
              </div>

              <div>
                <p>Inactive Destinations</p>
                <h3>{inactiveDestinations}</h3>
              </div>
            </div>
          </section>

          {/* Destination Table */}
          <section className="manage-destinations-table-section">
            <div className="destination-table-header">
              <div>
                <h3>All Destinations</h3>
                <p>Manage the destinations listed on the website.</p>
              </div>

              <span className="destination-count">
                {filteredDestinations.length} Destinations
              </span>
            </div>

            {/* Search and Filter */}
            <div className="destination-toolbar">
              <div className="destination-search">
                <i className="bi bi-search"></i>

                <input
                  type="text"
                  placeholder="Search destination, city, state or country..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                />
              </div>

              <select
                className="destination-filter"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            {/* Table */}
            <div className="destination-table-wrapper">
              <table className="destination-table">
                <thead>
                  <tr>
                    <th>Destination</th>
                    <th>City</th>
                    <th>State / Region</th>
                    <th>Country</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredDestinations.length > 0 ? (
                    filteredDestinations.map((destination) => (
                      <tr key={destination.destination_id}>
                        <td>
                          <div className="destination-name-cell">
                            <strong>{destination.destination_name}</strong>
                            <span>ID #{destination.destination_id}</span>
                          </div>
                        </td>

                        <td>{destination.city}</td>

                        <td>{destination.state_region}</td>

                        <td>{destination.country}</td>

                        <td>
                          <span
                            className={`destination-status ${getStatusClass(destination.status)}`}
                          >
                            {destination.status}
                          </span>
                        </td>

                        <td>
                          <div className="destination-actions">
                            <button
                              type="button"
                              className="destination-action-btn view-btn"
                              title="View destination"
                              onClick={() =>
                                setSelectedDestination(destination)
                              }
                            >
                              <i className="bi bi-eye"></i>
                            </button>

                            <button
                              type="button"
                              className="destination-action-btn edit-btn"
                              title="Edit destination"
                              onClick={() => handleEditDestination(destination)}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>

                            <button
                              type="button"
                              className="destination-action-btn delete-btn"
                              title="Delete destination"
                              onClick={() =>
                                handleDeleteDestination(
                                  destination.destination_id,
                                )
                              }
                            >
                              <i className="bi bi-trash3"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6">
                        <div className="destination-empty-state">
                          <i className="bi bi-geo-alt"></i>
                          <h4>No destinations found</h4>
                          <p>Try changing your search or status filter.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <footer className="manage-destinations-footer">
          © 2026 TravelTales. All rights reserved.
        </footer>
      </main>

      {/* Add / Edit Destination Modal */}
      {isFormOpen && (
        <div
          className="destination-modal-overlay"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="destination-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="destination-modal-header">
              <div>
                <span>Destination Management</span>
                <h3>
                  {editingDestination ? "Edit Destination" : "Add Destination"}
                </h3>
              </div>

              <button
                type="button"
                className="destination-modal-close"
                onClick={() => setIsFormOpen(false)}
                aria-label="Close form"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="destination-modal-body">
                {formError && (
                  <p className="destination-form-error">{formError}</p>
                )}

                <div className="destination-form-grid">
                  <div className="destination-form-group">
                    <label htmlFor="destination_name">Destination Name</label>

                    <input
                      id="destination_name"
                      name="destination_name"
                      type="text"
                      value={formData.destination_name}
                      onChange={handleInputChange}
                      placeholder="Enter destination name"
                      required
                    />
                  </div>

                  <div className="destination-form-group">
                    <label htmlFor="city">City</label>

                    <input
                      id="city"
                      name="city"
                      type="text"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Enter city"
                      required
                    />
                  </div>

                  <div className="destination-form-group">
                    <label htmlFor="state_region">State / Region</label>

                    <input
                      id="state_region"
                      name="state_region"
                      type="text"
                      value={formData.state_region}
                      onChange={handleInputChange}
                      placeholder="Enter state or region"
                      required
                    />
                  </div>

                  <div className="destination-form-group">
                    <label htmlFor="country">Country</label>

                    <input
                      id="country"
                      name="country"
                      type="text"
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder="Enter country"
                      required
                    />
                  </div>

                  <div className="destination-form-group full-width">
                    <label htmlFor="description">Description</label>

                    <textarea
                      id="description"
                      name="description"
                      rows="4"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe this destination"
                      required
                    />
                  </div>

                  <div className="destination-form-group">
                    <label htmlFor="status">Status</label>

                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="destination-modal-footer">
                <button
                  type="button"
                  className="destination-cancel-btn"
                  onClick={() => setIsFormOpen(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="destination-save-btn">
                  {editingDestination ? "Save Changes" : "Add Destination"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Destination Details Modal */}
      {selectedDestination && (
        <div
          className="destination-modal-overlay"
          onClick={() => setSelectedDestination(null)}
        >
          <div
            className="destination-modal destination-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="destination-modal-header">
              <div>
                <span>Destination Details</span>
                <h3>{selectedDestination.destination_name}</h3>
              </div>

              <button
                type="button"
                className="destination-modal-close"
                onClick={() => setSelectedDestination(null)}
                aria-label="Close details"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="destination-modal-body">
              <div className="destination-detail-grid">
                <div>
                  <span>Destination ID</span>
                  <strong>#{selectedDestination.destination_id}</strong>
                </div>

                <div>
                  <span>City</span>
                  <strong>{selectedDestination.city}</strong>
                </div>

                <div>
                  <span>State / Region</span>
                  <strong>{selectedDestination.state_region}</strong>
                </div>

                <div>
                  <span>Country</span>
                  <strong>{selectedDestination.country}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong
                    className={`destination-status ${getStatusClass(selectedDestination.status)}`}
                  >
                    {selectedDestination.status}
                  </strong>
                </div>
              </div>

              <div className="destination-description">
                <h4>Description</h4>
                <p>{selectedDestination.description}</p>
              </div>
            </div>

            <div className="destination-modal-footer">
              <button
                type="button"
                className="destination-cancel-btn"
                onClick={() => setSelectedDestination(null)}
              >
                Close
              </button>

              <button
                type="button"
                className="destination-save-btn"
                onClick={() => handleEditDestination(selectedDestination)}
              >
                <i className="bi bi-pencil-square"></i>
                Edit Destination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageDestinations;
