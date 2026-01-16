// UI Management
class UIManager {
  constructor() {
    this.themeToggle = document.getElementById("themeToggle");
    this.loginBtn = document.getElementById("loginBtn");
    this.registerBtn = document.getElementById("registerBtn");
    this.logoutBtn = document.getElementById("logoutBtn");
    this.userMenu = document.getElementById("userMenu");
    this.guestMenu = document.getElementById("guestMenu");
    this.userName = document.getElementById("userName");
    this.loginModal = document.getElementById("loginModal");
    this.registerModal = document.getElementById("registerModal");
    this.editModal = document.getElementById("editModal");
    this.deleteModal = document.getElementById("deleteModal");
    this.closeModalButtons = document.querySelectorAll(".close-modal");
    this.navLinks = document.querySelectorAll(".nav-link");
    this.pages = document.querySelectorAll(".page");
    this.notification = document.getElementById("notification");
    this.hamburgerBtn = document.getElementById("hamburgerBtn");
    this.mobileNav = document.getElementById("mobileNav");
    this.mobileNavLinks = document.querySelectorAll(".mobile-nav-link");
    this.loader = document.getElementById("global-loader");

    this.currentDeleteId = null;

    this.initEventListeners();
    this.initTheme();
    this.initPasswordToggles();
    this.initDropdownEvents();
  }

  // Loader
  setLoading(isLoading) {
    if (!this.loader) return;
    if (isLoading) {
      this.loader.classList.remove("hidden");
    } else {
      this.loader.classList.add("hidden");
    }
  }

