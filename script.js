// ===== CẤU HÌNH BEGIN_DATE =====
const BEGIN_DATE = "30/05/2025 08:40"; // Format: dd/mm/yyyy hh:mm

// ===== CHUYỂN ĐỔI CHUỖI THÀNH OBJECT DATE =====
function parseDate(dateStr) {
  const [datePart, timePart] = dateStr.split(" ");
  const [day, month, year] = datePart.split("/").map(Number);
  const [hours, minutes] = timePart.split(":").map(Number);
  return new Date(year, month - 1, day, hours, minutes);
}

const beginDateObj = parseDate(BEGIN_DATE);

function updateCounter() {
  const now = new Date();
  const diff = now - beginDateObj;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  // PadStart cho ngày/tháng/hours/minutes/seconds
  const dd = now.getDate().toString().padStart(2, "0");
  const mm = (now.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = now.getFullYear();
  const hh = now.getHours().toString().padStart(2, "0");
  const min = now.getMinutes().toString().padStart(2, "0");
  const sec = now.getSeconds().toString().padStart(2, "0");

  const formattedDateTime = `${dd}/${mm}/${yyyy} ${hh}:${min}:${sec}`;

  document.getElementById("beginDateDisplay").textContent = BEGIN_DATE;
  document.getElementById("currentTime").textContent = formattedDateTime;

  // PadStart cho số ngày
  const formattedDays = days.toString().padStart(2, "0");
  document.getElementById("daysGone").textContent = `${formattedDays} days`;
}

let originalData = []; // Lưu data gốc để lọc lại

async function loadJSONData() {
  try {
    const response = await fetch("data.json");
    const data = await response.json();
    originalData = [...data];

    renderTable(data);
    document.getElementById("totalAttempts").textContent =
      "Total attempts: " + data.length;
  } catch (error) {
    console.error("Lỗi khi load JSON:", error);
  }
}

function renderTable(data) {
  const tbody = document.querySelector("#jsonTable tbody");
  tbody.innerHTML = "";

  // Sắp xếp giảm dần theo ngày
  data.sort((a, b) => {
    const [dayA, monthA, yearA] = a.date.split("/").map(Number);
    const [dayB, monthB, yearB] = b.date.split("/").map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateB - dateA;
  });

  data.forEach((item) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.date}</td>
      <td>${item.time || "No data"}</td>
      <td>${item.daysGoneBy}</td>
    `;
    tbody.appendChild(row);
  });
}

// Lọc theo input
function applyFilters() {
  const dateInput = document.getElementById("filterDate").value.trim();
  const monthInput = document.getElementById("filterMonth").value.trim();
  const yearInput = document.getElementById("filterYear").value.trim();
  const durationInput = document
    .getElementById("filterDuration")
    .value.trim()
    .toLowerCase();

  let filtered = [...originalData];

  if (dateInput) {
    filtered = filtered.filter((item) => item.date === dateInput);
  }
  if (monthInput) {
    filtered = filtered.filter((item) => {
      const [d, m] = item.date.split("/");
      return Number(m) === Number(monthInput);
    });
  }
  if (yearInput) {
    filtered = filtered.filter((item) => {
      const [, , y] = item.date.split("/");
      return y === yearInput;
    });
  }
  if (durationInput) {
    filtered = filtered.filter((item) =>
      item.daysGoneBy.toLowerCase().includes(durationInput)
    );
  }

  renderTable(filtered);
  document.getElementById("totalAttempts").textContent =
    "Filtered attempts: " + filtered.length;
}

function resetFilters() {
  document.getElementById("filterDate").value = "";
  document.getElementById("filterMonth").value = "";
  document.getElementById("filterYear").value = "";
  document.getElementById("filterDuration").value = "";
  renderTable(originalData);
  document.getElementById("totalAttempts").textContent =
    "Total attempts: " + originalData.length;
}

document.addEventListener("DOMContentLoaded", () => {
  updateCounter();
  setInterval(updateCounter, 1000);
  loadJSONData();
});
