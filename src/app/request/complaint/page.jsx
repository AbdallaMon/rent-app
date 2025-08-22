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
  Tooltip,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@mui/material";
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailIcon from '@mui/icons-material/Email';
import DeleteIcon from '@mui/icons-material/Delete';
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PaginationControls from "@/components/request/pagination";

// Define enum values matching prisma schema
const ComplaintStatus = {
  PENDING: 'PENDING',
  REVIEWING: 'REVIEWING',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED'
};

const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
};

// Reply Form Component
const ReplyForm = ({ open, onClose, onSubmit, titlePrefix }) => {
  const [title, setTitle] = useState(titlePrefix || '');
  const [message, setMessage] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, message });
  };
  
  if (!open) return null;
  
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{ 
          p: 3, 
          width: '90%', 
          maxWidth: 600,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <Typography variant="h6" gutterBottom>
        الرد على الشكوى
        </Typography>
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <input
            id="title"
            style={{ 
              padding: '10px',
              fontSize: '16px',
              width: '100%',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </FormControl>
        
        <FormControl fullWidth sx={{ mb: 3 }}>
          <textarea
            id="message"
            style={{ 
              padding: '10px',
              fontSize: '16px',
              width: '100%',
              minHeight: '150px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              resize: 'vertical'
            }}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </FormControl>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={onClose}>
          يلغي
          </Button>
          <Button variant="contained" type="submit" color="primary">
          إرسال الرد
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default function ComplaintPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [replyFormOpen, setReplyFormOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState(null);

  useEffect(() => {
    fetchComplaints();
  }, [page, rowsPerPage, statusFilter, priorityFilter]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      let url = `/api/request/complaint?page=${page}&limit=${rowsPerPage}`;
      
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }
      
      if (priorityFilter !== 'ALL') {
        url += `&priority=${priorityFilter}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }
      
      const data = await response.json();
      setComplaints(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching complaints:", err);
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

  const handleReply = (complaint) => {
    setSelectedComplaint(complaint);
    setReplyFormOpen(true);
  };

  const handleStatusChange = async (complaintId, newStatus) => {
    try {
      const response = await fetch(`/api/request/complaint/${complaintId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update complaint status');
      }

      toast.success('Complaint status updated successfully');
      fetchComplaints();
    } catch (error) {
      console.error('Error updating complaint status:', error);
      toast.error('Failed to update complaint status');
    }
  };

  const handleSubmitReply = async ({ title, message }) => {
    if (isSending || !selectedComplaint) return;
    
    try {
      setIsSending(true);
      const sanitizedMessage = message.replace(/\n/g, " ").replace(/\t/g, " ").replace(/\s{2,}/g, " ");
  
      // Email response
      const emailResponse = await fetch("/api/notifications/email/contact_form/reply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: selectedComplaint.client.name,
          email: selectedComplaint.client.email,
          phone: selectedComplaint.client.phone,
          message: `${title}\n\n${message}`,
          complaintId: selectedComplaint.id,
        }),
      });
  
      if (!emailResponse.ok) {
        throw new Error("Failed to send email");
      }
  
      // WhatsApp response if phone exists
      if (selectedComplaint.client.phone) {
        const whatsappResponse = await fetch("/api/notifications/whatsapp/contact_form/reply", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phone: selectedComplaint.client.phone,
            message: `${title} ${sanitizedMessage}`,
            complaintId: selectedComplaint.id,
          }),
        });
  
        if (!whatsappResponse.ok) {
          console.warn("Failed to send WhatsApp message");
        }
      }
      
      toast.success("Reply sent successfully");
      setReplyFormOpen(false);
      return true;
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
      throw error;
    } finally {
      setIsSending(false);
    }
  };

  const openDeleteDialog = (complaint) => {
    setComplaintToDelete(complaint);
    setDeleteDialogOpen(true);
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setComplaintToDelete(null);
  };

  const handleDeleteComplaint = async () => {
    if (!complaintToDelete) return;
    
    try {
      const response = await fetch(`/api/request/complaint/${complaintToDelete.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete complaint');
      }
      
      toast.success('Complaint deleted successfully');
      fetchComplaints();
      closeDeleteDialog();
    } catch (error) {
      console.error('Error deleting complaint:', error);
      toast.error('Failed to delete complaint');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'warning';
      case 'REVIEWING': return 'info';
      case 'RESOLVED': return 'success';
      case 'REJECTED': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'LOW': return 'success';
      case 'MEDIUM': return 'info';
      case 'HIGH': return 'warning';
      case 'URGENT': return 'error';
      default: return 'default';
    }
  };

  const getPropertyInfo = (complaint) => {
    if (complaint.unit?.property) {
      return {
        unitInfo: `وحدة: ${complaint.unit.number || complaint.unit.id}`,
        propertyInfo: `عقار: ${complaint.unit.property.name}`,
        bothDefined: true
      };
    } else if (complaint.property) {
      return {
        propertyInfo: `عقار: ${complaint.property.name}`,
        bothDefined: false
      };
    } else if (complaint.unit && !complaint.unit.property) {
      return {
        unitInfo: `وحدة: ${complaint.unit.number || complaint.unit.id}`,
        propertyInfo: "عقار: غير محدد",
        bothDefined: true
      };
    } else {
      return {
        propertyInfo: "عقار: غير محدد",
        bothDefined: false
      };
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        إدارة الشكاوى
      </Typography>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>الحالة</InputLabel>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            label="الحالة"
          >
            <MenuItem value="ALL">جميع الحالات</MenuItem>
            {Object.values(ComplaintStatus).map(status => (
              <MenuItem key={status} value={status}>
                {status}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 180 }}>
          <InputLabel>الأولوية</InputLabel>
          <Select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            label="الأولوية"
          >
            <MenuItem value="ALL">جميع الأولويات</MenuItem>
            {Object.values(Priority).map(priority => (
              <MenuItem key={priority} value={priority}>
                {priority}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

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
                <TableHead>
                  <TableRow>
                    <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">ID</TableCell>
                    <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">العميل</TableCell>
                    <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">الوحدة/العقار</TableCell>
                    <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">الوصف</TableCell>
                    <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">الحالة</TableCell>
                    <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">الأولوية</TableCell>
                    <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">تاريخ</TableCell>
                    <TableCell sx={{backgroundColor:"primary.main", color:"white"}} align="right">الإجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {complaints.length > 0 ? (
                    complaints.map((complaint) => {
                      const { unitInfo, propertyInfo, bothDefined } = getPropertyInfo(complaint);
                      
                      return (
                        <TableRow key={complaint.id} hover>
                          <TableCell align="right">{complaint.id}</TableCell>
                          <TableCell align="right">
                            {complaint.client.name}
                            <Typography variant="body2" color="text.secondary">
                              {complaint.client.phone}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            {bothDefined && (
                              <>
                                <Typography variant="body2">
                                  {unitInfo}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  {propertyInfo}
                                </Typography>
                              </>
                            )}
                            {!bothDefined && (
                              <Typography variant="body2">
                                {propertyInfo}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right" sx={{ maxWidth: 300 }}>
                            <Typography noWrap>
                              {complaint.description}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={complaint.status} 
                              color={getStatusColor(complaint.status)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={complaint.priority} 
                              color={getPriorityColor(complaint.priority)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="right">{formatDate(complaint.createdAt)}</TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="تغيير الحالة">
                                <FormControl size="small">
                                  <Select
                                    value={complaint.status}
                                    onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                                    sx={{ height: 32 }}
                                  >
                                    {Object.values(ComplaintStatus).map(status => (
                                      <MenuItem key={status} value={status}>
                                        {status}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Tooltip>
                              
                              <Tooltip title="الرد عبر واتساب">
                                <IconButton
                                  size="small"
                                  onClick={() => handleReply(complaint)}
                                  color="primary"
                                >
                                  <WhatsAppIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="الرد عبر البريد الإلكتروني">
                                <IconButton
                                  size="small"
                                  onClick={() => handleReply(complaint)}
                                  color="primary"
                                >
                                  <EmailIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="حذف الشكوى">
                                <IconButton
                                  size="small"
                                  onClick={() => openDeleteDialog(complaint)}
                                  color="error"
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        لم يتم العثور على شكاوى
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
        onClick={fetchComplaints}
      >
        تحديث البيانات
      </Button>

      <ReplyForm
        open={replyFormOpen}
        onClose={() => setReplyFormOpen(false)}
        onSubmit={handleSubmitReply}
        titlePrefix={`Re: Complaint #${selectedComplaint?.id || ''}`}
      />
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>حذف الشكوى</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من أنك تريد حذف هذه الشكوى؟ لا يمكن التراجع عن هذا الإجراء.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog} color="primary">
            إلغاء
          </Button>
          <Button onClick={handleDeleteComplaint} color="error" autoFocus>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
      
      <ToastContainer position="bottom-right" />
    </Box>
  );
}
