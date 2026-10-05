(function () {
  function getGitHubUser() {
    const raw = localStorage.getItem("decap-cms-user");

    if (!raw) {
      alert("Please login to GitHub first.");
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch (e) {
      alert("GitHub login information could not be read.");
      return null;
    }
  }

  async function uploadFile(file) {
    const user = getGitHubUser();
    if (!user || !user.token) return;

    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];

    if (!allowed.includes(file.type)) {
      alert("Only PDF and DOCX files are allowed.");
      return;
    }

    const reader = new FileReader();

    reader.onload = async function () {
      try {
        const base64 = reader.result.split(",")[1];

        const path = `uploads/${file.name}`;

        const response = await fetch(
          `https://api.github.com/repos/gttracker/globalterrorismtracker.com/contents/${encodeURIComponent(path)}`,
          {
            method: "PUT",
            headers: {
              "Authorization": `Bearer ${user.token}`,
              "Accept": "application/vnd.github+json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              message: `Upload ${file.name}`,
              content: base64,
              branch: "main"
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          console.error(data);
          alert("Upload failed: " + (data.message || "Unknown error"));
          return;
        }

        alert("File uploaded successfully.");

        return `/uploads/${file.name}`;

      } catch (error) {
        console.error(error);
        alert("Upload failed.");
      }
    };

    reader.readAsDataURL(file);
  }

  window.GTTUploadFile = uploadFile;
})();
