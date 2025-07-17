/**
 * Goon Tracker - Modern Time Tracking Tool
 * Version: 2.1
 * Author: Goon Tracker Team
 * Date: 2025-06-05
 * Fixes:
 * - Fixed pagination previous button issue
 * - Improved pagination controls
 */

// ===== CONFIGURATION =====
const CONFIG = {
  // Start date for tracking
  BEGIN_DATE: "17/07/2025 17:33",

  // Pagination settings
  ITEMS_PER_PAGE: 10,

  // Date format options
  DATE_FORMAT_OPTIONS: {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  },
};

// ===== GLOBAL VARIABLES =====
let originalData = []; // Stores the original JSON data
let filteredData = []; // Stores filtered data
let currentPage = 1; // Current pagination page

// ===== UTILITY FUNCTIONS =====

/**
 * Parse date string to Date object
 * @param {string} dateStr - Date string in format "dd/mm/yyyy hh:mm"
 * @returns {Date} Parsed Date object
 */
function parseDate(dateStr) {
  const [datePart, timePart] = dateStr.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hours, minutes] = timePart?.split(":").map(Number) || [0, 0];
  return new Date(year, month - 1, day, hours, minutes);
}

/**
 * Format date to localized string
 * @param {Date} date - Date object to format
 * @returns {string} Formatted date string
 */
function formatDate(date) {
  return date.toLocaleString(undefined, CONFIG.DATE_FORMAT_OPTIONS);
}

/**
 * Calculate time difference in human-readable format
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date (defaults to now)
 * @returns {string} Human-readable duration
 */
