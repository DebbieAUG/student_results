/* Minimal static client for scores.json */
let DATA = null;
const boardBody = () => document.querySelector("#board tbody");

function calcTotal(scores) {
  return Object.values(scores || {}).reduce((a,b)=>a + (+b||0), 0);
}

function renderLeaderboard(filterGroup = "") {
  if (!DATA) return;
  const rows = DATA.students
    .filter(s => !filterGroup || (s.group || '') === filterGroup)
    .map(s => ({
      name: s.name || '',
      enrollment: s.enrollment || '',
      group: s.group || '',
      total: calcTotal(s.scores || {})
    }))
    .sort((a,b) => b.total - a.total);

  const tbody = boardBody();
  tbody.innerHTML = "";
  rows.forEach((r, idx) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${idx+1}</td>
                    <td>${r.name}</td>
                    <td>${r.enrollment}</td>
                    <td>${r.group || '-'}</td>
                    <td class="right">${r.total}</td>`;
    tbody.appendChild(tr);
  });
}

function renderGroups() {
  const sel = document.getElementById("filterGroup");
  const groups = Array.from(new Set(DATA.students.map(s => s.group).filter(Boolean))).sort();
  sel.innerHTML = `<option value="">All Groups</option>` + groups.map(g => `<option>${g}</option>`).join("");
  sel.onchange = e => renderLeaderboard(e.target.value);
}

function showResult(student) {
  const box = document.getElementById("result");
  if (!student) {
    box.innerHTML = `<p class="muted">No match found. Check your enrollment number.</p>`;
    return;
  }
  const total = calcTotal(student.scores);
  const lines = Object.entries(student.scores || {})
    .map(([k,v]) => `<div class="scoreline"><span>${k}</span><span>${v}</span></div>`)
    .join("");
  box.innerHTML = `<h3>${student.name} • ${student.enrollment}${student.group ? ' • Group ' + student.group : ''}</h3>
                   ${lines}
                   <div class="scoreline total"><span>Total</span><span>${total}</span></div>`;
}

function handleSearch() {
  const q = (document.getElementById("enroll").value || "").trim().toLowerCase();
  const student = DATA.students.find(s => (s.enrollment||"").toLowerCase() === q);
  showResult(student || null);
}

function downloadCSV() {
  const rows = DATA.students.map(s => ({
    name: s.name || '',
    enrollment: s.enrollment || '',
    group: s.group || '',
    ...s.scores,
    total: calcTotal(s.scores || {})
  }));
  const headers = Array.from(
    new Set(rows.flatMap(r => Object.keys(r)))
  );
  const csv = [headers.join(",")].concat(
    rows.map(r => headers.map(h => (r[h] ?? "")).join(","))
  ).join("\n");
  const blob = new Blob([csv], {type: "text/csv"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "leaderboard.csv";
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  a.remove();
}

async function init() {
  try {
    const res = await fetch("scores.json", {cache: "no-store"});
    DATA = await res.json();
  } catch (e) {
    console.error(e);
    DATA = {metadata:{},students:[]};
  }
  renderLeaderboard();
  renderGroups();
  document.getElementById("lastUpdated").textContent =
    DATA.metadata?.lastUpdated ? "Last updated: " + DATA.metadata.lastUpdated : "";
  document.getElementById("searchBtn").onclick = handleSearch;
  document.getElementById("enroll").addEventListener("keydown", e => {
    if (e.key === "Enter") handleSearch();
  });
  document.getElementById("downloadCsvBtn").onclick = downloadCSV;
}

init();
