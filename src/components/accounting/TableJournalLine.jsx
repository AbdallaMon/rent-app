import { Typography } from "antd";

export function getJournalLineDisplay(line) {
  if (!line) return null;

  if (line.companyBankAccount) {
    return {
      label: `حساب شركة: ${line.companyBankAccount.name}`,
    };
  }

  if (line.glAccount) {
    if (line.partyClient) {
      // render both gl account and party client
      return {
        label: `حساب GL: ${line.glAccount.code} - ${line.glAccount.name} | طرف: ${
          line.partyType === "OWNER" ? "مالك" : "مستأجر"
        } - ${line.partyClient.name}`,
      };
    }
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

export default function TableJournalLine({ line }) {
  const data = getJournalLineDisplay(line);
  if (!data) return null;

  return (
    <Typography
      sx={{
        fontWeight: "bold",
        fontSize: "1.2rem",
        marginBottom: "0.5rem",
      }}
    >
      {data.label}
    </Typography>
  );
}
