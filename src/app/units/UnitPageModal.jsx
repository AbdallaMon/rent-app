"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import UnitPage from "./[id]/page";
import { getCurrentPrivilege } from "@/helpers/functions/getUserPrivilege";
import { usePathname } from "next/navigation";
import { useAuth } from "../context/AuthProvider/AuthProvider";

export default function UnitModal({ unitId, onSubmit }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const pathName = usePathname();

  function checkIfCanEdit() {
    const currentPrivilege = getCurrentPrivilege(user, pathName);
    return currentPrivilege?.privilege.canEdit;
  }
  const canEdit = checkIfCanEdit();
  const handleClose = () => {
    setOpen(false);
  };
  if (!canEdit) return;
  return (
    <>
      <Button variant="contained" onClick={() => setOpen(true)} sx={{ mr: 1 }}>
        تعديل الوحدة
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <UnitPage
            params={{ id: unitId }}
            onSubmit={onSubmit}
            handleClose={handleClose}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={handleClose}>الغاء</Button>
          {/* <Button 
                        variant="contained" 
                        onClick={handleClose}
                    >
                        Confirm
                    </Button> */}
        </DialogActions>
      </Dialog>
    </>
  );
}
