document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  fetchModels();
});

// --- Authentication Functions ---
function updateAuthUI() {
  const token = localStorage.getItem("authToken");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");

  if (token) {
    if (loginBtn) loginBtn.classList.add("d-none");
    if (logoutBtn) logoutBtn.classList.remove("d-none");
  } else {
    if (loginBtn) loginBtn.classList.remove("d-none");
    if (logoutBtn) logoutBtn.classList.add("d-none");
  }
}

document.getElementById("loginForm")?.addEventListener("submit", function (e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  fetch("http://localhost:8080/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
    .then((res) => res.json())
    .then((result) => {
      const token = result.data?.token || result.token || result.jwt;
      const userEmail = result.data?.email || result.email || email;

      if (token) {
        localStorage.setItem("authToken", token);
        localStorage.setItem("userEmail", userEmail);
        location.reload();
      } else {
        document.getElementById("loginAlert").innerHTML =
          `<div class="alert alert-danger small">Invalid Email or Password!</div>`;
      }
    })
    .catch((err) => {
      console.error("Login Error:", err);
      document.getElementById("loginAlert").innerHTML =
        `<div class="alert alert-danger small">System Error. Please try again.</div>`;
    });
});

function logout() {
  localStorage.clear();
  location.reload();
}

function showLoginAlert() {
  alert("Please login to proceed!");
  const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
  loginModal.show();
}

// --- Data Fetching & Display ---
function fetchModels() {
  const apiUrl = "http://localhost:8080/api/v1/models";
  fetch(apiUrl)
    .then((response) => response.json())
    .then((result) => {
      if (result.status === 200) {
        displayModels(result.data);
      }
    })
    .catch((error) => {
      console.error("Connection Error:", error);
      document.getElementById("models-container").innerHTML =
        `<div class="alert alert-danger text-center w-100">Failed to load models. Check backend.</div>`;
    });
}

function displayModels(models) {
  const container = document.getElementById("models-container");
  container.innerHTML = "";
  const isLoggedIn = localStorage.getItem("authToken") !== null;

  if (models.length === 0) {
    container.innerHTML = `<p class="text-center w-100">No 3D models available.</p>`;
    return;
  }

  models.forEach((model) => {
    const formattedPrice = model.estimatedCost
      ? model.estimatedCost.toLocaleString()
      : "N/A";

    // Aluth Inquiry Button eka methanata damma
    const actionButtons = isLoggedIn
      ? `
          <button class="btn btn-dark w-100 mt-3 fw-semibold" onclick="downloadQuotation('${model.modelId}', event)">Download Quotation (PDF)</button>
          <button class="btn btn-outline-success w-100 mt-2 fw-bold" onclick="openPurchaseModal('${model.modelName}', ${model.estimatedCost * 0.05})">Buy Plan (Advance 5%)</button>
          <button class="btn btn-outline-primary w-100 mt-2 fw-bold" onclick="openInquiryModal('${model.modelName}')">Send Inquiry</button>
        `
      : `
          <button class="btn btn-secondary w-100 mt-3 fw-semibold" onclick="showLoginAlert()">Login to Request</button>
          <button class="btn btn-secondary w-100 mt-2 fw-bold" onclick="showLoginAlert()">Login to Buy Plan</button>
          <button class="btn btn-secondary w-100 mt-2 fw-bold" onclick="showLoginAlert()">Login to Inquire</button>
        `;

    const cardHtml = `
      <div class="col-md-4 mb-4">
        <div class="card h-100 shadow-sm border-0">
          <div class="card-img-top bg-secondary bg-opacity-10 rounded-top d-flex justify-content-center align-items-center" style="height: 300px; position: relative;">
            <model-viewer src="${model.modelUrl}" alt="${model.modelName}" auto-rotate camera-controls style="width: 100%; height: 100%;"></model-viewer>
            <span class="badge bg-primary position-absolute top-0 end-0 m-2">3D View</span>
          </div>
          <div class="card-body d-flex flex-column">
            <h5 class="card-title fw-bold text-dark">${model.modelName}</h5>
            <p class="card-text text-muted small">${model.description}</p>
            <div class="mt-auto bg-light p-3 rounded">
              <div class="d-flex justify-content-between mb-2">
                <span class="fw-semibold">Estimated Cost:</span>
                <span class="text-success fw-bold">Rs. ${formattedPrice}</span>
              </div>
              <div class="d-flex justify-content-between mb-2">
                <span>Bedrooms:</span> <span>${model.numBedrooms}</span>
              </div>
              <div class="d-flex justify-content-between">
                <span>Area:</span> <span>${model.floorArea} sq.ft</span>
              </div>
            </div>
            ${actionButtons}
          </div>
        </div>
      </div>`;
    container.innerHTML += cardHtml;
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
    .then((res) => res.json())
    .then((result) => {
      if (result.status === 200) displayModels(result.data);
    });
}

// --- Modals ---
function openPurchaseModal(modelName, advanceAmount) {
  document.getElementById("purchaseModelName").innerText = modelName;
  document.getElementById("purchasePrice").innerText =
    advanceAmount.toLocaleString();
  document.getElementById("hiddenModelName").value = modelName;
  document.getElementById("hiddenPrice").value = advanceAmount;
  new bootstrap.Modal(document.getElementById("purchaseModal")).show();
}

function openInquiryModal(modelName) {
  document.getElementById("inquiryModelName").value = modelName;

  // LocalStorage eken email eka aran auto fill karanawa
  const savedEmail = localStorage.getItem("userEmail");
  if (savedEmail) {
    document.getElementById("inquiryCustomerEmail").value = savedEmail;
  }

  new bootstrap.Modal(document.getElementById("inquiryModal")).show();
}

// --- Form Submissions ---
document
  .getElementById("purchaseForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const token = localStorage.getItem("authToken");

    const orderData = {
      modelName: document.getElementById("hiddenModelName").value,
      customerName: document.getElementById("buyerName").value,
      customerEmail: document.getElementById("buyerEmail").value,
      amountPaid: parseFloat(document.getElementById("hiddenPrice").value),
    };

    fetch("http://localhost:8080/api/v1/orders/purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(orderData),
    })
      .then((res) => res.json())
      .then((result) => {
        document.getElementById("purchaseAlertMessage").innerHTML =
          `<div class="alert alert-success small">Payment Successful!</div>`;
        setTimeout(() => location.reload(), 2000);
      });
  });

// Aluth Inquiry Submit Logic Eka
document
  .getElementById("inquiryForm")
  ?.addEventListener("submit", function (event) {
    event.preventDefault();
    const token = localStorage.getItem("authToken");

    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Sending...';

    const inquiryData = {
      modelName: document.getElementById("inquiryModelName").value,
      customerName: document.getElementById("inquiryCustomerName").value,
      customerEmail: document.getElementById("inquiryCustomerEmail").value,
      customerPhone: document.getElementById("inquiryCustomerPhone").value,
      message: document.getElementById("inquiryMessage").value,
    };

    fetch("http://localhost:8080/api/v1/inquiries/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify(inquiryData),
    })
      .then((res) => res.json())
      .then((result) => {
        const alertBox = document.getElementById("inquiryAlertMessage");
        if (result.status === 200) {
          alertBox.innerHTML = `<div class="alert alert-success small"><i class="bi bi-check-circle"></i> Inquiry sent successfully! Email confirmation sent.</div>`;
          setTimeout(() => {
            const modalInst = bootstrap.Modal.getInstance(
              document.getElementById("inquiryModal"),
            );
            modalInst.hide();
            this.reset();
            alertBox.innerHTML = "";
          }, 2500);
        } else {
          alertBox.innerHTML = `<div class="alert alert-danger small">Failed: ${result.message}</div>`;
        }
      })
      .catch((err) => {
        console.error(err);
        document.getElementById("inquiryAlertMessage").innerHTML =
          `<div class="alert alert-danger small">Network error! Please try again.</div>`;
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      });
  });

async function downloadQuotation(modelId, event) {
  const token = localStorage.getItem("authToken");
  if (!token) {
    showLoginAlert();
    return;
  }

  const btn = event.target.closest("button");
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>...';

  const url = `http://localhost:8080/api/v1/requests/download-quotation/${modelId}`;

  fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Bearer " + token,
      Accept: "application/pdf",
    },
  })
    .then(async (res) => {
      if (res.ok) {
        const blob = await res.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = `Quotation_${modelId}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
      } else {
        alert("Failed to download PDF. Status: " + res.status);
      }
    })
    .catch((err) => {
      console.error("Fetch Error:", err);
      alert("Server error occurred.");
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = originalText;
    });
}
