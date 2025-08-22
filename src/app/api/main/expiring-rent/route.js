import { NextResponse } from 'next/server';
import { addMonths, parseISO } from 'date-fns';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const today = new Date();
    const twoMonthsFromNow = addMonths(today, 2);
   
    // Format dates as full ISO strings with time component for Prisma
    const startDate = today.toISOString();
    const endDate = twoMonthsFromNow.toISOString();
   
    // Fetch rent agreements that are expiring within the next 2 months and have ACTIVE status
    const expiringAgreements = await prisma.rentAgreement.findMany({
      where: {
        endDate: {
          gte: startDate,
          lte: endDate,
        },
        status: 'ACTIVE',
      },
      include: {
        unit: {
          include: {
            property: true,
          },
        },
        renter: true,
      },
      orderBy: {
        endDate: 'asc',
      },
    });

    return NextResponse.json({
      data: expiringAgreements,
      count: expiringAgreements.length
    }, { status: 200 });
   
  } catch (error) {
    console.error('Error fetching expiring rent agreements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expiring rent agreements' },
      { status: 500 }
    );
  }
}
