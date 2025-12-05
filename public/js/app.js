// Application Management
class ApplicationManager {
  constructor() {
    this.applications = [];
    this.applicationForm = document.getElementById("application-form");
    this.editApplicationForm = document.getElementById("edit-application-form");
    this.statusFilter = document.getElementById("status-filter");
    this.searchInput = document.getElementById("search-applications");

    // Add chart instances
    this.statusChartInstance = null;
    this.timelineChartInstance = null;

    this.initEventListeners();
    this.loadApplications();

    // Setup filtering system
    this.setupFiltering();
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

    // Search input event listener
    if (this.searchInput) {
      this.searchInput.addEventListener("input", () => {
        this.filterApplications();
      });
    }

    // Status filter event listener
    if (this.statusFilter) {
      this.statusFilter.addEventListener("change", () => {
        this.filterApplications();
      });
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

  // New method to handle filtering
  filterApplications() {
    const searchTerm = this.searchInput
      ? this.searchInput.value.toLowerCase().trim()
      : "";
    const statusFilter = this.statusFilter ? this.statusFilter.value : "all";

    let filteredApplications = this.applications;

    // Apply status filter first
    if (statusFilter !== "all") {
      filteredApplications = filteredApplications.filter(
        (app) => app.status === statusFilter
      );
    }

    // Apply search filter
    if (searchTerm) {
      filteredApplications = filteredApplications.filter(
        (app) =>
          app.jobTitle.toLowerCase().includes(searchTerm) ||
          app.company.toLowerCase().includes(searchTerm) ||
          (app.location && app.location.toLowerCase().includes(searchTerm)) ||
          this.getStatusText(app.status).toLowerCase().includes(searchTerm)
      );
    }

    this.displayFilteredApplications(filteredApplications);
  }

  // Method to display filtered results
  displayFilteredApplications(filteredApplications) {
    const allApplicationsBody = document.getElementById(
      "all-applications-body"
    );
    if (!allApplicationsBody) return;

    allApplicationsBody.innerHTML = "";

    if (filteredApplications.length === 0) {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td colspan="6" style="text-align: center; padding: 40px;">
          <div class="no-data">
            <p>No applications found</p>
            <p style="font-size: 0.8rem; margin-top: 0.5rem; color: var(--text-muted);">
              Try adjusting your search or filter criteria
            </p>
          </div>
        </td>
      `;
      allApplicationsBody.appendChild(row);
      return;
    }

    filteredApplications.forEach((app) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${app.jobTitle}</td>
        <td>${app.company}</td>
        <td>${app.location || "-"}</td>
        <td>${this.formatDate(app.date)}</td>
        <td><span class="status-badge status-${
          app.status
        }">${this.getStatusText(app.status)}</span></td>
    <td class="action-buttons">
      <button 
        class="btn-action icon-button btn-edit" 
        data-id="${app._id}" 
        title="Edit application" 
        aria-label="Edit application">
        <i class="ri-edit-2-line"></i>
      </button>
      <button 
        class="btn-action icon-button btn-delete" 
        data-id="${app._id}" 
        title="Delete application" 
        aria-label="Delete application">
        <i class="ri-delete-bin-6-line"></i>
       </button>
    </td>
      `;
      allApplicationsBody.appendChild(row);
    });

    this.attachActionListeners();
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
      location: document.getElementById("location").value,
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
      // Show loading spinner before sending the request
      uiManager.setLoading(true);

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
        this.filterApplications(); // Use filter instead of updateUI for Applications page
        this.updateDashboard(); // Update dashboard stats
        this.updateStatisticsPage(); // Update statistics

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
    } finally {
      // hide spinner after request is done
      uiManager.setLoading(false);
    }
  }

