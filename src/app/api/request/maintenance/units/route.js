// file: src/app/api/units/route.js
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const propertyId = searchParams.get("propertyId");

  if (!propertyId) {
    return NextResponse.json(
      { error: "Property ID is required" },
      { status: 400 }
    );
  }

  try {
    const units = await prisma.unit.findMany({
      where: {
        propertyId: parseInt(propertyId),
        deletedAt: null
      },
      select: {
        id: true,
        number: true,
        floor: true,
        unitId: true
      },
      orderBy: [
        { floor: 'asc' },
        { number: 'asc' }
      ]
    });

    return NextResponse.json(units);
  } catch (error) {
    console.error("Error fetching units:", error);
    return NextResponse.json(
      { error: "Failed to fetch units" },
      { status: 500 }
    );
  }
}
