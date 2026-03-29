// marketplace.js — BuildFlow
document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  fetchModels();
});

function updateAuthUI() {
  const token = localStorage.getItem("authToken");
  const loginBtn = document.getElementById("loginNavBtn");
  const registerBtn = document.getElementById("registerNavBtn");
  const guestBanner = document.getElementById("guestBanner");

  if (token) {
    if (loginBtn) loginBtn.textContent = "Dashboard";
    if (loginBtn) loginBtn.href = "client-dashboard.html";
    if (registerBtn) {
      registerBtn.textContent = "Logout";
      registerBtn.href = "#";
      registerBtn.onclick = logout;
    }
    if (guestBanner) guestBanner.style.display = "none";
  }
}

function logout() {
  localStorage.clear();
  location.reload();
}

function fetchModels() {
  fetch("http://localhost:8080/api/v1/models")
    .then((r) => r.json())
    .then((result) => {
      if (result.status === 200) displayModels(result.data);
    })
    .catch(() => {
      document.getElementById("models-container").innerHTML =
        '<div style="grid-column:1/-1;text-align:center;padding:60px 0;color:var(--danger);">' +
        '<i class="bi bi-wifi-off" style="font-size:2.5rem;display:block;margin-bottom:12px;opacity:0.5;"></i>' +
        '<p style="font-size:0.9rem;">Could not connect to server. Please ensure the backend is running.</p></div>';
    });
}

function displayModels(models) {
  const container = document.getElementById("models-container");
  const countEl = document.getElementById("modelCount");
  container.innerHTML = "";

  if (countEl)
    countEl.textContent =
      models.length + " model" + (models.length !== 1 ? "s" : "") + " found";

  const isLoggedIn = !!localStorage.getItem("authToken");

  if (!models.length) {
    container.innerHTML =
      '<div style="grid-column:1/-1;" class="empty-state"><i class="bi bi-search"></i><p>No models match your search. Try adjusting the filters.</p></div>';
    return;
  }

  models.forEach((model) => {
    const cost = model.estimatedCost
      ? model.estimatedCost.toLocaleString()
      : "N/A";
    const advance = model.estimatedCost
      ? (model.estimatedCost * 0.05).toLocaleString(undefined, {
          maximumFractionDigits: 0,
        })
      : "N/A";

    const actions = isLoggedIn
      ? `
      <button class="btn-bf btn-ghost-bf btn-sm-bf" onclick="downloadQuotation('${model.modelId}', event)" style="width:100%;justify-content:center;">
        <i class="bi bi-file-earmark-pdf"></i> Download Quotation
      </button>
      <button class="btn-bf btn-success-bf btn-sm-bf" onclick="openPurchaseModal('${model.modelName}', ${model.estimatedCost * 0.05})" style="width:100%;justify-content:center;">
        <i class="bi bi-cart-check"></i> Buy Plan (5% Advance)
      </button>
      <button class="btn-bf btn-outline-bf btn-sm-bf" onclick="openInquiryModal('${model.modelName}')" style="width:100%;justify-content:center;">
        <i class="bi bi-chat-dots"></i> Send Inquiry
      </button>
    `
      : `
      <a href="login.html" class="btn-bf btn-ghost-bf btn-sm-bf" style="width:100%;justify-content:center;">
        <i class="bi bi-lock"></i> Login to Download Quotation
      </a>
      <a href="login.html" class="btn-bf btn-outline-bf btn-sm-bf" style="width:100%;justify-content:center;">
        <i class="bi bi-person-circle"></i> Login to Purchase / Inquire
      </a>
    `;

    container.innerHTML += `
      <div class="model-card anim-fade-up">
        <div class="model-viewer-wrap">
          <model-viewer src="${model.modelUrl}" alt="${model.modelName}" auto-rotate camera-controls style="width:100%;height:100%;"></model-viewer>
          <span class="model-badge"><i class="bi bi-box" style="margin-right:4px;"></i>3D View</span>
        </div>
        <div class="model-card-body">
          <div class="model-card-title">${model.modelName}</div>
          <p class="model-card-desc">${model.description || "A beautifully designed architectural model."}</p>
          <div class="model-specs">
            <div class="model-spec-row">
              <span class="model-spec-label"><i class="bi bi-currency-rupee"></i> Estimated Cost</span>
              <span class="model-spec-value price">Rs. ${cost}</span>
            </div>
            <div class="model-spec-row">
              <span class="model-spec-label"><i class="bi bi-door-open"></i> Bedrooms</span>
              <span class="model-spec-value">${model.numBedrooms}</span>
            </div>
            <div class="model-spec-row">
              <span class="model-spec-label"><i class="bi bi-aspect-ratio"></i> Floor Area</span>
              <span class="model-spec-value">${model.floorArea} sq.ft</span>
            </div>
            <div class="model-spec-row">
              <span class="model-spec-label"><i class="bi bi-cash-coin"></i> 5% Advance</span>
              <span class="model-spec-value" style="color:var(--accent);">Rs. ${advance}</span>
            </div>
          </div>
          <div class="model-actions">${actions}</div>
        </div>
      </div>`;
  });
}

