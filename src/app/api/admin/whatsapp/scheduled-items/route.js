import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Test working from scheduled-items!',
    data: {
      scheduledItems: [],
      stats: {
        total: 0,
        payments: 0,
        contracts: 0
      }
    }
  });
}