  async handleUpdateApplication(e) {
    e.preventDefault();
    console.log("=== UPDATE APPLICATION STARTED ===");
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
      location: document.getElementById("edit-location").value,
      date: document.getElementById("edit-application-date").value,
      status: document.getElementById("edit-status").value,
      notes: document.getElementById("edit-notes").value,
    };
    console.log("Form Data being sent:", formData); // Debug log
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
        this.filterApplications(); // Use filter instead of updateUI for Applications page
        this.updateDashboard(); // Still update dashboard stats
        this.updateStatisticsPage(); // Still update statistics
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
        this.filterApplications(); // Use filter instead of updateUI for Applications page
        this.updateDashboard(); // Still update dashboard stats
        this.updateStatisticsPage(); // Still update statistics
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
    this.updateStatisticsPage();
  }

  // Update the existing updateApplicationsTable method to use filtering
  updateApplicationsTable() {
    // Instead of displaying all applications, use the filter method
    this.filterApplications();
  }

  updateDashboard() {
    const totalApplications = this.applications.length;

    // Calculate this week's applications
    const thisWeekApplications = this.getThisWeekApplications();

    const interviews = this.applications.filter(
      (app) => app.status === "interview"
    ).length;
    const offers = this.applications.filter(
      (app) => app.status === "offer"
    ).length;
    const successRate =
      totalApplications > 0 ? (offers / totalApplications) * 100 : 0;

    document.getElementById("total-applications").textContent =
      totalApplications;
    document.getElementById("this-week").textContent = thisWeekApplications;
    document.getElementById("interviews").textContent = interviews;
    document.getElementById("success-rate").textContent =
      successRate.toFixed(1) + "%";

    // Update extended statistics
    this.updateExtendedStatistics();

    // Update recent applications
    this.updateRecentApplications();
  }

  // Get this week's applications (week starts on Monday - European style)
  getThisWeekApplications() {
    const today = new Date();

    // Clone today's date so we don't mutate the original
    const startOfWeek = new Date(today);

    // Normalize time to the start of the day
    startOfWeek.setHours(0, 0, 0, 0);

    // In JS: Sunday = 0, Monday = 1, ..., Saturday = 6
    // We want Monday as the first day of the week.
    let day = startOfWeek.getDay();
    if (day === 0) {
      // Treat Sunday as day 7 instead of 0
      day = 7;
    }

    // Move back to Monday of the current week
    // Example: if today is Wednesday (day = 3), go back (3 - 1) = 2 days
    startOfWeek.setDate(startOfWeek.getDate() - (day - 1));

    // End of week = Sunday 23:59:59.999
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Count applications that fall within this Monday–Sunday window
    return this.applications.filter((app) => {
      const appDate = new Date(app.date);
      return appDate >= startOfWeek && appDate <= endOfWeek;
    }).length;
  }

  // Extended Statistics by Week and Month
  updateExtendedStatistics() {
    const weeklyStats = this.getWeeklyStatistics();
    const monthlyStats = this.getMonthlyStatistics();

    this.displayWeeklyStats(weeklyStats);
    this.displayMonthlyStats(monthlyStats);
    this.updatePerformanceStats(weeklyStats, monthlyStats);
  }

  // Update performance summary statistics
  updatePerformanceStats(weeklyStats, monthlyStats) {
    // Current week count
    const currentWeekCount = this.getThisWeekApplications();
    document.getElementById("current-week-count").textContent =
      currentWeekCount;

    // Most active month
    const mostActiveMonth = this.getMostActiveMonth(monthlyStats);
    document.getElementById("most-active-month").textContent = mostActiveMonth;

    // Weekly average
    const weeklyAverage = this.getWeeklyAverage(weeklyStats);
    document.getElementById("weekly-average").textContent = weeklyAverage;
  }

  // Get most active month
  getMostActiveMonth(monthlyStats) {
    if (Object.keys(monthlyStats).length === 0) return "-";

    const months = Object.values(monthlyStats);
    const mostActive = months.reduce(
      (max, month) => (month.count > max.count ? month : max),
      months[0]
    );

    return mostActive.monthName;
  }

  // Calculate weekly average
  getWeeklyAverage(weeklyStats) {
    if (Object.keys(weeklyStats).length === 0) return "0";

    const weeks = Object.values(weeklyStats);
    const totalApplications = weeks.reduce((sum, week) => sum + week.count, 0);
    const average = totalApplications / weeks.length;

    return average.toFixed(1);
  }

  // Weekly statistics
  getWeeklyStatistics() {
    const weeklyStats = {};

    this.applications.forEach((app) => {
      const weekNumber = this.getWeekNumber(new Date(app.date));
      const year = new Date(app.date).getFullYear();
      const weekKey = `${year}-W${weekNumber.toString().padStart(2, "0")}`;

      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = {
          week: weekNumber,
          year: year,
          count: 0,
          applications: [],
        };
      }

      weeklyStats[weekKey].count++;
      weeklyStats[weekKey].applications.push(app);
    });

    return weeklyStats;
  }

  // Monthly statistics
  getMonthlyStatistics() {
    const monthlyStats = {};

    this.applications.forEach((app) => {
      const date = new Date(app.date);
      const month = date.getMonth() + 1;
      const year = date.getFullYear();
      const monthKey = `${year}-${month.toString().padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: month,
          year: year,
          monthName: monthName,
          count: 0,
          applications: [],
        };
      }

      monthlyStats[monthKey].count++;
      monthlyStats[monthKey].applications.push(app);
    });

    return monthlyStats;
  }

  // Display weekly statistics
  displayWeeklyStats(weeklyStats) {
    const weeklyContainer = document.getElementById("weekly-stats-container");
    if (!weeklyContainer) return;

    weeklyContainer.innerHTML = "";

    // Convert the object to an array and sort it in descending order
    const sortedWeeks = Object.values(weeklyStats).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.week - a.week;
    });

    if (sortedWeeks.length === 0) {
      weeklyContainer.innerHTML = '<p class="no-data">No applications yet</p>';
      return;
    }

    sortedWeeks.forEach((week) => {
      const weekElement = document.createElement("div");
      weekElement.className = "stat-item";
      weekElement.innerHTML = `
                <div class="stat-header">
                    <h4>Week ${week.week}, ${week.year}</h4>
                    <span class="stat-count">${week.count} applications</span>
                </div>
                <div class="applications-list">
                    ${week.applications
                      .map(
                        (app) => `
                        <div class="application-item">
                            <span class="app-title">${app.jobTitle}</span>
                            <span class="app-company">at ${app.company}</span>
                            <span class="app-location">${
                              app.location ? `in ${app.location}` : ""
                            }</span>
                            <span class="app-status status-${
                              app.status
                            }">${this.getStatusText(app.status)}</span>
                        </div>
                      `
                      )
                      .join("")}
                </div>
            `;
      weeklyContainer.appendChild(weekElement);
    });
  }

  // Display monthly statistics
  displayMonthlyStats(monthlyStats) {
    const monthlyContainer = document.getElementById("monthly-stats-container");
    if (!monthlyContainer) return;

    monthlyContainer.innerHTML = "";

    // Convert the object to an array and sort it in descending order
    const sortedMonths = Object.values(monthlyStats).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    if (sortedMonths.length === 0) {
      monthlyContainer.innerHTML = '<p class="no-data">No applications yet</p>';
      return;
    }

    sortedMonths.forEach((month) => {
      const monthElement = document.createElement("div");
      monthElement.className = "stat-item";
      monthElement.innerHTML = `
                <div class="stat-header">
                    <h4>${month.monthName}</h4>
                    <span class="stat-count">${month.count} applications</span>
                </div>
                <div class="applications-list">
                    ${month.applications
                      .map(
                        (app) => `
                        <div class="application-item">
                            <span class="app-title">${app.jobTitle}</span>
                            <span class="app-company">at ${app.company}</span>
                            <span class="app-date">${this.formatDate(
                              app.date
                            )}</span>
                            <span class="app-status status-${
                              app.status
                            }">${this.getStatusText(app.status)}</span>
                        </div>
                    `
                      )
                      .join("")}
                </div>
            `;
      monthlyContainer.appendChild(monthElement);
    });
  }

  // Helper function to get ISO-like week number (week starts on Monday)
  getWeekNumber(date) {
    // Create a copy of the date in UTC to avoid timezone issues
    const tmp = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );

    // In ISO weeks, week starts on Monday.
    // Set tmp to the Thursday of the current week (ISO trick).
    const day = tmp.getUTCDay() || 7; // Sunday (0) becomes 7
    tmp.setUTCDate(tmp.getUTCDate() + 4 - day);

    // First day of the year (in UTC)
    const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));

    // Calculate week number: number of weeks between yearStart and tmp
    const weekNumber = Math.ceil(((tmp - yearStart) / 86400000 + 1) / 7);

    return weekNumber;
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
      row.innerHTML = `<td colspan="6" style="text-align: center; padding: 20px;">No applications yet. Add your first application above!</td>`;
      recentApplicationsBody.appendChild(row);
      return;
    }

    recentApps.forEach((app) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${app.jobTitle}</td>
        <td>${app.company}</td>
        <td>${app.location || "-"}</td>
        <td>${this.formatDate(app.date)}</td>
        <td><span class="status-badge status-${
          app.status
        }">${this.getStatusText(app.status)}</span></td>
      <td class="action-buttons">
       <button 
        class="btn-action icon-button btn-edit" 
        data-id="${app._id}" 
        title="Edit application" 
        aria-label="Edit application">
        <i class="ri-edit-2-line"></i>
       </button>
       <button 
        class="btn-action icon-button btn-delete" 
        data-id="${app._id}" 
        title="Delete application" 
        aria-label="Delete application">
        <i class="ri-delete-bin-6-line"></i>
       </button>
      </td>
      `;
      recentApplicationsBody.appendChild(row);
    });

    this.attachActionListeners();
  }

  attachActionListeners() {
    // Edit buttons
    document.querySelectorAll(".btn-edit").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        this.editApplication(id);
      });
    });

    // Delete buttons
    document.querySelectorAll(".btn-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        this.showDeleteConfirmation(id);
      });
    });
  }

  // Update statistics page (separate from dashboard)
  updateStatisticsPage() {
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

    // Update extended statistics for statistics page
    this.updateExtendedStatistics();

    // Update charts
    this.updateCharts();
  }

  updateCharts() {
    this.updateStatusChart();
    this.updateTimelineChart();
  }

  // Update status chart
  updateStatusChart() {
    const ctx = document.getElementById("statusChart");
    if (!ctx) return;

    // More reliable theme detection
    const isDarkMode = document.body.classList.contains("dark-mode");

    // Use direct color values for better reliability
    const textColor = isDarkMode ? "#f1f5f9" : "#1e293b";
    const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
    const lightBorder = isDarkMode
      ? "rgba(255, 255, 255, 0.2)"
      : "rgba(0, 0, 0, 0.1)";

    // Destroy existing chart if it exists
    if (this.statusChartInstance) {
      this.statusChartInstance.destroy();
      this.statusChartInstance = null;
    }

    // Count applications by status
    const statusCounts = {
      applied: this.applications.filter((app) => app.status === "applied")
        .length,
      interview: this.applications.filter((app) => app.status === "interview")
        .length,
      test: this.applications.filter((app) => app.status === "test").length,
      offer: this.applications.filter((app) => app.status === "offer").length,
      rejected: this.applications.filter((app) => app.status === "rejected")
        .length,
      canceled: this.applications.filter((app) => app.status === "canceled")
        .length,
    };

    // Only create chart if we have data
    if (this.applications.length > 0) {
      try {
        // Clear any existing content
        ctx.parentElement.innerHTML = '<canvas id="statusChart"></canvas>';
        const newCtx = document.getElementById("statusChart");

        this.statusChartInstance = new Chart(newCtx, {
          type: "doughnut",
          data: {
            labels: ["Applied", "Interview", "Test", "Offer", "Rejected"],
            datasets: [
              {
                data: [
                  statusCounts.applied,
                  statusCounts.interview,
                  statusCounts.test,
                  statusCounts.offer,
                  statusCounts.rejected,
                  statusCounts.canceled,
                ],
                backgroundColor: [
                  "#3b82f6",
                  "#f59e0b",
                  "#8b5cf6",
                  "#10b981",
                  "#ef4444",
                  "#6b7280",
                ],
                borderWidth: 2,
                borderColor: cardBg,
              },
            ],
          },
          options: {
            color: textColor,
            responsive: true,
            maintainAspectRatio: false,
            elements: {
              arc: {
                borderColor: cardBg,
              },
            },
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  color: textColor,
                  font: { size: 11 },
                  padding: 15,
                  usePointStyle: true,
                },
              },
              tooltip: {
                backgroundColor: cardBg,
                titleColor: textColor,
                bodyColor: textColor,
                borderColor: lightBorder,
                borderWidth: 1,
              },
            },
            cutout: "60%",
          },
        });
      } catch (error) {
        console.error("Error creating status chart:", error);
      }
    } else {
      // Show no data message
      const container = ctx.parentElement;
      if (container) {
        container.innerHTML = `
                <div class="no-data" style="height: 200px; display: flex; align-items: center; justify-content: center;">
                    <div>
                        <p>No data available</p>
                        <p style="font-size: 0.8rem; margin-top: 0.5rem;">Add applications to see status distribution</p>
                    </div>
                </div>
            `;
      }
    }
  }

  // Update timeline chart
  updateTimelineChart() {
    const ctx = document.getElementById("weeklyChart");
    if (!ctx) return;

    // More reliable theme detection
    const isDarkMode = document.body.classList.contains("dark-mode");

    // Use direct color values for better reliability
    const textColor = isDarkMode ? "#f1f5f9" : "#1e293b";
    const cardBg = isDarkMode ? "#1e293b" : "#ffffff";
    const lightBorder = isDarkMode
      ? "rgba(255, 255, 255, 0.2)"
      : "rgba(0, 0, 0, 0.1)";
    const gridColor = isDarkMode
      ? "rgba(255, 255, 255, 0.1)"
      : "rgba(0, 0, 0, 0.1)";

    // Destroy existing chart if it exists
    if (this.timelineChartInstance) {
      this.timelineChartInstance.destroy();
      this.timelineChartInstance = null;
    }

    // Get weekly statistics
    const weeklyStats = this.getWeeklyStatistics();

    // Convert to array and sort by date
    const sortedWeeks = Object.values(weeklyStats)
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.week - b.week;
      })
      .slice(-8); // Last 8 weeks

    if (sortedWeeks.length > 0) {
      try {
        // Clear any existing content
        ctx.parentElement.innerHTML = '<canvas id="weeklyChart"></canvas>';
        const newCtx = document.getElementById("weeklyChart");

        this.timelineChartInstance = new Chart(newCtx, {
          type: "line",
          data: {
            labels: sortedWeeks.map((week) => `W${week.week} ${week.year}`),
            datasets: [
              {
                label: "Applications",
                data: sortedWeeks.map((week) => week.count),
                borderColor: "#6366f1",
                backgroundColor: isDarkMode
                  ? "rgba(99, 102, 241, 0.3)"
                  : "rgba(99, 102, 241, 0.1)",
                tension: 0.4,
                fill: true,
                pointBackgroundColor: "#6366f1",
                pointBorderColor: cardBg,
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false,
              },
              tooltip: {
                backgroundColor: cardBg,
                titleColor: textColor,
                bodyColor: textColor,
                borderColor: lightBorder,
                borderWidth: 1,
              },
            },
            scales: {
              x: {
                grid: {
                  color: gridColor,
                },
                ticks: {
                  color: textColor,
                  maxRotation: 0,
                  font: {
                    size: 11,
                  },
                },
              },
              y: {
                beginAtZero: true,
                grid: {
                  color: gridColor,
                },
                ticks: {
                  color: textColor,
                  stepSize: 1,
                  font: {
                    size: 11,
                  },
                },
              },
            },
          },
        });
      } catch (error) {
        console.error("Error creating timeline chart:", error);
      }
    } else {
      // Show no data message
      ctx.parentElement.innerHTML = `
            <div class="no-data" style="height: 200px; display: flex; align-items: center; justify-content: center;">
                <div>
                    <p>No data available</p>
                    <p style="font-size: 0.8rem; margin-top: 0.5rem;">Add applications to see timeline</p>
                </div>
            </div>
        `;
    }
  }

  // Month Filtering System
  setupFiltering() {
    const monthFilter = document.getElementById("month-filter");
    const applyFilterBtn = document.getElementById("apply-month-filter");

    if (monthFilter && applyFilterBtn) {
      this.populateMonthFilter();

      applyFilterBtn.addEventListener("click", () => {
        this.applyMonthFilter();
      });
    }
  }

  // Populate available months in filter dropdown
  populateMonthFilter() {
    const monthFilter = document.getElementById("month-filter");
    if (!monthFilter) return;

    // Clear current options (except "All Months")
    while (monthFilter.children.length > 1) {
      monthFilter.removeChild(monthFilter.lastChild);
    }

    // Collect available months from applications
    const availableMonths = new Set();

    this.applications.forEach((app) => {
      const date = new Date(app.date);
      const month = date.getMonth();
      const year = date.getFullYear();
      const monthKey = `${year}-${(month + 1).toString().padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });

      availableMonths.add(
        JSON.stringify({
          key: monthKey,
          name: monthName,
          year: year,
          month: month + 1,
        })
      );
    });

    // Convert to array and sort in descending order
    const sortedMonths = Array.from(availableMonths)
      .map((item) => JSON.parse(item))
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });

    // Add options to dropdown
    sortedMonths.forEach((month) => {
      const option = document.createElement("option");
      option.value = month.key;
      option.textContent = month.name;
      monthFilter.appendChild(option);
    });
  }

  // Apply month filter and display results
  applyMonthFilter() {
    const monthFilter = document.getElementById("month-filter");
    const resultsContainer = document.getElementById("monthly-filter-results");

    if (!monthFilter || !resultsContainer) return;

    const selectedMonth = monthFilter.value;

    if (selectedMonth === "all") {
      resultsContainer.innerHTML =
        '<p class="no-data">Select a specific month to see applications</p>';
      return;
    }

    const [year, month] = selectedMonth.split("-").map(Number);
    const filteredApplications = this.applications.filter((app) => {
      const appDate = new Date(app.date);
      return appDate.getFullYear() === year && appDate.getMonth() + 1 === month;
    });

    if (filteredApplications.length === 0) {
      resultsContainer.innerHTML =
        '<p class="no-data">No applications found for the selected month</p>';
      return;
    }

    resultsContainer.innerHTML = `
    <div class="filtered-header">
        <h4>${new Date(year, month - 1).toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })}</h4>
        <span class="stat-count">${
          filteredApplications.length
        } applications</span>
    </div>
    <div class="applications-list">
        ${filteredApplications
          .map(
            (app) => `
            <div class="application-item">
                <span class="app-title">${app.jobTitle}</span>
                <span class="app-company">at ${app.company}</span>
                <span class="app-location">${
                  app.location ? `in ${app.location}` : ""
                }</span>
                <span class="app-date">${this.formatDate(app.date)}</span>
                <span class="app-status status-${
                  app.status
                }">${this.getStatusText(app.status)}</span>
            </div>
        `
          )
          .join("")}
    </div>
  `;
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
      canceled: "Canceled",
    };
    return statusMap[status] || status;
  }
}

// Initialize Application Manager when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  window.applicationManager = new ApplicationManager();
});
