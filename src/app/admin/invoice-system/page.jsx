'use client';

import React from 'react';
import { Container, Box, Breadcrumbs, Link, Typography } from '@mui/material';
import InvoiceSystemManager from '@/components/admin/InvoiceSystemManager';
import { useAuth } from '@/app/context/AuthProvider/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function InvoiceSystemUpdatePage() {
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // التحقق من صلاحيات المدير
        if (!user || user.role !== 'ADMIN') {
            router.push('/not-allowed');
        }
    }, [user, router]);

    if (!user || user.role !== 'ADMIN') {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Typography variant="h4" textAlign="center">
                    ⚠️ غير مسموح بالوصول
                </Typography>
                <Typography variant="body1" textAlign="center" sx={{ mt: 2 }}>
                    هذه الصفحة مخصصة للمدراء فقط
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* مسار التنقل */}
            <Breadcrumbs sx={{ mb: 3 }}>
                <Link color="inherit" href="/dashboard">
                    الرئيسية
                </Link>
                <Link color="inherit" href="/admin">
                    لوحة الإدارة
                </Link>
                <Typography color="text.primary">تحديث نظام الفواتير</Typography>
            </Breadcrumbs>

            {/* تحذير مهم */}
            <Box sx={{ 
                mb: 4, 
                p: 3, 
                bgcolor: 'warning.light', 
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'warning.main'
            }}>
                <Typography variant="h6" color="warning.dark" gutterBottom>
                    ⚠️ تحذير مهم
                </Typography>
                <Typography variant="body1" color="warning.dark">
                    هذه العملية ستقوم بتعديل البيانات الموجودة في النظام. يُنصح بعمل نسخة احتياطية قبل البدء.
                    العملية ستقوم بإزالة فواتير الإيجار والضرائب من نظام الفواتير وتحويلها إلى عمولات إدارة.
                </Typography>
            </Box>

            {/* مكون التحديث */}
            <InvoiceSystemManager />
        </Container>
    );
}
