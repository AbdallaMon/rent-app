// file: src/app/UiComponents/FormComponents/Forms/reply-form/index.jsx
"use client";
import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from "@mui/material";
import { toast } from "react-toastify";
// Remove the import for ToastContainer
// Remove "react-toastify/dist/ReactToastify.css" - it's now in the parent

export default function ReplyForm({ open, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
 
  const handleSubmit = async () => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      await onSubmit({ title, message });
      toast.success("تم إرسال الرسالة بنجاح!", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        rtl: true,
      });
      setTitle("");
      setMessage("");
      onClose();
    } catch (error) {
      toast.error("فشل في إرسال الرسالة. حاول مرة أخرى.", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        rtl: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };
 
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>رد على الاتصال</DialogTitle>
      <DialogContent>
        <TextField
          label="العنوان"
          fullWidth
          margin="normal"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          label="الرسالة"
          fullWidth
          multiline
          rows={4}
          margin="normal"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ alignContent: "flex-start" }}>
        <Button onClick={onClose}>إلغاء</Button>
        <Button 
          onClick={handleSubmit} 
          color="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "جاري الإرسال..." : "إرسال"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
