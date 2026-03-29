// ============================================================
//  dashboard.js — BuildFlow Client Dashboard
// ============================================================

const API = "http://localhost:8080/api/v1";
let token = localStorage.getItem("authToken");
let userEmail = localStorage.getItem("userEmail") || "";
let currentProjectId = null;
let globalProject = null; // kept for receipt download

document.addEventListener("DOMContentLoaded", () => {
  if (!token) {
    window.location.href = "login.html";
    return;
  }
  initUI();
  loadDashboard();
});

// ── UI init ──────────────────────────────────────────────
function initUI() {
  setEl("userEmailLabel", userEmail);
  setEl("overviewEmail", "Logged in as " + userEmail);
  const av = document.getElementById("userAvatar");
  if (av && userEmail) av.textContent = userEmail[0].toUpperCase();
}

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

function switchTab(name, btn) {
  document
    .querySelectorAll(".tab-content")
    .forEach((t) => t.classList.remove("active"));
  document
    .querySelectorAll(".sidebar-item")
    .forEach((s) => s.classList.remove("active"));
  const tab = document.getElementById("tab-" + name);
  if (tab) tab.classList.add("active");
  if (btn) btn.classList.add("active");
}

function authH() {
  return {
    Authorization: "Bearer " + token,
    "Content-Type": "application/json",
  };
}

// ── Main data load ────────────────────────────────────────
async function loadDashboard() {
  try {
    const [projectsRes] = await Promise.all([
      fetch(`${API}/projects/all`, { headers: authH() }),
    ]);

    const projectsData = await projectsRes.json();
    const projects = projectsData.data || [];

    // Match project to logged-in user by email prefix
    const myProject =
      projects.find(
        (p) =>
          p.customerName &&
          userEmail &&
          p.customerName
            .toLowerCase()
            .includes(userEmail.split("@")[0].toLowerCase()),
      ) ||
      projects[0] ||
      null;

    if (myProject) currentProjectId = myProject.projectId || myProject.id;
    globalProject = myProject;

    // Load progress for this project
    let progressList = [];
    if (currentProjectId) {
      try {
        const pRes = await fetch(
          `${API}/progress/project/${currentProjectId}`,
          { headers: authH() },
        );
        const pData = await pRes.json();
        progressList = pData.data || [];
      } catch (_) {}
    }

    renderOverview(myProject, progressList);
    renderProjectTab(myProject, progressList);
    renderPaymentsTab(myProject);
    renderProgressTab(progressList);
  } catch (err) {
    console.error("Dashboard load error:", err);
  }
}

// ══════════════════════════════════════════════════════════
//  OVERVIEW
// ══════════════════════════════════════════════════════════
function renderOverview(project, progressList) {
  const prog = project?.currentProgress || 0;
  const totalCost = project?.finalCost || project?.finalAgreedCost || 0;
  const paid = totalCost * 0.05;
  const due = totalCost - paid;

  setEl("statProjects", project ? "1" : "0");
  setEl("statProgress", prog + "%");
  setEl("statPaid", paid ? "Rs. " + fmt(paid) : "—");
  setEl("statDue", due > 0 ? "Rs. " + fmt(due) : "—");

  const summaryEl = document.getElementById("overviewProjectSummary");
  if (!project) {
    summaryEl.innerHTML = emptyProject(
      "No Active Project",
      "You don't have an active construction project yet. Browse our models and purchase a plan to get started.",
    );
    document.getElementById("latestUpdatesBody").innerHTML =
      '<div class="empty-state"><i class="bi bi-inbox"></i><p>No updates yet.</p></div>';
    return;
  }

  summaryEl.innerHTML = `
    <div class="project-detail-header">
      <div>
        <div style="font-size:0.72rem;opacity:0.65;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;margin-bottom:4px;">Active Project</div>
        <div style="font-family:'Playfair Display',serif;font-size:1.3rem;font-weight:700;">${project.modelName || "—"}</div>
        <div style="font-size:0.82rem;opacity:0.7;margin-top:5px;">${project.customerName || ""} &bull; Started ${fmtDate(project.startDate)}</div>
      </div>
      <div style="text-align:center;">
        ${ringHtml(prog, 90, 38, 7, "white")}
        <div style="font-size:0.72rem;opacity:0.65;margin-top:5px;">Complete</div>
      </div>
    </div>
    <div class="grid-3" style="gap:12px;">
      ${miniBox("Status", `<span class="badge-bf ${statusBadge(project.currentStatus)}">${project.currentStatus || "N/A"}</span>`)}
      ${miniBox("Model", project.modelName || "—")}
      ${miniBox("Started", fmtDate(project.startDate))}
    </div>`;

  // Latest 2 progress updates
  const latestEl = document.getElementById("latestUpdatesBody");
  if (!progressList.length) {
    latestEl.innerHTML =
      '<div class="empty-state"><i class="bi bi-clock-history"></i><p>No progress updates yet. Check back soon.</p></div>';
    return;
  }
  latestEl.innerHTML = progressList
    .slice(0, 2)
    .map(
      (u) => `
    <div style="display:flex;gap:14px;align-items:flex-start;padding:14px 0;border-bottom:1px solid var(--border);">
      <div style="width:36px;height:36px;background:var(--info-light);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--info);flex-shrink:0;">
        <i class="bi bi-hammer"></i>
      </div>
      <div style="flex:1;">
        <div style="font-size:0.875rem;font-weight:600;margin-bottom:2px;">${u.description || "Progress update"}</div>
        <div style="font-size:0.78rem;color:var(--text-muted);">${fmtDT(u.updateTime)}</div>
        <div class="bf-progress-wrap" style="margin-top:8px;max-width:200px;">
          <div class="bf-progress-bar" style="width:${u.percentageComplete}%"></div>
        </div>
        <div style="font-size:0.74rem;color:var(--text-muted);margin-top:3px;">${u.percentageComplete}% complete</div>
      </div>
      <span class="badge-bf badge-primary">${u.percentageComplete}%</span>
    </div>`,
    )
    .join("");
}

