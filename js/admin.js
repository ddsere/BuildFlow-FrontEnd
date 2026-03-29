document.addEventListener("DOMContentLoaded", () => {
  loadInquiries();
  loadProjects();
});

// --- 1. Add New Model Logic ---
document
  .getElementById("addModelForm")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault();
    const submitBtn = document.getElementById("saveModelBtn");
    const originalBtnText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Saving...';

    const modelData = {
      modelName: document.getElementById("modelName").value,
      description: document.getElementById("description").value,
      estimatedCost: parseFloat(document.getElementById("estimatedCost").value),
      floorArea: parseFloat(document.getElementById("floorArea").value),
      numBedrooms: parseInt(document.getElementById("numBedrooms").value),
      modelUrl: document.getElementById("modelUrl").value,
      imgUrl: document.getElementById("imgUrl").value,
    };

    const token = localStorage.getItem("authToken");
    const apiUrl = "http://localhost:8080/api/v1/models/add";

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? "Bearer " + token : "",
        },
        body: JSON.stringify(modelData),
      });

      const result = await response.json();
      const alertBox = document.getElementById("alertMessage");

      if (response.ok) {
        alertBox.innerHTML = `
                <div class="alert alert-success alert-dismissible fade show shadow-sm" role="alert">
                    <i class="bi bi-check-circle-fill me-2"></i><strong>Success!</strong> ${result.message || "Model added successfully!"}
                    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                </div>`;
        document.getElementById("addModelForm").reset();
      } else {
        throw new Error(result.message || "Failed to add model.");
      }
    } catch (error) {
      console.error("Error adding model:", error);
      document.getElementById("alertMessage").innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show shadow-sm" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i><strong>Error!</strong> ${error.message || "Failed to save the model. Is the server running?"}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
      setTimeout(() => {
        document.getElementById("alertMessage").innerHTML = "";
      }, 5000);
    }
  });

// --- 2. Load Inquiries Logic ---
async function loadInquiries() {
  const tableBody = document.getElementById("inquiriesTableBody");
  const token = localStorage.getItem("authToken");

  tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading inquiries...</td></tr>`;

  try {
    const response = await fetch("http://localhost:8080/api/v1/inquiries/all", {
      headers: { Authorization: token ? "Bearer " + token : "" },
    });

    const result = await response.json();
    tableBody.innerHTML = "";

    if (result.status === 200 && result.data && result.data.length > 0) {
      result.data.forEach((inquiry) => {
        const dateObj = new Date(inquiry.submittedAt || new Date());
        const formattedDate = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });

        // Note: Use inquiry.id or inquiry.inquiryId based on your backend DTO
        const currentId = inquiry.id || inquiry.inquiryId;

        const row = `
                    <tr>
                        <td class="align-middle text-muted small ps-4">
                            <i class="bi bi-calendar3 me-1"></i>${formattedDate}
                        </td>
                        <td class="align-middle">
                            <strong class="text-dark">${inquiry.customerName}</strong><br>
                            <small class="text-primary"><i class="bi bi-telephone-fill me-1"></i>${inquiry.customerPhone}</small><br>
                            <small class="text-muted"><i class="bi bi-envelope-fill me-1"></i>${inquiry.customerEmail}</small>
                        </td>
                        <td class="align-middle">
                            <span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1 border border-primary-subtle rounded-3">
                                <i class="bi bi-house me-1"></i>${inquiry.modelName}
                            </span>
                        </td>
                        <td class="align-middle text-secondary small" style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${inquiry.message || "No message"}">
                            ${inquiry.message || "<i class='text-muted'>No message provided</i>"}
                        </td>
                        <td class="align-middle text-center pe-4">
                            <button onclick="openReplyModal('${inquiry.customerEmail}', '${inquiry.modelName}')" class="btn btn-sm btn-primary shadow-sm rounded-pill px-3 mb-1 w-100">
                                <i class="bi bi-reply-fill me-1"></i>Reply
                            </button>
                            <br>
                            <button onclick="openApproveModal('${currentId}', '${inquiry.customerName}', '${inquiry.modelName}')" class="btn btn-sm btn-success shadow-sm rounded-pill px-3 w-100 mt-1">
                                <i class="bi bi-check-lg me-1"></i>Approve
                            </button>
                        </td>
                    </tr>`;
        tableBody.innerHTML += row;
      });
    } else {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted"><i class="bi bi-inbox fs-3 d-block mb-2"></i>No inquiries found.</td></tr>`;
    }
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-danger"><i class="bi bi-exclamation-triangle-fill fs-3 d-block mb-2"></i>Failed to load data. Please check connection.</td></tr>`;
  }
}

