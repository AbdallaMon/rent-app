// file: src/app/api/request/complaint/[id]/route.js
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function DELETE(request, { params }) {
  try {
    const complaintId = parseInt(params.id);
    
    if (isNaN(complaintId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid complaint ID' },
        { status: 400 }
      );
    }
    
    // Check if the complaint exists before attempting deletion
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId }
    });
    
    if (!complaint) {
      return NextResponse.json(
        { success: false, error: 'Complaint not found' },
        { status: 404 }
      );
    }
    
    // Delete the complaint
    await prisma.complaint.delete({
      where: { id: complaintId }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: 'Complaint deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting complaint:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete complaint' },
      { status: 500 }
    );
  }
}