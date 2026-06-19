import { prisma } from "../config/prisma.js";
import { HttpError } from "../utils/httpError.js";
import { createCustomerSchema, updateCustomerSchema } from "../validators/customerValidators.js";
import { generateCustomersPdf } from "./pdfService.js";
import { getShopSettingsForUser, shopSettingsToPdf } from "./settingsService.js";

const getFirstAndLastName = (name?: string | null) => {
  if (!name) return { firstName: "", lastName: "" };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
};

const splitAddress = (address?: string | null) => {
  let street = address || "";
  let zipCode = "";
  let city = "";
  if (address) {
    const addressParts = address.split(",");
    if (addressParts.length >= 2) {
      street = addressParts[0].trim();
      const zipCityParts = addressParts[1].trim().split(/\s+/);
      if (zipCityParts.length >= 2) {
        zipCode = zipCityParts[0].trim();
        city = zipCityParts.slice(1).join(" ").trim();
      } else {
        city = addressParts[1].trim();
      }
    }
  }
  return { street, zipCode, city };
};

export const searchCustomers = async (userId: string, query: string) => {
  return prisma.customer.findMany({
    where: {
      userId,
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { customerNumber: { contains: query, mode: "insensitive" } }
      ]
    },
    orderBy: { name: "asc" },
    take: 50
  });
};

export const getCustomerList = async (userId: string, page = 1, limit = 15, query = "") => {
  const skip = (page - 1) * limit;

  const filter: any = { userId };
  if (query.trim()) {
    filter.OR = [
      { name: { contains: query, mode: "insensitive" } },
      { phone: { contains: query, mode: "insensitive" } },
      { email: { contains: query, mode: "insensitive" } },
      { customerNumber: { contains: query, mode: "insensitive" } },
      { company: { contains: query, mode: "insensitive" } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where: filter,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.customer.count({
      where: filter,
    }),
  ]);

  return {
    customers,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const createCustomer = async (userId: string, input: Record<string, unknown>) => {
  const parsed = createCustomerSchema.parse(input);

  const count = await prisma.customer.count({ where: { userId } });
  const customerNumber = `CUST-${10001 + count}`;
  const name = `${parsed.firstName} ${parsed.lastName}`.trim();
  const address = `${parsed.street}, ${parsed.zipCode} ${parsed.city}`.trim();

  // Deduplicate check
  const existing = await prisma.customer.findFirst({
    where: {
      userId,
      name,
      phone: parsed.phone,
    }
  });

  if (existing) {
    return existing;
  }

  return prisma.customer.create({
    data: {
      userId,
      customerNumber,
      salutation: parsed.salutation || null,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      company: parsed.company || null,
      vatId: parsed.vatId || null,
      street: parsed.street,
      zipCode: parsed.zipCode,
      city: parsed.city,
      dateOfBirth: parsed.dateOfBirth || null,
      newsletter: parsed.newsletter || false,
      notes: parsed.notes || null,
      name,
      phone: parsed.phone,
      email: parsed.email,
      address,
    }
  });
};

export const getCustomerOrThrow = async (id: string, userId: string) => {
  const customer = await prisma.customer.findFirst({
    where: { id, userId }
  });

  if (!customer) {
    throw new HttpError(404, "Customer not found");
  }

  return customer;
};

export const updateCustomer = async (userId: string, id: string, input: Record<string, unknown>) => {
  const customer = await getCustomerOrThrow(id, userId);
  const parsed = updateCustomerSchema.parse(input);

  const firstName = parsed.firstName !== undefined ? parsed.firstName : customer.firstName;
  const lastName = parsed.lastName !== undefined ? parsed.lastName : customer.lastName;
  const name = `${firstName || ""} ${lastName || ""}`.trim() || customer.name;

  const street = parsed.street !== undefined ? parsed.street : customer.street;
  const zipCode = parsed.zipCode !== undefined ? parsed.zipCode : customer.zipCode;
  const city = parsed.city !== undefined ? parsed.city : customer.city;
  const address = street && zipCode && city ? `${street}, ${zipCode} ${city}`.trim() : customer.address;

  return prisma.customer.update({
    where: { id: customer.id },
    data: {
      salutation: parsed.salutation !== undefined ? parsed.salutation : customer.salutation,
      firstName: firstName || null,
      lastName: lastName || null,
      company: parsed.company !== undefined ? parsed.company : customer.company,
      vatId: parsed.vatId !== undefined ? parsed.vatId : customer.vatId,
      street: street || null,
      zipCode: zipCode || null,
      city: city || null,
      dateOfBirth: parsed.dateOfBirth !== undefined ? parsed.dateOfBirth : customer.dateOfBirth,
      newsletter: parsed.newsletter !== undefined ? parsed.newsletter : customer.newsletter,
      notes: parsed.notes !== undefined ? parsed.notes : customer.notes,
      name,
      phone: parsed.phone !== undefined ? parsed.phone : customer.phone,
      email: parsed.email !== undefined ? parsed.email : customer.email,
      address,
    }
  });
};

export const deleteCustomer = async (userId: string, id: string) => {
  const customer = await getCustomerOrThrow(id, userId);
  await prisma.customer.delete({
    where: { id: customer.id }
  });
  return { success: true };
};

export const mergeCustomers = async (userId: string, keepCustomerId: string, mergeCustomerId: string) => {
  const keep = await getCustomerOrThrow(keepCustomerId, userId);
  const merge = await getCustomerOrThrow(mergeCustomerId, userId);

  if (keep.id === merge.id) {
    throw new HttpError(400, "Cannot merge a customer into itself");
  }

  // Relink contracts
  await prisma.contract.updateMany({
    where: { customerId: merge.id, userId },
    data: { customerId: keep.id }
  });

  // Relink invoices
  await prisma.invoice.updateMany({
    where: { customerId: merge.id, userId },
    data: { customerId: keep.id }
  });

  // Relink repair orders
  await prisma.repairOrder.updateMany({
    where: { customerId: merge.id, userId },
    data: { customerId: keep.id }
  });

  // Relink quotations
  await prisma.quotation.updateMany({
    where: { customerId: merge.id, userId },
    data: { customerId: keep.id }
  });

  // Delete merged duplicate
  await prisma.customer.delete({
    where: { id: merge.id }
  });

  return keep;
};

export const getCustomerDetailsWithHistory = async (userId: string, id: string) => {
  const customer = await getCustomerOrThrow(id, userId);

  // Retrieve transactional history
  const [contracts, invoices, repairOrders, quotations] = await Promise.all([
    prisma.contract.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          { userId, customerEmail: customer.email, customerPhone: customer.phone }
        ]
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.invoice.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          { userId, customerEmail: customer.email, customerPhone: customer.phone }
        ]
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.repairOrder.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          { userId, customerEmail: customer.email, customerPhone: customer.phone }
        ]
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.quotation.findMany({
      where: {
        OR: [
          { customerId: customer.id },
          { userId, customerEmail: customer.email, customerPhone: customer.phone }
        ]
      },
      orderBy: { createdAt: "desc" }
    })
  ]);

  // Extract unique devices
  const devicesMap = new Map<string, any>();

  for (const ro of repairOrders) {
    if (ro.model) {
      const key = `${ro.brand || ""}_${ro.model}_${ro.imeiOrSerial || ""}`.toLowerCase();
      if (!devicesMap.has(key)) {
        devicesMap.set(key, {
          brand: ro.brand || "",
          model: ro.model,
          imeiOrSerial: ro.imeiOrSerial || "",
          deviceType: ro.deviceType || "Repair",
          source: "Repair Order",
          createdAt: ro.createdAt,
        });
      }
    }
  }

  for (const c of contracts) {
    if (c.model) {
      const key = `${c.brand || ""}_${c.model}_${c.imei || c.serialNumber || ""}`.toLowerCase();
      if (!devicesMap.has(key)) {
        devicesMap.set(key, {
          brand: c.brand || "",
          model: c.model,
          imeiOrSerial: c.imei || c.serialNumber || "",
          deviceType: c.deviceType || "Purchase",
          source: "Contract",
          createdAt: c.createdAt,
        });
      }
    }
  }

  const devices = Array.from(devicesMap.values());

  return {
    customer,
    history: {
      contracts,
      invoices,
      repairOrders,
      quotations,
      devices,
    }
  };
};

