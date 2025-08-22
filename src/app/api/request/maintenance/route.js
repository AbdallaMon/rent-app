// /app/api/request/maintenance/route.js

import { getMaintenanceRequests } from "@/services/server/maintenanceRequestHandlers";

export const dynamic = 'force-dynamic';
const handlerObject = {
  maintenanceRequest: {
    GET: getMaintenanceRequests,
  }
};

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");
    
    if (!handlerObject[id] || !handlerObject[id].GET) {
      return Response.json({
        status: "error",
        message: "Invalid handler ID",
      }, { status: 400 });
    }
    
    const data = await handlerObject[id].GET(searchParams);
    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({
      status: "error",
      message: "An error occurred while processing your request.",
    }, { status: 500 });
  }
}
