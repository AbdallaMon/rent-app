"use client";
import React, { useEffect, useState, Fragment } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Link as MuiLink,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import HomeWorkIcon from "@mui/icons-material/HomeWork";
import ApartmentIcon from "@mui/icons-material/Apartment";
import DescriptionIcon from "@mui/icons-material/Description";
import PaymentsIcon from "@mui/icons-material/Payments";
import HandymanIcon from "@mui/icons-material/Handyman";
import dayjs from "dayjs";

export default function JournalLineDetailsModal({
  open,
  lineId,
  onClose,
  onJumpToLine,
}) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    if (!open || !lineId) return;
    setLoading(true);
    setError("");
    try {
      // keep same endpoint; just ensure it’s a valid template string
      const res = await fetch(`/api/main/accounting/journal/${lineId}`);
      const data = await res.json();
      setPayload(data);
    } catch (e) {
      setError(e?.message || "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    (async () => {
      if (!open || !lineId) return;
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/main/accounting/journal/${lineId}`);
        const data = await res.json();
        if (active) setPayload(data);
      } catch (e) {
        if (active) setError(e?.message || "حدث خطأ غير متوقع");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [open, lineId]);

  const p = payload;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        تفاصيل سطر اليومية
        <IconButton onClick={onClose} sx={{ ml: "auto" }} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent dividers sx={{ p: { xs: 2, sm: 3 } }}>
        {/* Loading */}
        {loading && <LoadingSkeleton />}

        {/* Error */}
        {!loading && error && (
          <Alert
            severity="error"
            sx={{ mb: 2 }}
            action={
              <Button color="inherit" size="small" onClick={load}>
                إعادة المحاولة
              </Button>
            }
          >
            {error}
          </Alert>
        )}

        {/* Content */}
        {!loading && !error && p && (
          <Stack spacing={2.5}>
            <SectionCard>
              <CardContent sx={{ pb: 2 }}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "flex-start", sm: "center" }}
                  spacing={1.5}
                  justifyContent="space-between"
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
                      {p.memo || p.counterpartyLabel || "بدون وصف"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                      sx={{ mt: 0.5 }}
                    >
                      #{p.id} • {p.side === "DEBIT" ? "مدين" : "دائن"} • قيمة:{" "}
                      {Number(p.amount || 0).toLocaleString()}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    <Chip
                      size="small"
                      color={p.isSettled ? "success" : "warning"}
                      label={p.isSettled ? "مُسوّى" : "غير مُسوّى"}
                      variant={p.isSettled ? "filled" : "outlined"}
                    />
                    {p.createdAt && (
                      <Chip
                        size="small"
                        label={`تاريخ القيد: ${dayjs(p.createdAt).format(
                          "YYYY-MM-DD"
                        )}`}
                        variant="outlined"
                      />
                    )}
                    {p.settledAt && (
                      <Chip
                        size="small"
                        label={`تاريخ التسوية: ${dayjs(p.settledAt).format(
                          "YYYY-MM-DD"
                        )}`}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </SectionCard>

            {/* Entities / Links */}
            <SectionCard title="الروابط">
              <CardContent sx={{ pt: 1 }}>
                <List dense disablePadding>
                  {p.companyBankAccount && (
                    <EntityRow
                      icon={<AccountBalanceIcon />}
                      primary={`حساب شركة: ${p.companyBankAccount.name}`}
                      href={`/bank-accounts/${p.companyBankAccount.id}`}
                    />
                  )}

                  {p.glAccount && (
                    <EntityRow
                      icon={<AccountTreeIcon />}
                      primary={`حساب GL: ${p.glAccount.code} - ${p.glAccount.name}`}
                    />
                  )}

                  {p.partyClient && (
                    <EntityRow
                      icon={<PersonOutlineIcon />}
                      primary={`طرف: ${
                        p.partyType === "OWNER" ? "مالك" : "مستأجر"
                      } - ${p.partyClient.name}`}
                      href={`/clients/${p.partyClient.id}`}
                    />
                  )}

                  {p.property && (
                    <EntityRow
                      icon={<HomeWorkIcon />}
                      primary={`عقار #${p.property.id} - ${p.property.name}`}
                      href={`/properties/${p.property.id}`}
                    />
                  )}

                  {p.unit && (
                    <EntityRow
                      icon={<ApartmentIcon />}
                      primary={`وحدة #${p.unit.id} - ${p.unit.number || ""}`}
                      href={`/units/${p.unit.id}`}
                    />
                  )}

                  {p.rentAgreement && (
                    <EntityRow
                      icon={<DescriptionIcon />}
                      primary={`عقد إيجار #${p.rentAgreement.id}`}
                      href={`/rent/${p.rentAgreement.id}`}
                    />
                  )}

                  {p.payment && (
                    <EntityRow
                      icon={<PaymentsIcon />}
                      primary={`دفعة #${p.payment.id}`}
                    />
                  )}

                  {p.securityDeposit && (
                    <EntityRow
                      icon={<PaymentsIcon />}
                      primary={`وديعة #${p.securityDeposit.id} - الحالة: ${p.securityDeposit.status}`}
                      href={`/security-deposits/${p.securityDeposit.id}`}
                    />
                  )}

                  {p.maintenance && (
                    <EntityRow
                      icon={<HandymanIcon />}
                      primary={`صيانة #${p.maintenance.id}`}
                    />
                  )}
                </List>
              </CardContent>
            </SectionCard>

            {/* Settlements */}
            <SectionCard title="التسويات المرتبطة">
              <CardContent sx={{ pt: 1 }}>
                {payload?.settlements?.length ? (
                  <Stack spacing={1.5}>
                    {payload.settlements.map((sett) => (
                      <Card
                        key={sett.id}
                        variant="outlined"
                        sx={{ borderRadius: 2 }}
                      >
                        <CardContent sx={{ p: 1.5 }}>
                          <Typography
                            variant="subtitle1"
                            sx={{ mb: 1, fontWeight: 600 }}
                          >
                            تسوية #{sett.id} •{" "}
                            {dayjs(sett.matchedAt).format("YYYY-MM-DD")}
                          </Typography>

                          <Stack spacing={1}>
                            {sett.lines.map((ln) => (
                              <SettlementLineCard
                                key={ln.id}
                                ln={ln}
                                onJumpToLine={onJumpToLine}
                              />
                            ))}
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                ) : (
                  <Typography
                    color="text.secondary"
                    align="center"
                    sx={{ py: 1 }}
                  >
                    لا توجد تسويات مرتبطة بهذا السطر.
                  </Typography>
                )}
              </CardContent>
            </SectionCard>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Small building blocks ---------- */

function SectionCard({ title, children }) {
  return (
    <Card variant="outlined" sx={{ borderRadius: 2 }}>
      {title && (
        <CardHeader
          title={
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          }
          sx={{ pb: 0.5 }}
        />
      )}
      {children}
    </Card>
  );
}

function EntityRow({ icon, primary, href }) {
  return (
    <ListItem
      sx={{
        px: 0,
        "&:not(:last-of-type) .MuiDivider-root": { display: "block" },
      }}
      secondaryAction={
        href ? (
          <Tooltip title="فتح الصفحة">
            <IconButton
              edge="end"
              size="small"
              component={MuiLink}
              href={href}
              target="_blank"
              rel="noopener"
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : null
      }
    >
      <ListItemAvatar>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "action.hover",
            display: "grid",
            placeItems: "center",
          }}
        >
          {icon}
        </Box>
      </ListItemAvatar>
      <ListItemText
        primaryTypographyProps={{ variant: "body2", noWrap: true }}
        primary={primary}
      />
    </ListItem>
  );
}

function SettlementLineCard({ ln, onJumpToLine }) {
  const sideIsDebit = ln.side === "DEBIT";
  const sideLabel = sideIsDebit ? "مدين" : "دائن";

  return (
    <Paper variant="outlined" sx={{ p: 1.25, borderRadius: 2 }}>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1.5}
      >
        <Box minWidth={0}>
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
            سطر #{ln.lineId} • {sideLabel}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {ln.line?.memo || "بدون وصف"}
          </Typography>
        </Box>

        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="flex-end"
          flexShrink={0}
        >
          <Chip
            size="small"
            color={sideIsDebit ? "success" : "info"}
            variant="outlined"
            label={`قيمة: ${Number(ln.amountMatched || 0).toLocaleString()}`}
          />
          <Typography variant="caption" color="text.secondary" noWrap>
            {dayjs(ln.createdAt).format("YYYY-MM-DD")}
          </Typography>
          <Button
            size="small"
            variant="outlined"
            endIcon={<OpenInNewIcon />}
            onClick={() => onJumpToLine(ln.lineId)}
          >
            فتح
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

function LoadingSkeleton() {
  return (
    <Fragment>
      <Stack spacing={2.5}>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent>
            <Skeleton variant="text" width="40%" height={28} />
            <Skeleton variant="text" width="60%" />
            <Stack direction="row" spacing={1} mt={1}>
              <Skeleton variant="rounded" width={90} height={28} />
              <Skeleton variant="rounded" width={150} height={28} />
            </Stack>
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardHeader
            title={<Skeleton variant="text" width={120} height={24} />}
          />
          <CardContent>
            {[...Array(4)].map((_, i) => (
              <Stack
                key={i}
                direction="row"
                alignItems="center"
                spacing={1.5}
                sx={{ py: 0.75 }}
              >
                <Skeleton variant="circular" width={36} height={36} />
                <Skeleton variant="text" sx={{ flex: 1 }} />
                <Skeleton variant="rounded" width={28} height={28} />
              </Stack>
            ))}
          </CardContent>
        </Card>

        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardHeader
            title={<Skeleton variant="text" width={160} height={24} />}
          />
          <CardContent>
            <Skeleton variant="rounded" height={64} />
            <Skeleton variant="rounded" height={64} sx={{ mt: 1 }} />
          </CardContent>
        </Card>
      </Stack>

      {/* Fallback spinner if you like */}
      <Stack alignItems="center" py={2}>
        <CircularProgress size={22} />
      </Stack>
    </Fragment>
  );
}
