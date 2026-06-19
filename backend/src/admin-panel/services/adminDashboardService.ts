import { prisma } from "../../config/prisma.js";
import { getDayRange } from "../../utils/date.js";

const decimalToNumber = (value: { toString: () => string } | number | null | undefined) => {
  if (value === null || value === undefined) return 0;
  const parsed = Number(value.toString());
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * Global admin dashboard — comprehensive stats across all users.
 */
export const getGlobalDashboard = async () => {
  const range = getDayRange();
  const todayFilter = range
    ? { createdAt: { gte: range.start, lt: range.end } }
    : {};

  const [
    // User stats
    totalUsers,
    activeUsers,
    inactiveUsers,
    adminUsers,
    staffUsers,

    // Contract stats
    totalContracts,
    contractsToday,
    draftContracts,
    completedContracts,
    cancelledContracts,

    // Invoice stats
    totalInvoices,
    invoicesToday,
    paidInvoices,
    openInvoices,
    cancelledInvoices,

    // Repair order stats
    totalRepairOrders,
    repairOrdersToday,
    openRepairOrders,
    workPendingRepairOrders,
    sentToRepairCompanyOrders,
    appointmentScheduledOrders,
    newRepairOrders,
    receivedRepairOrders,
    inDiagnosisRepairOrders,
    waitingForPartsRepairOrders,
    sparePartArrivedRepairOrders,
    inRepairRepairOrders,
    finishedRepairOrders,
    readyForPickupRepairOrders,
    completedRepairOrders,
    cancelledRepairOrders,

    // Revenue
    totalRevenueInvoices,
    todayRevenueInvoices,

    // Purchase totals
    totalPurchaseAmount,
    todayPurchaseAmount,

    // Recent users
    recentUsers,
  ] = await Promise.all([
    // User stats
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.user.count({ where: { role: "staff" } }),

    // Contract stats
    prisma.contract.count(),
    prisma.contract.count({ where: todayFilter }),
    prisma.contract.count({ where: { status: "Draft" } }),
    prisma.contract.count({ where: { status: "Completed" } }),
    prisma.contract.count({ where: { status: "Cancelled" } }),

    // Invoice stats
    prisma.invoice.count(),
    prisma.invoice.count({ where: todayFilter }),
    prisma.invoice.count({ where: { paymentStatus: "Paid" } }),
    prisma.invoice.count({ where: { paymentStatus: "Open" } }),
    prisma.invoice.count({ where: { paymentStatus: "Cancelled" } }),

    // Repair order stats
    prisma.repairOrder.count(),
    prisma.repairOrder.count({ where: todayFilter }),
    prisma.repairOrder.count({ where: { status: "Open" } }),
    prisma.repairOrder.count({ where: { status: "WorkPending" } }),
    prisma.repairOrder.count({ where: { status: "SentToRepairCompany" } }),
    prisma.repairOrder.count({ where: { status: "AppointmentScheduled" } }),
    prisma.repairOrder.count({ where: { status: "New" } }),
    prisma.repairOrder.count({ where: { status: "Received" } }),
    prisma.repairOrder.count({ where: { status: "InDiagnosis" } }),
    prisma.repairOrder.count({ where: { status: "WaitingForParts" } }),
    prisma.repairOrder.count({ where: { status: "SparePartArrived" } }),
    prisma.repairOrder.count({ where: { status: "InRepair" } }),
    prisma.repairOrder.count({ where: { status: "Finished" } }),
    prisma.repairOrder.count({ where: { status: "ReadyForPickup" } }),
    prisma.repairOrder.count({ where: { status: "Completed" } }),
    prisma.repairOrder.count({ where: { status: "Cancelled" } }),

    // Revenue (all paid invoices gross total)
    prisma.invoice.findMany({
      where: { paymentStatus: "Paid" },
      select: { calculatedGrossTotal: true, grossTotalOverride: true },
    }),
    prisma.invoice.findMany({
      where: { paymentStatus: "Paid", ...todayFilter },
      select: { calculatedGrossTotal: true, grossTotalOverride: true },
    }),

    // Purchase amounts
    prisma.contract.aggregate({
      where: { status: "Completed" },
      _sum: { purchasePrice: true },
    }),
    prisma.contract.aggregate({
      where: { status: "Completed", ...todayFilter },
      _sum: { purchasePrice: true },
    }),

    // Recent users
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            contracts: true,
            invoices: true,
            repairOrders: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  const sumGross = (
    invoices: { calculatedGrossTotal: { toString: () => string }; grossTotalOverride: { toString: () => string } | null }[]
  ) =>
    invoices.reduce(
      (sum, inv) =>
        sum + decimalToNumber(inv.grossTotalOverride ?? inv.calculatedGrossTotal),
      0
    );

  return {
    users: {
      total: totalUsers,
      active: activeUsers,
      inactive: inactiveUsers,
      admins: adminUsers,
      staff: staffUsers,
    },
    contracts: {
      total: totalContracts,
      today: contractsToday,
      draft: draftContracts,
      completed: completedContracts,
      cancelled: cancelledContracts,
      totalPurchaseAmount: decimalToNumber(totalPurchaseAmount._sum?.purchasePrice),
      todayPurchaseAmount: decimalToNumber(todayPurchaseAmount._sum?.purchasePrice),
    },
    invoices: {
      total: totalInvoices,
      today: invoicesToday,
      paid: paidInvoices,
      open: openInvoices,
      cancelled: cancelledInvoices,
      totalRevenue: sumGross(totalRevenueInvoices),
      todayRevenue: sumGross(todayRevenueInvoices),
    },
    repairOrders: {
      total: totalRepairOrders,
      today: repairOrdersToday,
      open: openRepairOrders,
      workPending: workPendingRepairOrders,
      sentToRepairCompany: sentToRepairCompanyOrders,
      appointmentScheduled: appointmentScheduledOrders,
      new: newRepairOrders,
      received: receivedRepairOrders,
      inDiagnosis: inDiagnosisRepairOrders,
      waitingForParts: waitingForPartsRepairOrders,
      sparePartArrived: sparePartArrivedRepairOrders,
      inRepair: inRepairRepairOrders,
      finished: finishedRepairOrders,
      readyForPickup: readyForPickupRepairOrders,
      completed: completedRepairOrders,
      cancelled: cancelledRepairOrders,
      inProgress:
        workPendingRepairOrders +
        sentToRepairCompanyOrders +
        appointmentScheduledOrders +
        inDiagnosisRepairOrders +
        waitingForPartsRepairOrders +
        inRepairRepairOrders,
    },
    recentUsers,
  };
};
