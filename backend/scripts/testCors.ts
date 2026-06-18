const apiBaseUrl = "http://127.0.0.1:4000";

const run = async () => {
  try {
    console.log("Sending OPTIONS preflight request with Origin: http://localhost:5174...");
    const response = await fetch(`${apiBaseUrl}/api/contracts/public/signature/67605ded8a78451c13aa473f0bf6ed401eb3f795fb029d2b`, {
      method: "OPTIONS",
      headers: {
        "Origin": "http://localhost:5174",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "Content-Type"
      }
    });

    console.log("Status:", response.status);
    console.log("Access-Control-Allow-Origin:", response.headers.get("access-control-allow-origin"));
    console.log("Access-Control-Allow-Methods:", response.headers.get("access-control-allow-methods"));
    console.log("Access-Control-Allow-Headers:", response.headers.get("access-control-allow-headers"));
  } catch (error: any) {
    console.error("Fetch error:", error);
  }
};

run();
