//file: src/app/api/request/complaint/[id]/status/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(request, { params }) {
  try {
    const { status } = await request.json();
    const complaintId = parseInt(params.id);

    const validStatuses = ['PENDING', 'REVIEWING', 'RESOLVED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status value' },
        { status: 400 }
      );
    }

    const updatedComplaint = await prisma.complaint.update({
      where: { id: complaintId },
      data: { status },
      include: {
        client: true,
      },
    });

    return NextResponse.json({ success: true, data: updatedComplaint });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update complaint status' },
      { status: 500 }
    );
  }
}