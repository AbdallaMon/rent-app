// file: src/app/request/maintenance/page.jsx
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
  Chip,
  CircularProgress,
  Button,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  InputLabel,
  FormControl
} from "@mui/material";
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import TableFormProvider from "@/app/context/TableFormProvider/TableFormProvider";

import CreateMaintenanceRequestForm from "@/components/ui/FormComponents/Forms/CreateMaintenanceRequest";
import MaintenanceRequestStatusForm from "@/components/ui/FormComponents/Forms/Maintanace_request";
import PaginationControls from "@/components/request/pagination";

// Status color mapping
const statusColors = {
  PENDING: "warning",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  REJECTED: "error"
};

// Status translation
const statusTranslation = {
  PENDING: "قيد الانتظار",
  IN_PROGRESS: "قيد التنفيذ",
  COMPLETED: "مكتمل",
  REJECTED: "مرفوض"
};

// Priority translation and colors
const priorityTranslation = {
  LOW: "منخفضة",
  MEDIUM: "متوسطة",
  HIGH: "عالية",
  URGENT: "عاجلة"
};

const priorityColors = {
  LOW: "success",
  MEDIUM: "info",
  HIGH: "warning",
  URGENT: "error"
};

export default function MaintenanceRequestPage() {
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusFormOpen, setStatusFormOpen] = useState(false);
  const [createFormOpen, setCreateFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchMaintenanceRequests();
  }, [page, rowsPerPage]);

  const fetchMaintenanceRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/request/maintenance?id=maintenanceRequest&page=${page}&limit=${rowsPerPage}`);
      
      if (!response.ok) {
        throw new Error('فشل في استرداد طلبات الصيانة');
      }
      
      const data = await response.json();
      setMaintenanceRequests(data.items || []);
      setTotalCount(data.totalCount || 0);
    } catch (err) {
      setError(err.message);
      console.error("Error fetching maintenance requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(1); // Reset to first page when changing rows per page
  };

  const handleOpenStatusForm = (request) => {
    setSelectedRequest(request);
    setStatusFormOpen(true);
  };

  const handleCloseStatusForm = () => {
    setStatusFormOpen(false);
  };

  const handleOpenCreateForm = () => {
    setCreateFormOpen(true);
  };

  const handleCloseCreateForm = () => {
    setCreateFormOpen(false);
  };

  const handleRequestCreated = (newRequest) => {
    setMaintenanceRequests(prevRequests => [newRequest, ...prevRequests]);
    setTotalCount(prev => prev + 1);
    handleCloseCreateForm();
  };

  const handleStatusUpdated = (updatedRequest) => {
    setMaintenanceRequests(prevRequests => 
      prevRequests.map(req => 
        req.id === updatedRequest.id ? updatedRequest : req
      )
    );
  };

  const formatDate = (dateString) => {
    // التحقق من وجود التاريخ وصحته
    if (!dateString) return "—";
    
    const date = new Date(dateString);
    
    // التحقق من صحة التاريخ
    if (isNaN(date.getTime())) return "—";
    
    const formattedDate = new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(date);
    
    // جعل التاريخ يعرض من اليسار لليمين
    return `\u202D${formattedDate}\u202C`;
  };

  // دالة لتنسيق رقم الطلب من اليسار لليمين
  const formatRequestId = (displayId, id) => {
    const requestNumber = displayId || id;
    return `\u202D${requestNumber}\u202C`;
  };

  const list = [
    "رقم الطلب",
    "العميل",
    "العقار",
    "الوحدة",
    "الوصف",
    "الأولوية",
    "الحالة",
    "تاريخ الطلب",
    "آخر تحديث",
    "إجراءات"
  ];

  return (
    <TableFormProvider url={"request/maintanance"}>
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            طلبات الصيانة
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            onClick={handleOpenCreateForm}
          >
            إنشاء طلب صيانة جديد
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" sx={{ mt: 2 }}>
            حدث خطأ: {error}
          </Typography>
        ) : (
          <>
            <Paper sx={{ width: '100%', overflow: 'hidden', mt: 2 }}>
              <TableContainer sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      {list.map((header, index) => (
                        <TableCell 
                          key={index}
                          align={index === 9 ? "center" : "left"}
                          sx={{ 
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '0.875rem',
                            backgroundColor: 'primary.main',
                            width: index === 0 ? '100px' : // رقم الطلب - عرض صغير
                                   index === 4 ? '300px' : // الوصف - عرض كبير
                                   index === 1 ? '130px' : // العميل
                                   index === 2 ? '130px' : // العقار
                                   index === 3 ? '90px' : // الوحدة
                                   index === 5 ? '100px' :  // الأولوية
                                   index === 6 ? '110px' : // الحالة
                                   index === 7 ? '140px' : // تاريخ الطلب
                                   index === 8 ? '140px' : // آخر تحديث
                                   '80px' // الإجراءات
                          }}
                        >
                          {header}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {maintenanceRequests.length > 0 ? (
                      maintenanceRequests.map((request) => (
                        <TableRow key={request.id} hover>
                          <TableCell align="left" sx={{ width: '100px', fontSize: '0.8rem' }}>
                            <span style={{ direction: 'ltr', textAlign: 'left' }}>
                              {formatRequestId(request.displayId, request.id)}
                            </span>
                          </TableCell>
                          <TableCell align="left" sx={{ width: '130px' }}>{request.client?.name || "—"}</TableCell>
                          <TableCell align="left" sx={{ width: '130px' }}>{request.propertyName || request.property?.name || "—"}</TableCell>
                          <TableCell align="left" sx={{ width: '90px' }}>
                            {request.unit ? 
                              `${request.unit.number || ''}${request.unit.floor ? ` (طابق ${request.unit.floor})` : ''}` 
                              : "—"}
                          </TableCell>
                          <TableCell align="left" sx={{ width: '300px', wordBreak: 'break-word' }}>{request.description}</TableCell>
                          <TableCell align="left" sx={{ width: '100px' }}>
                            <Chip 
                              label={priorityTranslation[request.priority] || request.priority}
                              color={priorityColors[request.priority] || "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="left" sx={{ width: '110px' }}>
                            <Chip 
                              label={statusTranslation[request.status] || request.status}
                              color={statusColors[request.status] || "default"}
                              size="small"
                            />
                          </TableCell>
                          <TableCell align="left" sx={{ width: '140px', fontSize: '0.85rem' }}>
                            <span style={{ direction: 'ltr', textAlign: 'left' }}>
                              {formatDate(request.requestDate)}
                            </span>
                          </TableCell>
                          <TableCell align="left" sx={{ width: '140px', fontSize: '0.85rem' }}>
                            <span style={{ direction: 'ltr', textAlign: 'left' }}>
                              {formatDate(request.updatedAt)}
                            </span>
                          </TableCell>
                          <TableCell align="center" sx={{ width: '80px' }}>
                            <Tooltip title="تعديل الحالة">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenStatusForm(request)}
                                color="primary"
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={10} align="center">
                          لا توجد طلبات صيانة
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
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}

        <Button 
          variant="outlined" 
          color="primary" 
          sx={{ mt: 3 }}
          onClick={fetchMaintenanceRequests}
        >
          تحديث البيانات
        </Button>

        {selectedRequest && (
          <MaintenanceRequestStatusForm
            open={statusFormOpen}
            onClose={handleCloseStatusForm}
            request={selectedRequest}
            onStatusUpdated={handleStatusUpdated}
          />
        )}

        <CreateMaintenanceRequestForm
          open={createFormOpen}
          onClose={handleCloseCreateForm}
          onRequestCreated={handleRequestCreated}
        />
      </Box>
    </TableFormProvider>
  );
}
