import { useState } from "react";
import { Box, Button, Modal, Typography } from "@mui/material";
import { useAuth } from "@/app/context/AuthProvider/AuthProvider";
import { usePathname } from "next/navigation";
import { getCurrentPrivilege } from "@/helpers/functions/getUserPrivilege";

const style = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
};
export default function DeleteBtn({
  handleDelete,
  message = "في حالة حذف هذا العنصر سيتم حذف جميع العناصر المرتبطه به",
}) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const pathName = usePathname();
  const currentPrivilege = getCurrentPrivilege(user, pathName);

  function handleClose() {
    setOpen(false);
  }

  if (!currentPrivilege?.privilege.canDelete) return null;
  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        type={"delete"}
        variant="contained"
        color="error"
        sx={{
          mr: 1,
          mt: 1,
        }}
      >
        حذف
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            هل أنت متأكد من حذف العنصر؟
          </Typography>
          <Typography id="modal-modal-description" sx={{ mt: 2 }}>
            {message}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
            <Button onClick={handleClose}>إلغاء</Button>
            <Button onClick={handleDelete} type={"delete"} color={"error"}>
              حذف
            </Button>
          </Box>
        </Box>
      </Modal>
    </>
  );
}
