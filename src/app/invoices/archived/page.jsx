"use client";
import dayjs from "dayjs";
import "dayjs/locale/ar";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
  Print as PrintIcon,
  AttachMoney as AttachMoneyIcon,
  Receipt as ReceiptIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  MonetizationOn as MonetizationOnIcon,
  AccountBalance as AccountBalanceIcon,
  Build as BuildIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Stack,
  Tooltip,
  Paper,
  useTheme,
  TextField,
  CircularProgress,
} from "@mui/material";
import { useRef, useState } from "react";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import InvoicePrint from "../InvoicePrint";
import CombinedInvoicePrint from "../CombinedInvoicePrint";

import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useReactToPrint } from "react-to-print";
import FilterPaperContainer from "@/components/utility/FilterPaperContainer";
import FilterSelect from "@/components/utility/FilterSelect";
import { PaymentType } from "@/config/Enums";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import BillingInvoiceViewDialogButton from "../ViewBillingInvoice";
import TableFormProvider from "@/app/context/TableFormProvider/TableFormProvider";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";

// إعداد dayjs
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale("ar");

const getInvoiceTypeConfig = (invoiceType) => {
  const configs = {
    RENT: {
      color: "info",
      icon: AttachMoneyIcon,
      type: "توثيق",
      bgColor: "#e3f2fd",
    },
    TAX: {
      color: "info",
      icon: AccountBalanceIcon,
      type: "توثيق",
      bgColor: "#e3f2fd",
    },
    INSURANCE: {
      color: "success",
      icon: MonetizationOnIcon,
      type: "دخل",
      bgColor: "#e8f5e8",
    },
    REGISTRATION: {
      color: "success",
      icon: MonetizationOnIcon,
      type: "دخل",
      bgColor: "#e8f5e8",
    },
    CONTRACT_EXPENSE: {
      color: "success",
      icon: MonetizationOnIcon,
      type: "دخل",
      bgColor: "#e8f5e8",
    },
    OTHER_EXPENSE: {
      color: "success",
      icon: MonetizationOnIcon,
      type: "دخل",
      bgColor: "#e8f5e8",
    },
    MANAGEMENT_COMMISSION: {
      color: "success",
      icon: TrendingUpIcon,
      type: "دخل",
      bgColor: "#e8f5e8",
    },
    MAINTENANCE: {
      color: "error",
      icon: BuildIcon,
      type: "مصروف",
      bgColor: "#fdeaea",
    },
    OTHER: {
      color: "info",
      icon: DescriptionIcon,
      type: "توثيق",
      bgColor: "#e3f2fd",
    },
  };

  return (
    configs[invoiceType] || {
      color: "default",
      icon: ReceiptIcon,
      type: "عام",
      bgColor: "#f5f5f5",
    }
  );
};

