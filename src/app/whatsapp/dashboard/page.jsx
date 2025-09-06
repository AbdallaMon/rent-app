"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Chip,
  Stack,
  IconButton,
  LinearProgress,
  Tooltip,
  CardHeader,
  Switch,
  FormControlLabel,
  Badge,
  useTheme,
  Skeleton,
  Container,
  useMediaQuery,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import {
  FiRefreshCw,
  FiMessageSquare,
  FiBarChart2,
  FiSend,
  FiTrendingUp,
  FiAlertTriangle,
} from "react-icons/fi";
import { getDataAndSet } from "@/helpers/functions/getDataAndSet";

// Charts
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip as ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";

ChartJS.register(
  ArcElement,
  ChartTooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

/* -------------------------------- Helpers -------------------------------- */

function phonePretty(p) {
  if (!p) return "—";
  return p.startsWith("+") ? p : `+${p}`;
}

/* ---------- Intl helpers ---------- */
function makeNumberFormatter(localeCandidates = ["ar-AE", "ar", "en"]) {
  for (const loc of localeCandidates) {
    try {
      return new Intl.NumberFormat(loc);
    } catch {}
  }
  return new Intl.NumberFormat();
}
const nf = makeNumberFormatter(["ar-AE", "ar", "en"]);
function fmtNum(v) {
  const n = Number.isFinite(Number(v)) ? Number(v) : 0;
  return nf.format(n);
}
function pctClamp(v) {
  const n = Number(v) || 0;
  return Math.max(0, Math.min(100, n));
}

/* ---------- tiny colored dot ---------- */
function Dot({ color = "#999" }) {
  return (
    <Box
      sx={{
        width: 10,
        height: 10,
        borderRadius: "50%",
        bgcolor: color,
        display: "inline-block",
        mr: 1,
      }}
    />
  );
}

/* ---------- table under charts ---------- */
function ChartDataTable({ labels = [], rows = {}, columns = [] }) {
  // columns: [{ key, label, color?, postfix? }]
  return (
    <Paper variant="outlined" sx={{ mt: 1.5, borderRadius: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ whiteSpace: "nowrap", fontWeight: 700 }}>
              البند
            </TableCell>
            {columns.map((c) => (
              <TableCell key={c.key} align="right" sx={{ fontWeight: 700 }}>
                <Stack direction="row" alignItems="center" justifyContent="end">
                  {c.color ? <Dot color={c.color} /> : null}
                  <span>{c.label}</span>
                </Stack>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {labels.map((label, i) => (
            <TableRow key={label + i}>
              <TableCell sx={{ maxWidth: 360 }}>{label}</TableCell>
              {columns.map((c) => (
                <TableCell key={c.key} align="right">
                  {fmtNum(rows?.[c.key]?.[i] ?? 0)}
                  {c.postfix === "%" ? "%" : ""}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );
}

/* ---------- center total plugin for doughnut ---------- */
const CenterTotalPlugin = {
  id: "centerTotal",
  afterDraw(chart, _args, opts) {
    const { ctx, chartArea } = chart;
    const dataset = chart.data.datasets?.[0];
    if (!dataset) return;
    const total = (dataset.data || []).reduce((a, b) => a + Number(b || 0), 0);
    const { top, bottom, left, right } = chartArea;
    const x = (left + right) / 2;
    const y = (top + bottom) / 2;
    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = opts?.color || "#666";
    ctx.font = "700 18px sans-serif";
    ctx.fillText(fmtNum(total), x, y - 6);
    ctx.font = "400 12px sans-serif";
    ctx.fillText(opts?.label || "الإجمالي", x, y + 12);
    ctx.restore();
  },
};

/* ---------- UI atoms ---------- */
function SectionTitle({ icon, title, subtitle }) {
  return (
    <Stack
      direction="row"
      alignItems="center"
      spacing={1.25}
      sx={{ mb: 1.5, flexWrap: "wrap" }}
    >
      <Box
        sx={{ display: "inline-flex", fontSize: 22, color: "text.secondary" }}
      >
        {icon}
      </Box>
      <Typography variant="h6" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body2" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Stack>
  );
}

function StatChip({ label, value, color = "default" }) {
  return (
    <Chip
      size="medium"
      color={color}
      variant="outlined"
      label={`${label}: ${fmtNum(value ?? 0)}`}
      sx={(t) => ({
        mr: 1,
        mb: 1,
        fontSize: t.typography.pxToRem(13),
        height: 34,
        px: 1,
      })}
    />
  );
}

function PercentBar({ value, label = "نسبة النجاح" }) {
  const pct = pctClamp(value);
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ mb: 0.75 }}
      >
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          {fmtNum(Number(pct.toFixed(1)))}%
        </Typography>
      </Stack>
      <LinearProgress
        variant="determinate"
        value={pct}
        sx={{
          height: 10,
          borderRadius: 6,
          "& .MuiLinearProgress-bar": { borderRadius: 6 },
        }}
      />
    </Box>
  );
}

function ChartPlaceholder({ height = 300, text = "لا توجد بيانات للعرض" }) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1}
      sx={{
        width: "100%",
        height,
        borderRadius: 3,
        border: "1px dashed",
        borderColor: "divider",
        bgcolor: "background.default",
      }}
    >
      <Skeleton variant="circular" width={52} height={52} />
      <Typography variant="body2" color="text.secondary">
        {text}
      </Typography>
    </Stack>
  );
}

/* ---------- KPI Card ---------- */
function KpiCard({ icon, title, total, success, fail, successPct, colors }) {
  return (
    <Card sx={{ height: "100%", borderRadius: 4 }}>
      <CardContent sx={{ p: 2.75 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{ mb: 1 }}
        >
          <Box sx={{ fontSize: 22, color: "text.secondary" }}>{icon}</Box>
          <Typography variant="subtitle1" fontWeight={800}>
            {title}
          </Typography>
        </Stack>

        <Paper
          variant="outlined"
          sx={(t) => ({
            p: 1.5,
            mb: 1.25,
            borderRadius: 3,
            bgcolor:
              t.palette.mode === "light" ? "grey.50" : "background.paper",
          })}
        >
          <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.1 }}>
            {fmtNum(total || 0)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            الإجمالي
          </Typography>
        </Paper>

        <Stack direction="row" flexWrap="wrap" gap={1.25} mb={1.25}>
          <StatChip label="تم" value={success} color={colors.successChip} />
          <StatChip label="فشل" value={fail} color={colors.failChip} />
        </Stack>

        <PercentBar value={successPct} />
      </CardContent>
    </Card>
  );
}

/* -------------------------------- Main -------------------------------- */

export default function WhatsappStats() {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const isLgUp = useMediaQuery(theme.breakpoints.up("lg"));

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const timerRef = useRef(null);

  const fetchData = async () => {
    await getDataAndSet({
      url: "/whatsapp/v2/stats",
      setData,
      setLoading,
    });
    setLastUpdated(new Date());
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      timerRef.current = setInterval(fetchData, 60 * 1000);
    }
    return () => timerRef.current && clearInterval(timerRef.current);
  }, [autoRefresh]);

  const incoming = data?.incoming;
  const outgoing = data?.outgoing;

  const incomingToday = incoming?.overview?.today ?? {};
  const incomingAll = incoming?.overview?.all ?? {};
  const outgoingToday = outgoing?.overview?.today ?? {};
  const outgoingAll = outgoing?.overview?.all ?? {};

  // intents ranked (limit to top 6, always show in roomy horizontal layout)
  const intentsRanked = useMemo(() => {
    if (!incoming?.byIntent?.ranked) return [];
    return incoming.byIntent.ranked.slice(0, 6);
  }, [incoming]);

  // chart sizes
  const chartHeight = isLgUp ? 360 : isMdUp ? 320 : 280;
  const intentsHeight = Math.max(420, (intentsRanked?.length || 0) * 64);

  // colors
  const cSuccess = theme.palette.success.main;
  const cError = theme.palette.error.main;
  const cPrimary = theme.palette.primary.main;
  const cInfo = theme.palette.info.main;
  const cMuted =
    theme.palette.mode === "light"
      ? theme.palette.grey[300]
      : theme.palette.grey[700];

  /* ---------- Doughnuts (today) ---------- */
  const doughnutIncomingToday = useMemo(() => {
    const total = Number(incomingToday.total || 0);
    const success = Number(incomingToday.responded || 0);
    const failed = Number(incomingToday.failed || 0);
    const other = Math.max(0, total - success - failed);
    if (total <= 0) return null;
    return {
      labels: ["تم الرد", "فشل", "أخرى"],
      datasets: [
        {
          data: [success, failed, other],
          backgroundColor: [cSuccess, cError, cMuted],
          hoverOffset: 6,
          borderWidth: 2,
          borderColor: theme.palette.background.paper,
          spacing: 2,
        },
      ],
    };
  }, [incomingToday, cSuccess, cError, cMuted, theme.palette.background.paper]);

  const doughnutOutgoingToday = useMemo(() => {
    const total = Number(outgoingToday.total || 0);
    const delivered = Number(outgoingToday.delivered || 0);
    const failed = Number(outgoingToday.failed || 0);
    const other = Math.max(0, total - delivered - failed);
    if (total <= 0) return null;
    return {
      labels: ["تم التسليم", "فشل", "أخرى"],
      datasets: [
        {
          data: [delivered, failed, other],
          backgroundColor: [cPrimary, cError, cMuted],
          hoverOffset: 6,
          borderWidth: 2,
          borderColor: theme.palette.background.paper,
          spacing: 2,
        },
      ],
    };
  }, [outgoingToday, cPrimary, cError, cMuted, theme.palette.background.paper]);

  /* ---------- Intents: roomy, horizontal, grouped bars (today vs period) ---------- */
  const intentsBar = useMemo(() => {
    if (!intentsRanked.length) return null;
    const labels = intentsRanked.map(
      (r) => incoming?.byIntent?.labels?.[r.key] || r.key
    );

    // values
    const todayVals = intentsRanked.map((r) => r.today || 0);
    const allVals = intentsRanked.map((r) => r.all || 0);

    return {
      labels,
      datasets: [
        {
          type: "bar",
          label: "طوال الفترة",
          data: allVals,
          backgroundColor:
            theme.palette.mode === "light"
              ? theme.palette.grey[400]
              : theme.palette.grey[600],
          borderRadius: 8,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        },
        {
          type: "bar",
          label: "اليوم",
          data: todayVals,
          backgroundColor: theme.palette.info.main,
          borderRadius: 8,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        },
      ],
    };
  }, [intentsRanked, incoming, theme.palette]);

  /* ---------- Times ---------- */
  const lastUpdatedText = lastUpdated
    ? new Intl.DateTimeFormat("ar-EG", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(lastUpdated)
    : "—";

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 3 } }} dir="rtl">
      {/* Header */}
      <Card sx={{ mb: 3, borderRadius: 4, boxShadow: 1 }}>
        <CardHeader
          sx={{ pb: 0 }}
          title={
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box sx={{ display: "inline-flex", fontSize: 26 }}>
                <FiBarChart2 />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900 }}>
                إحصاءات واتساب
              </Typography>
              <Badge
                sx={{ ml: 1 }}
                color="secondary"
                badgeContent={incomingToday?.total ?? 0}
              >
                <Typography variant="body2" color="text.secondary">
                  وارد اليوم
                </Typography>
              </Badge>
            </Stack>
          }
          action={
            <Stack
              direction="row"
              alignItems="center"
              spacing={1.25}
              sx={{ pr: 1 }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mr: 1 }}
              >
                آخر تحديث: {lastUpdatedText}
              </Typography>
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Switch
                    size="small"
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                }
                label={<Typography variant="body2">تحديث تلقائي</Typography>}
              />
              <Tooltip title="تحديث الكل">
                <span>
                  <IconButton onClick={fetchData} disabled={loading}>
                    <FiRefreshCw />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          }
        />
        {loading && <LinearProgress />}
      </Card>

      <Grid container spacing={3}>
        {/* KPIs */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <KpiCard
            icon={<FiMessageSquare />}
            title="الوارد — اليوم"
            total={incomingToday.total}
            success={incomingToday.responded}
            fail={incomingToday.failed}
            successPct={incomingToday.successPct}
            colors={{ successChip: "success", failChip: "error" }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <KpiCard
            icon={<FiMessageSquare />}
            title="الوارد — طوال الفترة"
            total={incomingAll.total}
            success={incomingAll.responded}
            fail={incomingAll.failed}
            successPct={incomingAll.successPct}
            colors={{ successChip: "success", failChip: "error" }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <KpiCard
            icon={<FiSend />}
            title="الصادر — اليوم"
            total={outgoingToday.total}
            success={outgoingToday.delivered}
            fail={outgoingToday.failed}
            successPct={outgoingToday.successPct}
            colors={{ successChip: "primary", failChip: "error" }}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <KpiCard
            icon={<FiSend />}
            title="الصادر — طوال الفترة"
            total={outgoingAll.total}
            success={outgoingAll.delivered}
            fail={outgoingAll.failed}
            successPct={outgoingAll.successPct}
            colors={{ successChip: "primary", failChip: "error" }}
          />
        </Grid>

        {/* Doughnut: Incoming Today */}
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <Card sx={{ height: "100%", borderRadius: 4 }}>
            <CardContent sx={{ p: 2.75 }}>
              <SectionTitle icon={<FiTrendingUp />} title="تفصيل وارد اليوم" />
              <Box
                sx={{
                  height: chartHeight,
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                {doughnutIncomingToday ? (
                  <Doughnut
                    data={doughnutIncomingToday}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: "64%",
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: { usePointStyle: true },
                        },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => `${ctx.label}: ${fmtNum(ctx.raw)}`,
                          },
                        },
                        centerTotal: {
                          color: theme.palette.text.secondary,
                          label: "الإجمالي",
                        },
                      },
                    }}
                    plugins={[CenterTotalPlugin]}
                  />
                ) : (
                  <ChartPlaceholder height={chartHeight} />
                )}
              </Box>

              {doughnutIncomingToday && (
                <ChartDataTable
                  labels={doughnutIncomingToday.labels}
                  columns={[
                    {
                      key: "values",
                      label: "عدد",
                      color:
                        doughnutIncomingToday.datasets[0].backgroundColor[0],
                    },
                  ]}
                  rows={{ values: doughnutIncomingToday.datasets[0].data }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Doughnut: Outgoing Today */}
        <Grid size={{ xs: 12, md: 6, lg: 6 }}>
          <Card sx={{ height: "100%", borderRadius: 4 }}>
            <CardContent sx={{ p: 2.75 }}>
              <SectionTitle icon={<FiTrendingUp />} title="تفصيل صادر اليوم" />
              <Box
                sx={{
                  height: chartHeight,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {doughnutOutgoingToday ? (
                  <Doughnut
                    data={doughnutOutgoingToday}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      cutout: "64%",
                      plugins: {
                        legend: {
                          position: "bottom",
                          labels: { usePointStyle: true },
                        },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => `${ctx.label}: ${fmtNum(ctx.raw)}`,
                          },
                        },
                        centerTotal: {
                          color: theme.palette.text.secondary,
                          label: "الإجمالي",
                        },
                      },
                    }}
                    plugins={[CenterTotalPlugin]}
                  />
                ) : (
                  <ChartPlaceholder height={chartHeight} />
                )}
              </Box>

              {doughnutOutgoingToday && (
                <ChartDataTable
                  labels={doughnutOutgoingToday.labels}
                  columns={[
                    {
                      key: "values",
                      label: "عدد",
                      color:
                        doughnutOutgoingToday.datasets[0].backgroundColor[0],
                    },
                  ]}
                  rows={{ values: doughnutOutgoingToday.datasets[0].data }}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Intents: Bigger, Horizontal, Grouped Bars + Table */}
        <Grid size={{ xs: 12, md: 12 }}>
          <Card sx={{ height: "100%", borderRadius: 4 }}>
            <CardContent sx={{ p: 2.75 }}>
              <SectionTitle
                icon={<FiTrendingUp />}
                title="أكثر الخدمات طلباً (مقارنة اليوم بالفترة)"
                subtitle="حتى ٦ عناصر — عرض أفقي أوضح"
              />
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box sx={{ height: intentsHeight }}>
                    {intentsBar ? (
                      <Bar
                        data={intentsBar}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          indexAxis: "y",
                          plugins: {
                            legend: { position: "bottom" },
                            tooltip: {
                              mode: "index",
                              intersect: false,
                              callbacks: {
                                label: (ctx) =>
                                  `${ctx.dataset.label}: ${fmtNum(
                                    ctx.parsed.x ?? ctx.parsed
                                  )}`,
                              },
                            },
                          },
                          scales: {
                            x: {
                              beginAtZero: true,
                              grid: { color: theme.palette.divider },
                              ticks: { precision: 0 },
                            },
                            y: {
                              grid: { display: false },
                              ticks: {
                                callback: (val) => {
                                  const lbl = intentsBar.labels[val] || "";
                                  return lbl.length > 28
                                    ? lbl.slice(0, 26) + "…"
                                    : lbl;
                                },
                              },
                            },
                          },
                          interaction: { mode: "index", intersect: false },
                        }}
                      />
                    ) : (
                      <ChartPlaceholder height={intentsHeight} />
                    )}
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, md: 6 }}>
                  {intentsBar && (
                    <ChartDataTable
                      labels={intentsBar.labels}
                      columns={[
                        {
                          key: "all",
                          label: "طوال الفترة",
                          color: intentsBar.datasets[0].backgroundColor,
                        },
                        {
                          key: "today",
                          label: "اليوم",
                          color: theme.palette.info.main,
                        },
                      ]}
                      rows={{
                        all: intentsBar.datasets[0].data,
                        today: intentsBar.datasets[1].data,
                      }}
                    />
                  )}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Divider sx={{ my: 2, width: "100%" }} />
        {/* Reminders */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 4, height: "100%" }}>
            <CardContent sx={{ p: 2.75 }}>
              <SectionTitle
                icon={<FiAlertTriangle />}
                title="التذكيرات (تم التسليم مقابل فشل)"
              />

              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                طوال الفترة
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1.25} mb={1.25}>
                <StatChip
                  label="إجمالي"
                  value={outgoing?.reminders?.all?.total}
                />
                <StatChip
                  label="تم التسليم"
                  value={outgoing?.reminders?.all?.delivered}
                  color="primary"
                />
                <StatChip
                  label="فشل"
                  value={outgoing?.reminders?.all?.failed}
                  color="error"
                />
              </Stack>
              <PercentBar value={outgoing?.reminders?.all?.successPct} />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                اليوم
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1.25} mb={1.25}>
                <StatChip
                  label="إجمالي"
                  value={outgoing?.reminders?.today?.total}
                />
                <StatChip
                  label="تم التسليم"
                  value={outgoing?.reminders?.today?.delivered}
                  color="primary"
                />
                <StatChip
                  label="فشل"
                  value={outgoing?.reminders?.today?.failed}
                  color="error"
                />
              </Stack>
              <PercentBar value={outgoing?.reminders?.today?.successPct} />
            </CardContent>
          </Card>
        </Grid>

        {/* Team alerts */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 4, height: "100%" }}>
            <CardContent sx={{ p: 2.75 }}>
              <SectionTitle
                icon={<FiAlertTriangle />}
                title="تنبيهات الفريق (تم التسليم مقابل فشل)"
              />

              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                طوال الفترة
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1.25} mb={1.25}>
                <StatChip
                  label="إجمالي"
                  value={outgoing?.teamAlerts?.all?.total}
                />
                <StatChip
                  label="تم التسليم"
                  value={outgoing?.teamAlerts?.all?.delivered}
                  color="primary"
                />
                <StatChip
                  label="فشل"
                  value={outgoing?.teamAlerts?.all?.failed}
                  color="error"
                />
              </Stack>
              <PercentBar value={outgoing?.teamAlerts?.all?.successPct} />

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                اليوم
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={1.25} mb={1.25}>
                <StatChip
                  label="إجمالي"
                  value={outgoing?.teamAlerts?.today?.total}
                />
                <StatChip
                  label="تم التسليم"
                  value={outgoing?.teamAlerts?.today?.delivered}
                  color="primary"
                />
                <StatChip
                  label="فشل"
                  value={outgoing?.teamAlerts?.today?.failed}
                  color="error"
                />
              </Stack>
              <PercentBar value={outgoing?.teamAlerts?.today?.successPct} />
            </CardContent>
          </Card>
        </Grid>

        {/* Conversations — KPIs */}
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <KpiCard
            icon={<FiMessageSquare />}
            title="المحادثات — المفتوحة"
            total={data?.conversations?.overview?.open}
            success={data?.conversations?.overview?.activeToday}
            fail={data?.conversations?.overview?.closed}
            successPct={0}
            colors={{ successChip: "info", failChip: "default" }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card sx={{ height: "100%", borderRadius: 4 }}>
            <CardContent sx={{ p: 2.75 }}>
              <SectionTitle icon={<FiTrendingUp />} title="متوسط مدة الإغلاق" />
              <Typography
                variant="h4"
                fontWeight={900}
                sx={{ lineHeight: 1.1 }}
              >
                {data?.conversations?.overview?.avgCloseDuration?.hmm || "0:00"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ساعات : دقائق (لعينات مُغلقة حديثًا)
              </Typography>

              <Divider sx={{ my: 1.5 }} />

              <Stack direction="row" spacing={1} flexWrap="wrap">
                <StatChip
                  label="إجمالي"
                  value={data?.conversations?.overview?.total}
                />
                <StatChip
                  label="مفتوحة"
                  value={data?.conversations?.overview?.open}
                  color="info"
                />
                <StatChip
                  label="مغلقة"
                  value={data?.conversations?.overview?.closed}
                />
                <StatChip
                  label="نشطة اليوم"
                  value={data?.conversations?.overview?.activeToday}
                  color="secondary"
                />
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Top sending clients */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ borderRadius: 4, height: "100%" }}>
            <CardContent sx={{ p: 2.75 }}>
              <SectionTitle
                icon={<FiBarChart2 />}
                title="أكثر العملاء إرسالاً"
                subtitle="حسب مجموع الرسائل في المحادثات المرتبطة بالعميل"
              />
              <Box sx={{ height: 360 }}>
                {Array.isArray(data?.conversations?.topClients) &&
                data.conversations.topClients.length ? (
                  <Bar
                    data={{
                      labels: data.conversations.topClients.map(
                        (c) => c.name || c.phone || "—"
                      ),
                      datasets: [
                        {
                          label: "إجمالي الرسائل",
                          data: data.conversations.topClients.map(
                            (c) => c.totalMessages
                          ),
                          backgroundColor:
                            theme.palette.mode === "light"
                              ? theme.palette.primary.main
                              : theme.palette.primary.light,
                          borderRadius: 8,
                          maxBarThickness: 36,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          callbacks: {
                            label: (ctx) => `الرسائل: ${ctx.parsed.y || 0}`,
                          },
                        },
                      },
                      scales: {
                        x: {
                          grid: {
                            color: theme.palette.divider,
                            borderDash: [3, 3],
                          },
                          ticks: {
                            maxRotation: 0,
                            minRotation: 0,
                            autoSkip: true,
                            callback: (val) => {
                              const c = data.conversations.topClients[val];
                              const lbl = `${c?.name || phonePretty(c?.phone) || ""}`;
                              return lbl.length > 16
                                ? lbl.slice(0, 14) + "…"
                                : lbl;
                            },
                          },
                        },
                        y: {
                          beginAtZero: true,
                          grid: { color: theme.palette.divider },
                          ticks: { precision: 0 },
                        },
                      },
                    }}
                  />
                ) : (
                  <ChartPlaceholder height={360} />
                )}
              </Box>

              {Array.isArray(data?.conversations?.topClients) &&
                data.conversations.topClients.length > 0 && (
                  <ChartDataTable
                    labels={data.conversations.topClients.map(
                      (c) => c.name || phonePretty(c.phone) || "—"
                    )}
                    columns={[
                      {
                        key: "msgs",
                        label: "إجمالي الرسائل",
                        color: theme.palette.primary.main,
                      },
                      { key: "convos", label: "عدد المحادثات" },
                    ]}
                    rows={{
                      msgs: data.conversations.topClients.map(
                        (c) => c.totalMessages
                      ),
                      convos: data.conversations.topClients.map(
                        (c) => c.conversations
                      ),
                    }}
                  />
                )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
