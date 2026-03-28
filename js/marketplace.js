document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI(); // මුලින්ම Login status එක බලන්න
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

// Login Form Submit logic
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
      // මම මෙතන Console එකට දානවා Backend එකෙන් එන දේ බලාගන්න
      console.log("Backend Response:", result);

      // Spring boot එකෙන් එවන විදිහට token එකයි email එකයි ගන්න ට්‍රයි කරනවා
      const token = result.data?.token || result.token || result.jwt;
      const userEmail = result.data?.email || result.email || email;

      // Token එකක් ඇවිත් නම් විතරක් ලොග් වෙනවා
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
  alert("Please login to proceed with the purchase or quotation!");
  const loginModal = new bootstrap.Modal(document.getElementById("loginModal"));
  loginModal.show();
}

// --- Data Fetching Functions ---

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

    // Login status එක අනුව buttons වෙනස් වෙනවා
    const actionButtons = isLoggedIn
      ? `
<button class="btn btn-dark w-100 mt-3 fw-semibold" onclick="downloadQuotation('${model.modelId}', event)">
    Download Quotation (PDF)
</button>
            <button class="btn btn-outline-success w-100 mt-2 fw-bold" onclick="openPurchaseModal('${model.modelName}', ${model.estimatedCost * 0.05})">Buy Plan (Advance 5%)</button>
        `
      : `
            <button class="btn btn-secondary w-100 mt-3 fw-semibold" onclick="showLoginAlert()">Login to Request</button>
            <button class="btn btn-secondary w-100 mt-2 fw-bold" onclick="showLoginAlert()">Login to Buy Plan</button>
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

// --- Search and Modal Controls ---

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

function openRequestModal(modelId, modelName) {
  document.getElementById("requestModelName").value = modelName;
  // Form එකේ Model ID එක තාවකාලිකව තියාගන්න
  document.getElementById("requestForm").dataset.selectedModelId = modelId;
  new bootstrap.Modal(document.getElementById("requestModal")).show();
}

function openPurchaseModal(modelName, advanceAmount) {
  document.getElementById("purchaseModelName").innerText = modelName;
  document.getElementById("purchasePrice").innerText =
    advanceAmount.toLocaleString();
  document.getElementById("hiddenModelName").value = modelName;
  document.getElementById("hiddenPrice").value = advanceAmount;
  new bootstrap.Modal(document.getElementById("purchaseModal")).show();
}

// --- Form Submissions with Security Tokens ---

document
  .getElementById("requestForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const token = localStorage.getItem("authToken");

    const requestData = {
      modelId: parseInt(this.dataset.selectedModelId),
      customerName: document.getElementById("customerName").value,
      customerEmail: document.getElementById("customerEmail").value,
      customerPhone: document.getElementById("customerPhone").value,
      message: document.getElementById("customerMessage").value,
    };

    fetch("http://localhost:8080/api/v1/requests/request-quotation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token, // Security Token එක මෙතනට යනවා
      },
      body: JSON.stringify(requestData),
    })
      .then((res) => res.json())
      .then((result) => {
        const alertBox = document.getElementById("requestAlertMessage");
        if (result.status === 200) {
          alertBox.innerHTML = `<div class="alert alert-success small">Quotation request sent!</div>`;
          setTimeout(() => location.reload(), 2000);
        }
      });
  });

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

async function downloadQuotation(modelId, event) {
  const token = localStorage.getItem("authToken");

  if (!token) {
    showLoginAlert();
    return;
  }

  // බටන් එක හරියටම අල්ලගන්නවා
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
        // මෙතනදී Backend එකෙන් එන JSON error එකක් තිබුණොත් ඒක බලන්න පුළුවන්
        console.error("Server Response Error:", res.status);
        alert("Failed to download PDF. Status: " + res.status);
      }
    })
    .catch((err) => {
      console.error("Fetch Error:", err);
      alert("Server error occurred. Please check CORS settings on Backend.");
    })
    .finally(() => {
      btn.disabled = false;
      btn.innerHTML = originalText;
    });
}
