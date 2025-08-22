"use client";
import { useState, useEffect } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Button,
  IconButton,
  Tooltip
} from "@mui/material";
import TableFormProvider from "@/app/context/TableFormProvider/TableFormProvider";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import ReplyForm from "@/components/ui/FormComponents/Forms/reply-form";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PaginationControls from "@/components/request/pagination";

export default function ContactFormPage() {
  const [contactForms, setContactForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [replyFormOpen, setReplyFormOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchContactForms();
  }, [page, rowsPerPage]);

  const fetchContactForms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/request/contact?id=contactForm&page=${page}&limit=${rowsPerPage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contact forms');
      }
      
      const data = await response.json();
      setContactForms(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching contact forms:", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleReply = (form) => {
    setSelectedForm(form);
    setReplyFormOpen(true);
  };
  const handleSubmitReply = async ({ title, message }) => {
    if (isSending) return;
    
    try {
      setIsSending(true);
      const sanitizedMessage = message.replace(/\n/g, " ").replace(/\t/g, " ").replace(/\s{2,}/g, " ");
  
      const emailResponse = await fetch("/api/notifications/email/contact_form/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedForm.name,
          email: "info@example.com", // Default email since not available in Contact table
          phone: selectedForm.phone,
          message: `${title}\n\n${message}`,
        }),
      });
  
      if (!emailResponse.ok) {
        throw new Error("Failed to send email");
      }
  
      const whatsappResponse = await fetch("/api/notifications/whatsapp/contact_form/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone: selectedForm.phone,
          message: `${title} ${sanitizedMessage}`,
        }),
      });
  
      if (!whatsappResponse.ok) {
        throw new Error("Failed to send WhatsApp message");
      }
      
      return true;
    } catch (error) {
      console.error("Error sending reply:", error);
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  return (
    <TableFormProvider url={"request/contact"}>
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          نماذج الاتصال
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ mt: 2 }}>
            Error: {error}
          </Typography>
        ) : (
          <>
            <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>                    <TableRow>
                      <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">ID</TableCell>
                      <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">الاسم</TableCell>
                      <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">الهاتف</TableCell>
                      <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">الوصف</TableCell>
                      <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">تاريخ الإنشاء</TableCell>
                      <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">إجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {contactForms.length > 0 ? (
                      contactForms.map((form) => (                        <TableRow key={form.id} hover>
                          <TableCell align="right">{form.id}</TableCell>
                          <TableCell align="right">{form.name}</TableCell>
                          <TableCell align="right">{form.phone}</TableCell>
                          <TableCell align="right">{form.description}</TableCell>
                          <TableCell align="right">{formatDate(form.createdAt)}</TableCell>
                          <TableCell align="right">
                            <Tooltip title="رد عبر واتساب">
                              <IconButton
                                size="small"
                                onClick={() => handleReply(form)}
                                color="primary"
                              >
                                <WhatsAppIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          No contact forms found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            <PaginationControls
              count={Math.ceil(totalCount / rowsPerPage)}
              page={page}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
          </>
        )}

        <Button 
          variant="outlined" 
          color="primary" 
          sx={{ mt: 3 }}
          onClick={fetchContactForms}
        >
          تحديث البيانات
        </Button>

        <ReplyForm
          open={replyFormOpen}
          onClose={() => setReplyFormOpen(false)}
          onSubmit={handleSubmitReply}
        />
        
        <ToastContainer />
      </Box>
    </TableFormProvider>
  );
}