  initEventListeners() {
    // Theme toggle
    this.themeToggle?.addEventListener("change", () => this.toggleTheme());

    // Modal controls
    this.loginBtn?.addEventListener("click", () => this.showModal("loginModal"));
    this.registerBtn?.addEventListener("click", () =>
      this.showModal("registerModal")
    );

    // Close modal buttons
    this.closeModalButtons.forEach((button) => {
      button.addEventListener("click", () => this.hideAllModals());
    });

    // Edit modal events
    document.getElementById("cancelEdit")?.addEventListener("click", () => {
      this.hideAllModals();
    });

    // Delete modal events
    document.getElementById("cancelDelete")?.addEventListener("click", () => {
      this.hideAllModals();
    });

    document.getElementById("confirmDelete")?.addEventListener("click", () => {
      if (this.currentDeleteId && window.applicationManager) {
        window.applicationManager.deleteApplication(this.currentDeleteId);
        this.hideAllModals();
      }
    });

    // Close modal when clicking outside
    window.addEventListener("click", (e) => {
      if (e.target.classList.contains("modal")) {
        this.hideAllModals();
      }
    });

    // Navigation
    this.navLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        this.showPage(link.getAttribute("data-page"));
        this.closeMobileNav();
      });
    });

    // Mobile navigation
    if (this.hamburgerBtn) {
      this.hamburgerBtn.addEventListener("click", () => this.toggleMobileNav());
    }

    // Mobile nav links
    this.mobileNavLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const page = link.getAttribute("data-page");
        this.showPage(page);
        this.closeMobileNav();
      });
    });

    // Close mobile nav when clicking on auth buttons
    document.querySelectorAll(".auth-buttons button").forEach((btn) => {
      btn.addEventListener("click", () => this.closeMobileNav());
    });

    // Logout
    if (this.logoutBtn) {
      this.logoutBtn.addEventListener("click", () => this.handleLogout());
    }

    // Forgot Password
    document.getElementById("forgot-password")?.addEventListener("click", (e) => {
      e.preventDefault();
      this.hideAllModals();
      this.showModal("forgotPasswordModal");
    });

    // Logout button (from menu)
    document.querySelectorAll("#logoutBtn").forEach(btn => {
      btn.addEventListener("click", () => this.handleLogout());
    });

    // Theme toggle (from menu)
    document.getElementById("themeToggleMenu")?.addEventListener("click", () => this.toggleTheme());
    
    // Change password from dropdown
    document.getElementById("openChangePasswordInMenu")?.addEventListener("click", () => {
      this.showModal("changePasswordModal");
    });

    // Settings from dropdown
    document.getElementById("openSettings")?.addEventListener("click", () => {
      this.showNotification("Settings coming soon!", "info");
    });

    // Back to Login from Forgot Password
    document.querySelector(".back-to-login")?.addEventListener("click", (e) => {
        e.preventDefault();
        this.hideAllModals();
        this.showModal("loginModal");
    });
  }

  initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    if (savedTheme === "light") {
      document.body.classList.remove("dark-mode");
      if (this.themeToggle) this.themeToggle.checked = false;
    } else {
      document.body.classList.add("dark-mode");
      if (this.themeToggle) this.themeToggle.checked = true;
    }
  }

  toggleTheme() {
    const isDarkMode = this.themeToggle.checked;
    if (isDarkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
    }

    // Refresh charts when theme changes
    setTimeout(() => {
      if (window.applicationManager) {
        window.applicationManager.updateCharts();
      }
    }, 300);
  }

  // Mobile Navigation Methods
  toggleMobileNav() {
    if (this.mobileNav.classList.contains("active")) {
      this.closeMobileNav();
    } else {
      this.openMobileNav();
    }
  }

  openMobileNav() {
    this.mobileNav.classList.add("active");
    this.hamburgerBtn.classList.add("active");
    document.body.classList.add("mobile-nav-open");
  }

  closeMobileNav() {
    this.mobileNav.classList.remove("active");
    this.hamburgerBtn.classList.remove("active");
    document.body.classList.remove("mobile-nav-open");
  }

  // Modal Methods
  showModal(modalId) {
    this.hideAllModals();
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.style.display = "flex";
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }
  }

  hideModals() {
    const modals = document.querySelectorAll(".modal");
    modals.forEach((modal) => {
      modal.style.display = "none";
    });
    // Restore body scroll
    document.body.style.overflow = "";
  }

  hideAllModals() {
    this.hideModals();
    this.closeMobileNav();
    document.body.classList.remove("mobile-nav-open");
  }

  initPasswordToggles() {
    const toggles = document.querySelectorAll(".toggle-password");
    toggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const targetId = toggle.getAttribute("data-target");
        const passwordInput = document.getElementById(targetId);
        if (passwordInput) {
          const isPassword = passwordInput.getAttribute("type") === "password";
          passwordInput.setAttribute("type", isPassword ? "text" : "password");

          // Toggle icon class
          toggle.classList.toggle("ri-eye-off-line", !isPassword);
          toggle.classList.toggle("ri-eye-line", isPassword);
        }
      });
    });
  }

  initDropdownEvents() {
    const dropdowns = document.querySelectorAll(".user-dropdown");

    // Close dropdowns if clicked outside (for mobile or click triggers)
    document.addEventListener("click", (event) => {
      dropdowns.forEach(dropdown => {
        const dropdownMenu = dropdown.querySelector(".dropdown-menu");
        if (dropdownMenu && !dropdown.contains(event.target)) {
          // If we were using .show class, we'd remove it here
        }
      });
    });
  }

  showEditModal(application) {
    if (!application) return;

    document.getElementById("edit-application-id").value = application._id;
    document.getElementById("edit-job-title").value = application.jobTitle;
    document.getElementById("edit-company").value = application.company;
    document.getElementById("edit-location").value = application.location || "";
    document.getElementById("edit-application-date").value =
      application.date.split("T")[0];

    // Set status and force a re-render
    const statusField = document.getElementById("edit-status");
    statusField.value = application.status;
    statusField.dispatchEvent(new Event("change", { bubbles: true })); // Force change event

    document.getElementById("edit-notes").value = application.notes || "";

    // Small delay to ensure DOM updates
    setTimeout(() => {
      this.showModal("editModal");
      console.log("Modal shown, status field value:", statusField.value);
    }, 50);
  }

  showDeleteModal(application) {
    if (!application) return;

    document.getElementById(
      "delete-app-info"
    ).textContent = `${application.jobTitle} at ${application.company}`;
    this.currentDeleteId = application._id;
    this.showModal("deleteModal");
  }

  // Page Navigation
  showPage(pageId) {
    // Update active nav link for desktop
    this.navLinks.forEach((nav) => nav.classList.remove("active"));
    const desktopLink = document.querySelector(
      `.nav-link[data-page="${pageId}"]`
    );
    if (desktopLink) {
      desktopLink.classList.add("active");
    }

    // Update active nav link for mobile
    this.mobileNavLinks.forEach((nav) => nav.classList.remove("active"));
    const mobileLink = document.querySelector(
      `.mobile-nav-link[data-page="${pageId}"]`
    );
    if (mobileLink) {
      mobileLink.classList.add("active");
    }

    // Show selected page
    this.pages.forEach((page) => {
      if (page.id === `${pageId}-page`) {
        page.classList.remove("hidden");
      } else {
        page.classList.add("hidden");
      }
    });

    // 🔹 Always close the mobile nav when changing page
    if (typeof this.closeMobileNav === "function") {
      this.closeMobileNav();
    }

    // Update statistics if needed
    if (pageId === "statistics" && window.applicationManager) {
      window.applicationManager.updateStatisticsPage();
    }
  }

  // Notification System
  showNotification(message, type = "info") {
    const notification = this.notification;
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    notification.classList.remove("hidden", "hide");

    setTimeout(() => {
      notification.classList.remove("show");
      notification.classList.add("hide");
      setTimeout(() => {
        notification.classList.add("hidden");
      }, 300);
    }, 3000);
  }

  // User Interface Updates
  updateUserInterface(user) {
    if (user) {
      // Desktop elements
      if (this.guestMenu) this.guestMenu.classList.add("hidden");
      this.userMenu.classList.remove("hidden");
      
      // Update Name and Initials
      const nameElement = document.getElementById("userName");
      const initialsElement = document.getElementById("userInitials");
      
      if (nameElement) nameElement.textContent = user.name;
      if (initialsElement) {
        initialsElement.textContent = this.getInitials(user.name);
      }

      // Mobile elements
      const mobileAuth = document.getElementById("mobileAuth");
      if (mobileAuth) {
        mobileAuth.classList.add("hidden");
      }
      const mobileUserMenu = document.getElementById("mobileUserMenu");
      if (mobileUserMenu) {
        mobileUserMenu.classList.remove("hidden");
        const mobileName = document.getElementById("mobileUserName");
        if (mobileName) mobileName.textContent = user.name;
      }
    } else {
      // Desktop elements
      if (this.guestMenu) this.guestMenu.classList.remove("hidden");
      this.userMenu.classList.add("hidden");

      // Mobile elements
      const mobileAuth = document.getElementById("mobileAuth");
      if (mobileAuth) {
        mobileAuth.classList.remove("hidden");
      }
      const mobileUserMenu = document.getElementById("mobileUserMenu");
      if (mobileUserMenu) {
        mobileUserMenu.classList.add("hidden");
      }
    }
  }

  // Logout Handler
  async handleLogout() {
    try {
      this.setLoading(true); // Show loader
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        localStorage.removeItem("token");
        this.updateUserInterface(null);
        this.showNotification("Logged out successfully", "success");
        this.showPage("dashboard");
        // Reload applications to clear user data
        if (window.applicationManager) {
          await window.applicationManager.loadApplications();
        }
      } else {
        this.showNotification("Error logging out", "error");
      }
    } catch (error) {
      this.showNotification("Error logging out", "error");
    } finally {
      // Hide loader
      this.setLoading(false);
    }
  }

  // Form validation helpers
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  validatePassword(password) {
    return password.length >= 6;
  }

  validateForm(formData) {
    const errors = [];

    if (formData.email && !this.validateEmail(formData.email)) {
      errors.push("Please enter a valid email address");
    }

    if (formData.password && !this.validatePassword(formData.password)) {
      errors.push("Password must be at least 6 characters long");
    }

    if (
      formData.confirmPassword &&
      formData.password !== formData.confirmPassword
    ) {
      errors.push("Passwords do not match");
    }

    return errors;
  }

  // Utility method to format dates
  formatDate(dateString) {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  }

  // Utility method to get status text
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

  // Initials Helper
  getInitials(name) {
    if (!name) return "??";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}

// Initialize UI Manager
const uiManager = new UIManager();
window.uiManager = uiManager;
