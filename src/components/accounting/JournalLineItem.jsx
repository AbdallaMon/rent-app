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
import DoneAllIcon from "@mui/icons-material/DoneAll";
import PendingIcon from "@mui/icons-material/HourglassEmpty";
import JournalLineDetailsModal from "./JournalLineDetailsModal";
import { JournalLineMemo } from "./JournalLineMemo.jsx";
export default function JournalLineItem({ line }) {
  const settled = Boolean(line.isSettled);
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
        <JournalLineDetailsModal
          lineId={id}
          open={open}
          onClose={onCloseDetails}
          onJumpToLine={onOpenDetails}
        />
      )}
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0 }}>
            <JournalLineMemo line={line} />
          </Box>

          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            <Tooltip title={settled ? "تمت التسوية" : "غير مُسوّى"}>
              <Chip
                size="small"
                color={settled ? "success" : "warning"}
                icon={settled ? <DoneAllIcon /> : <PendingIcon />}
                label={settled ? "مُسوّى" : "غير مُسوّى"}
              />
            </Tooltip>

            <Button
              size="small"
              variant="outlined"
              startIcon={<InfoOutlined />}
              onClick={() => onOpenDetails(line.id)}
            >
              التفاصيل
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}
