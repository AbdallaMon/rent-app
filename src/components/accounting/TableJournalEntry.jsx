"use client";
import React, { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlined from "@mui/icons-material/InfoOutlined";

import JournalEntryDetailsModal from "./JournalEntryDetailsModal";
export default function TableJournalEntry({ entry }) {
  const [open, setOpen] = useState(false);
  const [id, setId] = useState(null);
  function onOpenDetails(id) {
    setId(id);
    setOpen(true);
  }
  function onCloseDetails() {
    setId(null);
    setOpen(false);
  }
  return (
    <>
      {id && open && (
        <JournalEntryDetailsModal
          entryId={entry.id}
          open={open}
          onClose={onCloseDetails}
          onJumpToLine={onOpenDetails}
        />
      )}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        justifyContent="space-between"
      >
        <Button
          size="small"
          variant="outlined"
          startIcon={<InfoOutlined />}
          onClick={() => onOpenDetails(entry.id)}
        >
          تفاصيل القيد
        </Button>
      </Stack>
    </>
  );
}
