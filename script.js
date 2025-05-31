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

// ===== CẬP NHẬT GIAO DIỆN ĐỒNG HỒ =====
function updateCounter() {
  const now = new Date();
  const diff = now - beginDateObj;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Format giờ hiện tại
  const formattedDateTime =
    `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ` +
    `${now.getHours().toString().padStart(2, "0")}:` +
    `${now.getMinutes().toString().padStart(2, "0")}:` +
    `${now.getSeconds().toString().padStart(2, "0")}`;

  document.getElementById("beginDateDisplay").textContent = BEGIN_DATE;

  // Hiển thị thời gian và số ngày riêng biệt
  document.getElementById("currentTime").textContent = formattedDateTime;
  document.getElementById("daysGone").textContent = `${days} day${
    days !== 1 ? "s" : ""
  }`;
}

// Hàm fetch dữ liệu từ data.json và đổ vào table
async function loadJSONData() {
  try {
    const response = await fetch("data.json");
    const data = await response.json();
    const tbody = document.querySelector("#jsonTable tbody");

    data.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.date}</td>
        <td>${item.time}</td>
        <td>${item.daysGoneBy}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (error) {
    console.error("Lỗi khi load JSON:", error);
  }
}

// Gọi sau khi DOM load
document.addEventListener("DOMContentLoaded", () => {
  updateCounter(); // cập nhật đồng hồ
  setInterval(updateCounter, 1000);
  loadJSONData(); // load bảng từ file
});
