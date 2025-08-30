import { AiFillCloseCircle, AiOutlineSwap } from "react-icons/ai";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  useTheme,
  Button,
} from "@mui/material";
import { BankCashForm } from "./utility";
import { useState } from "react";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";

export default function CreateAJournalEntry({ onSuccess }) {
  const theme = useTheme();
  const [openTransfer, setOpenTransfer] = useState(false);
  const { setLoading } = useToastContext();
  async function onSubmit(data) {
    const response = await handleRequestSubmit(
      data,
      setLoading,
      "/main/accounting/accounts",
      false,
      "جاري المعالجة"
    );
    if (response && response.status === 200) {
      if (onSuccess) {
        onSuccess();
      }
      return response;
    }
  }
  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpenTransfer(true)}
        startIcon={<AiOutlineSwap size={18} />}
      >
        اضافة قيد محسابي
      </Button>

      <Dialog
        open={openTransfer}
        onClose={() => setOpenTransfer(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ pr: 6 }}>
          اضافة قيد محسابي
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
    </>
  );
}
