/**
 * Dashboard Component - لوحة القيادة الرئيسية
 * 
 * هذا المكون هو الصفحة الرئيسية للتطبيق ويعرض:
 * - إحصائيات الوحدات (مؤجرة/شاغرة)
 * - إحصائيات العقود (نشطة/منتهية)
 * - إحصائيات المدفوعات (إيجارات/صيانة/أخرى)
 * - رسوم بيانية تفاعلية لكل إحصائية
 * - تصفية البيانات حسب العقار
 * 
 * الميزات:
 * - عرض البيانات في بطاقات منظمة
 * - إمكانية إظهار/إخفاء الرسوم البيانية
 * - تحديث البيانات في الوقت الفعلي
 * - تصفية حسب العقار المحدد
 * - تنسيق العملة بالدرهم الإماراتي
 */

"use client"; // تشغيل هذا المكون في جانب العميل فقط

// استيراد React hooks للحالة والتأثيرات الجانبية
import { useEffect, useState } from "react";

// استيراد مكونات Material-UI للواجهة
import {
  Box,          // مكون الحاوية المرنة
  Card,         // مكون البطاقة
  CardContent,  // محتوى البطاقة
  FormControl,  // التحكم في النماذج
  Grid,         // نظام الشبكة للتخطيط
  InputLabel,   // تسمية المدخلات
  MenuItem,     // عنصر القائمة
  Select,       // قائمة الاختيار المنسدلة
  Typography,   // مكون النصوص
  Button,       // مكون الأزرار
  List,         // مكون القائمة
  ListItem,     // عنصر القائمة
  ListItemText, // نص عنصر القائمة
  Divider,      // خط الفاصل
} from "@mui/material";

// استيراد مكونات الرسوم البيانية
import ChartDataLabels from "chartjs-plugin-datalabels"; // إضافة تسميات البيانات للرسوم البيانية
import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from "chart.js"; // مكونات Chart.js

// استيراد الوظائف المساعدة والمكونات المخصصة
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic"; // تنسيق العملة بالدرهم
import CardComponent from "./CardComponent"; // مكون البطاقة المخصص
import { useAuth } from "./context/AuthProvider/AuthProvider"; // سياق المصادقة
import { usePathname } from "next/navigation"; // الحصول على مسار الصفحة الحالي
import { getCurrentPrivilege } from "@/helpers/functions/getUserPrivilege"; // الحصول على صلاحيات المستخدم

// تسجيل مكونات Chart.js المطلوبة للرسوم البيانية الدائرية
ChartJS.register(ArcElement, Title, Tooltip, Legend, ChartDataLabels);

/**
 * Dashboard Component - مكون لوحة القيادة الرئيسية
 * 
 * يدير جميع البيانات والحالات اللازمة لعرض الإحصائيات
 * ويتعامل مع التفاعلات مثل تغيير العقار وإظهار الرسوم البيانية
 */
