// admin.js — BuildFlow Admin Dashboard

const API = "http://localhost:8080/api/v1";
const token = () => localStorage.getItem("authToken") || "";
const authHeaders = () => ({
  Authorization: "Bearer " + token(),
  "Content-Type": "application/json",
});

document.addEventListener("DOMContentLoaded", () => {
  loadOverview();
  loadInquiries();
  loadProjects();
  loadModelCount();
});

function logout() {
  localStorage.clear();
  window.location.href = "login.html";
}

function showAdminTab(name, btn) {
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".admin-nav-tab")
    .forEach((t) => t.classList.remove("active"));
  const tab = document.getElementById("tab-" + name);
  if (tab) tab.classList.add("active");
  if (btn) btn.classList.add("active");
}

function refreshAll() {
  loadOverview();
  loadInquiries();
  loadProjects();
}

// ─── Overview ─────────────────────────────────────────────
async function loadOverview() {
  try {
    const [inquiriesRes, projectsRes] = await Promise.all([
      fetch(`${API}/inquiries/all`, { headers: authHeaders() }),
      fetch(`${API}/projects/all`, { headers: authHeaders() }),
    ]);
    const inquiriesData = await inquiriesRes.json();
    const projectsData = await projectsRes.json();

    const inquiries = inquiriesData.data || [];
    const projects = projectsData.data || [];
    const pending = inquiries.filter(
      (i) => i.status === "PENDING" || !i.status,
    ).length;

    setEl("statInquiries", inquiries.length);
    setEl("statPending", pending);
    setEl("statProjects", projects.length);

    // Badge on tab
    if (pending > 0) {
      const tab = document.getElementById("inquiriesTab");
      if (tab && !tab.querySelector(".tab-badge")) {
        const badge = document.createElement("span");
        badge.className = "tab-badge";
        badge.textContent = pending;
        tab.appendChild(badge);
      }
    }

    // Overview inquiries (latest 4)
    const oIq = document.getElementById("overviewInquiriesBody");
    if (!inquiries.length) {
      oIq.innerHTML =
        '<div class="empty-state"><i class="bi bi-inbox"></i><p>No inquiries yet.</p></div>';
    } else {
      oIq.innerHTML = inquiries
        .slice(0, 4)
        .map(
          (i) => `
        <div style="display:flex;align-items:center;gap:12px;padding:12px 20px;border-bottom:1px solid var(--border);">
          <div style="width:36px;height:36px;border-radius:50%;background:var(--info-light);display:flex;align-items:center;justify-content:center;color:var(--info);font-weight:700;font-size:0.85rem;flex-shrink:0;">
            ${(i.customerName || "U")[0].toUpperCase()}
          </div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.875rem;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${i.customerName || "—"}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">${i.modelName || "—"}</div>
          </div>
          <span class="badge-bf ${i.status === "APPROVED" ? "badge-success" : "badge-warning"}">${i.status || "PENDING"}</span>
        </div>`,
        )
        .join("");
    }

    // Overview projects (latest 4)
    const oPr = document.getElementById("overviewProjectsBody");
    if (!projects.length) {
      oPr.innerHTML =
        '<div class="empty-state"><i class="bi bi-inbox"></i><p>No active projects.</p></div>';
    } else {
      oPr.innerHTML = projects
        .slice(0, 4)
        .map(
          (p) => `
        <div style="padding:12px 20px;border-bottom:1px solid var(--border);">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div>
              <div style="font-size:0.875rem;font-weight:600;">${p.customerName || "—"}</div>
              <div style="font-size:0.78rem;color:var(--text-muted);">${p.modelName || "—"}</div>
            </div>
            <span style="font-family:'Playfair Display',serif;font-weight:700;font-size:1rem;color:var(--primary);">${p.currentProgress || 0}%</span>
          </div>
          <div class="bf-progress-wrap">
            <div class="bf-progress-bar" style="width:${p.currentProgress || 0}%;"></div>
          </div>
        </div>`,
        )
        .join("");
    }
  } catch (err) {
    console.error("Overview load error:", err);
  }
}

