document
  .getElementById("addModelForm")
  .addEventListener("submit", function (event) {
    // Form එකේ සාමාන්‍ය reload වෙන එක නවත්වනවා
    event.preventDefault();

    // Form එකෙන් දත්ත ටික ගන්නවා
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

    // Backend එකට දත්ත යැවීම
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
        // Success Message එක පෙන්වීම
        const alertBox = document.getElementById("alertMessage");
        alertBox.innerHTML = `
            <div class="alert alert-success alert-dismissible fade show" role="alert">
                <strong>Success!</strong> ${result.message || "Model added successfully!"}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        // Form එක හිස් කිරීම
        document.getElementById("addModelForm").reset();
      })
      .catch((error) => {
        console.error("Error adding model:", error);
        // Error Message එක පෙන්වීම
        const alertBox = document.getElementById("alertMessage");
        alertBox.innerHTML = `
            <div class="alert alert-danger alert-dismissible fade show" role="alert">
                <strong>Error!</strong> Failed to save the model. Is the Spring Boot server running?
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
      });
  });
