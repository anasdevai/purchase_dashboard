const token = "67605ded8a78451c13aa473f0bf6ed401eb3f795fb029d2b";
const apiBaseUrl = "http://127.0.0.1:4000";
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

const run = async () => {
  try {
    console.log(`Submitting mock signature to token ${token} WITH Authorization header...`);
    const formData = new FormData();
    formData.append("signature", new Blob([tinyPng], { type: "image/png" }), "signature.png");

    const response = await fetch(`${apiBaseUrl}/api/contracts/public/signature/${token}`, {
      method: "POST",
      body: formData,
      headers: {
        "Authorization": "Bearer invalid-token-value-here"
      }
    });

    console.log("Status:", response.status);
    console.log("Response Text:", await response.text());
  } catch (error: any) {
    console.error("Fetch error:", error);
  }
};

run();
