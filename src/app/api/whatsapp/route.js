/**
 * Route رئيسي موحد للواتساب - الهيكل الجديد المنظم
 * يوفر معلومات عن جميع APIs المتاحة
 */

import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const whatsappApis = {
            message: 'مرحباً بك في APIs الواتساب المنظمة',
            version: '2.0.0',
            structure: 'الهيكل الجديد المنظم',
            timestamp: new Date().toISOString(),
            availableApis: {
                webhook: {
                    path: '/api/whatsapp/webhook',
                    description: 'استقبال ومعالجة رسائل الواتساب',
                    methods: ['GET', 'POST'],
                    status: 'active'
                },
                reminders: {
                    path: '/api/whatsapp/reminders',
                    description: 'إدارة التذكيرات والإشعارات',
                    methods: ['GET', 'POST', 'PUT', 'DELETE'],
                    status: 'active'
                },
                settings: {
                    path: '/api/whatsapp/settings',
                    description: 'إعدادات الواتساب',
                    methods: ['GET', 'POST', 'PUT'],
                    status: 'active'
                }
            },
            migration: {
                status: 'مكتمل',
                oldStructure: 'src/app/api/notifications/whatsapp و src/app/api/admin/whatsapp',
                newStructure: 'src/app/api/whatsapp (موحد)',
                compatibility: 'المسارات القديمة تعمل بالتوازي'
            }
        };

        return NextResponse.json(whatsappApis, { status: 200 });
        
    } catch (error) {
        console.error('خطأ في route الواتساب الرئيسي:', error);
        
        return NextResponse.json({
            error: 'خطأ في النظام',
            message: 'حدث خطأ في استرجاع معلومات APIs الواتساب',
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const body = await request.json();
        
        return NextResponse.json({
            message: 'Route الواتساب الرئيسي يعمل',
            receivedData: body,
            timestamp: new Date().toISOString(),
            note: 'استخدم APIs المحددة لكل وظيفة'
        }, { status: 200 });
        
    } catch (error) {
        console.error('خطأ في معالجة POST للواتساب الرئيسي:', error);
        
        return NextResponse.json({
            error: 'خطأ في معالجة البيانات',
            message: error.message,
            timestamp: new Date().toISOString()
        }, { status: 500 });
    }
}
