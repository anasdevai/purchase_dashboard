const apiBaseUrl = "http://127.0.0.1:4000";
const email = `pdf-test-${Date.now()}@example.com`;
const password = "Test12345!";
const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
  "base64"
);

const api = async <T>(path: string, options: RequestInit = {}, token?: string): Promise<T> => {
  const headers = new Headers(options.headers);
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${apiBaseUrl}${path}`, { ...options, headers });
  if (!response.ok) {
    throw new Error(`${response.status} ${await response.text()}`);
  }
  return response.json() as Promise<T>;
};

const uploadPng = async (contractId: string, token: string, fieldName: string, route: "files" | "signature") => {
  const formData = new FormData();
  if (route === "files") {
    formData.append("fileType", fieldName);
    formData.append("file", new Blob([tinyPng], { type: "image/png" }), `${fieldName}.png`);
  } else {
    formData.append("role", fieldName);
    formData.append("signature", new Blob([tinyPng], { type: "image/png" }), `${fieldName}.png`);
  }

  await api(`/api/contracts/${contractId}/${route === "files" ? "files" : "signature"}`, {
    method: "POST",
    body: formData
  }, token);
};

const run = async () => {
  await api("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name: "PDF Test", email, password })
  });
  const login = await api<{ token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  const draft = await api<{ contract: { id: string; contractNumber: string } }>("/api/contracts/draft", {
    method: "POST",
    body: JSON.stringify({
      salutation: "Mr",
      customerFirstName: "PDF",
      customerLastName: "Test Customer",
      customerStreet: "123 Test Street",
      customerZipCode: "1234",
      customerCity: "Vienna",
      customerPhone: "03202031783",
      customerEmail: "customer@example.com",
      deviceType: "Smartphone",
      brand: "Apple",
      model: "iPhone 13",
      imei: Math.floor(100000000000000 + Math.random() * 900000000000000).toString(),
      serialNumber: "SN" + Math.floor(Math.random() * 1000000000).toString(),
      storage: "128GB",
      color: "Black",
      condition: "Like new",
      icloudStatus: "Unlocked",
      purchasePrice: 500,
      paymentMethod: "Cash",
      ownershipConfirmed: true,
      notStolenConfirmed: true,
      icloudRemoved: true,
      googleLockRemoved: true,
      otherLockRemoved: true,
      factoryResetConfirmed: true
    })
  }, login.token);

  for (const fileType of ["id_front", "device_front", "device_back"]) {
    await uploadPng(draft.contract.id, login.token, fileType, "files");
  }
  await uploadPng(draft.contract.id, login.token, "customer", "signature");
  await uploadPng(draft.contract.id, login.token, "shopkeeper", "signature");

  const completed = await api<{ contract: { id: string; contractNumber: string; pdfPath: string | null } }>(
    `/api/contracts/${draft.contract.id}/complete`,
    { method: "POST", body: JSON.stringify({}) },
    login.token
  );

  console.log(JSON.stringify(completed.contract, null, 2));

  await api(`/api/contracts/${draft.contract.id}/cancel`, { method: "POST" }, login.token);
};

run();