// --- 3. Reply Modal Logic ---
function openReplyModal(customerEmail, modelName) {
  document.getElementById("replyEmail").value = customerEmail;
  document.getElementById("replySubject").value =
    `Re: Inquiry about ${modelName} (BuildFlow)`;
  document.getElementById("replyMessage").value = "";
  document.getElementById("replyAlertMessage").innerHTML = "";
  new bootstrap.Modal(document.getElementById("replyModal")).show();
}

document
  .getElementById("replyForm")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault();
    const submitBtn = document.getElementById("sendReplyBtn");
    const originalBtnText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Sending...';

    const replyData = {
      customerEmail: document.getElementById("replyEmail").value,
      subject: document.getElementById("replySubject").value,
      message: document.getElementById("replyMessage").value,
    };

    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/inquiries/reply",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? "Bearer " + token : "",
          },
          body: JSON.stringify(replyData),
        },
      );

      const result = await response.json();
      const alertBox = document.getElementById("replyAlertMessage");

      if (response.ok) {
        alertBox.innerHTML = `<div class="alert alert-success small shadow-sm"><i class="bi bi-check-circle-fill me-1"></i> Email sent successfully!</div>`;
        setTimeout(() => {
          bootstrap.Modal.getInstance(
            document.getElementById("replyModal"),
          ).hide();
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to send email.");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      document.getElementById("replyAlertMessage").innerHTML =
        `<div class="alert alert-danger small shadow-sm"><i class="bi bi-exclamation-triangle-fill me-1"></i> Error: ${error.message}</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });

// --- 4. Approve Modal Logic ---
function openApproveModal(inquiryId, customerName, modelName) {
  document.getElementById("approveInquiryId").value = inquiryId;
  document.getElementById("approveCustomerName").value = customerName;
  document.getElementById("approveModelName").value = modelName;
  document.getElementById("approveSpecs").value = "";
  document.getElementById("approvePrice").value = "";
  document.getElementById("approveAlertMessage").innerHTML = "";
  new bootstrap.Modal(document.getElementById("approveModal")).show();
}

document
  .getElementById("approveForm")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault();
    const submitBtn = document.getElementById("confirmApproveBtn");
    const originalBtnText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Processing...';

    const orderData = {
      inquiryId: parseInt(document.getElementById("approveInquiryId").value),
      customSpecs: document.getElementById("approveSpecs").value,
      finalPrice: parseFloat(document.getElementById("approvePrice").value),
    };

    const token = localStorage.getItem("authToken");

    try {
      const response = await fetch(
        "http://localhost:8080/api/v1/orders/create-custom",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? "Bearer " + token : "",
          },
          body: JSON.stringify(orderData),
        },
      );

      const result = await response.json();
      const alertBox = document.getElementById("approveAlertMessage");

      if (response.ok) {
        alertBox.innerHTML = `<div class="alert alert-success small shadow-sm"><i class="bi bi-check-circle-fill me-1"></i> Order created & Email sent!</div>`;
        setTimeout(() => {
          bootstrap.Modal.getInstance(
            document.getElementById("approveModal"),
          ).hide();
          loadInquiries(); // Refresh the table
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to create order.");
      }
    } catch (error) {
      console.error("Error creating custom order:", error);
      document.getElementById("approveAlertMessage").innerHTML =
        `<div class="alert alert-danger small shadow-sm"><i class="bi bi-exclamation-triangle-fill me-1"></i> Error: ${error.message}</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });

// --- 5. Load Ongoing Projects Logic ---
async function loadProjects() {
  const tableBody = document.getElementById("projectsTableBody");
  const token = localStorage.getItem("authToken");

  tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted"><div class="spinner-border spinner-border-sm text-warning me-2"></div>Loading projects...</td></tr>`;

  try {
    // ඔයාගේ ProjectController එකේ Projects ගන්න Endpoint එක මෙතන දාන්න
    const response = await fetch("http://localhost:8080/api/v1/projects/all", {
      headers: { Authorization: token ? "Bearer " + token : "" },
    });

    const result = await response.json();
    tableBody.innerHTML = "";

    if (response.ok && result.data && result.data.length > 0) {
      result.data.forEach((project) => {
        // Backend එකෙන් එන ID එක (project.id හෝ project.projectId)
        const projectId = project.id || project.projectId;
        const progressVal = project.currentProgress || 0; // දැනට තියෙන ප්‍රතිශතය

        const row = `
                    <tr>
                        <td class="align-middle text-muted fw-bold ps-4">#PRJ-${projectId}</td>
                        <td class="align-middle">
                            <strong class="text-dark">${project.customerName}</strong>
                        </td>
                        <td class="align-middle">
                            <span class="badge bg-secondary">${project.modelName}</span>
                        </td>
                        <td class="align-middle">
                            <div class="d-flex align-items-center">
                                <div class="progress flex-grow-1 me-2" style="height: 8px;">
                                    <div class="progress-bar bg-warning" role="progressbar" style="width: ${progressVal}%" aria-valuenow="${progressVal}" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                                <span class="small fw-bold text-muted">${progressVal}%</span>
                            </div>
                        </td>
                        <td class="align-middle text-center pe-4">
                            <button onclick="openProgressModal('${projectId}', '${project.customerName} - ${project.modelName}')" class="btn btn-sm btn-dark shadow-sm rounded-pill px-3">
                                <i class="bi bi-plus-circle me-1"></i>Add Update
                            </button>
                        </td>
                    </tr>`;
        tableBody.innerHTML += row;
      });
    } else {
      tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-muted"><i class="bi bi-cone-striped fs-3 d-block mb-2"></i>No ongoing projects found.</td></tr>`;
    }
  } catch (error) {
    console.error("Error fetching projects:", error);
    tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-5 text-danger">Failed to load projects data.</td></tr>`;
  }
}

// --- 6. Progress Modal Logic ---
function openProgressModal(projectId, projectTitle) {
  document.getElementById("updateProjectId").value = projectId;
  document.getElementById("updateProjectName").value = projectTitle;
  document.getElementById("updateMessage").value = "";
  document.getElementById("updatePercentage").value = "";
  document.getElementById("updateImageUrl").value = "";
  document.getElementById("progressAlertMessage").innerHTML = "";

  new bootstrap.Modal(document.getElementById("progressModal")).show();
}

document
  .getElementById("progressForm")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault();
    const submitBtn = document.getElementById("saveProgressBtn");
    const originalBtnText = submitBtn.innerHTML;

    submitBtn.disabled = true;
    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Saving Update...';

    // මේ Data ටික ඔයාගේ ProgressUpdateDTO එකට ගැලපෙන්න ඕනේ
    const progressData = {
      projectId: parseInt(document.getElementById("updateProjectId").value),
      updateMessage: document.getElementById("updateMessage").value,
      completionPercentage: parseInt(
        document.getElementById("updatePercentage").value,
      ),
      imageUrl: document.getElementById("updateImageUrl").value,
    };

    const token = localStorage.getItem("authToken");

    try {
      // ඔයාගේ ProgressUpdateController එකේ Endpoint එක
      const response = await fetch(
        "http://localhost:8080/api/v1/progress/add",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: token ? "Bearer " + token : "",
          },
          body: JSON.stringify(progressData),
        },
      );

      const result = await response.json();
      const alertBox = document.getElementById("progressAlertMessage");

      if (response.ok) {
        alertBox.innerHTML = `<div class="alert alert-success small shadow-sm"><i class="bi bi-check-circle-fill me-1"></i> Progress updated successfully!</div>`;
        setTimeout(() => {
          bootstrap.Modal.getInstance(
            document.getElementById("progressModal"),
          ).hide();
          loadProjects(); // Table එක Refresh කරනවා අලුත් % එක පේන්න
        }, 2000);
      } else {
        throw new Error(result.message || "Failed to update progress.");
      }
    } catch (error) {
      console.error("Error updating progress:", error);
      document.getElementById("progressAlertMessage").innerHTML =
        `<div class="alert alert-danger small shadow-sm"><i class="bi bi-exclamation-triangle-fill me-1"></i> Error: ${error.message}</div>`;
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
