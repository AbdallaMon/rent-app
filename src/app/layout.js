/**
 * Root Layout Component - مكون التخطيط الجذر
 *
 * هذا المكون يُستخدم في جميع صفحات التطبيق ويوفر:
 * - الهيكل الأساسي للصفحة (HTML structure)
 * - مقدمي الخدمات (Providers) للحالة العامة
 * - التخطيط الأساسي والتنقل
 * - الدعم للغة العربية والاتجاه من اليمين لليسار (RTL)
 * - الخطوط والأنماط العامة
 *
 * الميزات:
 * - دعم كامل للغة العربية
 * - إدارة حالة المصادقة
 * - تحميل البيانات المشتركة
 * - إشعارات النظام (Toast)
 * - شريط التنقل الموحد
 */

// ===== الاستيرادات =====

// استيراد الأنماط العامة للتطبيق
import "./globals.css";

// استيراد مكونات التنقل والواجهة
import DashboardNav from "@/components/ui/Navigation/Navbar/Navbar"; // شريط التنقل الرئيسي

// استيراد مكونات الدعم والمساعدة

// استيراد مقدمي الخدمات (Context Providers)
import { SubmitLoaderProvider } from "@/app/context/SubmitLoaderProvider/SubmitLoaderProvider"; // مدير تحميل الإرسال
import { DataLoaderProvider } from "@/app/context/DataLoaderProvider/DataLoaderProvider"; // مدير تحميل البيانات
import ToastProvider from "@/app/context/ToastLoading/ToastLoadingProvider"; // مدير الإشعارات
import AuthProvider from "@/app/context/AuthProvider/AuthProvider"; // مدير المصادقة
import MUIContextProvider from "@/app/context/MuiProvider/MuiProvider"; // مزود إعدادات MUI
// استيراد الخطوط من Google Fonts
import { Cairo } from "next/font/google"; // خط Cairo العربي

// ===== بيانات التعريف للصفحة (SEO Metadata) =====
// تستخدم هذه البيانات في تحسين محركات البحث وعرض معلومات الموقع
export const metadata = {
  title:
    "Tar Real Estate Company - Premier Property Rental & Maintenance in UAE",
  description:
    "Discover high-quality rental properties across the UAE with Tar Real Estate Company. We specialize in renting and maintaining properties listed exclusively in our system, ensuring seamless living experiences.",
  keywords:
    "UAE property rental, rent apartments UAE, property maintenance UAE, house rental Dubai, rental listings UAE, affordable rentals Abu Dhabi, property management UAE, furnished apartments UAE, long-term rental UAE, Tar Real Estate Company rental services,Tar Real Estate Company",
};

// ===== إعداد الخط =====
// تكوين خط Cairo العربي مع دعم النصوص اللاتينية
const font = Cairo({
  subsets: ["latin"], // دعم الأحرف اللاتينية بالإضافة للعربية
});

/**
 * RootLayout Component - مكون التخطيط الجذر
 *
 * @param {Object} props - خصائص المكون
 * @param {React.ReactNode} props.children - مكونات الصفحات الفرعية
 * @returns {JSX.Element} الهيكل الأساسي للتطبيق
 */
export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={font.className}>
        <MUIContextProvider>
          <ToastProvider>
            <AuthProvider>
              <DataLoaderProvider>
                <SubmitLoaderProvider>
                  <DashboardNav>{children}</DashboardNav>
                </SubmitLoaderProvider>
              </DataLoaderProvider>
            </AuthProvider>
          </ToastProvider>
        </MUIContextProvider>
      </body>
    </html>
  );
}