// ══════════════════════════════════════════════════════════
//  MY PROJECT
// ══════════════════════════════════════════════════════════
function renderProjectTab(project, progressList) {
  const el = document.getElementById("projectTabContent");
  if (!project) {
    el.innerHTML = emptyProject(
      "No Active Project Found",
      "Once your inquiry is approved or you purchase a plan, your project will appear here.",
    );
    return;
  }

  const prog = project.currentProgress || 0;
  const totalCost = project.finalCost || project.finalAgreedCost || 0;
  const paid = totalCost * 0.05;
  const balance = totalCost - paid;

  el.innerHTML = `
    <div class="project-detail-header" style="margin-bottom:24px;">
      <div>
        <div style="font-size:0.72rem;opacity:0.65;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;margin-bottom:4px;">
          Project #PRJ-${project.projectId || project.id}
        </div>
        <div style="font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;">${project.modelName || "—"}</div>
        <div style="font-size:0.85rem;opacity:0.7;margin-top:6px;">
          <i class="bi bi-person-fill" style="margin-right:4px;"></i>${project.customerName || "You"}
          &nbsp;&bull;&nbsp;
          <i class="bi bi-calendar-event" style="margin-right:4px;"></i>Started ${fmtDate(project.startDate)}
        </div>
      </div>
      <div style="text-align:center;">
        ${ringHtml(prog, 90, 38, 7, "white")}
        <div style="font-size:0.72rem;opacity:0.65;margin-top:5px;">Complete</div>
      </div>
    </div>

    <div class="grid-2" style="gap:20px;margin-bottom:20px;">
      <div class="bf-card">
        <div class="bf-card-header"><div class="bf-card-title"><i class="bi bi-info-circle" style="color:var(--primary);"></i> Project Details</div></div>
        <div class="bf-card-body">
          ${dRow("House Model", project.modelName)}
          ${dRow("Status", `<span class="badge-bf ${statusBadge(project.currentStatus)}">${project.currentStatus || "N/A"}</span>`)}
          ${dRow("Start Date", fmtDate(project.startDate))}
          ${dRow("Contractor", project.contractorName || "Assigned by BuildFlow")}
          ${dRow("Project ID", "#PRJ-" + (project.projectId || project.id))}
        </div>
      </div>

      <div class="bf-card">
        <div class="bf-card-header"><div class="bf-card-title"><i class="bi bi-wallet2" style="color:var(--accent);"></i> Payment Snapshot</div></div>
        <div class="bf-card-body" style="padding:0;">
          <div class="payment-breakdown">
            <div class="payment-row">
              <span class="pay-label"><i class="bi bi-tag me-1"></i>Total Cost</span>
              <span class="pay-value">${totalCost ? "Rs. " + totalCost.toLocaleString() : "TBD"}</span>
            </div>
            <div class="payment-row">
              <span class="pay-label"><i class="bi bi-check-circle me-1"></i>Paid (5% Advance)</span>
              <span class="pay-value paid">Rs. ${fmt(paid)}</span>
            </div>
            <div class="payment-row">
              <span class="pay-label"><i class="bi bi-hourglass-split me-1"></i>Balance Remaining</span>
              <span class="pay-value due">Rs. ${fmt(balance)}</span>
            </div>
            <div class="payment-row total">
              <span class="pay-label">Payment Progress</span>
              <span class="pay-value">${totalCost ? Math.round((paid / totalCost) * 100) : 0}% paid</span>
            </div>
          </div>
          ${
            totalCost
              ? `
          <div style="padding:14px 18px;">
            <div class="bf-progress-wrap"><div class="bf-progress-bar warning" style="width:${Math.round((paid / totalCost) * 100)}%;"></div></div>
            <div style="display:flex;justify-content:space-between;font-size:0.74rem;color:var(--text-muted);margin-top:5px;">
              <span>Rs. ${fmt(paid)} paid</span><span>Rs. ${totalCost.toLocaleString()} total</span>
            </div>
          </div>`
              : ""
          }
        </div>
      </div>
    </div>

    <!-- Construction milestones -->
    <div class="bf-card">
      <div class="bf-card-header">
        <div class="bf-card-title"><i class="bi bi-graph-up" style="color:var(--success);"></i> Construction Progress</div>
        <span class="badge-bf badge-success">${prog}% Complete</span>
      </div>
      <div class="bf-card-body">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
          <div style="flex:1;">
            <div class="bf-progress-wrap" style="height:14px;">
              <div class="bf-progress-bar success" style="width:${prog}%;"></div>
            </div>
          </div>
          <div style="font-family:'Playfair Display',serif;font-size:1.5rem;font-weight:700;color:var(--success);min-width:52px;">${prog}%</div>
        </div>
        <div class="grid-4" style="gap:12px;">
          ${milestone("Foundation", 25, prog)}
          ${milestone("Structure", 50, prog)}
          ${milestone("Finishing", 75, prog)}
          ${milestone("Handover", 100, prog)}
        </div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════════════
//  PAYMENTS  — the rich new tab
// ══════════════════════════════════════════════════════════
function renderPaymentsTab(project) {
  const el = document.getElementById("paymentsTabContent");
  const dlBtn = document.getElementById("downloadReceiptBtn");

  if (!project) {
    el.innerHTML = `<div class="no-project-card">
      <i class="bi bi-credit-card" style="font-size:2.5rem;color:var(--text-muted);opacity:0.35;display:block;margin-bottom:14px;"></i>
      <h4 style="font-family:'Playfair Display',serif;margin-bottom:8px;">No Payment Records</h4>
      <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:20px;">Payment details will appear here once you have an active project.</p>
      <a href="marketplace.html" class="btn-bf btn-primary-bf"><i class="bi bi-grid-3x3-gap"></i> Browse Models</a>
    </div>`;
    return;
  }

  if (dlBtn) dlBtn.style.display = "inline-flex";

  const totalCost = project.finalCost || project.finalAgreedCost || 0;
  const advance = totalCost * 0.05;
  const stage2 = totalCost * 0.25;
  const stage3 = totalCost * 0.3;
  const stage4 = totalCost * 0.4;
  const balance = totalCost - advance;
  const payPct = totalCost ? Math.round((advance / totalCost) * 100) : 0;
  const prog = project.currentProgress || 0;
  const modelName = project.modelName || "—";
  const projId = project.projectId || project.id;
  const today = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  // Determine stage statuses based on construction progress
  const s2Status = prog >= 25 ? "paid" : prog >= 10 ? "current" : "upcoming";
  const s3Status = prog >= 50 ? "paid" : prog >= 25 ? "current" : "upcoming";
  const s4Status = prog >= 100 ? "paid" : prog >= 75 ? "current" : "upcoming";

  const circleC = 2 * Math.PI * 48;
  const filled = circleC * (payPct / 100);

  el.innerHTML = `

    <!-- ── Hero Banner ── -->
    <div class="pay-hero">
      <div class="pay-hero-inner">
        <div class="pay-hero-top">
          <div>
            <div class="pay-hero-eyebrow">Project #PRJ-${projId} &bull; ${modelName}</div>
            <div class="pay-hero-title">Payment Overview</div>
            <div class="pay-hero-sub">Advance payment confirmed &bull; Receipt sent to ${userEmail}</div>
          </div>
          <span class="badge-bf" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);align-self:flex-start;">
            <i class="bi bi-check-circle-fill" style="margin-right:4px;color:#6ee7b7;"></i> Advance Paid
          </span>
        </div>

        <!-- Three headline stats -->
        <div class="pay-hero-stats">
          <div class="pay-hero-stat">
            <div class="pay-hs-label">Total Project Cost</div>
            <div class="pay-hs-value">${totalCost ? "Rs. " + fmtM(totalCost) : "TBD"}</div>
            <div class="pay-hs-sub">Agreed project value</div>
          </div>
          <div class="pay-hero-stat">
            <div class="pay-hs-label">Amount Paid</div>
            <div class="pay-hs-value" style="color:#6ee7b7;">Rs. ${fmt(advance)}</div>
            <div class="pay-hs-sub">5% advance · ${today}</div>
          </div>
          <div class="pay-hero-stat">
            <div class="pay-hs-label">Balance Remaining</div>
            <div class="pay-hs-value" style="color:#fcd34d;">Rs. ${fmt(balance)}</div>
            <div class="pay-hs-sub">Due in instalments</div>
          </div>
        </div>

        <!-- Payment progress bar -->
        <div class="pay-hero-bar-wrap" style="margin-top:18px;">
          <div class="pay-hero-bar" style="width:${payPct}%;"></div>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:0.72rem;opacity:0.55;margin-top:6px;">
          <span>${payPct}% of total cost paid</span>
          <span>${100 - payPct}% remaining</span>
        </div>
      </div>
    </div>

    <!-- ── Two-col: Donut + Breakdown table ── -->
    <div class="grid-2" style="gap:20px;margin-bottom:24px;">

      <!-- Donut visual -->
      <div class="bf-card">
        <div class="bf-card-header">
          <div class="bf-card-title"><i class="bi bi-pie-chart-fill" style="color:var(--primary);"></i> Payment Split</div>
        </div>
        <div class="bf-card-body" style="display:flex;align-items:center;gap:28px;flex-wrap:wrap;">
          <div class="donut-wrap">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="48" fill="none" stroke="var(--surface-3)" stroke-width="14"/>
              <circle cx="60" cy="60" r="48" fill="none" stroke="var(--success)" stroke-width="14"
                stroke-dasharray="${filled} ${circleC - filled}" stroke-linecap="round"/>
            </svg>
            <div class="donut-label">
              <div class="donut-pct">${payPct}%</div>
              <div class="donut-sub">Paid</div>
            </div>
          </div>
          <div style="flex:1;min-width:140px;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <div style="width:12px;height:12px;border-radius:3px;background:var(--success);flex-shrink:0;"></div>
              <div>
                <div style="font-size:0.82rem;font-weight:700;">Paid</div>
                <div style="font-size:0.78rem;color:var(--text-muted);">Rs. ${fmt(advance)} (${payPct}%)</div>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
              <div style="width:12px;height:12px;border-radius:3px;background:var(--accent);flex-shrink:0;"></div>
              <div>
                <div style="font-size:0.82rem;font-weight:700;">Balance Due</div>
                <div style="font-size:0.78rem;color:var(--text-muted);">Rs. ${fmt(balance)} (${100 - payPct}%)</div>
              </div>
            </div>
            <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--border);">
              <div style="font-size:0.75rem;color:var(--text-muted);margin-bottom:3px;">Total Project Value</div>
              <div style="font-family:'Playfair Display',serif;font-size:1.2rem;font-weight:700;color:var(--primary);">
                ${totalCost ? "Rs. " + totalCost.toLocaleString() : "TBD"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Breakdown rows -->
      <div class="bf-card">
        <div class="bf-card-header">
          <div class="bf-card-title"><i class="bi bi-receipt" style="color:var(--primary);"></i> Cost Breakdown</div>
        </div>
        <div class="bf-card-body" style="padding:0;">
          <table class="breakdown-table">
            <tbody>
              <tr>
                <td style="color:var(--text-muted);">Base construction</td>
                <td style="text-align:right;font-weight:600;">${totalCost ? "Rs. " + fmt(totalCost * 0.8) : "TBD"}</td>
              </tr>
              <tr>
                <td style="color:var(--text-muted);">Materials &amp; fittings</td>
                <td style="text-align:right;font-weight:600;">${totalCost ? "Rs. " + fmt(totalCost * 0.15) : "TBD"}</td>
              </tr>
              <tr>
                <td style="color:var(--text-muted);">Professional services</td>
                <td style="text-align:right;font-weight:600;">${totalCost ? "Rs. " + fmt(totalCost * 0.05) : "TBD"}</td>
              </tr>
              <tr class="row-total">
                <td style="color:white;font-weight:700;">Total Project Cost</td>
                <td style="text-align:right;color:white;font-weight:700;">${totalCost ? "Rs. " + totalCost.toLocaleString() : "TBD"}</td>
              </tr>
              <tr class="row-paid">
                <td style="color:var(--success);font-weight:600;"><i class="bi bi-check-circle-fill me-1"></i>Advance Paid (5%)</td>
                <td style="text-align:right;font-weight:700;color:var(--success);">Rs. ${fmt(advance)}</td>
              </tr>
              <tr class="row-due">
                <td style="color:var(--accent);font-weight:600;"><i class="bi bi-clock me-1"></i>Outstanding Balance</td>
                <td style="text-align:right;font-weight:700;color:var(--accent);">Rs. ${fmt(balance)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ── Payment Schedule (stage cards) ── -->
    <div class="bf-card" style="margin-bottom:24px;">
      <div class="bf-card-header">
        <div class="bf-card-title"><i class="bi bi-calendar3" style="color:var(--primary);"></i> Payment Schedule</div>
        <span style="font-size:0.78rem;color:var(--text-muted);">Based on construction milestones</span>
      </div>
      <div class="bf-card-body">
        <div class="stages-grid">

          <!-- Stage 1 — Advance (always paid) -->
          <div class="stage-card s-paid">
            <div class="stage-badge">
              <div class="stage-num-circle">1</div>
              <span class="badge-bf badge-success"><i class="bi bi-check-circle-fill"></i> Paid</span>
            </div>
            <div class="stage-name">Advance Payment</div>
            <div class="stage-desc">Confirms your order and kicks off the project planning phase.</div>
            <div class="stage-amount">Rs. ${fmt(advance)}</div>
            <div class="stage-pct">5% of total &bull; Paid on ${today}</div>
          </div>

          <!-- Stage 2 — Foundation -->
          <div class="stage-card ${stageClass(s2Status)}">
            <div class="stage-badge">
              <div class="stage-num-circle">2</div>
              <span class="badge-bf ${stageBadge(s2Status)}">${stageLabel(s2Status)}</span>
            </div>
            <div class="stage-name">Foundation &amp; Groundwork</div>
            <div class="stage-desc">Due when construction reaches 25% completion milestone.</div>
            <div class="stage-amount">Rs. ${fmt(stage2)}</div>
            <div class="stage-pct">25% of total &bull; Due at 25% completion</div>
          </div>

          <!-- Stage 3 — Structure -->
          <div class="stage-card ${stageClass(s3Status)}">
            <div class="stage-badge">
              <div class="stage-num-circle">3</div>
              <span class="badge-bf ${stageBadge(s3Status)}">${stageLabel(s3Status)}</span>
            </div>
            <div class="stage-name">Structural &amp; Roofing</div>
            <div class="stage-desc">Due when framing, walls, and roofing reach 50% milestone.</div>
            <div class="stage-amount">Rs. ${fmt(stage3)}</div>
            <div class="stage-pct">30% of total &bull; Due at 50% completion</div>
          </div>

          <!-- Stage 4 — Final -->
          <div class="stage-card ${stageClass(s4Status)}">
            <div class="stage-badge">
              <div class="stage-num-circle">4</div>
              <span class="badge-bf ${stageBadge(s4Status)}">${stageLabel(s4Status)}</span>
            </div>
            <div class="stage-name">Final Handover Payment</div>
            <div class="stage-desc">Paid upon successful completion and key handover of your home.</div>
            <div class="stage-amount">Rs. ${fmt(stage4)}</div>
            <div class="stage-pct">40% of total &bull; Due at 100% completion</div>
          </div>

        </div>

        <!-- Overall progress bar below stages -->
        <div style="margin-top:20px;padding-top:18px;border-top:1px solid var(--border);">
          <div style="display:flex;justify-content:space-between;font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">
            <span>Overall Payment Progress</span>
            <span>${payPct}% paid</span>
          </div>
          <div class="bf-progress-wrap" style="height:10px;">
            <div class="bf-progress-bar success" style="width:${payPct}%;"></div>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.73rem;color:var(--text-muted);margin-top:6px;">
            <span style="color:var(--success);">✓ Rs. ${fmt(advance)} paid</span>
            <span style="color:var(--accent);">Rs. ${fmt(balance)} remaining</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Transaction History ── -->
    <div class="bf-card" style="margin-bottom:24px;">
      <div class="bf-card-header">
        <div class="bf-card-title"><i class="bi bi-clock-history" style="color:var(--primary);"></i> Transaction History</div>
        <span class="badge-bf badge-success">1 Transaction</span>
      </div>
      <div>
        <!-- Advance payment transaction -->
        <div class="txn-row">
          <div class="txn-icon" style="background:var(--success-light);color:var(--success);">
            <i class="bi bi-check-circle-fill"></i>
          </div>
          <div class="txn-info">
            <div class="txn-title">Advance Payment — ${modelName}</div>
            <div class="txn-meta">
              <i class="bi bi-calendar3 me-1"></i>${today}
              &nbsp;&bull;&nbsp;
              <i class="bi bi-credit-card me-1"></i>Card Payment (Simulated)
              &nbsp;&bull;&nbsp;
              TXN-${generateTxnId(projId)}
            </div>
          </div>
          <div class="txn-status">
            <div class="txn-amount credit">+ Rs. ${fmt(advance)}</div>
            <span class="badge-bf badge-success" style="font-size:0.68rem;"><i class="bi bi-check-circle-fill"></i> Completed</span>
          </div>
        </div>

        <!-- Pending rows (greyed out) -->
        ${[
          {
            label: "Foundation Payment",
            amount: stage2,
            note: "Unlocks at 25% construction",
          },
          {
            label: "Structural Payment",
            amount: stage3,
            note: "Unlocks at 50% construction",
          },
          {
            label: "Final Handover",
            amount: stage4,
            note: "Unlocks at 100% completion",
          },
        ]
          .map(
            (t) => `
        <div class="txn-row" style="opacity:0.5;">
          <div class="txn-icon" style="background:var(--surface-3);color:var(--text-muted);">
            <i class="bi bi-lock"></i>
          </div>
          <div class="txn-info">
            <div class="txn-title" style="color:var(--text-muted);">${t.label} — ${modelName}</div>
            <div class="txn-meta"><i class="bi bi-clock me-1"></i>${t.note}</div>
          </div>
          <div class="txn-status">
            <div class="txn-amount" style="color:var(--text-muted);">Rs. ${fmt(t.amount)}</div>
            <span class="badge-bf badge-neutral" style="font-size:0.68rem;"><i class="bi bi-circle"></i> Pending</span>
          </div>
        </div>`,
          )
          .join("")}
      </div>
    </div>

    <!-- ── Documents & Receipts ── -->
    <div class="bf-card">
      <div class="bf-card-header">
        <div class="bf-card-title"><i class="bi bi-folder2-open" style="color:var(--primary);"></i> Documents &amp; Receipts</div>
      </div>
      <div class="bf-card-body">
        <div class="grid-2" style="gap:12px;">

          <div class="invoice-card" onclick="handleDownloadReceipt()">
            <div class="invoice-icon"><i class="bi bi-receipt"></i></div>
            <div class="invoice-info">
              <div class="invoice-title">Advance Payment Receipt</div>
              <div class="invoice-meta">Rs. ${fmt(advance)} &bull; ${today} &bull; TXN-${generateTxnId(projId)}</div>
            </div>
            <button class="btn-bf btn-ghost-bf btn-sm-bf" style="flex-shrink:0;">
              <i class="bi bi-download"></i>
            </button>
          </div>

          <div class="invoice-card" onclick="handleDownloadQuotation()">
            <div class="invoice-icon" style="background:linear-gradient(135deg,var(--accent),#b07830);"><i class="bi bi-file-earmark-pdf"></i></div>
            <div class="invoice-info">
              <div class="invoice-title">Project Quotation — ${modelName}</div>
              <div class="invoice-meta">Full cost breakdown &bull; PDF format</div>
            </div>
            <button class="btn-bf btn-ghost-bf btn-sm-bf" style="flex-shrink:0;" id="quotationDownloadBtn">
              <i class="bi bi-download"></i>
            </button>
          </div>

        </div>

        <div class="bf-alert bf-alert-info" style="margin-top:16px;margin-bottom:0;">
          <i class="bi bi-info-circle-fill"></i>
          <div>
            Payment receipts and invoices are also sent automatically to <strong>${userEmail}</strong> after each transaction.
          </div>
        </div>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════════════
//  PROGRESS LOG
// ══════════════════════════════════════════════════════════
function renderProgressTab(progressList) {
  const el = document.getElementById("progressTabContent");

  if (!progressList || !progressList.length) {
    el.innerHTML = `<div class="no-project-card">
      <i class="bi bi-graph-up" style="font-size:2.5rem;color:var(--text-muted);opacity:0.35;display:block;margin-bottom:14px;"></i>
      <h4 style="font-family:'Playfair Display',serif;margin-bottom:8px;">No Updates Yet</h4>
      <p style="color:var(--text-muted);font-size:0.875rem;">Progress updates will appear here as your construction advances. Check back soon!</p>
    </div>`;
    return;
  }

  const latest = progressList[0];

  el.innerHTML = `
    <div class="bf-card" style="margin-bottom:24px;">
      <div class="bf-card-body">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
          <div>
            <div style="font-size:0.75rem;text-transform:uppercase;letter-spacing:0.7px;font-weight:700;color:var(--text-muted);">Overall Completion</div>
            <div style="font-family:'Playfair Display',serif;font-size:2.1rem;font-weight:700;color:var(--success);line-height:1.1;">${latest.percentageComplete}%</div>
          </div>
          <div style="text-align:right;font-size:0.82rem;color:var(--text-muted);">
            ${progressList.length} update${progressList.length !== 1 ? "s" : ""}<br>
            Last: ${fmtDT(latest.updateTime)}
          </div>
        </div>
        <div class="bf-progress-wrap" style="height:12px;">
          <div class="bf-progress-bar success" style="width:${latest.percentageComplete}%;"></div>
        </div>
      </div>
    </div>

    <div style="display:flex;flex-direction:column;">
      ${progressList
        .map(
          (u) => `
        <div class="progress-item">
          <div class="progress-dot"><i class="bi bi-hammer"></i></div>
          <div class="progress-content">
            <div class="progress-content-header">
              <div>
                <div style="font-size:0.875rem;font-weight:700;margin-bottom:3px;">${u.description || "Construction update"}</div>
                <div style="font-size:0.78rem;color:var(--text-muted);"><i class="bi bi-clock me-1"></i>${fmtDT(u.updateTime)}</div>
              </div>
              <span class="badge-bf badge-primary">${u.percentageComplete}% Done</span>
            </div>
            <div class="bf-progress-wrap" style="margin-top:10px;">
              <div class="bf-progress-bar" style="width:${u.percentageComplete}%;"></div>
            </div>
            ${u.photoUrl ? `<img src="${u.photoUrl}" class="progress-img" alt="Site photo" loading="lazy"/>` : ""}
          </div>
        </div>`,
        )
        .join("")}
    </div>`;
}

// ══════════════════════════════════════════════════════════
//  DOWNLOAD HANDLERS
// ══════════════════════════════════════════════════════════
function handleDownloadReceipt() {
  // Simple browser-based HTML receipt (no backend endpoint needed)
  const p = globalProject;
  const cost = p?.finalCost || p?.finalAgreedCost || 0;
  const paid = cost * 0.05;
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const projId = p?.projectId || p?.id || "—";
  const txn = generateTxnId(projId);

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/>
  <title>Receipt — BuildFlow</title>
  <style>
    body { font-family: Georgia, serif; max-width: 600px; margin: 40px auto; color: #1a1a2e; }
    .header { text-align:center; border-bottom: 2px solid #1a3c5e; padding-bottom: 20px; margin-bottom: 28px; }
    .logo   { font-size:1.6rem; font-weight:700; color:#1a3c5e; }
    .logo span { color:#c9883a; }
    h2 { font-size:1rem; color:#4a5568; font-weight:400; margin:6px 0 0; }
    .row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #eee; }
    .row.total { background:#1a3c5e; color:white; padding:12px 16px; margin-top:10px; font-weight:700; }
    .paid { color:#2e7d5e; font-weight:700; }
    .footer { margin-top:32px; text-align:center; font-size:0.8rem; color:#8a96a8; }
  </style></head><body>
  <div class="header"><div class="logo">Build<span>Flow</span></div><h2>Advance Payment Receipt</h2></div>
  <div class="row"><span>Receipt No</span><span>RCT-${txn}</span></div>
  <div class="row"><span>Transaction ID</span><span>TXN-${txn}</span></div>
  <div class="row"><span>Date</span><span>${today}</span></div>
  <div class="row"><span>Project ID</span><span>#PRJ-${projId}</span></div>
  <div class="row"><span>Customer</span><span>${p?.customerName || userEmail}</span></div>
  <div class="row"><span>Model / Plan</span><span>${p?.modelName || "—"}</span></div>
  <div class="row"><span>Payment Type</span><span>Advance (5%)</span></div>
  <div class="row"><span>Payment Method</span><span>Card Payment</span></div>
  <div class="row total"><span>Amount Paid</span><span>Rs. ${fmt(paid)}</span></div>
  <div class="row" style="margin-top:12px;"><span>Total Project Cost</span><span>Rs. ${cost ? cost.toLocaleString() : "TBD"}</span></div>
  <div class="row"><span class="paid">✓ Paid</span><span class="paid">Rs. ${fmt(paid)}</span></div>
  <div class="row"><span>Balance Remaining</span><span>Rs. ${fmt(cost - paid)}</span></div>
  <div class="footer">This is an official receipt issued by BuildFlow Architecture.<br>For queries: info@buildflow.lk &bull; +94 11 234 5678</div>
  </body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `BuildFlow_Receipt_${txn}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function handleDownloadQuotation() {
  const btn = document.getElementById("quotationDownloadBtn");
  const modelId = globalProject?.modelId || null;
  if (!modelId) {
    alert("Model ID not available for this project.");
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-bf dark"></span>';
  }
  try {
    const res = await fetch(`${API}/requests/download-quotation/${modelId}`, {
      headers: { Authorization: "Bearer " + token, Accept: "application/pdf" },
    });
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Quotation_${globalProject?.modelName || modelId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else alert("Could not generate PDF. Status: " + res.status);
  } catch (e) {
    alert("Error: " + e.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-download"></i>';
    }
  }
}

// ══════════════════════════════════════════════════════════
//  SMALL HELPERS
// ══════════════════════════════════════════════════════════
function setEl(id, val) {
  const e = document.getElementById(id);
  if (e) e.textContent = val;
}

function fmt(n) {
  return n ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "0";
}
function fmtM(n) {
  if (!n) return "—";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(0) + "K";
  return n.toLocaleString();
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function fmtDT(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusBadge(s) {
  return (
    {
      STARTED: "badge-info",
      IN_PROGRESS: "badge-warning",
      COMPLETED: "badge-success",
      PENDING: "badge-neutral",
    }[s] || "badge-neutral"
  );
}

function stageClass(s) {
  return s === "paid" ? "s-paid" : s === "current" ? "s-current" : "s-upcoming";
}
function stageBadge(s) {
  return s === "paid"
    ? "badge-success"
    : s === "current"
      ? "badge-warning"
      : "badge-neutral";
}
function stageLabel(s) {
  return s === "paid"
    ? '<i class="bi bi-check-circle-fill"></i> Paid'
    : s === "current"
      ? '<i class="bi bi-clock-fill"></i> Due Soon'
      : '<i class="bi bi-circle"></i> Upcoming';
}

function generateTxnId(seed) {
  return (Math.abs((seed || 1) * 9301 + 49297) % 233280)
    .toString(16)
    .toUpperCase()
    .padStart(6, "0");
}

function dRow(label, value) {
  return `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border);font-size:0.875rem;">
    <span style="color:var(--text-muted);">${label}</span>
    <span style="font-weight:600;">${value || "—"}</span>
  </div>`;
}

function miniBox(label, value) {
  return `<div style="text-align:center;padding:14px;background:var(--surface-2);border-radius:var(--radius-sm);border:1px solid var(--border);">
    <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.7px;font-weight:700;color:var(--text-muted);margin-bottom:5px;">${label}</div>
    <div style="font-weight:600;font-size:0.875rem;">${value}</div>
  </div>`;
}

function emptyProject(title, msg) {
  return `<div class="no-project-card">
    <i class="bi bi-building" style="font-size:2.5rem;color:var(--text-muted);opacity:0.35;display:block;margin-bottom:14px;"></i>
    <h4 style="font-family:'Playfair Display',serif;margin-bottom:8px;">${title}</h4>
    <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:20px;">${msg}</p>
    <a href="marketplace.html" class="btn-bf btn-primary-bf"><i class="bi bi-grid-3x3-gap"></i> Explore Models</a>
  </div>`;
}

function ringHtml(pct, size, r, sw, color) {
  const c = 2 * Math.PI * r;
  const dash = c * (pct / 100);
  return `<div class="big-progress-wrap" style="width:${size}px;height:${size}px;">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="transform:rotate(-90deg);">
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="${sw}"/>
      <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${sw}"
        stroke-dasharray="${dash} ${c - dash}" stroke-linecap="round"/>
    </svg>
    <div class="big-progress-label" style="font-family:'Playfair Display',serif;font-size:1.1rem;font-weight:700;color:${color};">${pct}%</div>
  </div>`;
}

function milestone(label, threshold, prog) {
  const done = prog >= threshold;
  const active = prog >= threshold - 25 && prog < threshold;
  const cls = done
    ? "badge-success"
    : active
      ? "badge-warning"
      : "badge-neutral";
  const icon = done
    ? "bi-check-circle-fill"
    : active
      ? "bi-arrow-right-circle-fill"
      : "bi-circle";
  const col = done
    ? "var(--success)"
    : active
      ? "var(--accent)"
      : "var(--border)";
  return `<div style="text-align:center;padding:14px 10px;background:var(--surface-2);border-radius:var(--radius-sm);border:1px solid var(--border);">
    <i class="bi ${icon}" style="font-size:1.4rem;display:block;margin-bottom:6px;color:${col};"></i>
    <div style="font-size:0.8rem;font-weight:700;margin-bottom:5px;">${label}</div>
    <span class="badge-bf ${cls}">${done ? "Done" : active ? "Active" : "Pending"}</span>
  </div>`;
}
