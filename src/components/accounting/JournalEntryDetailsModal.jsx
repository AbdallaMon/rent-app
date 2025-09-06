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
  Grid,
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
import { getJournalLineDisplay } from "./TableJournalLine";

export default function JournalEntryDetailsModal({ open, entryId, onClose }) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState(null);
  const [error, setError] = useState("");

  async function load() {
    if (!open || !entryId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `/api/main/accounting/journal/entries/${entryId}`
      );
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
    if (active && open && entryId) {
      load();
    }
    return () => {
      active = false;
    };
  }, [open, entryId]);

  const p = payload;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      scroll="paper"
    >
      <DialogTitle
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 1,
          bgcolor: "background.paper",
          fontWeight: 700,
          display: "flex",
          alignItems: "center",
          gap: 1,
          py: 1.25,
          "& .MuiIconButton-root": { ml: "auto" },
          borderBottom: (t) => `1px solid ${t.palette.divider}`,
        }}
      >
        تفاصيل القيد
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <Divider />

      <DialogContent
        dividers
        sx={{
          p: { xs: 2, sm: 3 },
          "& .MuiCard-root": { borderRadius: 2, overflow: "hidden" },
          "& .MuiChip-root": { borderRadius: 1.5 },
        }}
      >
        {loading && <LoadingSkeleton />}

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
                  sx={{ gap: 2 }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }} noWrap>
                      {p?.description || "بدون وصف"}
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      noWrap
                      sx={{ mt: 0.5 }}
                    >
                      #{p.id} قيمة:
                      {Number(p.lines[0].amount || 0).toLocaleString()}
                    </Typography>
                  </Box>

                  <Stack
                    direction="row"
                    spacing={1}
                    flexWrap="wrap"
                    sx={{ "& > *": { mr: 1, mb: 1 } }}
                  >
                    <Chip
                      size="small"
                      color={p.lines[0].isSettled ? "success" : "warning"}
                      label={p.lines[0].isSettled ? "مُسوّى" : "غير مُسوّى"}
                      variant={p.lines[0].isSettled ? "filled" : "outlined"}
                    />
                    {p.entryDate && (
                      <Chip
                        size="small"
                        label={`تاريخ القيد: ${dayjs(p.entryDate).format(
                          "YYYY-MM-DD"
                        )}`}
                        variant="outlined"
                      />
                    )}
                    {p.lines[0].settledAt && (
                      <Chip
                        size="small"
                        label={`تاريخ التسوية: ${dayjs(
                          p.lines[0].settledAt
                        ).format("YYYY-MM-DD")}`}
                        variant="outlined"
                      />
                    )}
                  </Stack>
                </Stack>
              </CardContent>
            </SectionCard>

            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              تفاصيل الاسطر
            </Typography>

            <Grid container spacing={1.5}>
              {p.lines.map((line) => (
                <Grid size={{ xs: 12, sm: 6 }} key={line.id}>
                  <LineRelations p={line} />
                </Grid>
              ))}
            </Grid>

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
                        <CardContent sx={{ p: 1.25 }}>
                          <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            sx={{ mb: 1 }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{ fontWeight: 600 }}
                            >
                              تسوية #{sett.id} •{" "}
                              {dayjs(sett.matchedAt).format("YYYY-MM-DD")}
                            </Typography>
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`قيمة: ${Number(
                                sett.lines[0].amountMatched || 0
                              ).toLocaleString()}`}
                            />
                          </Stack>

                          <Stack spacing={1}>
                            {sett.lines.map((ln) => (
                              <SettlementLineCard key={ln.id} ln={ln} />
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
    <Card
      variant="outlined"
      sx={{
        borderRadius: 2,
        transition: "border-color 120ms ease",
        "&:hover": { borderColor: "primary.light" },
      }}
    >
      {title && (
        <CardHeader
          title={
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {title}
            </Typography>
          }
          sx={{ py: 1.25, pb: 0.75 }}
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
        py: 0.5,
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
      <ListItemAvatar sx={{ minWidth: 48 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            bgcolor: "action.hover",
            display: "grid",
            placeItems: "center",
            border: (t) => `1px solid ${t.palette.divider}`,
          }}
        >
          {icon}
        </Box>
      </ListItemAvatar>
      <Tooltip title={primary} placement="top" enterDelay={600}>
        <ListItemText
          primary={primary}
          primaryTypographyProps={{
            variant: "body2",
            noWrap: true,
            sx: { fontWeight: 500 },
          }}
        />
      </Tooltip>
    </ListItem>
  );
}

function SettlementLineCard({ ln }) {
  const sideIsDebit = ln.line.side === "DEBIT";
  const sideLabel = sideIsDebit ? "مدين" : "دائن";
  const lineData = getJournalLineDisplay(ln.line);
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.25,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.25,
        borderLeft: (t) =>
          `4px solid ${sideIsDebit ? t.palette.success.main : t.palette.info.main}`,
      }}
    >
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="subtitle2" noWrap sx={{ fontWeight: 600 }}>
            سطر {sideLabel}
          </Typography>
        </Stack>
        {lineData.label}
        <Typography variant="body2" color="text.secondary" noWrap>
          {ln.line?.memo || "بدون وصف"}
        </Typography>
      </Box>
    </Paper>
  );
}

function LoadingSkeleton() {
  return (
    <Fragment>
      <Stack spacing={2.5}>
        <Card variant="outlined" sx={{ borderRadius: 2 }}>
          <CardContent sx={{ pt: 2, pb: 2 }}>
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
          <CardContent sx={{ pt: 2, pb: 2 }}>
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
          <CardContent sx={{ pt: 2, pb: 2 }}>
            <Skeleton variant="rounded" height={64} />
            <Skeleton variant="rounded" height={64} sx={{ mt: 1 }} />
          </CardContent>
        </Card>
      </Stack>

      <Stack alignItems="center" py={2}>
        <CircularProgress size={22} />
      </Stack>
    </Fragment>
  );
}

function LineRelations({ p }) {
  return (
    <>
      <SectionCard title={p.side === "DEBIT" ? "المدين" : "الدائن"}>
        <CardContent sx={{ pt: 0.5, pb: 1 }}>
          <List
            dense
            disablePadding
            sx={{
              "& .MuiListItem-root": { py: 0.25 },
              "& .MuiListItemSecondaryAction-root": { right: 0 },
            }}
          >
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
    </>
  );
}
