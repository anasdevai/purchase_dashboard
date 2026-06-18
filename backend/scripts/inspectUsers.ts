const testDashboardApi = async () => {
  try {
    const loginRes = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@admin.com",
        password: "admin123"
      })
    });
    const loginData = await loginRes.json() as any;
    const token = loginData.token;
    console.log("Logged in! Token obtained.");
    const dashboardRes = await fetch("http://localhost:4000/api/dashboard", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dashboardData = await dashboardRes.json();
    console.log("Dashboard response:", dashboardData);
  } catch (err: any) {
    console.error("Error:", err.message);
  }
};

testDashboardApi();
