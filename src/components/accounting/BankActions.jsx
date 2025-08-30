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
} from "@mui/material";
import {
  AiFillCloseCircle,
  AiOutlineMinusCircle,
  AiOutlinePlusCircle,
  AiOutlineSwap,
} from "react-icons/ai";
import { BankCashForm } from "./utility";

export default function BankActions({ onSubmit }) {
  const theme = useTheme();
  const [openTransfer, setOpenTransfer] = useState(false);
  const [openInflow, setOpenInflow] = useState(false);
  const [openOutflow, setOpenOutflow] = useState(false);

  return (
    <Box>
      <List
        sx={{
          bgcolor: "background.paper",
          borderRadius: 2,
          border: "1px solid",
          borderColor: "divider",
          p: 1,
        }}
      >
        <Divider component="li" sx={{ my: 0.5 }} />
        <ListItem
          secondaryAction={
            <Button
              variant="contained"
              color="success"
              onClick={() => setOpenInflow(true)}
              startIcon={<AiOutlinePlusCircle size={18} />}
              sx={{ borderRadius: 2, textTransform: "none", px: 2.5 }}
            >
              إضافة أموال
            </Button>
          }
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: theme.palette.success.main }}>
              <AiOutlinePlusCircle size={18} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="إضافة أموال (وارد)"
            secondary="إيداع/استلام أموال في حساب الشركة"
            primaryTypographyProps={{ fontWeight: 600 }}
          />
        </ListItem>

        <Divider component="li" sx={{ my: 0.5 }} />

        <ListItem
          secondaryAction={
            <Button
              variant="contained"
              color="error"
              onClick={() => setOpenOutflow(true)}
              startIcon={<AiOutlineMinusCircle size={18} />}
              sx={{ borderRadius: 2, textTransform: "none", px: 2.5 }}
            >
              سحب
            </Button>
          }
        >
          <ListItemAvatar>
            <Avatar sx={{ bgcolor: theme.palette.error.main }}>
              <AiOutlineMinusCircle size={18} />
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary="سحب (صادر)"
            secondary="صرف/سحب أموال من حساب الشركة"
            primaryTypographyProps={{ fontWeight: 600 }}
          />
        </ListItem>
      </List>

      <Dialog
        open={openTransfer}
        onClose={() => setOpenTransfer(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          تحويل داخلي
          <IconButton
            aria-label="إغلاق"
            onClick={() => setOpenTransfer(false)}
            sx={{ position: "absolute", left: 8, top: 8 }}
          >
            <AiFillCloseCircle />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <BankCashForm
            variant="transfer"
            onCancel={() => setOpenTransfer(false)}
            onSubmit={async (payload) => {
              onSubmit && (await onSubmit(payload));
              setOpenTransfer(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={openInflow}
        onClose={() => setOpenInflow(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          إضافة أموال (وارد)
          <IconButton
            aria-label="إغلاق"
            onClick={() => setOpenInflow(false)}
            sx={{ position: "absolute", left: 8, top: 8 }}
          >
            <AiFillCloseCircle />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <BankCashForm
            variant="inflow"
            onCancel={() => setOpenInflow(false)}
            onSubmit={async (payload) => {
              onSubmit && (await onSubmit(payload));
              setOpenInflow(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={openOutflow}
        onClose={() => setOpenOutflow(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          سحب (صادر)
          <IconButton
            aria-label="إغلاق"
            onClick={() => setOpenOutflow(false)}
            sx={{ position: "absolute", left: 8, top: 8 }}
          >
            <AiFillCloseCircle />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <BankCashForm
            variant="outflow"
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
