import { withWriteConnection } from "@/lib/database-connection";
import {
  TYPE_MAP_COMPLAINT,
  PRIORITIES,
  ComplaintCategoryLabels,
  PriorityLabels,
} from "./constants";
import { findClientWithPropertyProduction } from "./clients";
import { sendComplaintRequestToCs } from "../staff-notifications/services";
import { generateRequestDisplayId } from "../../requests/actions";

export async function createComplaintProduction(
  phoneNumber,
  description,
  session
) {
  return withWriteConnection(async (prisma) => {
    const clientData = await findClientWithPropertyProduction(phoneNumber);
    if (!clientData.success || !clientData.client) {
      return {
        success: false,
        message: "CLIENT_NOT_FOUND",
        data: null,
        error: "CLIENT_NOT_FOUND",
      };
    }

    const { client, property, unit } = clientData;
    const displayId = await generateRequestDisplayId({
      model: "complaint",
      date: new Date(),
    });

    const inputCategory = (session?.data?.category || "other").toLowerCase();
    const mappedCategory = TYPE_MAP_COMPLAINT[inputCategory] || "OTHER";

    let priority = (session?.data?.priority || "MEDIUM").toUpperCase();
    if (!PRIORITIES.includes(priority)) {
      const map = {
        urgent: "URGENT",
        high: "HIGH",
        medium: "MEDIUM",
        low: "LOW",
      };
      priority = map[(session?.data?.priority || "").toLowerCase()] || "MEDIUM";
    }

    const complaint = await prisma.complaint.create({
      data: {
        displayId,
        clientId: client.id,
        propertyId: property?.id || null,
        unitId: unit?.id || null,
        description,
        type: mappedCategory,
        priority,
        status: "PENDING",
      },
      include: { client: true, property: true, unit: true },
    });

    try {
      await sendComplaintRequestToCs({
        requestId: complaint.id,
        clientName: client.name,
        displayId: complaint.displayId,
        priority: PriorityLabels[complaint.priority].ar,
        complaintType: ComplaintCategoryLabels[complaint.type].ar,
        description: description,
        clientPhone: phoneNumber,
        propertyName: property?.name || "غير محدد",
        displayId: complaint.displayId,
        unitNumber:
          unit?.number ||
          unit?.unitId ||
          (unit?.floor ? `الطابق ${unit.floor}` : "غير محدد"),
        requestDate: new Date(),
        type: "COMPLAINT",
      });
    } catch (e) {
      console.warn("Complaint notifications failed:", e?.message);
    }

    return { success: true, data: { complaint, client, property, unit } };
  });
}
