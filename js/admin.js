document
  .getElementById("addModelForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();

    const modelData = {
      modelName: document.getElementById("modelName").value,
      description: document.getElementById("description").value,
      estimatedCost: parseFloat(document.getElementById("estimatedCost").value),
      floorArea: parseFloat(document.getElementById("floorArea").value),
      numBedrooms: parseInt(document.getElementById("numBedrooms").value),
      modelUrl: document.getElementById("modelUrl").value,
      imgUrl: document.getElementById("imgUrl").value,
    };

    const apiUrl = "http://localhost:8080/api/v1/models/add";

    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(modelData),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((result) => {
        const alertBox = document.getElementById("alertMessage");
        alertBox.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <strong>Success!</strong> ${result.message || "Model added successfully!"}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        document.getElementById("addModelForm").reset();
      })
      .catch((error) => {
        console.error("Error adding model:", error);
        const alertBox = document.getElementById("alertMessage");
        alertBox.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Error!</strong> Failed to save the model. Is the Spring Boot server running?
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
      });
  });

document.addEventListener("DOMContentLoaded", () => {
  loadInquiries();
});

function loadInquiries() {
  fetch("http://localhost:8080/api/v1/inquiries/all")
    .then((response) => response.json())
    .then((result) => {
      const tableBody = document.getElementById("inquiriesTableBody");
      tableBody.innerHTML = "";

      if (result.status === 200 && result.data.length > 0) {
        result.data.forEach((inquiry) => {
          const date = new Date(inquiry.submittedAt).toLocaleDateString();

          const row = `
                        <tr>
                            <td class="align-middle text-muted small">${date}</td>
                            <td class="align-middle">
                                <fw-bold>${inquiry.customerName}</fw-bold><br>
                                <small class="text-primary">${inquiry.customerPhone}</small><br>
                                <small class="text-muted">${inquiry.customerEmail}</small>
                            </td>
                            <td class="align-middle fw-semibold">${inquiry.modelName}</td>
                            <td class="align-middle small">${inquiry.message || "-"}</td>
                            <td class="align-middle">
                                <a href="mailto:${inquiry.customerEmail}" class="btn btn-sm btn-success">Reply</a>
                            </td>
                        </tr>
                    `;
          tableBody.innerHTML += row;
        });
      } else {
        tableBody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No inquiries found.</td></tr>`;
      }
    })
    .catch((error) => {
      console.error("Error fetching inquiries:", error);
      document.getElementById("inquiriesTableBody").innerHTML =
        `<tr><td colspan="5" class="text-center py-4 text-danger">Failed to load data.</td></tr>`;
    });
}
