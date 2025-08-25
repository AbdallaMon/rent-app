"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Box,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Container,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Toolbar,
  Typography,
} from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { ArcElement, Chart as ChartJS, Legend, Title, Tooltip } from "chart.js";
import Link from "next/link";
import { Pie } from "react-chartjs-2";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";

ChartJS.register(ArcElement, Title, Tooltip, Legend, ChartDataLabels);

/* =========================
   Header (sticky, compact)
========================= */
function DashboardHeader({ properties, selectedProperty, onChange }) {
  const theme = useTheme();
  return (
    <AppBar
      position="sticky"
      elevation={0}
      color="default"
      sx={{
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: "background.paper",
      }}
    >
      <Toolbar sx={{ gap: 2, flexWrap: "wrap", py: 1.5 }}>
        <Typography
          variant="h5"
          sx={{ fontWeight: 800, flexGrow: 1, color: "text.primary" }}
        >
          لوحة الموقع
        </Typography>

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel>اختر العقار</InputLabel>
          <Select
            value={selectedProperty}
            label="اختر العقار"
            onChange={onChange}
            displayEmpty
            MenuProps={{ PaperProps: { elevation: 1 } }}
          >
            <MenuItem value="all">
              <em>جميع العقارات</em>
            </MenuItem>
            {Array.isArray(properties) &&
              properties.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>
      </Toolbar>
    </AppBar>
  );
}

/* =========================
   Tiny chart wrapper
========================= */
const MiniPie = ({ data }) => {
  const theme = useTheme();
  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center" }}>
      <Box sx={{ maxWidth: 280, width: "100%", px: 1, pb: 1 }}>
        <Pie
          data={data}
          options={{
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
              legend: {
                position: "bottom",
                labels: {
                  color: theme.palette.text.primary,
                  boxWidth: 14,
                },
              },
              title: { display: false },
              datalabels: {
                color: theme.palette.getContrastText(
                  theme.palette.background.paper
                ),
                formatter: (val, ctx) => {
                  const total =
                    ctx.dataset.data.reduce((a, b) => a + b, 0) || 0;
                  const pct = total ? Math.round((val / total) * 100) : 0;
                  return `${pct}%`;
                },
                font: { weight: 600 },
              },
            },
          }}
        />
      </Box>
    </Box>
  );
};

/* =========================
   Metric Card (modern)
========================= */
function RowHead({ children, withDivider }) {
  return (
    <Typography
      variant="subtitle1"
      sx={{
        flex: 1,
        textAlign: "center",
        p: 1.25,
        borderInlineEnd: withDivider
          ? (t) => `1px solid ${t.palette.divider}`
          : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 600,
        minHeight: 48,
      }}
    >
      {children}
    </Typography>
  );
}

function RowValue({ children, withDivider, color }) {
  return (
    <Typography
      variant="h6"
      sx={{
        flex: 1,
        textAlign: "center",
        p: 1.75,
        borderInlineEnd: withDivider
          ? (t) => `1px solid ${t.palette.divider}`
          : "none",
        borderTop: (t) => `1px solid ${t.palette.divider}`,
        minHeight: 60,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: color || "text.primary",
        fontWeight: 800,
        letterSpacing: 0.2,
      }}
    >
      {children}
    </Typography>
  );
}

