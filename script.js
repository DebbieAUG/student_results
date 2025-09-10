/* Minimal static client for URN/Roll search + leaderboard */
let DATA = null;

const $ = (sel) => document.querySelector(sel);
const tbody = () => $("#board tbody");

function norm(x) {
  return String(x ?? "").trim().toLowerCase();
}

function renderLeaderboard() {
  if (!DATA) return;
  const rows = DATA.students
    .map(s => ({
      name: s.name || "",
      urn: s.urn || "",
      roll: s.roll || "",
      score: Number(s.score || 0)
    }))
    .sort((a,b) => b.score - a.score);

  const body = tbody();
  body.innerHTML = "";
  rows.forEach((r, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${r.name}</td>
      <td>${r.urn}</td>
      <td>${r.roll}</td>
      <td class="right">${r.score}</td>
    `;
    body.appendChild(tr);
  });
}

function showResult(student) {
  const box = $("#result");
  if (!student) {
    box.innerHTML = `<p class="muted">No match found. Check your ${$("#searchType").value.toUpperCase()}.</p>`;
    return;
  }
  box.innerHTML = `
    <div class="line"><span><strong>Name</strong></span><span>${student.name}</span></div>
    <div class="line"><span><strong>URN</strong></span><span>${student.urn}</span></div>
    <div class="line"><span><strong>Roll No.</strong></span><span>${student.roll}</span></div>
    <div class="line total"><span><strong>Score</strong></span><span>${student.score}</span></div>
  `;
}

function handleSearch() {
  const type = $("#searchType").value; // 'urn' | 'roll'
  const q = norm($("#searchInput").value);
  if (!q) return showResult(null);

  const student = DATA.students.find(s => norm(s[type]) === q);
  showResult(student || null);
}

async function init() {
  try {
    const res = await fetch("scores.json", { cache: "no-store" });
    DATA = await res.json();
  } catch (e) {
    console.error(e);
    DATA = { metadata: {}, students: [] };
  }
  renderLeaderboard();
  $("#lastUpdated").textContent = DATA.metadata?.lastUpdated ? `Last updated: ${DATA.metadata.lastUpdated}` : "";
  $("#searchBtn").onclick = handleSearch;
  $("#searchInput").addEventListener("keydown", (e) => { if (e.key === "Enter") handleSearch(); });
  $("#downloadCsvBtn").onclick = downloadCSV;
}

init();
