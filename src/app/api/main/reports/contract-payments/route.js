import { getContractPayments } from "@/services/server/fastHandlers";

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const data = await getContractPayments(searchParams);
    
    if (data.success) {
      return Response.json({ status: 200, data: data.data });
    } else {
      return Response.json({ 
        status: 400, 
        message: data.message || 'حدث خطأ أثناء جلب البيانات' 
      });
    }
  } catch (error) {
    console.error('Error in contract payments API:', error);
    return Response.json({
      status: 500,
      message: 'حدث خطأ في الخادم أثناء معالجة الطلب',
    });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { filters } = body;
    
    // Create a mock searchParams object with the filters
    const searchParams = new URLSearchParams();
    searchParams.set('filters', JSON.stringify(filters));
    
    // Reuse the same getContractPayments function for consistency
    const data = await getContractPayments(searchParams);
    
    if (data.success) {
      return Response.json({ status: 200, data: data.data });
    } else {
      return Response.json({ 
        status: 400, 
        message: data.message || 'حدث خطأ أثناء جلب البيانات' 
      });
    }
  } catch (error) {
    console.error('Error in contract payments report API:', error);
    return Response.json({
      status: 500,
      message: 'حدث خطأ في الخادم أثناء معالجة الطلب',
    });
  }
}