function unifiedSearch() {
  const name = document.getElementById("nameSearch").value;
  const price = document.getElementById("priceSearch").value;
  const bedrooms = document.getElementById("bedroomSearch").value;

  let url = new URL("http://localhost:8080/api/v1/models/search");
  if (name) url.searchParams.append("name", name);
  if (price) url.searchParams.append("maxPrice", price);
  if (bedrooms) url.searchParams.append("minBedrooms", bedrooms);

  fetch(url)
    .then((r) => r.json())
    .then((result) => {
      if (result.status === 200) displayModels(result.data);
    });
}

function clearFilters() {
  document.getElementById("nameSearch").value = "";
  document.getElementById("priceSearch").value = "";
  document.getElementById("bedroomSearch").value = "";
  fetchModels();
}

// ── Modals ──
function openModal(id) {
  document.getElementById(id).style.display = "flex";
  document.body.style.overflow = "hidden";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
  document.body.style.overflow = "";
}
function closeModalOnBackdrop(event, id) {
  if (event.target.id === id) closeModal(id);
}

function openPurchaseModal(modelName, advanceAmount) {
  document.getElementById("purchaseModelName").textContent = modelName;
  document.getElementById("purchasePrice").textContent =
    advanceAmount.toLocaleString(undefined, { maximumFractionDigits: 0 });
  document.getElementById("payBtnAmt").textContent =
    advanceAmount.toLocaleString(undefined, { maximumFractionDigits: 0 });
  document.getElementById("hiddenModelName").value = modelName;
  document.getElementById("hiddenPrice").value = advanceAmount;
  document.getElementById("purchaseAlert").innerHTML = "";
  openModal("purchaseModalWrap");
}

function openInquiryModal(modelName) {
  document.getElementById("inquiryModelName").value = modelName;
  const savedEmail = localStorage.getItem("userEmail");
  if (savedEmail)
    document.getElementById("inquiryCustomerEmail").value = savedEmail;
  document.getElementById("inquiryAlert").innerHTML = "";
  openModal("inquiryModalWrap");
}

function formatCard(input) {
  let v = input.value.replace(/\D/g, "").substring(0, 16);
  input.value = v.replace(/(.{4})/g, "$1 ").trim();
}

// ── Form Submissions ──
document
  .getElementById("purchaseForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("confirmPurchaseBtn");
    const alertBox = document.getElementById("purchaseAlert");
    const token = localStorage.getItem("authToken");

    const orderData = {
      modelName: document.getElementById("hiddenModelName").value,
      customerName: document.getElementById("buyerName").value,
      customerEmail: document.getElementById("buyerEmail").value,
      amountPaid: parseFloat(document.getElementById("hiddenPrice").value),
    };

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-bf"></span> Processing...';
    alertBox.innerHTML = "";

    try {
      const res = await fetch("http://localhost:8080/api/v1/orders/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(orderData),
      });
      const result = await res.json();
      if (res.ok) {
        alertBox.innerHTML =
          '<div class="bf-alert bf-alert-success"><i class="bi bi-check-circle-fill"></i> Payment successful! Receipt sent to your email.</div>';
        setTimeout(() => {
          closeModal("purchaseModalWrap");
          this.reset();
        }, 3000);
      } else throw new Error(result.message || "Payment failed.");
    } catch (err) {
      alertBox.innerHTML = `<div class="bf-alert bf-alert-danger"><i class="bi bi-exclamation-triangle-fill"></i> ${err.message}</div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML =
        '<i class="bi bi-lock-fill"></i> Pay Securely Rs. <span id="payBtnAmt">' +
        document.getElementById("hiddenPrice").value +
        "</span>";
    }
  });

document
  .getElementById("inquiryForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const btn = document.getElementById("sendInquiryBtn");
    const alertBox = document.getElementById("inquiryAlert");
    const token = localStorage.getItem("authToken");

    const data = {
      modelName: document.getElementById("inquiryModelName").value,
      customerName: document.getElementById("inquiryCustomerName").value,
      customerEmail: document.getElementById("inquiryCustomerEmail").value,
      customerPhone: document.getElementById("inquiryCustomerPhone").value,
      message: document.getElementById("inquiryMessage").value,
    };

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-bf"></span> Sending...';
    alertBox.innerHTML = "";

    try {
      const res = await fetch("http://localhost:8080/api/v1/inquiries/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (result.status === 200) {
        alertBox.innerHTML =
          '<div class="bf-alert bf-alert-success"><i class="bi bi-check-circle-fill"></i> Inquiry sent! We\'ll respond to your email shortly.</div>';
        setTimeout(() => {
          closeModal("inquiryModalWrap");
          this.reset();
        }, 2500);
      } else throw new Error(result.message || "Failed to send inquiry.");
    } catch (err) {
      alertBox.innerHTML = `<div class="bf-alert bf-alert-danger"><i class="bi bi-exclamation-triangle-fill"></i> ${err.message}</div>`;
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-send"></i> Send Inquiry';
    }
  });

async function downloadQuotation(modelId, event) {
  const btn = event.target.closest("button");
  const orig = btn.innerHTML;
  const token = localStorage.getItem("authToken");

  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-bf dark"></span> Generating...';

  try {
    const res = await fetch(
      `http://localhost:8080/api/v1/requests/download-quotation/${modelId}`,
      {
        headers: {
          Authorization: "Bearer " + token,
          Accept: "application/pdf",
        },
      },
    );
    if (res.ok) {
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Quotation_${modelId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } else {
      alert("Failed to generate PDF. Status: " + res.status);
    }
  } catch (err) {
    alert("Server error: " + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = orig;
  }
}
