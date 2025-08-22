import { getContactForms } from '@/services/server/contactFormHandlers';
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function POST(request) {
  try {
    const { name, phone, description } = await request.json();

    if (!name || !phone || !description) {
      return NextResponse.json(
        { success: false, error: 'Name, phone, and description are required' },
        { status: 400 }
      );
    }

    const contact = await prisma.contact.create({
      data: {
        name,
        phone,
        description
      },
    });

    return NextResponse.json({ success: true, data: contact }, { status: 201 });
  } catch (error) {
    console.error('Error saving contact data:', error);
    return NextResponse.json({ success: false, error: 'Failed to save contact data' }, { status: 500 });
  }
}

const handlerObject = {
  contactForm: {
    GET: getContactForms,
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
