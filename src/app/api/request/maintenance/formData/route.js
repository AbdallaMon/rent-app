// file: src/app/api/request/maintenance/formData/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // Fetch clients
    const clients = await prisma.client.findMany({
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        role: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Fetch properties
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        propertyId: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({
      clients,
      properties
    });
  } catch (error) {
    console.error("Error fetching form data:", error);
    return NextResponse.json(
      { error: "Failed to fetch form data" },
      { status: 500 }
    );
  }
}