function getTimeDifference(startDate, endDate = new Date()) {
  const diff = endDate - startDate;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days} day${days !== 1 ? "s" : ""}`;
  if (hours > 0) return `${hours} hour${hours !== 1 ? "s" : ""}`;
  return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
}

// ===== CORE FUNCTIONS =====

/**
 * Update the counter display with current time and duration
 */
function updateCounter() {
  const now = new Date();
  const beginDateObj = parseDate(CONFIG.BEGIN_DATE);
  const diff = now - beginDateObj;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Update DOM elements
  document.getElementById("beginDateDisplay").textContent =
    formatDate(beginDateObj);
  document.getElementById("currentTime").textContent = formatDate(now);
  document.getElementById("daysGone").textContent = `${days} day${
    days !== 1 ? "s" : ""
  }`;

  // Update status indicator
  const statusIndicator = document.getElementById("statusIndicator");
  statusIndicator.textContent = "Active";
  statusIndicator.className = "active";
}

/**
 * Load JSON data from file
 */
async function loadJSONData() {
  try {
    showLoading();

    const response = await fetch("data.json");
    const data = await response.json();

    originalData = [...data];
    filteredData = [...data];

    renderTable();
    updateStats();
    setupPagination();

    hideLoading();
  } catch (error) {
    console.error("Error loading JSON data:", error);
    showError("Failed to load data. Please try again later.");
  }
}

/**
 * Render the data table with pagination
 */
function renderTable() {
  const tbody = document.querySelector("#jsonTable tbody");
  tbody.innerHTML = "";

  // Sort data by date (newest first)
  filteredData.sort((a, b) => {
    const dateA = parseDate(`${a.date} ${a.time || "00:00"}`);
    const dateB = parseDate(`${b.date} ${b.time || "00:00"}`);
    return dateB - dateA;
  });

  // Calculate pagination bounds
  const startIdx = (currentPage - 1) * CONFIG.ITEMS_PER_PAGE;
  const endIdx = startIdx + CONFIG.ITEMS_PER_PAGE;
  const paginatedData = filteredData.slice(startIdx, endIdx);

  // Populate table rows
  paginatedData.forEach((item) => {
    const row = document.createElement("tr");

    // Calculate progress percentage (example logic)
    const duration = parseInt(item.daysGoneBy) || 0;
    const progressPercent = Math.min(100, duration * 10);

    row.innerHTML = `
      <td>${item.date}</td>
      <td>${item.time || "-"}</td>
      <td>${item.daysGoneBy}</td>
      <td>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
        <span class="progress-text">${progressPercent}%</span>
      </td>
    `;

    tbody.appendChild(row);
  });

  // Update pagination info and buttons
  updatePaginationInfo();
  updatePaginationButtons();
}

/**
 * Apply filters to the data
 */
function applyFilters() {
  currentPage = 1; // Reset to first page when applying filters

  const dateInput = document.getElementById("filterDate").value.trim();
  const monthInput = document.getElementById("filterMonth").value.trim();
  const yearInput = document.getElementById("filterYear").value.trim();
  const durationInput = document
    .getElementById("filterDuration")
    .value.trim()
    .toLowerCase();

  filteredData = [...originalData];

  // Date filter
  if (dateInput) {
    filteredData = filteredData.filter((item) => item.date === dateInput);
  }

  // Month filter
  if (monthInput) {
    filteredData = filteredData.filter(
      (item) => item.date.split("/")[1] === monthInput.padStart(2, "0")
    );
  }

  // Year filter
  if (yearInput) {
    filteredData = filteredData.filter(
      (item) => item.date.split("/")[2] === yearInput
    );
  }

  // Duration filter
  if (durationInput) {
    filteredData = filteredData.filter((item) =>
      item.daysGoneBy.toLowerCase().includes(durationInput)
    );
  }

  renderTable();
  updateStats();
}

/**
 * Reset all filters
 */
function resetFilters() {
  currentPage = 1;

  document.getElementById("filterDate").value = "";
  document.getElementById("filterMonth").value = "";
  document.getElementById("filterYear").value = "";
  document.getElementById("filterDuration").value = "";

  filteredData = [...originalData];
  renderTable();
  updateStats();
}

/**
 * Update statistics summary
 */
function updateStats() {
  document.getElementById("totalAttempts").textContent = filteredData.length;

  // Calculate average duration
  if (filteredData.length > 0) {
    const totalDays = filteredData.reduce((sum, item) => {
      return sum + (parseInt(item.daysGoneBy) || 0);
    }, 0);
    const avgDays = (totalDays / filteredData.length).toFixed(1);
    document.getElementById("averageDuration").textContent = `${avgDays} days`;
  } else {
    document.getElementById("averageDuration").textContent = "-";
  }

  // Get last record date
  if (filteredData.length > 0) {
    const lastRecord = filteredData[0];
    document.getElementById("lastRecord").textContent = lastRecord.date;
  } else {
    document.getElementById("lastRecord").textContent = "-";
  }
}

// ===== PAGINATION FUNCTIONS =====

/**
 * Update pagination buttons state
 */
function updatePaginationButtons() {
  const totalPages = Math.ceil(filteredData.length / CONFIG.ITEMS_PER_PAGE);
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;

  // Update ARIA attributes for accessibility
  prevBtn.setAttribute("aria-disabled", prevBtn.disabled);
  nextBtn.setAttribute("aria-disabled", nextBtn.disabled);
}

/**
 * Setup pagination controls
 */
function setupPagination() {
  const prevBtn = document.getElementById("prevPage");
  const nextBtn = document.getElementById("nextPage");

  // Remove existing event listeners to prevent duplicates
  prevBtn.replaceWith(prevBtn.cloneNode(true));
  nextBtn.replaceWith(nextBtn.cloneNode(true));

  // Get new references after clone
  const newPrevBtn = document.getElementById("prevPage");
  const newNextBtn = document.getElementById("nextPage");

  newPrevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  };

  newNextBtn.onclick = () => {
    const totalPages = Math.ceil(filteredData.length / CONFIG.ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  };

  updatePaginationButtons();
}

/**
 * Update pagination information text
 */
function updatePaginationInfo() {
  const totalPages = Math.ceil(filteredData.length / CONFIG.ITEMS_PER_PAGE);
  const pageInfo = document.getElementById("pageInfo");

  if (filteredData.length === 0) {
    pageInfo.textContent = "No records found";
  } else {
    pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${filteredData.length} records)`;
  }
}

// ===== UI HELPER FUNCTIONS =====

/**
 * Show loading state
 */
function showLoading() {
  document.body.classList.add("loading");
}

/**
 * Hide loading state
 */
function hideLoading() {
  document.body.classList.remove("loading");
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  // Create error toast element
  const toast = document.createElement("div");
  toast.className = "error-toast";
  toast.textContent = message;

  // Add to DOM
  document.body.appendChild(toast);

  // Auto remove after 5 seconds
  setTimeout(() => {
    toast.classList.add("fade-out");
    setTimeout(() => toast.remove(), 300);
  }, 5000);
}

// ===== INITIALIZATION =====
document.addEventListener("DOMContentLoaded", () => {
  // Initialize counter
  updateCounter();
  setInterval(updateCounter, 1000);

  // Load data
  loadJSONData();

  // Setup export button
  document.getElementById("exportBtn").addEventListener("click", () => {
    // Implement export functionality
    exportData();
  });

  // Setup refresh button
  document.getElementById("refreshBtn").addEventListener("click", () => {
    loadJSONData();
  });
});

/**
 * Export data as JSON file
 */
function exportData() {
  try {
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = `goon-tracker-export-${new Date()
      .toISOString()
      .slice(0, 10)}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    // Show success message
    const toast = document.createElement("div");
    toast.className = "success-toast";
    toast.innerHTML = `<i class="fas fa-check-circle"></i> Data exported successfully`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  } catch (error) {
    showError("Failed to export data: " + error.message);
  }
}