const Dashboard = () => {
  // ===== حالات إدارة البيانات الأساسية =====
  
  // قائمة العقارات المتاحة للتصفية
  const [properties, setProperties] = useState([]);
  
  // العقار المحدد حالياً (افتراضياً "الكل")
  const [selectedProperty, setSelectedProperty] = useState("all");

  // ===== حالات التحكم في عرض الرسوم البيانية =====
  // كل مفتاح يتحكم في إظهار/إخفاء رسم بياني معين
  const [showCharts, setShowCharts] = useState({
    units: false,                           // رسم بياني للوحدات
    agreements: false,                      // رسم بياني للعقود
    rentPayments: false,                    // رسم بياني لمدفوعات الإيجار
    currentMonthPayments: false,            // رسم بياني لمدفوعات الشهر الحالي
    maintenancePayments: false,             // رسم بياني لمدفوعات الصيانة
    currentMonthMaintenancePayments: false, // رسم بياني لصيانة الشهر الحالي
    otherPayments: false,                   // رسم بياني للمدفوعات الأخرى
    currentMonthOtherPayments: false,       // رسم بياني لمدفوعات أخرى للشهر الحالي
  });

  // ===== حالات البيانات الإحصائية =====
  
  // إحصائيات الوحدات (إجمالي، مؤجرة، شاغرة)
  const [units, setUnits] = useState({ total: 0, rented: 0, nonRented: 0 });
  
  // إحصائيات العقود (إجمالي، نشطة، منتهية)
  const [agreements, setAgreements] = useState({
    total: 0,
    active: 0,
    expired: 0,
  });
  const [rentPayments, setRentPayments] = useState({
    totalAmount: 0,
    totalPaidAmount: 0,
    totalRemainingAmount: 0,
  });
  const [currentMonthPayments, setCurrentMonthPayments] = useState({
    totalAmount: 0,
    totalPaidAmount: 0,
    totalRemainingAmount: 0,
  });
  const [maintenancePayments, setMaintenancePayments] = useState({
    totalAmount: 0,
    totalPaidAmount: 0,
    totalRemainingAmount: 0,
  });
  const [currentMonthMaintenancePayments, setCurrentMonthMaintenancePayments] =
    useState({
      totalAmount: 0,
      totalPaidAmount: 0,
      totalRemainingAmount: 0,
    });
  const [otherPayments, setOtherPayments] = useState({
    totalAmount: 0,
    totalPaidAmount: 0,
    totalRemainingAmount: 0,
  });
  const [currentMonthOtherPayments, setCurrentMonthOtherPayments] = useState({
    totalAmount: 0,
    totalPaidAmount: 0,
    totalRemainingAmount: 0,
  });
  // Lists for left sidebar
  const [recentMaintenances, setRecentMaintenances] = useState([]);
  const [recentRentAgreements, setRecentRentAgreements] = useState([]);

  // Loading states
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [loadingAgreements, setLoadingAgreements] = useState(true);
  const [loadingRentPayments, setLoadingRentPayments] = useState(true);
  const [loadingCurrentMonthPayments, setLoadingCurrentMonthPayments] =
    useState(true);
  const [loadingMaintenancePayments, setLoadingMaintenancePayments] =
    useState(true);
  const [
    loadingCurrentMonthMaintenancePayments,
    setLoadingCurrentMonthMaintenancePayments,
  ] = useState(true);
  const [loadingOtherPayments, setLoadingOtherPayments] = useState(true);
  const [
    loadingCurrentMonthOtherPayments,
    setLoadingCurrentMonthOtherPayments,  ] = useState(true);
    // Toggle chart display
  const toggleChart = (chart) => {
    setShowCharts({
      ...showCharts,
      [chart]: !showCharts[chart],
    });
  };
  useEffect(() => {
    async function fetchProperties() {
      try {
        const res = await fetch("/api/fast-handler?id=properties");
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch properties", error);
        setProperties([]); // تأكد من أن properties هو array فارغ في حالة الخطأ
      }
    }

    fetchProperties();
  }, []);

  useEffect(() => {
    async function fetchUnits() {
      setLoadingUnits(true);
      try {
        const propertyParam =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";        const res = await fetch(`/api/main/home/units?${propertyParam}`);
        const data = await res.json();
        setUnits(data || { total: 0, rented: 0, nonRented: 0 });
      } catch (error) {
        console.error("Failed to fetch units", error);
        setUnits({ total: 0, rented: 0, nonRented: 0 }); // حماية في حالة الخطأ
      }
      setLoadingUnits(false);
    }

    fetchUnits();
  }, [selectedProperty]);

  useEffect(() => {
    async function fetchAgreements() {
      setLoadingAgreements(true);
      try {
        const propertyParam =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";        const res = await fetch(
          `/api/main/home/rentAgreements?${propertyParam}`
        );
        const data = await res.json();
        setAgreements(data || { total: 0, active: 0, expired: 0 });
      } catch (error) {
        console.error("Failed to fetch agreements", error);
        setAgreements({ total: 0, active: 0, expired: 0 }); // حماية في حالة الخطأ
      }
      setLoadingAgreements(false);
    }

    fetchAgreements();
  }, [selectedProperty]);

  useEffect(() => {
    async function fetchRentPayments() {
      setLoadingRentPayments(true);
      try {
        const propertyParam =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";        const res = await fetch(`/api/main/home/rentPayments?${propertyParam}`);
        const data = await res.json();
        setRentPayments(data || { totalAmount: 0, paidAmount: 0, remainingAmount: 0 });
      } catch (error) {
        console.error("Failed to fetch rent payments", error);
        setRentPayments({ totalAmount: 0, paidAmount: 0, remainingAmount: 0 }); // حماية في حالة الخطأ
      }
      setLoadingRentPayments(false);
    }

    fetchRentPayments();
  }, [selectedProperty]);

  useEffect(() => {
    async function fetchCurrentMonthPayments() {
      setLoadingCurrentMonthPayments(true);
      try {
        const propertyParam =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";        const res = await fetch(`/api/main/home/payments?${propertyParam}`);
        const data = await res.json();
        setCurrentMonthPayments(data || { totalAmount: 0, paidAmount: 0, remainingAmount: 0 });
      } catch (error) {
        console.error("Failed to fetch current month payments", error);
        setCurrentMonthPayments({ totalAmount: 0, paidAmount: 0, remainingAmount: 0 }); // حماية في حالة الخطأ
      }
      setLoadingCurrentMonthPayments(false);
    }

    fetchCurrentMonthPayments();
  }, [selectedProperty]);

  useEffect(() => {
    async function fetchMaintenancePayments() {
      setLoadingMaintenancePayments(true);
      try {
        const propertyParam =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";        const res = await fetch(
          `/api/main/home/totalExpences?${propertyParam}`
        );
        const data = await res.json();
        setMaintenancePayments(data || { totalAmount: 0, paidAmount: 0, remainingAmount: 0 });
      } catch (error) {
        console.error("Failed to fetch maintenance payments", error);
        setMaintenancePayments({ totalAmount: 0, paidAmount: 0, remainingAmount: 0 }); // حماية في حالة الخطأ
      }
      setLoadingMaintenancePayments(false);
    }

    fetchMaintenancePayments();
  }, [selectedProperty]);

  useEffect(() => {
    async function fetchCurrentMonthMaintenancePayments() {
      setLoadingCurrentMonthMaintenancePayments(true);
      try {
        const propertyParam =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";        const res = await fetch(
          `/api/main/home/currentMonthMaintenancePayments?${propertyParam}`
        );
        const data = await res.json();
        setCurrentMonthMaintenancePayments(data || { totalAmount: 0, paidAmount: 0, remainingAmount: 0 });
      } catch (error) {
        console.error(
          "Failed to fetch current month maintenance payments",
          error
        );
        setCurrentMonthMaintenancePayments({ totalAmount: 0, paidAmount: 0, remainingAmount: 0 }); // حماية في حالة الخطأ
      }
      setLoadingCurrentMonthMaintenancePayments(false);
    }

    fetchCurrentMonthMaintenancePayments();
  }, [selectedProperty]);

  useEffect(() => {
    async function fetchOtherPayments() {
      setLoadingOtherPayments(true);
      try {
        const propertyParam =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";        const res = await fetch(
          `/api/main/home/otherPayments?${propertyParam}`
        );
        const data = await res.json();
        setOtherPayments(data || { totalAmount: 0, paidAmount: 0, remainingAmount: 0 });
      } catch (error) {
        console.error("Failed to fetch other payments", error);
        setOtherPayments({ totalAmount: 0, paidAmount: 0, remainingAmount: 0 }); // حماية في حالة الخطأ
      }
      setLoadingOtherPayments(false);
    }

    fetchOtherPayments();
  }, [selectedProperty]);

  useEffect(() => {
    async function fetchCurrentMonthOtherPayments() {
      setLoadingCurrentMonthOtherPayments(true);
      try {
        const propertyParam =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";        const res = await fetch(
          `/api/main/home/currentMonthOtherPayments?${propertyParam}`
        );
        const data = await res.json();
        setCurrentMonthOtherPayments(data || { totalAmount: 0, paidAmount: 0, remainingAmount: 0 });
      } catch (error) {
        console.error("Failed to fetch current month other payments", error);
        setCurrentMonthOtherPayments({ totalAmount: 0, paidAmount: 0, remainingAmount: 0 }); // حماية في حالة الخطأ
      }
      setLoadingCurrentMonthOtherPayments(false);
    }    fetchCurrentMonthOtherPayments();
  }, [selectedProperty]);
  
  const handlePropertyChange = (event) => {
    setSelectedProperty(event.target.value);
  };

  
  const unitsChartData = {
    labels: ["الوحدات المؤجرة", "الوحدات الشاغرة"],
    datasets: [
      {
        data: [units.rented, units.nonRented],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
      },
    ],
  };

  const agreementsChartData = {
    labels: ["النشط", "منتهي"],
    datasets: [
      {
        data: [agreements.active, agreements.expired],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
      },
    ],
  };

  const rentPaymentsChartData = {
    labels: ["الإيجار المحصل", "الإيجار المتبقي"],
    datasets: [
      {
        data: [rentPayments.totalPaidAmount, rentPayments.totalRemainingAmount],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
      },
    ],
  };

  const currentMonthPaymentsChartData = {
    labels: ["المبلغ المحصل", "المبلغ المتبقي"],
    datasets: [
      {
        data: [
          currentMonthPayments.totalPaidAmount,
          currentMonthPayments.totalRemainingAmount,
        ],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
      },
    ],
  };

  const maintenancePaymentsChartData = {
    labels: ["المصروفات المدفوعة", "المصروفات المتبقية"],
    datasets: [
      {
        data: [
          maintenancePayments.totalPaidAmount,
          maintenancePayments.totalRemainingAmount,
        ],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
      },
    ],
  };

  const currentMonthMaintenancePaymentsChartData = {
    labels: ["المبلغ المحصل", "المبلغ المتبقي"],
    datasets: [
      {
        data: [
          currentMonthMaintenancePayments.totalPaidAmount,
          currentMonthMaintenancePayments.totalRemainingAmount,
        ],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
      },
    ],
  };

  const otherPaymentsChartData = {
    labels: ["المبلغ المحصل", "المبلغ المتبقي"],
    datasets: [
      {
        data: [
          otherPayments.totalPaidAmount,
          otherPayments.totalRemainingAmount,
        ],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
      },
    ],
  };

  const currentMonthOtherPaymentsChartData = {
    labels: ["المبلغ المحصل", "المبلغ المتبقي"],
    datasets: [
      {
        data: [
          currentMonthOtherPayments.totalPaidAmount,
          currentMonthOtherPayments.totalRemainingAmount,
        ],
        backgroundColor: ["rgba(75, 192, 192, 0.6)", "rgba(255, 99, 132, 0.6)"],
      },
    ],
  };

  // Modified CardComponent props to include toggle function and showChart state
  const cardComponents = [
    {
      id: "units",
      headers: ["إجمالي الوحدات", "الوحدات المؤجرة", "الوحدات الشاغرة"],
      values: [units.total, units.rented, units.nonRented],
      loading: loadingUnits,
      chartData: unitsChartData,
      href: "/units?rentStatus=notRented",
      hrefIndex: 2,
      showChart: showCharts.units
    },
    {
      id: "agreements",
      headers: ["إجمالي العقود", "العقود النشطة", "العقود المنتهية"],
      values: [agreements.total, agreements.active, agreements.expired],
      loading: loadingAgreements,
      chartData: agreementsChartData,
      href: "/rent?status=expired&rented=expired",  // Updated link to properly filter expired agreements
      hrefIndex: 2,
      showChart: showCharts.agreements
    },
    {
      id: "rentPayments",
      headers: ["إجمالي الإيجارات", "الإيجار المحصل", "الإيجار المتبقي"],
      values: [
        formatCurrencyAED(rentPayments.totalAmount),
        formatCurrencyAED(rentPayments.totalPaidAmount),
        formatCurrencyAED(rentPayments.totalRemainingAmount),
      ],
      loading: loadingRentPayments,
      chartData: rentPaymentsChartData,
      href: "/invoices?type=RENT",
      hrefIndex: 2,
      showChart: showCharts.rentPayments
    },
    {
      id: "currentMonthPayments",
      headers: ["إجمالي المدفوعات لهذا الشهر", "المبلغ المحصل", "المبلغ المتبقي"],
      values: [
        formatCurrencyAED(currentMonthPayments.totalAmount),
        formatCurrencyAED(currentMonthPayments.totalPaidAmount),
        formatCurrencyAED(currentMonthPayments.totalRemainingAmount),
      ],
      loading: loadingCurrentMonthPayments,
      chartData: currentMonthPaymentsChartData,
      href: "/invoices",
      hrefIndex: 2,
      showChart: showCharts.currentMonthPayments
    },
    {
      id: "maintenancePayments",
      headers: ["جميع المصروفات", "المصروفات المدفوعة", "المصروفات المتبقية"],
      values: [
        formatCurrencyAED(maintenancePayments.totalAmount),
        formatCurrencyAED(maintenancePayments.totalPaidAmount),
        formatCurrencyAED(maintenancePayments.totalRemainingAmount),
      ],
      loading: loadingMaintenancePayments,
      chartData: maintenancePaymentsChartData,
      href: "/maintenance",
      hrefIndex: 2,
      showChart: showCharts.maintenancePayments
    },
    {
      id: "currentMonthMaintenancePayments",
      headers: ["إجمالي المصروفات لهذا الشهر", "المبلغ المحصل", "المبلغ المتبقي"],
      values: [
        formatCurrencyAED(currentMonthMaintenancePayments.totalAmount),
        formatCurrencyAED(currentMonthMaintenancePayments.totalPaidAmount),
        formatCurrencyAED(currentMonthMaintenancePayments.totalRemainingAmount),
      ],
      loading: loadingCurrentMonthMaintenancePayments,
      chartData: currentMonthMaintenancePaymentsChartData,
      href: "/maintenance",
      hrefIndex: 2,
      showChart: showCharts.currentMonthMaintenancePayments
    },
    {
      id: "otherPayments",
      headers: ["جميع المدفوعات الأخرى", "المبلغ المحصل", "المبلغ المتبقي"],
      values: [
        formatCurrencyAED(otherPayments.totalAmount),
        formatCurrencyAED(otherPayments.totalPaidAmount),
        formatCurrencyAED(otherPayments.totalRemainingAmount),
      ],
      loading: loadingOtherPayments,
      chartData: otherPaymentsChartData,
      href: "/invoices?type=OTHER",
      hrefIndex: 2,
      showChart: showCharts.otherPayments
    },
    {
      id: "currentMonthOtherPayments",
      headers: ["إجمالي المدفوعات الأخرى لهذا الشهر", "المبلغ المحصل", "المبلغ المتبقي"],
      values: [
        formatCurrencyAED(currentMonthOtherPayments.totalAmount),
        formatCurrencyAED(currentMonthOtherPayments.totalPaidAmount),
        formatCurrencyAED(currentMonthOtherPayments.totalRemainingAmount),
      ],
      loading: loadingCurrentMonthOtherPayments,
      chartData: currentMonthOtherPaymentsChartData,
      href: "/invoices?type=OTHER",
      hrefIndex: 2,
      showChart: showCharts.currentMonthOtherPayments
    }  ];

