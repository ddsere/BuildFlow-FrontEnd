document.addEventListener("DOMContentLoaded", () => {
  fetchModels();
});

function fetchModels() {
  // ඔයාගේ Spring Boot Backend URL එක
  const apiUrl = "http://localhost:8080/api/v1/models";

  fetch(apiUrl)
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((result) => {
      if (result.status === 200) {
        displayModels(result.data);
      } else {
        console.error("Error fetching models:", result.message);
      }
    })
    .catch((error) => {
      console.error("Backend Connection Error:", error);
      document.getElementById("models-container").innerHTML =
        `<div class="alert alert-danger text-center w-100" role="alert">
                    Failed to load models. Please check if the Spring Boot server is running.
                 </div>`;
    });
}

function displayModels(models) {
  const container = document.getElementById("models-container");
  container.innerHTML = "";

  if (models.length === 0) {
    container.innerHTML = `<p class="text-center w-100">No 3D models available in the marketplace right now.</p>`;
    return;
  }

  models.forEach((model) => {
    const formattedPrice = model.estimatedCost
      ? model.estimatedCost.toLocaleString()
      : "N/A";

    const cardHtml = `
            <div class="col-md-4 mb-4">
                <div class="card h-100 shadow-sm border-0">
                    <div class="card-img-top bg-secondary bg-opacity-10 rounded-top d-flex justify-content-center align-items-center" style="height: 300px; position: relative;">
                        <model-viewer 
                            src="${model.modelUrl}" 
                            alt="${model.modelName}" 
                            auto-rotate 
                            camera-controls 
                            shadow-intensity="1"
                            style="width: 100%; height: 100%;"
                            camera-orbit="45deg 55deg 2.5m">
                        </model-viewer>
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
                                <span><i class="bi bi-house-door"></i> Bedrooms:</span>
                                <span>${model.numBedrooms}</span>
                            </div>
                            <div class="d-flex justify-content-between">
                                <span><i class="bi bi-aspect-ratio"></i> Area:</span>
                                <span>${model.floorArea} sq.ft</span>
                            </div>
                        </div>
<button class="btn btn-dark w-100 mt-3 fw-semibold" onclick="openRequestModal('${model.modelName}')">Request to Build</button>

<button class="btn btn-dark w-100 mt-3 fw-semibold" onclick="openRequestModal('${model.modelId}', '${model.modelName}')">
    Request Quotation
</button>

<button class="btn btn-outline-success w-100 mt-2 fw-bold" onclick="openPurchaseModal('${model.modelName}', ${model.estimatedCost * 0.05})">
    Buy Plan (Advance 5%)
</button>


                    </div>
                </div>
            </div>
        `;

    container.innerHTML += cardHtml;
  });
}

function unifiedSearch() {
  const name = document.getElementById("nameSearch").value;
  const price = document.getElementById("priceSearch").value;
  const bedrooms = document.getElementById("bedroomSearch").value;
  const container = document.getElementById("models-container");

  container.innerHTML = `
        <div class="text-center text-primary w-100">
            <div class="spinner-border" role="status"></div>
            <p class="mt-2">Filtering models...</p>
        </div>`;

  let url = new URL("http://localhost:8080/api/v1/models/search");

  if (name) url.searchParams.append("name", name);
  if (price) url.searchParams.append("maxPrice", price);
  if (bedrooms) url.searchParams.append("minBedrooms", bedrooms);

  fetch(url)
    .then((response) => response.json())
    .then((result) => {
      if (result.status === 200) {
        displayModels(result.data);
      } else {
        console.error("Search failed:", result.message);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      container.innerHTML = `<p class="text-danger text-center w-100">Error connecting to server.</p>`;
    });
}

function openRequestModal(modelName) {
  document.getElementById("requestModelName").value = modelName;

  const requestModal = new bootstrap.Modal(
    document.getElementById("requestModal"),
  );
  requestModal.show();
}

document
  .getElementById("requestForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const requestData = {
      modelName: document.getElementById("requestModelName").value,
      customerName: document.getElementById("customerName").value,
      customerEmail: document.getElementById("customerEmail").value,
      customerPhone: document.getElementById("customerPhone").value,
      message: document.getElementById("customerMessage").value,
    };

    fetch("http://localhost:8080/api/v1/inquiries/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then((response) => response.json())
      .then((result) => {
        const alertBox = document.getElementById("requestAlertMessage");
        alertBox.innerHTML = `
            <div class="alert alert-success small" role="alert">
                Request sent successfully! We will contact you soon.
            </div>`;

        setTimeout(() => {
          document.getElementById("requestForm").reset();
          alertBox.innerHTML = "";
          bootstrap.Modal.getInstance(
            document.getElementById("requestModal"),
          ).hide();
        }, 2500);
      })
      .catch((error) => {
        console.error("Error:", error);
        document.getElementById("requestAlertMessage").innerHTML = `
            <div class="alert alert-danger small" role="alert">Failed to send request.</div>`;
      });
  });

