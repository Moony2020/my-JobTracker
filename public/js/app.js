// Application Management
class ApplicationManager {
  constructor() {
    this.applications = [];
    this.applicationForm = document.getElementById("application-form");
    this.editApplicationForm = document.getElementById("edit-application-form");
    this.statusFilter = document.getElementById("status-filter");

    this.initEventListeners();
    this.loadApplications();
  }

  initEventListeners() {
    // Application form
    if (this.applicationForm) {
      this.applicationForm.addEventListener("submit", (e) =>
        this.handleAddApplication(e)
      );
    }

    // Edit application form
    if (this.editApplicationForm) {
      this.editApplicationForm.addEventListener("submit", (e) =>
        this.handleUpdateApplication(e)
      );
    }

    // Status filter
    if (this.statusFilter) {
      this.statusFilter.addEventListener("change", () =>
        this.loadApplications()
      );
    }

    // Set default date to today
    this.setDefaultDate();
  }

  setDefaultDate() {
    const dateField = document.getElementById("application-date");
    if (dateField) {
      const today = new Date().toISOString().split("T")[0];
      dateField.value = today;
    }
  }

  async loadApplications() {
    if (!authManager.isAuthenticated()) {
      this.applications = [];
      this.updateUI();
      return;
    }

    try {
      const token = authManager.getToken();
      const statusFilter = this.statusFilter ? this.statusFilter.value : "all";

      let url = "/api/applications";
      if (statusFilter !== "all") {
        url += `?status=${statusFilter}`;
      }

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        this.applications = await response.json();
        this.updateUI();
      } else {
        console.error("Failed to load applications:", response.status);
        uiManager.showNotification("Failed to load applications", "error");
      }
    } catch (error) {
      console.error("Error loading applications:", error);
      uiManager.showNotification("Network error loading applications", "error");
    }
  }

  async handleAddApplication(e) {
    e.preventDefault();
    console.log("Add application form submitted");

    if (!authManager.isAuthenticated()) {
      uiManager.showNotification("Please login to add applications", "warning");
      return;
    }

    const formData = {
      jobTitle: document.getElementById("job-title").value,
      company: document.getElementById("company").value,
      date: document.getElementById("application-date").value,
      status: document.getElementById("status").value,
      notes: document.getElementById("notes").value,
    };

    console.log("Form data:", formData);

    // Basic validation
    if (!formData.jobTitle || !formData.company || !formData.date) {
      uiManager.showNotification("Please fill in all required fields", "error");
      return;
    }

    try {
      const token = authManager.getToken();
      console.log(
        "Sending request to API with token:",
        token ? "Token exists" : "No token"
      );

      const response = await fetch("/api/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      console.log("Response status:", response.status);

      if (response.ok) {
        const newApplication = await response.json();
        console.log("New application created:", newApplication);
        this.applications.push(newApplication);
        this.applicationForm.reset();
        this.setDefaultDate(); // Reset date to today
        this.updateUI();
        uiManager.showNotification(
          "Application added successfully!",
          "success"
        );
      } else {
        const errorData = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        console.error("Server error:", errorData);
        uiManager.showNotification(
          errorData.message || "Failed to add application",
          "error"
        );
      }
    } catch (error) {
      console.error("Network error:", error);
      uiManager.showNotification("Network error. Please try again.", "error");
    }
  }

  async handleUpdateApplication(e) {
    e.preventDefault();

    if (!authManager.isAuthenticated()) {
      uiManager.showNotification(
        "Please login to update applications",
        "warning"
      );
      return;
    }

    const applicationId = document.getElementById("edit-application-id").value;
    const formData = {
      jobTitle: document.getElementById("edit-job-title").value,
      company: document.getElementById("edit-company").value,
      date: document.getElementById("edit-application-date").value,
      status: document.getElementById("edit-status").value,
      notes: document.getElementById("edit-notes").value,
    };

    // Basic validation
    if (!formData.jobTitle || !formData.company || !formData.date) {
      uiManager.showNotification("Please fill in all required fields", "error");
      return;
    }

    try {
      const token = authManager.getToken();
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (response.ok) {
        const updatedApplication = await response.json();
        // Update the application in the local array
        const index = this.applications.findIndex(
          (app) => app._id === applicationId
        );
        if (index !== -1) {
          this.applications[index] = updatedApplication;
        }
        this.updateUI();
        uiManager.hideAllModals();
        uiManager.showNotification(
          "Application updated successfully!",
          "success"
        );
      } else {
        const error = await response.json();
        uiManager.showNotification(
          error.message || "Failed to update application",
          "error"
        );
      }
    } catch (error) {
      uiManager.showNotification("Network error. Please try again.", "error");
    }
  }

  async deleteApplication(id) {
    if (!authManager.isAuthenticated()) {
      uiManager.showNotification(
        "Please login to delete applications",
        "warning"
      );
      return;
    }

    try {
      const token = authManager.getToken();
      const response = await fetch(`/api/applications/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: "include",
      });

      if (response.ok) {
        this.applications = this.applications.filter((app) => app._id !== id);
        this.updateUI();
        uiManager.showNotification(
          "Application deleted successfully",
          "success"
        );
      } else {
        uiManager.showNotification("Failed to delete application", "error");
      }
    } catch (error) {
      uiManager.showNotification("Network error. Please try again.", "error");
    }
  }

  editApplication(id) {
    const application = this.applications.find((app) => app._id === id);
    if (application) {
      uiManager.showEditModal(application);
    } else {
      uiManager.showNotification("Application not found", "error");
    }
  }

  showDeleteConfirmation(id) {
    const application = this.applications.find((app) => app._id === id);
    if (application) {
      uiManager.showDeleteModal(application);
    } else {
      uiManager.showNotification("Application not found", "error");
    }
  }

  updateUI() {
    this.updateDashboard();
    this.updateApplicationsTable();
    this.updateStatistics();
  }

  updateDashboard() {
    const totalApplications = this.applications.length;

    // Calculate this week's applications
    const thisWeekApplications = this.applications.filter((app) => {
      const appDate = new Date(app.date);
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      return appDate >= startOfWeek;
    }).length;

    const interviews = this.applications.filter(
      (app) => app.status === "interview"
    ).length;
    const offers = this.applications.filter(
      (app) => app.status === "offer"
    ).length;
    const successRate =
      totalApplications > 0 ? (offers / totalApplications) * 100 : 0;

    // Update DOM elements if they exist
    const totalEl = document.getElementById("total-applications");
    const weekEl = document.getElementById("this-week");
    const interviewsEl = document.getElementById("interviews");
    const successEl = document.getElementById("success-rate");

    if (totalEl) totalEl.textContent = totalApplications;
    if (weekEl) weekEl.textContent = thisWeekApplications;
    if (interviewsEl) interviewsEl.textContent = interviews;
    if (successEl) successEl.textContent = successRate.toFixed(1) + "%";

    // Update recent applications table
    this.updateRecentApplications();
  }

  updateRecentApplications() {
    const recentApplicationsBody = document.getElementById(
      "recent-applications-body"
    );
    if (!recentApplicationsBody) return;

    recentApplicationsBody.innerHTML = "";

    const recentApps = this.applications
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5);

    if (recentApps.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="5" style="text-align: center; padding: 20px;">No applications yet. Add your first application above!</td>`;
      recentApplicationsBody.appendChild(row);
      return;
    }

    recentApps.forEach((app) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${app.jobTitle}</td>
                <td>${app.company}</td>
                <td>${this.formatDate(app.date)}</td>
                <td><span class="status-badge status-${
                  app.status
                }">${this.getStatusText(app.status)}</span></td>
                <td class="action-buttons">
                    <button class="btn-action btn-edit" data-id="${
                      app._id
                    }">Edit</button>
                    <button class="btn-action btn-delete" data-id="${
                      app._id
                    }">Delete</button>
                </td>
            `;
      recentApplicationsBody.appendChild(row);
    });

    this.attachActionListeners();
  }

  updateApplicationsTable() {
    const allApplicationsBody = document.getElementById(
      "all-applications-body"
    );
    if (!allApplicationsBody) return;

    allApplicationsBody.innerHTML = "";

    if (this.applications.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="6" style="text-align: center; padding: 20px;">No applications found. Add your first application from the Dashboard!</td>`;
      allApplicationsBody.appendChild(row);
      return;
    }

    this.applications.forEach((app) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${app.jobTitle}</td>
                <td>${app.company}</td>
                <td>${this.formatDate(app.date)}</td>
                <td><span class="status-badge status-${
                  app.status
                }">${this.getStatusText(app.status)}</span></td>
                <td>${app.notes || ""}</td>
                <td class="action-buttons">
                    <button class="btn-action btn-edit" data-id="${
                      app._id
                    }">Edit</button>
                    <button class="btn-action btn-delete" data-id="${
                      app._id
                    }">Delete</button>
                </td>
            `;
      allApplicationsBody.appendChild(row);
    });

    this.attachActionListeners();
  }

  attachActionListeners() {
    // Edit buttons
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        this.editApplication(id);
      });
    });

    // Delete buttons
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const id = e.target.getAttribute("data-id");
        this.showDeleteConfirmation(id);
      });
    });
  }

  updateStatistics() {
    const totalApplications = this.applications.length;

    // This month applications
    const thisMonthApplications = this.applications.filter((app) => {
      const appDate = new Date(app.date);
      const today = new Date();
      return (
        appDate.getMonth() === today.getMonth() &&
        appDate.getFullYear() === today.getFullYear()
      );
    }).length;

    // Interview rate
    const interviews = this.applications.filter(
      (app) => app.status === "interview"
    ).length;
    const interviewRate =
      totalApplications > 0 ? (interviews / totalApplications) * 100 : 0;

    // Offer rate
    const offers = this.applications.filter(
      (app) => app.status === "offer"
    ).length;
    const offerRate =
      totalApplications > 0 ? (offers / totalApplications) * 100 : 0;

    // Update DOM elements if they exist
    const totalEl = document.getElementById("stats-total");
    const monthEl = document.getElementById("stats-this-month");
    const interviewRateEl = document.getElementById("stats-interview-rate");
    const offerRateEl = document.getElementById("stats-offer-rate");

    if (totalEl) totalEl.textContent = totalApplications;
    if (monthEl) monthEl.textContent = thisMonthApplications;
    if (interviewRateEl)
      interviewRateEl.textContent = interviewRate.toFixed(1) + "%";
    if (offerRateEl) offerRateEl.textContent = offerRate.toFixed(1) + "%";

    this.updateCharts();
  }

  updateCharts() {
    // Simple chart implementation - in a real app, use Chart.js or similar
    console.log("Charts would be updated here with real data");
  }

  // Helper functions
  formatDate(dateString) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  }

  getStatusText(status) {
    const statusMap = {
      applied: "Applied",
      interview: "Interview",
      test: "Test",
      offer: "Offer",
      rejected: "Rejected",
    };
    return statusMap[status] || status;
  }
}

// Initialize Application Manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.applicationManager = new ApplicationManager();
});
