"use client";
import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardHeader,
  CardContent,
  Chip,
  Stack,
  Typography,
  Divider,
  Grid,
  Alert,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  useTheme,
  alpha,
  Container,
  Avatar,
  TableContainer,
  Tooltip,
} from "@mui/material";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import {
  FiFileText,
  FiAlertCircle,
  FiCalendar,
  FiHash,
  FiUser,
  FiHome,
  FiKey,
  FiDollarSign,
  FiEye,
  FiCreditCard,
  FiTrendingUp,
  FiClock,
  FiInfo,
  FiActivity,
  FiBarChart2,
} from "react-icons/fi";
import { PaymentType } from "@/config/Enums";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";

dayjs.locale("ar");

function formatDate(d) {
  if (!d) return "—";
  return dayjs(d).isValid() ? dayjs(d).format("DD/MM/YYYY") : "—";
}

const AR_STATUS = {
  DRAFT: "غير مدفوعة",
  SENT: "مرسلة",
  PARTIALLY_PAID: "مدفوعة جزئيًا",
  PAID: "مدفوعة",
  OVERDUE: "متأخرة",
  CANCELED: "ملغاة",
};

function StatusChip({ status }) {
  const theme = useTheme();

  const map = {
    PAID: { color: "success", icon: <FiCreditCard /> },
    OVERDUE: { color: "error", icon: <FiAlertCircle /> },
    PARTIALLY_PAID: { color: "warning", icon: <FiTrendingUp /> },
    SENT: { color: "info", icon: <FiFileText /> },
    DRAFT: { color: "default", icon: <FiFileText /> },
    CANCELED: { color: "default", icon: <FiFileText /> },
  };

  const cfg = map[status] || map.DRAFT;
  const tone =
    cfg.color === "default"
      ? theme.palette.text.secondary
      : theme.palette[cfg.color].main;

  return (
    <Chip
      icon={cfg.icon}
      label={`الحالة: ${AR_STATUS[status] || status}`}
      sx={{
        bgcolor: alpha(tone, 0.08),
        color: tone,
        border: `1px solid ${alpha(tone, 0.25)}`,
        fontWeight: 600,
        height: 34,
      }}
      size="medium"
      variant="outlined"
    />
  );
}

