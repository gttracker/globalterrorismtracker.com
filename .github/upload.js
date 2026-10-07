(function () {
  const ALLOWED_TYPES = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  const ALLOWED_EXTENSIONS = [".pdf", ".docx"];

  function getGitHubUser() {
    const raw = localStorage.getItem("decap-cms-user");

    if (!raw) {
      throw new Error("Please login to GitHub first.");
    }

    const user = JSON.parse(raw);

    if (!user.token) {
      throw new Error("GitHub authentication token not found.");
    }

    return user;
  }

  function isAllowedFile(file) {
    const name = file.name.toLowerCase();

    return (
      ALLOWED_TYPES.includes(file.type) ||
      ALLOWED_EXTENSIONS.some(ext => name.endsWith(ext))
    );
  }

  function uploadFile(file) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!isAllowedFile(file)) {
          throw new Error("Only PDF and DOCX files are allowed.");
        }

        const user = getGitHubUser();

        const reader = new FileReader();

        reader.onload = async function () {
          try {
            const base64 = reader.result.split(",")[1];

            const path = `uploads/${file.name}`;

            const response = await fetch(
              `https://api.github.com/repos/gttracker/globalterrorismtracker.com/contents/${path
                .split("/")
                .map(encodeURIComponent)
                .join("/")}`,
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

              throw new Error(
                data.message || "GitHub upload failed."
              );
            }

            resolve(`/uploads/${file.name}`);

          } catch (error) {
            reject(error);
          }
        };

        reader.onerror = function () {
          reject(new Error("Could not read the selected file."));
        };

        reader.readAsDataURL(file);

      } catch (error) {
        reject(error);
      }
    });
  }


  /*
   * Decap CMS custom widget
   */

  const FileControl = createClass({

    getInitialState: function () {
      return {
        uploading: false,
        error: null
      };
    },


    handleFile: async function (event) {

      const file = event.target.files[0];

      if (!file) {
        return;
      }

      if (!isAllowedFile(file)) {

        this.setState({
          error: "Only PDF and DOCX files are allowed."
        });

        event.target.value = "";

        return;
      }

      this.setState({
        uploading: true,
        error: null
      });

      try {

        const url = await uploadFile(file);

        this.props.onChange(url);

        this.setState({
          uploading: false,
          error: null
        });

      } catch (error) {

        console.error(error);

        this.setState({
          uploading: false,
          error: error.message || "Upload failed."
        });

      }

    },


    render: function () {

      const value = this.props.value;

      return h(
        "div",
        {
          style: {
            padding: "15px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            background: "#fafafa"
          }
        },

        h(
          "input",
          {
            type: "file",
            accept: ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            onChange: this.handleFile
          }
        ),

        this.state.uploading
          ? h(
              "p",
              {
                style: {
                  marginTop: "10px",
                  fontWeight: "bold"
                }
              },
              "Uploading file..."
            )
          : null,

        this.state.error
          ? h(
              "p",
              {
                style: {
                  marginTop: "10px",
                  color: "#c1121f"
                }
              },
              this.state.error
            )
          : null,

        value
          ? h(
              "p",
              {
                style: {
                  marginTop: "10px"
                }
              },
              "Uploaded: ",
              h(
                "strong",
                null,
                value.split("/").pop()
              )
            )
          : null

      );

    }

  });


  const FilePreview = createClass({

    render: function () {

      const value = this.props.value;

      if (!value) {
        return null;
      }

      return h(
        "a",
        {
          href: value,
          target: "_blank",
          rel: "noopener noreferrer"
        },
        "Open uploaded file"
      );

    }

  });


  CMS.registerWidget(
    "gtt-file",
    FileControl,
    FilePreview
  );


  window.GTTUploadFile = uploadFile;

})();
