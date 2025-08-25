"use client";
import React, { useMemo } from "react";
import {
  Box,
  Card,
  CardHeader,
  CardContent,
  Chip,
  Divider,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import DebitIcon from "@mui/icons-material/CallReceived";
import CreditIcon from "@mui/icons-material/CallMade";
import JournalLineItem from "./JournalLineItem.jsx";

export default function JournalEntryPanel({ lines = [], withValue = false }) {
  const { debitLines, creditLines, debitTotal, creditTotal } = useMemo(() => {
    const d = lines.filter((l) => l.side === "DEBIT");
    const c = lines.filter((l) => l.side === "CREDIT");
    const sum = (arr) => arr.reduce((s, x) => s + (x.amount || 0), 0);
    return {
      debitLines: d,
      creditLines: c,
      debitTotal: sum(d),
      creditTotal: sum(c),
    };
  }, [lines]);
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardHeader
            title={
              <Stack direction="row" spacing={1} alignItems="center">
                <DebitIcon />
                <Typography variant="h6">المدين</Typography>
                {withValue && (
                  <Chip
                    size="small"
                    color="success"
                    label={debitTotal.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  />
                )}
              </Stack>
            }
          />
          <Divider />
          <CardContent>
            <Stack spacing={1.5}>
              {debitLines.map((line) => (
                <JournalLineItem key={line.id} line={line} />
              ))}
              {debitLines.length === 0 && (
                <Typography color="text.secondary">
                  لا يوجد سطور مدينة.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card variant="outlined">
          <CardHeader
            title={
              <Stack direction="row" spacing={1} alignItems="center">
                <CreditIcon />
                <Typography variant="h6">الدائن</Typography>
                <Typography variant="h6"></Typography>

                {withValue && (
                  <Chip
                    size="small"
                    color="info"
                    label={creditTotal.toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}
                  />
                )}
              </Stack>
            }
          />
          <Divider />
          <CardContent>
            <Stack spacing={1.5}>
              {creditLines.map((line) => (
                <JournalLineItem key={line.id} line={line} />
              ))}
              {creditLines.length === 0 && (
                <Typography color="text.secondary">
                  لا يوجد سطور دائنة.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
}