function openRequestModal(modelName) {
  document.getElementById("requestModelName").value = modelName;

  const requestModal = new bootstrap.Modal(
    document.getElementById("requestModal"),
  );
  requestModal.show();
}

document
  .getElementById("requestForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const requestData = {
      modelName: document.getElementById("requestModelName").value,
      customerName: document.getElementById("customerName").value,
      customerEmail: document.getElementById("customerEmail").value,
      customerPhone: document.getElementById("customerPhone").value,
      message: document.getElementById("customerMessage").value,
    };

    fetch("http://localhost:8080/api/v1/inquiries/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestData),
    })
      .then((response) => response.json())
      .then((result) => {
        const alertBox = document.getElementById("requestAlertMessage");
        alertBox.innerHTML = `
            <div class="alert alert-success small" role="alert">
                Request sent successfully! We will contact you soon.
            </div>`;

        setTimeout(() => {
          document.getElementById("requestForm").reset();
          alertBox.innerHTML = "";
          bootstrap.Modal.getInstance(
            document.getElementById("requestModal"),
          ).hide();
        }, 2500);
      })
      .catch((error) => {
        console.error("Error:", error);
        document.getElementById("requestAlertMessage").innerHTML = `
            <div class="alert alert-danger small" role="alert">Failed to send request.</div>`;
      });
  });

function openPurchaseModal(modelName, advanceAmount) {
  document.getElementById("purchaseModelName").innerText = modelName;
  document.getElementById("purchasePrice").innerText =
    advanceAmount.toLocaleString();

  document.getElementById("hiddenModelName").value = modelName;
  document.getElementById("hiddenPrice").value = advanceAmount;

  const purchaseModal = new bootstrap.Modal(
    document.getElementById("purchaseModal"),
  );
  purchaseModal.show();
}

document
  .getElementById("purchaseForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const orderData = {
      modelName: document.getElementById("hiddenModelName").value,
      customerName: document.getElementById("buyerName").value,
      customerEmail: document.getElementById("buyerEmail").value,
      amountPaid: parseFloat(document.getElementById("hiddenPrice").value),
    };

    fetch("http://localhost:8080/api/v1/orders/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    })
      .then((response) => response.json())
      .then((result) => {
        const alertBox = document.getElementById("purchaseAlertMessage");
        alertBox.innerHTML = `
            <div class="alert alert-success small text-center" role="alert">
                <i class="bi bi-check-circle-fill"></i> Payment Successful! <br>
                Your blueprint will be emailed to you shortly.
            </div>`;

        setTimeout(() => {
          document.getElementById("purchaseForm").reset();
          alertBox.innerHTML = "";
          bootstrap.Modal.getInstance(
            document.getElementById("purchaseModal"),
          ).hide();
        }, 3000);
      })
      .catch((error) => {
        console.error("Payment Error:", error);
      });
  });

function openRequestModal(modelId, modelName) {
  document.getElementById("requestModelName").value = modelName;
  document.getElementById("requestForm").dataset.selectedModelId = modelId;

  const requestModal = new bootstrap.Modal(
    document.getElementById("requestModal"),
  );
  requestModal.show();
}

document
  .getElementById("requestForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const submitBtn = event.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm"></span> Sending...';

    const requestData = {
      userId: 1,
      modelId: parseInt(this.dataset.selectedModelId),
      requestType: "QUOTATION",
      status: "PENDING",
    };

    fetch("http://localhost:8080/api/v1/requests/request-quotation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestData),
    })
      .then((response) => response.json())
      .then((result) => {
        const alertBox = document.getElementById("requestAlertMessage");
        if (result.status === 200) {
          alertBox.innerHTML = `<div class="alert alert-success small">Quotation PDF sent to your email!</div>`;
          setTimeout(() => {
            this.reset();
            bootstrap.Modal.getInstance(
              document.getElementById("requestModal"),
            ).hide();
            alertBox.innerHTML = "";
          }, 3000);
        } else {
          alertBox.innerHTML = `<div class="alert alert-danger small">${result.message}</div>`;
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        document.getElementById("requestAlertMessage").innerHTML =
          `<div class="alert alert-danger small">Server Error. Please try again.</div>`;
      })
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.innerHTML = "Send Request";
      });
  });
