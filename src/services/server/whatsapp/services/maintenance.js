import { withWriteConnection } from "@/lib/database-connection";
import {
  TYPE_MAP_MAINT,
  PRIORITIES,
  MaintenanceTypeLabels,
  PriorityLabels,
} from "./constants";
import { findClientWithPropertyProduction } from "./clients";
import {
  sendMaintainceRequestToCS,
  sendMaintainceRequestToTech,
} from "../staff-notifications/services";
import { generateRequestDisplayId } from "../../requests/actions";

export async function createMaintenanceRequestProduction(
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
      model: "maintenanceRequest",
      date: new Date(),
    });
    const inputType = (session?.data?.maintenanceType || "other").toLowerCase();
    const mappedType = TYPE_MAP_MAINT[inputType] || "OTHER";

    let priority = (session?.data?.priority || "MEDIUM").toUpperCase();
    if (!PRIORITIES.includes(priority)) {
      // allow list ids (urgent/high/medium/low)
      const map = {
        urgent: "URGENT",
        high: "HIGH",
        medium: "MEDIUM",
        low: "LOW",
      };
      priority = map[(session?.data?.priority || "").toLowerCase()] || "MEDIUM";
    }

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        displayId,
        clientId: client.id,
        propertyId: property?.id || null,
        unitId: unit?.id || null,
        description,
        type: mappedType,
        priority,
        status: "PENDING",
      },
      include: { client: true, property: true, unit: true },
    });
    try {
      await sendMaintainceRequestToTech({
        requestId: maintenanceRequest.id,
        clientName: client.name,
        clientPhone: phoneNumber,
        displayId: maintenanceRequest.displayId,

        propertyName: property?.name || "غير محدد",
        maintenanceType: MaintenanceTypeLabels[maintenanceRequest.type].ar,
        priority: PriorityLabels[maintenanceRequest.priority].ar,
        description,
        unitNumber:
          unit?.number ||
          unit?.unitId ||
          (unit?.floor ? `الطابق ${unit.floor}` : "غير محدد"),
        requestDate: new Date(),
        type: "MAINTAINCE",
      });
      await sendMaintainceRequestToCS({
        requestId: maintenanceRequest.id,
        clientName: client.name,
        clientPhone: phoneNumber,
        propertyName: property?.name || "غير محدد",
        displayId: maintenanceRequest.displayId,
        maintenanceType: MaintenanceTypeLabels[maintenanceRequest.type].ar,
        priority: PriorityLabels[maintenanceRequest.priority].ar,
        description,
        unitNumber:
          unit?.number ||
          unit?.unitId ||
          (unit?.floor ? `الطابق ${unit.floor}` : "غير محدد"),
        requestDate: new Date(),
        type: "MAINTAINCE",
      });
    } catch (e) {
      console.warn("Maintenance notifications failed:", e?.message);
    }

    return {
      success: true,
      data: { request: maintenanceRequest, client, property, unit },
    };
  });
}