export const exportCustomersData = async (userId: string, format = "csv") => {
  const customers = await prisma.customer.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" }
  });

  if (format === "csv") {
    const headers = [
      "Customer Number",
      "Salutation",
      "First Name",
      "Last Name",
      "Company",
      "VAT ID",
      "Street",
      "ZIP Code",
      "City",
      "Phone",
      "Email",
      "Date of Birth",
      "Newsletter",
      "Notes"
    ];

    const rows = customers.map((c) => [
      c.customerNumber || "",
      c.salutation || "",
      c.firstName || "",
      c.lastName || "",
      c.company || "",
      c.vatId || "",
      c.street || "",
      c.zipCode || "",
      c.city || "",
      c.phone || "",
      c.email || "",
      c.dateOfBirth ? new Date(c.dateOfBirth).toISOString().split("T")[0] : "",
      c.newsletter ? "Yes" : "No",
      (c.notes || "").replace(/"/g, '""').replace(/\n/g, " ")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((val) => `"${val}"`).join(","))
    ].join("\n");

    return {
      contentType: "text/csv",
      filename: `customers_export_${new Date().toISOString().split("T")[0]}.csv`,
      data: csvContent as string | Buffer
    };
  }

  if (format === "pdf") {
    const rawSettings = await getShopSettingsForUser(userId);
    const shopSettings = rawSettings ? shopSettingsToPdf(rawSettings) : undefined;
    const pdfBuffer = await generateCustomersPdf(
      customers.map((c) => ({
        customerNumber: c.customerNumber,
        salutation: c.salutation,
        firstName: c.firstName,
        lastName: c.lastName,
        name: c.name,
        company: c.company,
        street: c.street,
        zipCode: c.zipCode,
        city: c.city,
        phone: c.phone,
        email: c.email,
        newsletter: c.newsletter,
        createdAt: c.createdAt
      })),
      shopSettings ?? undefined
    );

    return {
      contentType: "application/pdf",
      filename: `customers_export_${new Date().toISOString().split("T")[0]}.pdf`,
      data: pdfBuffer as string | Buffer
    };
  }

  throw new HttpError(400, `Unsupported export format: ${format}`);
};

export const findOrCreateCustomerForRepair = async (
  userId: string,
  name: string,
  phone: string,
  email?: string | null,
  address?: string | null
) => {
  const existing = await prisma.customer.findFirst({
    where: {
      userId,
      name,
      phone
    }
  });

  if (existing) {
    if ((email && !existing.email) || (address && !existing.address)) {
      return prisma.customer.update({
        where: { id: existing.id },
        data: {
          email: email || existing.email,
          address: address || existing.address
        }
      });
    }
    return existing;
  }

  // Split names and addresses
  const { firstName, lastName } = getFirstAndLastName(name);
  const { street, zipCode, city } = splitAddress(address);
  const count = await prisma.customer.count({ where: { userId } });
  const customerNumber = `CUST-${10001 + count}`;

  return prisma.customer.create({
    data: {
      userId,
      customerNumber,
      firstName,
      lastName,
      street,
      zipCode,
      city,
      name,
      phone,
      email: email || null,
      address: address || null
    }
  });
};
