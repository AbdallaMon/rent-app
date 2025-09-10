"use client";
import React, { useState } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Button,
  useTheme,
  Typography,
  Chip,
} from "@mui/material";
import {
  AiFillCloseCircle,
  AiOutlineMinusCircle,
  AiOutlinePlusCircle,
} from "react-icons/ai";
import {
  FaMoneyBillWave,
  FaHandHoldingUsd,
  FaFileInvoiceDollar,
} from "react-icons/fa";
import { BankCashForm } from "./utility";

export default function PettyCashActions({ onSubmit }) {
  const theme = useTheme();
  const [openInflow, setOpenInflow] = useState(false);
  const [openOutflow, setOpenOutflow] = useState(false);

  return (
    <Box>
      <Box
        sx={{
          bgcolor: "background.paper",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          p: 2,
        }}
      >
        {/* Header */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2, gap: 2 }}>
          <FaFileInvoiceDollar size={24} color={theme.palette.primary.main} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            معاملات صندوق النثرية
          </Typography>
          <Chip
            label="الصندوق مفتوح"
            color="success"
            size="small"
            sx={{ ml: "auto" }}
          />
        </Box>

        <Divider sx={{ mb: 2 }} />

        <ListItem
          sx={{
            mb: 2,
            bgcolor: theme.palette.success.main + "08",
            borderRadius: 2,
            border: "1px solid",
            borderColor: theme.palette.success.main + "20",
          }}
          secondaryAction={
            <Button
              variant="contained"
              color="success"
              onClick={() => setOpenInflow(true)}
              startIcon={<FaMoneyBillWave size={18} />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 2.5,
                fontWeight: 600,
              }}
            >
              تعبئة الصندوق
            </Button>
          }
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: theme.palette.success.main }}>
              <AiOutlinePlusCircle size={22} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="تعبئة صندوق النثرية"
            secondary="إضافة رصيد جديد للصندوق من الحساب الرئيسي"
            primaryTypographyProps={{ fontWeight: 600 }}
          />
        </ListItem>

        {/* Disbursement Action */}
        <ListItem
          sx={{
            bgcolor: theme.palette.error.main + "08",
            borderRadius: 2,
            border: "1px solid",
            borderColor: theme.palette.error.main + "20",
          }}
          secondaryAction={
            <Button
              variant="contained"
              color="error"
              onClick={() => setOpenOutflow(true)}
              startIcon={<FaHandHoldingUsd size={18} />}
              sx={{
                borderRadius: 2,
                textTransform: "none",
                px: 2.5,
                fontWeight: 600,
              }}
            >
              صرف نثرية
            </Button>
          }
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: theme.palette.error.main }}>
              <AiOutlineMinusCircle size={22} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="صرف من الصندوق"
            secondary="دفع مصروفات نثرية صغيرة من الصندوق"
            primaryTypographyProps={{ fontWeight: 600 }}
          />
        </ListItem>
      </Box>

      {/* Replenishment Dialog */}
      <Dialog
        open={openInflow}
        onClose={() => setOpenInflow(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: `2px solid ${theme.palette.success.main}20`,
          },
        }}
      >
        <DialogTitle
          sx={{
            pr: 6,
            bgcolor: theme.palette.success.main + "08",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <FaMoneyBillWave size={24} color={theme.palette.success.main} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              تعبئة صندوق النثرية
            </Typography>
          </Box>
          <IconButton
            aria-label="إغلاق"
            onClick={() => setOpenInflow(false)}
            sx={{ position: "absolute", left: 8, top: 8 }}
          >
            <AiFillCloseCircle />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <BankCashForm
            variant="inflow"
            isPettyCash={true}
            onCancel={() => setOpenInflow(false)}
            onSubmit={async (payload) => {
              onSubmit && (await onSubmit(payload));
              setOpenInflow(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Disbursement Dialog */}
      <Dialog
        open={openOutflow}
        onClose={() => setOpenOutflow(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            border: `2px solid ${theme.palette.error.main}20`,
          },
        }}
      >
        <DialogTitle
          sx={{
            pr: 6,
            bgcolor: theme.palette.error.main + "08",
            borderBottom: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <FaHandHoldingUsd size={24} color={theme.palette.error.main} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              صرف من صندوق النثرية
            </Typography>
            <Typography variant="caption" color="text.secondary">
              دفع مصروفات نثرية صغيرة
            </Typography>
          </Box>
          <IconButton
            aria-label="إغلاق"
            onClick={() => setOpenOutflow(false)}
            sx={{ position: "absolute", left: 8, top: 8 }}
          >
            <AiFillCloseCircle />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <BankCashForm
            variant="outflow"
            isPettyCash={true}
            onCancel={() => setOpenOutflow(false)}
            onSubmit={async (payload) => {
              onSubmit && (await onSubmit(payload));
              setOpenOutflow(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
}
