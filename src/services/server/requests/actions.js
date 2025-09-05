import prisma from "@/lib/prisma";
import { buildCaseComms } from "./utility";
import { sendSmart, sendWhatsAppTemplate } from "../whatsapp/whatsapp";
import { normalizePhone } from "@/lib/phone";
import { sendEmail } from "@/app/api/utlis/sendMail";
import {
  ComplaintCategoryLabels,
  MaintenanceTypeLabels,
  PriorityLabels,
} from "../whatsapp/services/constants";
import {
  sendComplaintRequestToCs,
  sendMaintainceRequestToCS,
  sendMaintainceRequestToTech,
} from "../whatsapp/staff-notifications/services";
export async function generateRequestDisplayId({ model, date }) {
  const name = model === "maintenanceRequest" ? "MR" : "CP";
  const lastId = (await prisma[model].count()) + 1;

  const yearMonth = new Date(date).toISOString().slice(0, 7).replace("-", "");

  // Pad lastId with leading zeros to 4 digits
  const paddedId = String(lastId).padStart(4, "0");

  return `${name}-${yearMonth}-${paddedId}`;
}

async function createRequest({ data, model }) {
  try {
    const {
      clientType,
      propertyId,
      unitId,
      priority,
      type,
      description,
      createdAt,
    } = data;
    const unit = await prisma.unit.findUnique({
      where: {
        id: Number(unitId),
      },
      select: {
        clientId: true,
        property: {
          select: {
            clientId: true,
          },
        },
      },
    });
    const clientId =
      clientType === "OWNER" ? unit.property.clientId : unit.clientId;

    if (!clientId) {
      throw new Error(
        clientType === "OWNER"
          ? "لا يوجد مالك لهذا العقار"
          : "لا يوجد مستاجر لهذة الوحدة"
      );
    }
    const date = createdAt ? new Date(createdAt) : new Date();
    const dateField =
      model === "maintenanceRequest"
        ? { requestDate: date }
        : { submittedAt: date };
    const displayId = await generateRequestDisplayId({ date, model });
    const newRequest = await prisma[model].create({
      data: {
        propertyId: Number(propertyId),
        unitId: Number(unitId),
        clientId,
        priority,
        type,
        description,
        createdAt: date,
        displayId,
        ...dateField,
      },
    });
    const reqeustData = await prisma[model].findUnique({
      where: {
        id: newRequest.id,
      },
      include: {
        property: true,
        client: true,
        unit: true,
      },
    });
    if (model === "complaint") {
      await sendComplaintRequestToCs({
        requestId: reqeustData.id,
        clientName: reqeustData.client.name,
        displayId: reqeustData.displayId,
        priority: PriorityLabels[reqeustData.priority].ar,
        complaintType: ComplaintCategoryLabels[reqeustData.type].ar,
        description: reqeustData.description,
        clientPhone: reqeustData.client.phone,
        propertyName: reqeustData.property?.name || "غير محدد",
        displayId: reqeustData.displayId,
        unitNumber:
          reqeustData.unit?.number ||
          reqeustData.unit?.unitId ||
          (reqeustData.unit?.floor
            ? `الطابق ${reqeustData.unit.floor}`
            : "غير محدد"),
        requestDate: reqeustData.createdAt,
        type: "COMPLAINT",
      });
    } else {
      await sendMaintainceRequestToTech({
        requestId: reqeustData.id,
        clientName: reqeustData.client.name,
        clientPhone: reqeustData.client.phone,
        displayId: reqeustData.displayId,
        propertyName: reqeustData.property?.name || "غير محدد",
        maintenanceType: MaintenanceTypeLabels[reqeustData.type].ar,
        priority: PriorityLabels[reqeustData.priority].ar,
        description: reqeustData.description,
        unitNumber:
          reqeustData.unit?.number ||
          reqeustData.unit?.unitId ||
          (reqeustData.unit?.floor
            ? `الطابق ${reqeustData.unit.floor}`
            : "غير محدد"),
        requestDate: reqeustData.createdAt,
        type: "MAINTAINCE",
      });
      await sendMaintainceRequestToCS({
        requestId: reqeustData.id,
        clientName: reqeustData.client.name,
        clientPhone: reqeustData.client.phone,

        displayId: reqeustData.displayId,
        propertyName: reqeustData.property?.name || "غير محدد",
        maintenanceType: MaintenanceTypeLabels[reqeustData.type].ar,
        priority: PriorityLabels[reqeustData.priority].ar,
        description: reqeustData.description,
        unitNumber:
          reqeustData.unit?.number ||
          reqeustData.unit?.unitId ||
          (reqeustData.unit?.floor
            ? `الطابق ${reqeustData.unit.floor}`
            : "غير محدد"),
        requestDate: reqeustData.createdAt,
        type: "MAINTAINCE",
      });
    }
    return { data: reqeustData, message: "تمت العملية بنجاح" };
  } catch (e) {
    console.log(e.message, "error in create request");
  }
}
export async function createMaintenanceReqeust(data) {
  return await createRequest({ data, model: "maintenanceRequest" });
}

export async function createComplaint(data) {
  return await createRequest({ data, model: "complaint" });
}

async function updateRequest({ id, data, model }) {
  const currentRequest = await prisma[model].findFirst({
    where: { id: String(id) },
  });

  const updated = await prisma[model].update({
    where: { id: currentRequest.id },
    data,
    include: { property: true, unit: true, client: true },
  });
  if (currentRequest.status !== data.status) {
    const client = updated.client;
    if (client) {
      await notifyClientOnCaseUpdate({
        client,
        entity: { ...updated, status: data.status },
        kind: model,
      });
    }
  }
  return updated;
}
export async function updateMaintenanceReqeust(id, data) {
  return await updateRequest({ id, data, model: "maintenanceRequest" });
}

export async function updateComplaint(id, data) {
  return await updateRequest({ id, data, model: "complaint" });
}

export async function notifyClientOnCaseUpdate({ client, entity, kind }) {
  const { bodyParams, subject, html, templateName, langCode } = buildCaseComms({
    entity,
    kind,
    client,
  });

  // Email (if exists)
  if (client?.email) {
    await sendEmail(client.email, subject, html).catch((e) =>
      console.error("Email send error:", e?.message || e)
    );
  }

  const { e164 } = normalizePhone(client.phone);

  if (client?.phone) {
    await sendSmart({
      to: e164,
      spec: {
        templateName,
        language: langCode,
        bodyParams,
      },
    });
  }
}
async function deleteRequest({ id, model }) {
  return await prisma[model].delete({
    where: {
      id: String(id),
    },
  });
}
export async function deleteMaintenenceReqeust(id) {
  return await deleteRequest({ id, model: "maintenanceRequest" });
}

export async function deleteComplaint(id) {
  return await deleteRequest({ id, model: "complaint" });
}
