document.addEventListener("DOMContentLoaded", () => {
  const projectId = 1;
  loadProgress(projectId);
});

function loadProgress(projectId) {
  fetch(`http://localhost:8080/api/v1/progress/project/${projectId}`)
    .then((response) => response.json())
    .then((result) => {
      const timeline = document.getElementById("progressTimeline");
      const totalProgressLabel = document.getElementById("totalProgress");

      timeline.innerHTML = "";

      if (result.status === 200 && result.data.length > 0) {
        totalProgressLabel.innerText = result.data[0].percentageComplete;

        result.data.forEach((update) => {
          const date = new Date(update.updateTime).toLocaleString();

          const updateHtml = `
                        <div class="card border-0 shadow-sm mb-4 progress-card">
                            <div class="card-body p-4">
                                <div class="d-flex justify-content-between align-items-start mb-3">
                                    <div>
                                        <h5 class="fw-bold text-dark mb-1">${update.description}</h5>
                                        <small class="text-muted"><i class="bi bi-clock"></i> ${date}</small>
                                    </div>
                                    <span class="badge bg-primary rounded-pill px-3 py-2">${update.percentageComplete}% Done</span>
                                </div>
                                
                                ${
                                  update.photoUrl
                                    ? `
                                    <div class="mt-3">
                                        <img src="${update.photoUrl}" class="update-img shadow-sm" alt="Site Progress">
                                    </div>
                                `
                                    : ""
                                }

                                <div class="progress mt-4" style="height: 8px;">
                                    <div class="progress-bar bg-success" role="progressbar" 
                                         style="width: ${update.percentageComplete}%" 
                                         aria-valuenow="${update.percentageComplete}" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                            </div>
                        </div>
                    `;
          timeline.innerHTML += updateHtml;
        });
      } else {
        timeline.innerHTML = `
                    <div class="alert alert-info text-center border-0 shadow-sm">
                        No progress updates found for this project yet.
                    </div>`;
      }
    })
    .catch((error) => {
      console.error("Error:", error);
      document.getElementById("progressTimeline").innerHTML =
        '<p class="text-danger">Error loading progress data.</p>';
    });
}