export default function InvoicePage() {
  return (
    <TableFormProvider url={"fast-handler"}>
      <InvoiceWrapper />
    </TableFormProvider>
  );
}
function InvoiceWrapper() {
  const {
    data,
    loading,
    setFilters,
    filters,
    page,
    setPage,
    total,
    setTotal,
    limit,
    setLimit,
    setData,
    totalPages,
    otherData,
    setOtherData,
    setRender,
  } = useDataFetcher(`main/billing-invoices?isArchived=true&`);
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));
  const printRef = useRef();
  const combinedPrintRef = useRef();
  const [printLoading, setPrintLoading] = useState(false);
  const [combinedPrintLoading, setCombinedPrintLoading] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [selectedOwner, setSelectedOwner] = useState();
  const [selectedRenter, setSelectedRenter] = useState();

  const [selectedProperty, setSelectedProperty] = useState();
  const [partyType, setPartyType] = useState("OWNERS");
  const { setLoading } = useToastContext();

  const columns = [
    {
      field: "invoiceNumber",
      headerName: "معرف",
      width: 50,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "category",
      headerName: "نوع الدفعة",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        const invoiceConfig = getInvoiceTypeConfig(params.row.category);

        return (
          <Box display="flex" alignItems="center" gap={2}>
            <Box>
              <Typography variant="body2" fontWeight="medium" noWrap>
                {PaymentType[params.row.category] || "لا يوجد نوع محدد"}
              </Typography>
              <Chip
                label={invoiceConfig.type}
                size="small"
                color={invoiceConfig.color}
                variant="outlined"
                sx={{ mt: 0.5, fontSize: "0.75rem" }}
              />
            </Box>
          </Box>
        );
      },
    },

    {
      field: "relatedLocation",
      headerName: "العقار المرتبط",
      width: 180,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Stack spacing={0.5}>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="caption" color="text.secondary">
                العقار:
              </Typography>
              <Typography variant="body2" fontWeight="medium" noWrap>
                {params.row.property?.name || "لا يوجد"}
              </Typography>
            </Box>
            {params.row.unit?.number && (
              <Box display="flex" alignItems="center" gap={1}>
                <Typography variant="caption" color="text.secondary">
                  الوحدة:
                </Typography>
                <Chip
                  label={params.row.unit.number}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{ fontSize: "0.75rem" }}
                />
              </Box>
            )}
          </Stack>
        </Box>
      ),
    },

    {
      field: "relatedClients",
      headerName: "العملاء المرتبطين",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {params.row.billedClient
                  ? params.row.billedClient.role === "OWNER"
                    ? "مالك"
                    : "مستاجر"
                  : null}
              </Typography>
              <Typography variant="body2" fontWeight="medium" noWrap>
                {params.row.billedClient?.name || "لا يوجد"}
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },

    {
      field: "description",
      headerName: "الوصف",
      width: 250,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Tooltip title={params.row.description || "لا يوجد وصف"} arrow>
            <Typography
              variant="body2"
              sx={{
                maxWidth: 200,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: params.row.description
                  ? "text.primary"
                  : "text.secondary",
                fontStyle: params.row.description ? "normal" : "italic",
              }}
            >
              {params.row.description || "لا يوجد وصف"}
            </Typography>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "dueDate",
      headerName: "تاريخ المطالبة",
      width: 140,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <ScheduleIcon color="action" fontSize="small" />
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {dayjs(params.row.dueDate).format("DD/MM/YYYY")}
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      field: "createdAt",
      headerName: "تاريخ الاصدار",
      width: 140,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Box sx={{ py: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <ScheduleIcon color="action" fontSize="small" />
            <Box>
              <Typography variant="body2" fontWeight="medium">
                {dayjs(params.row.createdAt).format("DD/MM/YYYY")}
              </Typography>
            </Box>
          </Box>
        </Box>
      ),
    },
    {
      field: "actions",
      headerName: "الاجراءات",
      width: 150,
      printable: true,
      renderCell: (params) => {
        return (
          <Box sx={{ py: 1, display: "flex", gap: 1, alignItems: "center" }}>
            <BillingInvoiceViewDialogButton invoice={params.row} />
            <Button
              variant="contained"
              color="primary"
              startIcon={<PrintIcon />}
              size="small"
              onClick={() => {
                setCurrentInvoice(params.row);
                setTimeout(handlePrint, 100);
              }}
              disabled={printLoading}
              loading={printLoading}
              sx={{
                minWidth: 100,
                borderRadius: 2,
                textTransform: "none",
                fontWeight: "medium",
              }}
            >
              طباعة
            </Button>
          </Box>
        );
      },
    },
  ];

  const handleDateChange = (type, date) => {
    if (type === "start") setStartDate(date);
    else setEndDate(date);
  };

  const applyFilters = () => {
    setFilters({
      ...filters,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    });
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "فاتورة",
    onBeforeGetContent: () => setPrintLoading(true),
    onAfterPrint: () => setPrintLoading(false),
  });
  const handleCombinedPrint = useReactToPrint({
    contentRef: combinedPrintRef,
    documentTitle: "فاتورة مجمعة",
    onBeforeGetContent: () => setCombinedPrintLoading(true),
    onAfterPrint: () => setCombinedPrintLoading(false),
  });
  const createFilterSummary = () => {
    const summary = {};

    if (startDate && endDate) {
      summary.period = `من ${startDate.format(
        "DD/MM/YYYY"
      )} إلى ${endDate.format("DD/MM/YYYY")}`;
    }

    if (selectedOwner) {
      summary.owner = selectedOwner;
    }

    if (selectedProperty) {
      summary.property = selectedProperty;
    }

    return summary;
  };

  return (
    <>
      <FilterPaperContainer
        handleFilter={applyFilters}
        extraComponentRender={() => {
          return (
            <>
              {data?.length > 0 && (
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={
                    combinedPrintLoading ? (
                      <CircularProgress size={16} color="inherit" />
                    ) : (
                      <PrintIcon />
                    )
                  }
                  onClick={handleCombinedPrint}
                  disabled={combinedPrintLoading}
                  sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                >
                  {combinedPrintLoading ? "جاري الطباعة..." : "طباعة مجمعة"}
                </Button>
              )}
            </>
          );
        }}
      >
        <FilterSelect
          label="علاقة الدفعة بالعميل"
          param={"clientType"}
          loading={false}
          setFilters={setFilters}
          setCurrent={setPartyType}
          options={[
            { name: "مالك", id: "OWNERS" },
            { name: "مستاجر", id: "RENTERS" },
          ]}
        />
        {partyType === "OWNERS" ||
          (partyType?.id === "OWNERS" && (
            <>
              <FilterSelect
                label="المالك"
                param={"ownerId"}
                setFilters={setFilters}
                apiPoint={"/api/fast-handler?id=owners"}
                setCurrent={setSelectedOwner}
              />
              {selectedOwner && (
                <FilterSelect
                  label="العقار"
                  param={"propertyId"}
                  setFilters={setFilters}
                  apiPoint={`/api/fast-handler?id=properties&clientId=${selectedOwner.id}&`}
                  setCurrent={setSelectedProperty}
                />
              )}
            </>
          ))}
        {partyType === "RENTERS" ||
          (partyType?.id === "RENTERS" && (
            <>
              <FilterSelect
                label="المستاجر"
                param={"renterId"}
                setFilters={setFilters}
                apiPoint={"/api/fast-handler?id=renter"}
                setCurrent={setSelectedRenter}
              />
              {selectedRenter && (
                <FilterSelect
                  label="عقد الايجار"
                  param={"renterId"}
                  setFilters={setFilters}
                  apiPoint={`/api/fast-handler?id=rentAgreements&renterId=${selectedRenter.id}`}
                  setCurrent={setSelectedRenter}
                />
              )}
            </>
          ))}
        <FilterSelect
          label="نوع الدفعة"
          param={"invoiceType"}
          loading={false}
          setFilters={setFilters}
          options={Object.keys(PaymentType).map((key) => ({
            id: key,
            name: PaymentType[key],
          }))}
        />
        <DatePicker
          label="تاريخ البدء"
          value={startDate}
          onChange={(d) => handleDateChange("start", d)}
          renderInput={(params) => <TextField {...params} />}
          format="DD/MM/YYYY"
        />

        <DatePicker
          label="تاريخ الانتهاء"
          value={endDate}
          onChange={(d) => handleDateChange("end", d)}
          renderInput={(params) => <TextField {...params} />}
          format="DD/MM/YYYY"
        />

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              const today = dayjs();
              const firstDay = today.startOf("month");
              const lastDay = today.endOf("month");
              setStartDate(firstDay);
              setEndDate(lastDay);
            }}
          >
            هذا الشهر
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              const lastMonth = dayjs().subtract(1, "month");
              const firstDay = lastMonth.startOf("month");
              const lastDay = lastMonth.endOf("month");
              setStartDate(firstDay);
              setEndDate(lastDay);
            }}
          >
            الشهر الماضي
          </Button>

          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              const today = dayjs();
              const firstDay = today.startOf("year");
              const lastDay = today.endOf("year");
              setStartDate(firstDay);
              setEndDate(lastDay);
            }}
          >
            هذا العام
          </Button>
        </Box>
      </FilterPaperContainer>
      {currentInvoice && (
        <div style={{ display: "none" }}>
          <InvoicePrint ref={printRef} invoice={currentInvoice} />
        </div>
      )}

      {data?.length > 0 && (
        <div style={{ display: "none" }}>
          <CombinedInvoicePrint
            ref={combinedPrintRef}
            invoices={data}
            summaryFnc={createFilterSummary}
          />
        </div>
      )}

      <ViewComponent
        title={"الفواتير"}
        totalPages={totalPages}
        rows={data}
        columns={columns}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        loading={loading}
        setData={setData}
        setTotal={setTotal}
        total={total}
        noModal={true}
        noCreate
      />
    </>
  );
}