return (
  <Box sx={{ p: { xs: 1, md: 3 } }}>
    <Typography variant="h4" gutterBottom>
      لوحة الموقع
    </Typography>
    <Grid
      container
      spacing={2}
      sx={{
        flexDirection: "row-reverse",
      }}
    >
      {/* Left Sidebar */}
      <Grid item xs={12} md={3} lg={3}>
        {/* Property Selector */}
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <FormControl fullWidth>
              <InputLabel>اختر العقار</InputLabel>
              <Select
                value={selectedProperty}
                onChange={handlePropertyChange}
                displayEmpty
              >                <MenuItem value="all">
                  <em>جميع العقارات</em>
                </MenuItem>
                {properties && Array.isArray(properties) && properties.map((property) => (
                  <MenuItem key={property.id} value={property.id}>
                    {property.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </CardContent>        </Card>
      </Grid>
      {/* Main Content Area */}
      <Grid item xs={12} md={9} lg={9}>
        <Grid
          container
          spacing={0}
          direction="column"
          sx={{
            flexWrap: "nowrap",
            height: '100%',
          }}
        >          <Box sx={{ maxHeight: 'calc(100vh - 120px)', overflow: 'auto', pb: 2 }}>
            {Array.isArray(cardComponents) && cardComponents.map((card) => (
              <Grid item xs={12} key={card.id} sx={{ mb: 2 }}>
                <CardComponent
                  headers={card.headers}
                  values={card.values}
                  loading={card.loading}
                  chartData={card.chartData}
                  href={card.href}
                  hrefIndex={card.hrefIndex}
                  showChart={card.showChart}
                  onToggleChart={() => toggleChart(card.id)}
                />
              </Grid>
            ))}
          </Box>
        </Grid>
      </Grid>
    </Grid>
  </Box>
);
};

export default Dashboard;
