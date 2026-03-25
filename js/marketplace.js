// පිටුව Load වුණ ගමන් fetchModels function එක run වෙනවා
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
      // අපේ APIResponse එකේ data කොටස ඇතුළේ තමයි models තියෙන්නේ
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
  container.innerHTML = ""; // Loading spinner එක අයින් කරනවා

  if (models.length === 0) {
    container.innerHTML = `<p class="text-center w-100">No 3D models available in the marketplace right now.</p>`;
    return;
  }

  // හැම Model එකක් සඳහාම Card එකක් හදනවා
  models.forEach((model) => {
    // අංක වලට කොමා දාන්න (උදා: 8500000 -> 8,500,000)
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
                        
                        <button class="btn btn-dark w-100 mt-3 fw-semibold">Request to Build</button>
                    </div>
                </div>
            </div>
        `;

    // හදපු Card එක HTML එකට එකතු කරනවා
    container.innerHTML += cardHtml;
  });
}

function unifiedSearch() {
  const name = document.getElementById("nameSearch").value;
  const price = document.getElementById("priceSearch").value;
  const bedrooms = document.getElementById("bedroomSearch").value;
  const container = document.getElementById("models-container");

  // Loading එක පෙන්වන්න
  container.innerHTML = `
        <div class="text-center text-primary w-100">
            <div class="spinner-border" role="status"></div>
            <p class="mt-2">Filtering models...</p>
        </div>`;

  // URL එක dynamic විදිහට හදාගන්නවා
  // ඔයාගේ API path එක /api/v1/models/search නිසා ඒක පාවිච්චි කරනවා
  let url = new URL("http://localhost:8080/api/v1/models/search");

  if (name) url.searchParams.append("name", name);
  if (price) url.searchParams.append("maxPrice", price);
  if (bedrooms) url.searchParams.append("minBedrooms", bedrooms);

  fetch(url)
    .then((response) => response.json())
    .then((result) => {
      if (result.status === 200) {
        displayModels(result.data); // අපි කලින් හදපු function එකම පාවිච්චි කරලා ප්‍රතිඵල පෙන්වනවා
      } else {
        console.error("Search failed:", result.message);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      container.innerHTML = `<p class="text-danger text-center w-100">Error connecting to server.</p>`;
    });
}
