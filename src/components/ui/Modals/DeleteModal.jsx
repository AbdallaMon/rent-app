import React, { useState, useMemo, useCallback } from "react";
import {
  Box,
  Fade,
  Modal,
  Button,
  Typography,
  IconButton,
  Stack,
  Tooltip,
  CircularProgress,
  Divider,
} from "@mui/material";
import { MdDelete } from "react-icons/md";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import { simpleModalStyle } from "@/config/constants";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";

export default function DeleteModal({
  handleClose,
  item,
  setData,
  href,
  setTotal,
  archive = false,
  buttonType = "TEXT",
  extra,
  fullButtonWidth = false,
  externalSubText,
}) {
  const { setLoading } = useToastContext();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const primaryLabel = archive ? "أرشفة" : "حذف";
  const confirmVerb = archive ? "أرشفة" : "حذف";
  const confirmColor = archive ? "warning" : "error";
  const iconAria = archive ? "أرشفة العنصر" : "حذف العنصر";

  const itemName =
    item?.name ||
    item?.title ||
    item?.label ||
    (typeof item?.id !== "undefined" ? `#${item.id}` : "هذا العنصر");

  const confirmQuestion = archive
    ? `هل أنت متأكد من أرشفة ${itemName}؟`
    : `هل أنت متأكد من حذف ${itemName}؟`;

  const subText = externalSubText
    ? externalSubText
    : archive
      ? "سيتم نقل العنصر إلى الأرشيف ويمكن استعادته لاحقًا."
      : "هذا إجراء نهائي. لا يمكن التراجع عن الحذف.";

  const handleDeleteOpen = useCallback(() => setOpen(true), []);
  const handleCloseLocal = useCallback(() => {
    if (!submitting) setOpen(false);
  }, [submitting]);

  const handleDeleteOrArchive = useCallback(async () => {
    setSubmitting(true);
    const url = archive
      ? `${href}/${item.id}?${extra ? extra : ""}&`
      : `${href}/${item.id}?${extra ? extra : ""}&`;
    const method = archive ? "PATCH" : "DELETE";
    const message = archive ? "جاري الأرشفة..." : "جاري الحذف...";
    const result = await handleRequestSubmit(
      {},
      setLoading,
      url,
      false,
      message,
      method
    );
    setSubmitting(false);

    if (result.status === 200) {
      setOpen(false);
      if (setData) {
        setData((prevData) =>
          prevData.filter((dataItem) => dataItem.id !== item.id)
        );
      }
      if (setTotal) setTotal((prev) => prev - 1);
      if (handleClose) handleClose();
    }
  }, [
    archive,
    href,
    item?.id,
    extra,
    setData,
    setTotal,
    handleClose,
    setLoading,
  ]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!submitting) handleDeleteOrArchive();
      }
    },
    [submitting, handleDeleteOrArchive]
  );

  // ---- Trigger (unchanged behavior) ----
  if (!open)
    return buttonType === "ICON" ? (
      <Tooltip title={primaryLabel}>
        <span>
          <IconButton
            onClick={handleDeleteOpen}
            color={confirmColor}
            size="small"
            aria-label={iconAria}
          >
            <MdDelete />
          </IconButton>
        </span>
      </Tooltip>
    ) : (
      <Button
        fullWidth={fullButtonWidth}
        variant="contained"
        color={confirmColor}
        onClick={handleDeleteOpen}
        sx={{ textTransform: "none", borderRadius: 2 }}
      >
        {primaryLabel}
      </Button>
    );

  // ---- Modal ----
  return (
    <Modal
      open={open}
      onClose={handleCloseLocal}
      closeAfterTransition
      keepMounted
    >
      <Fade in={open}>
        <Box
          sx={{
            ...simpleModalStyle,
            p: 3,
            borderRadius: 3,
            minWidth: 360,
            maxWidth: 560,
            width: "90vw",
            outline: "none",
            bgcolor: "background.paper",
            boxShadow: 6,
          }}
          onKeyDown={onKeyDown}
          dir="rtl"
        >
          <Stack spacing={2}>
            {/* Header */}
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Typography variant="h6" fontWeight={700}>
                {confirmQuestion}
              </Typography>
              <IconButton
                aria-label="إغلاق"
                onClick={handleCloseLocal}
                disabled={submitting}
                size="small"
              >
                {/* using same delete icon keeps bundle small; change if you prefer */}
                <MdDelete style={{ opacity: 0.4 }} />
              </IconButton>
            </Stack>

            <Typography variant="body2" color="text.secondary">
              {subText}
            </Typography>

            <Divider />

            {/* Actions */}
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1.5}
              justifyContent="flex-end"
            >
              <Button
                variant="outlined"
                onClick={handleCloseLocal}
                disabled={submitting}
                sx={{ minWidth: 120, borderRadius: 2 }}
              >
                إلغاء
              </Button>

              <Button
                variant="contained"
                color={confirmColor}
                onClick={handleDeleteOrArchive}
                disabled={submitting}
                sx={{ minWidth: 140, borderRadius: 2 }}
                autoFocus
              >
                {submitting ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={18} />
                    <span>{archive ? "جاري الأرشفة..." : "جاري الحذف..."}</span>
                  </Stack>
                ) : (
                  confirmVerb
                )}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Fade>
    </Modal>
  );
}