function MetricCard({
  headers,
  values,
  loading,
  chartData,
  href,
  hrefIndex,
  showChart,
  onToggleChart,
}) {
  const theme = useTheme();

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        overflow: "hidden",
        bgcolor: "background.paper",
        transition: "box-shadow .2s ease, transform .06s ease",
        "&:hover": { boxShadow: 2 },
      }}
    >
      <CardHeader
        onClick={onToggleChart}
        title={
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "stretch",
              justifyContent: "space-between",
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            {headers.map((h, i) => (
              <RowHead key={i} withDivider={i < headers.length - 1}>
                {h}
              </RowHead>
            ))}
          </Box>
        }
        sx={{
          px: 0,
          py: 0,
          "& .MuiCardHeader-title": { width: "100%" },
          bgcolor: (t) => alpha(t.palette.action.hover, 0.5),
          color: "text.primary",
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      />

      <CardContent
        sx={{ p: 0, flexGrow: 1, display: "flex", flexDirection: "column" }}
      >
        {loading ? (
          <Box sx={{ width: "100%", p: 2 }}>
            <Box sx={{ display: "flex" }}>
              {[0, 1, 2].map((i) => (
                <Box
                  key={i}
                  sx={{
                    flex: 1,
                    borderInlineEnd:
                      i < 2 ? (t) => `1px solid ${t.palette.divider}` : "none",
                    p: 1.5,
                  }}
                >
                  <Skeleton height={22} />
                  <Skeleton height={28} sx={{ mt: 1 }} />
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: "flex" }}>
            {values.map((val, i) => {
              const isLink = href && hrefIndex === i;
              const color = isLink ? "info.main" : "text.primary";
              return (
                <React.Fragment key={i}>
                  {isLink ? (
                    <RowValue withDivider={i < values.length - 1} color={color}>
                      <Link href={href} onClick={(e) => e.stopPropagation()}>
                        {val}
                      </Link>
                    </RowValue>
                  ) : (
                    <RowValue withDivider={i < values.length - 1}>
                      {val}
                    </RowValue>
                  )}
                </React.Fragment>
              );
            })}
          </Box>
        )}

        {showChart && chartData && (
          <>
            <Divider />
            <MiniPie data={chartData} />
          </>
        )}
      </CardContent>
    </Card>
  );
}

/* =========================
   Main Dashboard
========================= */
const Dashboard = () => {
  const theme = useTheme();

  // palette helpers (respect theme)
  const colorPair = useMemo(
    () => ({
      primaryVsMuted: [
        alpha(theme.palette.primary.main, 0.9),
        alpha(theme.palette.primary.main, 0.2),
      ],
      successVsWarning: [
        alpha(theme.palette.success.main, 0.9),
        alpha(theme.palette.warning.main, 0.9),
      ],
      successVsError: [
        alpha(theme.palette.success.main, 0.9),
        alpha(theme.palette.error.main, 0.9),
      ],
      infoVsError: [
        alpha(theme.palette.info.main, 0.9),
        alpha(theme.palette.error.main, 0.9),
      ],
    }),
    [theme.palette]
  );

  // ===== state =====
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState("all");

  const [showCharts, setShowCharts] = useState({
    units: false,
    agreements: false,
    rentPayments: false,
    currentMonthPayments: false,
    maintenancePayments: false,
    currentMonthMaintenancePayments: false,
    otherPayments: false,
    currentMonthOtherPayments: false,
  });

  const [units, setUnits] = useState({ total: 0, rented: 0, nonRented: 0 });
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
    setLoadingCurrentMonthOtherPayments,
  ] = useState(true);

  const toggleChart = (chart) =>
    setShowCharts((s) => ({ ...s, [chart]: !s[chart] }));

  // ===== data fetching =====
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/fast-handler?id=properties");
        const data = await res.json();
        setProperties(Array.isArray(data) ? data : []);
      } catch {
        setProperties([]);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoadingUnits(true);
      try {
        const q =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";
        const res = await fetch(`/api/main/home/units?${q}`);
        const data = await res.json();
        setUnits(data || { total: 0, rented: 0, nonRented: 0 });
      } catch {
        setUnits({ total: 0, rented: 0, nonRented: 0 });
      }
      setLoadingUnits(false);
    })();
  }, [selectedProperty]);

  useEffect(() => {
    (async () => {
      setLoadingAgreements(true);
      try {
        const q =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";
        const res = await fetch(`/api/main/home/rentAgreements?${q}`);
        const data = await res.json();
        setAgreements(data || { total: 0, active: 0, expired: 0 });
      } catch {
        setAgreements({ total: 0, active: 0, expired: 0 });
      }
      setLoadingAgreements(false);
    })();
  }, [selectedProperty]);

  useEffect(() => {
    (async () => {
      setLoadingRentPayments(true);
      try {
        const q =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";
        const res = await fetch(`/api/main/home/rentPayments?${q}`);
        const data = await res.json();
        setRentPayments(
          data || { totalAmount: 0, paidAmount: 0, remainingAmount: 0 }
        );
      } catch {
        setRentPayments({
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
        });
      }
      setLoadingRentPayments(false);
    })();
  }, [selectedProperty]);

  useEffect(() => {
    (async () => {
      setLoadingCurrentMonthPayments(true);
      try {
        const q =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";
        const res = await fetch(`/api/main/home/payments?${q}`);
        const data = await res.json();
        setCurrentMonthPayments(
          data || { totalAmount: 0, paidAmount: 0, remainingAmount: 0 }
        );
      } catch {
        setCurrentMonthPayments({
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
        });
      }
      setLoadingCurrentMonthPayments(false);
    })();
  }, [selectedProperty]);

  useEffect(() => {
    (async () => {
      setLoadingMaintenancePayments(true);
      try {
        const q =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";
        const res = await fetch(`/api/main/home/totalExpences?${q}`);
        const data = await res.json();
        setMaintenancePayments(
          data || { totalAmount: 0, paidAmount: 0, remainingAmount: 0 }
        );
      } catch {
        setMaintenancePayments({
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
        });
      }
      setLoadingMaintenancePayments(false);
    })();
  }, [selectedProperty]);

  useEffect(() => {
    (async () => {
      setLoadingCurrentMonthMaintenancePayments(true);
      try {
        const q =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";
        const res = await fetch(
          `/api/main/home/currentMonthMaintenancePayments?${q}`
        );
        const data = await res.json();
        setCurrentMonthMaintenancePayments(
          data || { totalAmount: 0, paidAmount: 0, remainingAmount: 0 }
        );
      } catch {
        setCurrentMonthMaintenancePayments({
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
        });
      }
      setLoadingCurrentMonthMaintenancePayments(false);
    })();
  }, [selectedProperty]);

  useEffect(() => {
    (async () => {
      setLoadingOtherPayments(true);
      try {
        const q =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";
        const res = await fetch(`/api/main/home/otherPayments?${q}`);
        const data = await res.json();
        setOtherPayments(
          data || { totalAmount: 0, paidAmount: 0, remainingAmount: 0 }
        );
      } catch {
        setOtherPayments({
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
        });
      }
      setLoadingOtherPayments(false);
    })();
  }, [selectedProperty]);

  useEffect(() => {
    (async () => {
      setLoadingCurrentMonthOtherPayments(true);
      try {
        const q =
          selectedProperty !== "all" ? `propertyId=${selectedProperty}` : "";
        const res = await fetch(
          `/api/main/home/currentMonthOtherPayments?${q}`
        );
        const data = await res.json();
        setCurrentMonthOtherPayments(
          data || { totalAmount: 0, paidAmount: 0, remainingAmount: 0 }
        );
      } catch {
        setCurrentMonthOtherPayments({
          totalAmount: 0,
          paidAmount: 0,
          remainingAmount: 0,
        });
      }
      setLoadingCurrentMonthOtherPayments(false);
    })();
  }, [selectedProperty]);

  const handlePropertyChange = (e) => setSelectedProperty(e.target.value);

  // ===== chart datasets =====
  const unitsChartData = {
    labels: ["الوحدات المؤجرة", "الوحدات الشاغرة"],
    datasets: [
      {
        data: [units.rented, units.nonRented],
        backgroundColor: colorPair.primaryVsMuted,
      },
    ],
  };
  const agreementsChartData = {
    labels: ["النشط", "منتهي"],
    datasets: [
      {
        data: [agreements.active, agreements.expired],
        backgroundColor: colorPair.infoVsError,
      },
    ],
  };
  const rentPaymentsChartData = {
    labels: ["الإيجار المحصل", "الإيجار المتبقي"],
    datasets: [
      {
        data: [rentPayments.totalPaidAmount, rentPayments.totalRemainingAmount],
        backgroundColor: colorPair.successVsWarning,
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
        backgroundColor: colorPair.successVsWarning,
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
        backgroundColor: colorPair.successVsError,
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
        backgroundColor: colorPair.successVsError,
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
        backgroundColor: colorPair.successVsWarning,
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
        backgroundColor: colorPair.successVsWarning,
      },
    ],
  };

  // ===== cards (same content, reorganized) =====
  const cards = [
    {
      id: "units",
      headers: ["إجمالي الوحدات", "الوحدات المؤجرة", "الوحدات الشاغرة"],
      values: [units.total, units.rented, units.nonRented],
      loading: loadingUnits,
      chartData: unitsChartData,
      href: "/units?rentStatus=notRented",
      hrefIndex: 2,
      showChart: showCharts.units,
    },
    {
      id: "agreements",
      headers: ["إجمالي العقود", "العقود النشطة", "العقود المنتهية"],
      values: [agreements.total, agreements.active, agreements.expired],
      loading: loadingAgreements,
      chartData: agreementsChartData,
      href: "/rent?status=expired&rented=expired",
      hrefIndex: 2,
      showChart: showCharts.agreements,
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
      showChart: showCharts.rentPayments,
    },
    {
      id: "currentMonthPayments",
      headers: [
        "إجمالي المدفوعات لهذا الشهر",
        "المبلغ المحصل",
        "المبلغ المتبقي",
      ],
      values: [
        formatCurrencyAED(currentMonthPayments.totalAmount),
        formatCurrencyAED(currentMonthPayments.totalPaidAmount),
        formatCurrencyAED(currentMonthPayments.totalRemainingAmount),
      ],
      loading: loadingCurrentMonthPayments,
      chartData: currentMonthPaymentsChartData,
      href: "/invoices",
      hrefIndex: 2,
      showChart: showCharts.currentMonthPayments,
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
      showChart: showCharts.maintenancePayments,
    },
    {
      id: "currentMonthMaintenancePayments",
      headers: [
        "إجمالي المصروفات لهذا الشهر",
        "المبلغ المحصل",
        "المبلغ المتبقي",
      ],
      values: [
        formatCurrencyAED(currentMonthMaintenancePayments.totalAmount),
        formatCurrencyAED(currentMonthMaintenancePayments.totalPaidAmount),
        formatCurrencyAED(currentMonthMaintenancePayments.totalRemainingAmount),
      ],
      loading: loadingCurrentMonthMaintenancePayments,
      chartData: currentMonthMaintenancePaymentsChartData,
      href: "/maintenance",
      hrefIndex: 2,
      showChart: showCharts.currentMonthMaintenancePayments,
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
      showChart: showCharts.otherPayments,
    },
    {
      id: "currentMonthOtherPayments",
      headers: [
        "إجمالي المدفوعات الأخرى لهذا الشهر",
        "المبلغ المحصل",
        "المبلغ المتبقي",
      ],
      values: [
        formatCurrencyAED(currentMonthOtherPayments.totalAmount),
        formatCurrencyAED(currentMonthOtherPayments.totalPaidAmount),
        formatCurrencyAED(currentMonthOtherPayments.totalRemainingAmount),
      ],
      loading: loadingCurrentMonthOtherPayments,
      chartData: currentMonthOtherPaymentsChartData,
      href: "/invoices?type=OTHER",
      hrefIndex: 2,
      showChart: showCharts.currentMonthOtherPayments,
    },
  ];

  return (
    <Container maxWidth="xxl" sx={{ px: 0 }}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
        <DashboardHeader
          properties={properties}
          selectedProperty={selectedProperty}
          onChange={handlePropertyChange}
        />

        {/* Content */}
        <Box
          sx={{
            px: { xs: 0, md: 3 },
            py: { xs: 2, md: 3 },
            direction: "rtl",
          }}
        >
          {/* Responsive Masonry-like grid */}
          <Grid
            container
            spacing={2}
            sx={{
              alignItems: "stretch",
            }}
          >
            {cards.map((card) => (
              <Grid
                key={card.id}
                item
                xs={12}
                sm={6}
                md={6}
                lg={4}
                sx={{ display: "flex" }}
              >
                <Box sx={{ width: "100%" }}>
                  <MetricCard
                    headers={card.headers}
                    values={card.values}
                    loading={card.loading}
                    chartData={card.chartData}
                    href={card.href}
                    hrefIndex={card.hrefIndex}
                    showChart={card.showChart}
                    onToggleChart={() => toggleChart(card.id)}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;
