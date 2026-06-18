import dotenv from "dotenv";
dotenv.config();

const base = "http://localhost:4000";

async function login() {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@example.com", password: "Admin123456" }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${JSON.stringify(data)}`);
  return data.token;
}

async function main() {
  const token = await login();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "X-App-Language": "en",
  };

  const payload = {
    customerName: "Test Customer",
    customerPhone: "+43 660 1234567",
    customerEmail: "test@example.com",
    paymentStatus: "Open",
    items: [
      {
        description: "Screen repair",
        quantity: 1,
        unitPrice: 120,
        vatPercent: 20,
      },
    ],
  };

  console.log("Creating invoice...");
  const createRes = await fetch(`${base}/api/invoices?lang=en`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  const createText = await createRes.text();
  console.log("Create status:", createRes.status);
  console.log("Create body:", createText.slice(0, 500));

  if (!createRes.ok) return;

  const { invoice } = JSON.parse(createText);
  console.log("Invoice id:", invoice.id);
  console.log("pdfPath:", invoice.pdfPath);

  if (!invoice.pdfPath) {
    console.log("Generating PDF...");
    const pdfRes = await fetch(`${base}/api/invoices/${invoice.id}/pdf?lang=en`, {
      method: "POST",
      headers,
    });
    const pdfText = await pdfRes.text();
    console.log("PDF gen status:", pdfRes.status);
    console.log("PDF gen body:", pdfText.slice(0, 500));
  }

  const openRes = await fetch(`${base}/api/invoices/${invoice.id}/pdf?lang=en`, {
    headers: { Authorization: `Bearer ${token}`, "X-App-Language": "en" },
  });
  console.log("Open PDF status:", openRes.status, "content-type:", openRes.headers.get("content-type"));
  const buf = await openRes.arrayBuffer();
  console.log("Open PDF bytes:", buf.byteLength);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
