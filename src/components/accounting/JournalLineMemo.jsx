import { Stack } from "@mui/material";
import { Typography } from "antd";
import DebitIcon from "@mui/icons-material/CallReceived";
import CreditIcon from "@mui/icons-material/CallMade";
export function getJournalLineDisplay(line) {
  if (!line) return null;

  if (line.companyBankAccount) {
    return {
      label: `حساب شركة: ${line.companyBankAccount.name}`,
    };
  }

  if (line.glAccount) {
    return {
      label: `حساب GL: ${line.glAccount.code} - ${line.glAccount.name}`,
    };
  }

  if (line.partyClient) {
    return {
      label: `طرف: ${
        line.partyType === "OWNER" ? "مالك" : "مستأجر"
      } - ${line.partyClient.name}`,
    };
  }

  if (line.counterpartyLabel) {
    return {
      label: `جهة: ${line.counterpartyLabel}`,
    };
  }

  return null;
}
export function JournalLineMemo({ line }) {
  const data = getJournalLineDisplay(line);
  if (!data) return null;

  return (
    <Stack spacing={0.5}>
      {line.side === "DEBIT" ? (
        <>
          <DebitIcon />
          <Typography variant="h6">المدين</Typography>
        </>
      ) : (
        <>
          <CreditIcon />
          <Typography variant="h6">الدائن</Typography>
        </>
      )}
      <Typography variant="body2" color="text.secondary">
        {data.label}
      </Typography>
      <Typography variant="body1" noWrap>
        {line.memo || line.counterpartyLabel || "بدون وصف"}
      </Typography>
      <Typography variant="body2" color="text.secondary" noWrap>
        قيمة: {Number(line.amount || 0).toLocaleString()}
      </Typography>
    </Stack>
  );
}
