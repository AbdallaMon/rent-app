import { Typography } from "@mui/material";

function glLabel(line) {
  if (!line?.glAccount) return null;
  return `حساب GL: ${line.glAccount.code} - ${line.glAccount.name}`;
}

function renter(line) {
  if (line?.partyClient && line?.partyType === "RENTER") {
    return { type: "RENTER", text: `مستأجر: ${line.partyClient.name}` };
  }
  return null;
}

function property(line) {
  if (line?.property?.name) {
    return { type: "PROPERTY", text: `عقار: ${line.property.name}` };
  }
  return null;
}

function owner(line) {
  if (line?.partyClient && line?.partyType === "OWNER") {
    return { type: "OWNER", text: `مالك: ${line.partyClient.name}` };
  }
  return null;
}

function client(line) {
  if (!line?.partyClient) return null;
  const kind =
    line.partyType === "OWNER"
      ? "مالك"
      : line.partyType === "RENTER"
        ? "مستأجر"
        : "طرف";
  return { type: "CLIENT", text: `${kind}: ${line.partyClient.name}` };
}

function partyTypeOnly(line) {
  if (!line?.partyType) return null;
  const kind = line.partyType === "OWNER" ? "مالك" : "مستأجر";
  return { type: "PARTY_TYPE", text: kind };
}

function counterparty(line) {
  if (!line?.counterpartyLabel) return null;
  return { type: "COUNTERPARTY", text: `جهة: ${line.counterpartyLabel}` };
}

// أولوياتك المخصوصة:
const WITH_GL_PRIORITY = [renter, property, owner]; // مستأجر > عقار > مالك
const WITHOUT_GL_PRIORITY = [property, client, partyTypeOnly, counterparty];

function pickFirst(line, rules) {
  for (const rule of rules) {
    const hit = rule(line);
    if (hit) return hit;
  }
  return null;
}

export function getJournalLineDisplay(line) {
  if (!line) return null;

  const gl = glLabel(line);
  if (gl) {
    const subject = pickFirst(line, WITH_GL_PRIORITY); // داخل حساب GL
    return {
      label: subject ? `${gl} | ${subject.text}` : gl,
      parts: { gl, subject },
      source: subject?.type || "GL_ONLY",
    };
  }

  const subject = pickFirst(line, WITHOUT_GL_PRIORITY);
  if (subject) {
    return {
      label: subject.text,
      parts: { gl: null, subject },
      source: subject.type,
    };
  }

  return null;
}

export default function TableJournalLine({ line }) {
  const data = getJournalLineDisplay(line);
  if (!data) return null;

  return <Typography sx={{ mb: 0.5 }}>{data.label}</Typography>;
}