function StatItem({ icon, label, value, color = "text.primary" }) {
  const theme = useTheme();
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: 2.5,
        height: "100%",
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Avatar
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.08),
            color: theme.palette.primary.main,
            width: 40,
            height: 40,
          }}
        >
          {icon}
        </Avatar>
        <Box flex={1}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 700 }}
          >
            {label}
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.5, fontWeight: 800, color }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export default function BillingInvoiceViewDialogButton({
  invoice,
  buttonLabel = "عرض التفاصيل",
}) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();

  const extractPayment = (line) => line?.payment || line || {};
  const paymentRemaining = (p) =>
    Math.max(0, (Number(p.amount) || 0) - (Number(p.paidAmount) || 0));

  const totalApplied = useMemo(
    () =>
      (invoice?.invoicePayments || []).reduce(
        (s, ln) => s + (Number(ln.amountApplied) || 0),
        0
      ),
    [invoice]
  );

  const invoiceAmount = useMemo(() => {
    if (typeof invoice?.amount === "number") return invoice.amount;
    return totalApplied;
  }, [invoice, totalApplied]);

  const invoicePaid = Number(invoice?.paidAmount) || 0;
  const invoiceRemainingAmt = Math.max(0, invoiceAmount - invoicePaid);

  return (
    <>
      <Button
        variant="contained"
        startIcon={<FiEye />}
        size="medium"
        color="info"
        onClick={() => setOpen(true)}
      >
        {buttonLabel}
      </Button>

      <Dialog
        dir="rtl"
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            pb: 1.5,
            pt: 2,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                  color: "primary.main",
                  width: 44,
                  height: 44,
                }}
              >
                <FiFileText />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900 }}>
                  تفاصيل فاتورة المطالبة
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.2 }}
                >
                  رقم الفاتورة: <b>{invoice?.invoiceNumber || "—"}</b>
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1.5}
              alignItems="center"
              flexWrap="wrap"
              useFlexGap
            >
              {invoice?.status ? <StatusChip status={invoice.status} /> : null}
              {invoice?.category ? (
                <Chip
                  icon={<FiKey />}
                  label={`التصنيف: ${PaymentType[invoice.category] || invoice.category}`}
                  variant="outlined"
                  size="medium"
                />
              ) : null}
              <Chip
                icon={<FiCalendar />}
                label={`الاستحقاق: ${formatDate(invoice?.dueDate)}`}
                variant="outlined"
                size="medium"
              />
              {(invoice?.periodStart || invoice?.periodEnd) && (
                <Chip
                  icon={<FiClock />}
                  label={`الفترة: ${formatDate(invoice?.periodStart)} — ${formatDate(
                    invoice?.periodEnd
                  )}`}
                  variant="outlined"
                  size="medium"
                />
              )}
            </Stack>
          </Stack>
        </DialogTitle>

        {/* Body */}
        <DialogContent sx={{ p: 0 }}>
          <Container maxWidth="lg" sx={{ py: 3 }}>
            {/* Top stats */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <StatItem
                  icon={<FiDollarSign />}
                  label="إجمالي الفاتورة"
                  value={formatCurrencyAED(invoiceAmount)}
                  color="primary.main"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <StatItem
                  icon={<FiCreditCard />}
                  label="مدفوع"
                  value={formatCurrencyAED(invoicePaid)}
                  color="success.main"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <StatItem
                  icon={<FiTrendingUp />}
                  label="المتبقي"
                  value={formatCurrencyAED(invoiceRemainingAmt)}
                  color={
                    invoiceRemainingAmt > 0 ? "error.main" : "success.main"
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3 }} />

            {/* Client & context */}
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardHeader
                title="بيانات العميل والسياق"
                sx={{
                  py: 1.5,
                  "& .MuiCardHeader-title": { fontWeight: 800, fontSize: 16 },
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                }}
                avatar={
                  <Avatar
                    sx={{ bgcolor: "primary.main", width: 36, height: 36 }}
                  >
                    <FiUser />
                  </Avatar>
                }
              />
              <CardContent sx={{ pt: 2 }}>
                <Grid container spacing={2}>
                  {invoice?.billedClient?.name ? (
                    <Grid item xs={12} md={4}>
                      <Stack spacing={0.5}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 700 }}
                        >
                          العميل
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {invoice.billedClient.name}
                        </Typography>
                      </Stack>
                    </Grid>
                  ) : null}

                  {invoice?.property?.name ? (
                    <Grid item xs={12} md={4}>
                      <Stack spacing={0.5}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 700 }}
                        >
                          العقار
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <FiHome />
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>
                            {invoice.property.name}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Grid>
                  ) : null}

                  {invoice?.unit?.name ||
                  invoice?.unit?.number ||
                  invoice?.unit?.code ? (
                    <Grid item xs={12} md={4}>
                      <Stack spacing={0.5}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 700 }}
                        >
                          الوحدة
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <FiHash />
                          <Typography variant="body1" sx={{ fontWeight: 700 }}>
                            {invoice?.unit?.name ||
                              invoice?.unit?.number ||
                              invoice?.unit?.code}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Grid>
                  ) : null}
                </Grid>
              </CardContent>
            </Card>

            {/* Description */}
            {invoice?.description ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2.5,
                  mb: 3,
                  borderRight: `4px solid ${theme.palette.info.main}`,
                  borderRadius: 2,
                }}
              >
                <Stack
                  direction="row"
                  spacing={1.5}
                  alignItems="center"
                  sx={{ mb: 0.5 }}
                >
                  <FiInfo />
                  <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                    وصف الفاتورة
                  </Typography>
                </Stack>
                <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
                  {invoice.description}
                </Typography>
              </Paper>
            ) : null}

            {/* Related payments */}
            <Card variant="outlined">
              <CardHeader
                title="الدفعات المرتبطة"
                sx={{
                  py: 1.5,
                  "& .MuiCardHeader-title": { fontWeight: 800, fontSize: 16 },
                  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
                }}
                avatar={
                  <Avatar
                    sx={{ bgcolor: "secondary.main", width: 36, height: 36 }}
                  >
                    <FiActivity />
                  </Avatar>
                }
              />
              <CardContent sx={{ p: 0 }}>
                {(invoice?.invoicePayments || []).length === 0 ? (
                  <Box sx={{ p: 2.5 }}>
                    <Alert
                      icon={<FiAlertCircle />}
                      variant="outlined"
                      severity="info"
                      sx={{ borderRadius: 2 }}
                    >
                      لا توجد دفعات مرتبطة بهذه الفاتورة.
                    </Alert>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table
                      size="medium"
                      stickyHeader
                      aria-label="جدول الدفعات المرتبطة"
                    >
                      <TableHead>
                        <TableRow>
                          <TableCell align="right">#</TableCell>
                          <TableCell align="right">نوع الدفعة</TableCell>
                          <TableCell align="right">تاريخ الاستحقاق</TableCell>
                          <TableCell align="right">تفاصيل</TableCell>
                          <TableCell align="right">إجمالي</TableCell>
                          <TableCell align="right">مدفوع</TableCell>
                          <TableCell align="right">متبقي</TableCell>
                          <TableCell align="right">
                            محمّل على الفاتورة
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(invoice?.invoicePayments || []).map((ln) => {
                          const p = extractPayment(ln);
                          const remain = paymentRemaining(p);
                          const details = [
                            p?.rentAgreement?.rentAgreementNumber
                              ? `عقد: ${p.rentAgreement.rentAgreementNumber}`
                              : null,
                            p?.property?.name
                              ? `عقار: ${p.property.name}`
                              : p?.rentAgreement?.property?.name
                                ? `عقار: ${p?.rentAgreement?.property?.name}`
                                : null,
                            p?.unit?.number ? `وحدة: ${p.unit.number}` : null,
                            p?.maintenance?.description
                              ? `صيانة: ${p.maintenance.description}`
                              : null,
                          ]
                            .filter(Boolean)
                            .join(" | ");

                          return (
                            <TableRow key={ln.id || p.id}>
                              <TableCell align="right">
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  justifyContent="flex-end"
                                  alignItems="center"
                                >
                                  <Avatar
                                    sx={{
                                      width: 28,
                                      height: 28,
                                      bgcolor: alpha(
                                        theme.palette.primary.main,
                                        0.1
                                      ),
                                      color: "primary.main",
                                      fontSize: 12,
                                    }}
                                  >
                                    <FiHash />
                                  </Avatar>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 700 }}
                                  >
                                    {p?.id ?? "—"}
                                  </Typography>
                                </Stack>
                              </TableCell>

                              <TableCell align="right">
                                <Chip
                                  size="small"
                                  label={
                                    PaymentType[p?.paymentType] ||
                                    p?.paymentType ||
                                    "—"
                                  }
                                  variant="outlined"
                                  sx={{
                                    fontWeight: 600,
                                  }}
                                />
                              </TableCell>

                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 600 }}
                                >
                                  {formatDate(p?.dueDate)}
                                </Typography>
                              </TableCell>

                              <TableCell align="right" sx={{ maxWidth: 260 }}>
                                <Tooltip title={details} arrow>
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {details || "—"}
                                  </Typography>
                                </Tooltip>
                              </TableCell>

                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 800 }}
                                >
                                  {formatCurrencyAED(p?.amount || 0)}
                                </Typography>
                              </TableCell>

                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 800,
                                    color: "success.main",
                                  }}
                                >
                                  {formatCurrencyAED(p?.paidAmount || 0)}
                                </Typography>
                              </TableCell>

                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 800,
                                    color:
                                      remain > 0
                                        ? "error.main"
                                        : "success.main",
                                  }}
                                >
                                  {formatCurrencyAED(remain)}
                                </Typography>
                              </TableCell>

                              <TableCell align="right">
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 900,
                                    color: "primary.main",
                                  }}
                                >
                                  {formatCurrencyAED(ln?.amountApplied || 0)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </CardContent>
            </Card>
          </Container>
        </DialogContent>

        {/* Footer */}
        <DialogActions
          sx={{
            px: 3,
            py: 2,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
          }}
        >
          <Container
            maxWidth="lg"
            sx={{ display: "flex", justifyContent: "center" }}
          >
            <Button
              onClick={() => setOpen(false)}
              size="large"
              variant="contained"
            >
              إغلاق
            </Button>
          </Container>
        </DialogActions>
      </Dialog>
    </>
  );
}
