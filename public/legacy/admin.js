
function convert() {
  const input = document.getElementById('input').value.trim();
  const output = document.getElementById('output');
  output.innerHTML = "";

  if (!input) {
    output.innerHTML = "<p style='color:red'>Please paste your JSON document first.</p>";
    return;
  }

  let doc;
  try {
    doc = JSON.parse(input);
  } catch (e) {
    output.innerHTML = "<p style='color:red'>Invalid JSON. Please check your input.</p>";
    return;
  }

  function getDate(msObj) {
    try {
      const val = Number(msObj?.$date?.$numberLong ?? msObj);
      if (!val) return "N/A";
      const utc = new Date(val).toISOString();
      const ist = new Date(val).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      return `${utc} (UTC) <br> ${ist} (IST)`;
    } catch {
      return "N/A";
    }
  }

  let html = "<h3>📄 Converted Fields</h3>";

  if (doc.email) html += `<p><span class="key">Email:</span> ${doc.email}</p>`;
  if (doc.lastIP) html += `<p><span class="key">Last IP:</span> ${doc.lastIP}</p>`;
  if (doc.lockedUntil) html += `<p><span class="key">Locked Until:</span><br>${getDate(doc.lockedUntil)}</p>`;
  if (doc.createdAt) html += `<p><span class="key">Created At:</span><br>${getDate(doc.createdAt)}</p>`;
  if (doc.updatedAt) html += `<p><span class="key">Updated At:</span><br>${getDate(doc.updatedAt)}</p>`;

  if (Array.isArray(doc.ipHistory)) {
    html += `<h3>🌐 IP History</h3><table><tr><th>#</th><th>IP</th><th>When</th></tr>`;
    doc.ipHistory.forEach((item, idx) => {
      html += `<tr>
        <td>${idx + 1}</td>
        <td>${item.ip}</td>
        <td>${getDate(item.when)}</td>
      </tr>`;
    });
    html += `</table>`;
  }

  output.innerHTML = html;
}