// ─── Model Count ──────────────────────────────────────────
async function loadModelCount() {
  try {
    const res = await fetch(`${API}/models`);
    const data = await res.json();
    setEl("statModels", (data.data || []).length);
  } catch (_) {}
}

// ─── Add Model ────────────────────────────────────────────
document
  .getElementById("addModelForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("saveModelBtn");
    const alertBox = document.getElementById("addModelAlert");
    const orig = btn.innerHTML;

    const modelData = {
      modelName: document.getElementById("modelName").value,
      description: document.getElementById("description").value,
      estimatedCost: parseFloat(document.getElementById("estimatedCost").value),
      floorArea: parseFloat(document.getElementById("floorArea").value),
      numBedrooms: parseInt(document.getElementById("numBedrooms").value),
      modelUrl: document.getElementById("modelUrl").value,
      imgUrl: document.getElementById("imgUrl").value,
    };

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-bf"></span> Saving...';
    alertBox.innerHTML = "";

    try {
      const res = await fetch(`${API}/models/add`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(modelData),
      });
      const result = await res.json();
      if (res.ok) {
        alertBox.innerHTML =
          '<div class="bf-alert bf-alert-success"><i class="bi bi-check-circle-fill"></i> Model added successfully!</div>';
        this.reset();
        loadModelCount();
      } else throw new Error(result.message || "Failed to add model.");
    } catch (err) {
      alertBox.innerHTML = `<div class="bf-alert bf-alert-danger"><i class="bi bi-exclamation-triangle-fill"></i> ${err.message}</div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
      setTimeout(() => {
        alertBox.innerHTML = "";
      }, 5000);
    }
  });

// ─── Inquiries ────────────────────────────────────────────
async function loadInquiries() {
  const tbody = document.getElementById("inquiriesTableBody");
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">
    <span class="spinner-bf dark"></span><span style="margin-left:10px;">Loading...</span>
  </td></tr>`;

  try {
    const res = await fetch(`${API}/inquiries/all`, { headers: authHeaders() });
    const result = await res.json();
    tbody.innerHTML = "";

    if (result.status === 200 && result.data?.length) {
      result.data.forEach((i) => {
        const dateStr = i.submittedAt
          ? new Date(i.submittedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "—";
        const id = i.id || i.inquiryId || "";
        const isApproved = i.status === "APPROVED";

        tbody.innerHTML += `<tr>
          <td style="padding-left:20px;color:var(--text-muted);font-size:0.82rem;white-space:nowrap;">${dateStr}</td>
          <td>
            <div style="font-weight:600;font-size:0.875rem;">${i.customerName || "—"}</div>
            <div style="font-size:0.78rem;color:var(--primary);">${i.customerPhone || ""}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);">${i.customerEmail || ""}</div>
          </td>
          <td><span class="badge-bf badge-primary"><i class="bi bi-house me-1"></i>${i.modelName || "—"}</span></td>
          <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--text-secondary);font-size:0.85rem;" title="${i.message || ""}">${i.message || '<i style="color:var(--text-muted)">No message</i>'}</td>
          <td><span class="badge-bf ${isApproved ? "badge-success" : "badge-warning"}">${i.status || "PENDING"}</span></td>
          <td style="text-align:center;padding-right:20px;">
            <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
              <button onclick="openReplyModal('${i.customerEmail}','${i.modelName}')" class="btn-bf btn-outline-bf btn-sm-bf">
                <i class="bi bi-reply-fill"></i> Reply
              </button>
              ${
                isApproved
                  ? `<button class="btn-bf btn-ghost-bf btn-sm-bf" disabled style="opacity:0.5;"><i class="bi bi-check2-all"></i> Approved</button>`
                  : `<button onclick="openApproveModal('${id}','${i.customerName}','${i.modelName}')" class="btn-bf btn-success-bf btn-sm-bf"><i class="bi bi-check-lg"></i> Approve</button>`
              }
            </div>
          </td>
        </tr>`;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:48px;"><div class="empty-state" style="padding:0;"><i class="bi bi-inbox"></i><p>No inquiries found.</p></div></td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--danger);">Failed to load inquiries. Please check connection.</td></tr>`;
  }
}

// ─── Projects ─────────────────────────────────────────────
async function loadProjects() {
  const tbody = document.getElementById("projectsTableBody");
  tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--text-muted);">
    <span class="spinner-bf dark"></span><span style="margin-left:10px;">Loading...</span>
  </td></tr>`;

  try {
    const res = await fetch(`${API}/projects/all`, { headers: authHeaders() });
    const result = await res.json();
    tbody.innerHTML = "";

    if (res.ok && result.data?.length) {
      result.data.forEach((p) => {
        const pId = p.projectId || p.id;
        const prog = p.currentProgress || 0;
        const statusCls =
          {
            STARTED: "badge-info",
            IN_PROGRESS: "badge-warning",
            COMPLETED: "badge-success",
          }[p.currentStatus] || "badge-neutral";

        tbody.innerHTML += `<tr>
          <td style="padding-left:20px;">
            <span style="font-family:'Playfair Display',serif;font-weight:700;color:var(--primary);">#PRJ-${pId}</span>
          </td>
          <td style="font-weight:600;font-size:0.875rem;">${p.customerName || "—"}</td>
          <td><span class="badge-bf badge-neutral">${p.modelName || "—"}</span></td>
          <td style="min-width:160px;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="bf-progress-wrap" style="flex:1;">
                <div class="bf-progress-bar" style="width:${prog}%;"></div>
              </div>
              <span style="font-size:0.8rem;font-weight:700;color:var(--text-primary);min-width:36px;">${prog}%</span>
            </div>
          </td>
          <td><span class="badge-bf ${statusCls}">${p.currentStatus || "N/A"}</span></td>
          <td style="text-align:center;padding-right:20px;">
            <button onclick="openProgressModal('${pId}','${p.customerName || ""} — ${p.modelName || ""}')" class="btn-bf btn-accent-bf btn-sm-bf">
              <i class="bi bi-plus-circle"></i> Add Update
            </button>
          </td>
        </tr>`;
      });
    } else {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:48px;"><div class="empty-state" style="padding:0;"><i class="bi bi-cone-striped"></i><p>No ongoing projects found.</p></div></td></tr>`;
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--danger);">Failed to load projects.</td></tr>`;
  }
}

// ─── Modal Helpers ────────────────────────────────────────
function openMod(id) {
  document.getElementById(id).style.display = "flex";
  document.body.style.overflow = "hidden";
}
function closeMod2(id) {
  document.getElementById(id).style.display = "none";
  document.body.style.overflow = "";
}
function closeMod(event, id) {
  if (event.target.id === id) closeMod2(id);
}

function openReplyModal(email, modelName) {
  document.getElementById("replyEmail").value = email;
  document.getElementById("replySubject").value =
    `Re: Inquiry about ${modelName} (BuildFlow)`;
  document.getElementById("replyMessage").value = "";
  document.getElementById("replyAlert").innerHTML = "";
  openMod("replyModalWrap");
}

function openApproveModal(inquiryId, customerName, modelName) {
  document.getElementById("approveInquiryId").value = inquiryId;
  document.getElementById("approveCustomerName").value = customerName;
  document.getElementById("approveModelName").value = modelName;
  document.getElementById("approveSpecs").value = "";
  document.getElementById("approvePrice").value = "";
  document.getElementById("approveAlert").innerHTML = "";
  openMod("approveModalWrap");
}

function openProgressModal(projectId, title) {
  document.getElementById("updateProjectId").value = projectId;
  document.getElementById("updateProjectName").value = title;
  document.getElementById("updateMessage").value = "";
  document.getElementById("updatePercentage").value = "";
  document.getElementById("updateImageUrl").value = "";
  document.getElementById("progressAlert").innerHTML = "";
  document.getElementById("progressPreview").style.width = "0%";
  openMod("progressModalWrap");
}

function previewProgress(val) {
  const bar = document.getElementById("progressPreview");
  if (bar)
    bar.style.width = Math.min(100, Math.max(0, parseInt(val) || 0)) + "%";
}

// ─── Form Submissions ─────────────────────────────────────
document
  .getElementById("replyForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("sendReplyBtn");
    const alertBox = document.getElementById("replyAlert");
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-bf"></span> Sending...';

    try {
      const res = await fetch(`${API}/inquiries/reply`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          customerEmail: document.getElementById("replyEmail").value,
          subject: document.getElementById("replySubject").value,
          message: document.getElementById("replyMessage").value,
        }),
      });
      const result = await res.json();
      if (res.ok) {
        alertBox.innerHTML =
          '<div class="bf-alert bf-alert-success"><i class="bi bi-check-circle-fill"></i> Email sent successfully!</div>';
        setTimeout(() => {
          closeMod2("replyModalWrap");
        }, 2000);
      } else throw new Error(result.message || "Failed to send.");
    } catch (err) {
      alertBox.innerHTML = `<div class="bf-alert bf-alert-danger"><i class="bi bi-exclamation-triangle-fill"></i> ${err.message}</div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });

document
  .getElementById("approveForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const rawId = document.getElementById("approveInquiryId").value;
    if (!rawId || rawId === "undefined") {
      document.getElementById("approveAlert").innerHTML =
        '<div class="bf-alert bf-alert-danger"><i class="bi bi-exclamation-triangle-fill"></i> Inquiry ID missing. Please refresh.</div>';
      return;
    }

    const btn = document.getElementById("confirmApproveBtn");
    const alertBox = document.getElementById("approveAlert");
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-bf"></span> Processing...';

    try {
      const res = await fetch(`${API}/orders/create-custom`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          inquiryId: parseInt(rawId),
          customSpecs: document.getElementById("approveSpecs").value,
          finalPrice: parseFloat(document.getElementById("approvePrice").value),
        }),
      });
      const result = await res.json();
      if (res.ok) {
        alertBox.innerHTML =
          '<div class="bf-alert bf-alert-success"><i class="bi bi-check-circle-fill"></i> Order created and email sent to customer!</div>';
        setTimeout(() => {
          closeMod2("approveModalWrap");
          loadInquiries();
          loadOverview();
        }, 2200);
      } else throw new Error(result.message || "Failed to create order.");
    } catch (err) {
      alertBox.innerHTML = `<div class="bf-alert bf-alert-danger"><i class="bi bi-exclamation-triangle-fill"></i> ${err.message}</div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });

document
  .getElementById("progressForm")
  ?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("saveProgressBtn");
    const alertBox = document.getElementById("progressAlert");
    const orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-bf"></span> Saving...';

    try {
      const res = await fetch(`${API}/progress/add`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          projectId: parseInt(document.getElementById("updateProjectId").value),
          description: document.getElementById("updateMessage").value,
          percentageComplete: parseInt(
            document.getElementById("updatePercentage").value,
          ),
          photoUrl: document.getElementById("updateImageUrl").value,
        }),
      });
      const result = await res.json();
      if (res.ok || result.status === 201) {
        alertBox.innerHTML =
          '<div class="bf-alert bf-alert-success"><i class="bi bi-check-circle-fill"></i> Progress updated successfully!</div>';
        setTimeout(() => {
          closeMod2("progressModalWrap");
          loadProjects();
          loadOverview();
        }, 2000);
      } else throw new Error(result.message || "Failed to update progress.");
    } catch (err) {
      alertBox.innerHTML = `<div class="bf-alert bf-alert-danger"><i class="bi bi-exclamation-triangle-fill"></i> ${err.message}</div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = orig;
    }
  });

// ─── Helpers ──────────────────────────────────────────────
function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}
