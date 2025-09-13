"use client";
import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useState } from "react";

import {
  Button,
  FormControl,
  FormLabel,
  InputAdornment,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Box,
} from "@mui/material";
import Link from "next/link";
import {
  PaymentMethodType,
  PaymentType,
  StatusType,
  PaymentStatus,
} from "@/config/Enums";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import dayjs from "dayjs";
import "dayjs/locale/en-gb";
import { useAuth } from "@/app/context/AuthProvider/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentPrivilege } from "@/helpers/functions/getUserPrivilege";

import FilterPaperContainer from "@/components/utility/FilterPaperContainer";
import EditPaymentMethodModal from "@/components/ui/Modals/EditPaymentMethod";
import { FiFilter, FiHash } from "react-icons/fi";
import FilterSelect from "@/components/utility/FilterSelect";

export default function PaymentsPage({ searchParams }) {
  return (
    <TableFormProvider url={"fast-handler"}>
      <PaymentsWrapper />
    </TableFormProvider>
  );
}

const PaymentsWrapper = ({}) => {
  const {
    data,
    loading,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    setData,
    total,
    setTotal,
    setRender,
    filters,
    setFilters,
  } = useDataFetcher(`main/payments/search`);

  const { user } = useAuth();
  const [editPaymentMethodModal, setPaymentMethodModal] = useState(false);
  const [editPaymentId, setEditPaymentId] = useState(null);
  const [editPaymentMethod, setEditPaymentMethod] = useState("CASH");
  const [editChequeNumber, setEditChequeNumber] = useState("");
  const [editBankId, setEditBankId] = useState(null);
  const [search, setSearch] = useState("");
  const pathName = usePathname();

  function canEdit() {
    const currentPrivilege = getCurrentPrivilege(user, pathName);
    return currentPrivilege?.privilege.canEdit;
  }
  function applyFilter() {
    setFilters((old) => ({ ...old, q: search }));
  }
  function handleSavePaymentMethod() {
    setRender((old) => !old);
  }
  const columns = [
    {
      field: "id",
      headerName: "معرف الدفعة",
      width: 100,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "dueDate",
      headerName: "ميعاد الدفع",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Typography>
          {dayjs(params.row.dueDate).format("DD/MM/YYYY")}
        </Typography>
      ),
    },

    {
      field: "amount",
      headerName: "الكمية",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Typography>{formatCurrencyAED(params.row.amount)}</Typography>
      ),
    },
    {
      field: "padiAmount",
      headerName: "الكمية المدفوعة",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Typography>
          {formatCurrencyAED(params.row.paidAmount.toFixed(2))}
        </Typography>
      ),
    },
    {
      field: "amountLeft",
      headerName: "الكمية المتبيقة",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Typography>
          {formatCurrencyAED(
            (params.row.amount - params.row.paidAmount).toFixed(2)
          )}
        </Typography>
      ),
    },
    {
      field: "paymentType",
      headerName: "النوع",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Typography>
          {params.row.maintenance
            ? params.row.maintenance.type.name
            : PaymentType[params.row.paymentType]}
        </Typography>
      ),
    },
    {
      field: "status",
      headerName: "الحالة",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Typography variant="body2">
          {PaymentStatus[params.row.status]}
        </Typography>
      ),
    },

    {
      field: "property",
      headerName: "العقار",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Box
          sx={{
            display: "flex",
            flexDirection: "columnt",
            gap: 1,
            alignItems: "center",
          }}
        >
          <Link href={"/properties/" + params.row.property?.id}>
            <Button
              variant={"text"}
              sx={{
                maxWidth: 100,
                overflow: "auto",
              }}
            >
              {params.row.property?.name}
            </Button>
          </Link>
          {(params.row.rentAgreement?.unit || params.row.unit) && (
            <Link
              href={
                "/units/" + params.row.rentAgreement?.unit?.id ||
                params.row.unit?.id
              }
            >
              <Button
                variant={"text"}
                sx={{
                  maxWidth: 100,
                  overflow: "auto",
                }}
              >
                {params.row.rentAgreement?.unit.number ||
                  params.row.unit?.number}
              </Button>
            </Link>
          )}
        </Box>
      ),
    },

    {
      field: "client",
      headerName: "العميل",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <>
          {params.row.rentAgreement?.renter ? (
            <Link
              href={"/renters/" + params.row.rentAgreement?.renter?.id}
              className={"flex justify-center"}
            >
              <Button variant={"text"}>
                {params.row.rentAgreement?.renter?.name} (مستاجر)
              </Button>
            </Link>
          ) : params.row.client ? (
            <Link
              href={"/renters/" + params.row.client?.id}
              className={"flex justify-center"}
            >
              <Button variant={"text"}>{params.row.client?.name} (مالك)</Button>
            </Link>
          ) : (
            ""
          )}
        </>
      ),
    },
    {
      field: "paymentMethod",
      headerName: "طريقة الدفع",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Typography variant="body2">
          {PaymentMethodType[params.row.paymentTypeMethod]}
        </Typography>
      ),
    },
    {
      field: "chequeNumber",
      headerName: "رقم الشيك",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "bankName",
      headerName: "اسم البنك",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Typography variant="body2">{params.row.bank?.name}</Typography>
      ),
    },
    {
      field: "actions",
      width: 350,
      printable: false,
      renderCell: (params) => (
        <>
          {canEdit() && (
            <>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setEditPaymentId(params.row.id);
                  setEditPaymentMethod(params.row.paymentTypeMethod || "CASH");
                  setEditChequeNumber(params.row.chequeNumber || "");
                  setPaymentMethodModal(true);
                  setEditBankId(params.row.bankId);
                }}
              >
                طريقة الدفع
              </Button>
            </>
          )}
        </>
      ),
    },
  ];

  return (
    <>
      <FilterPaperContainer handleFilter={applyFilter}>
        <TextField
          fullWidth
          size="medium"
          label="رقم الشيك"
          placeholder="اكتب جزء من رقم الشيك…"
          value={search || ""}
          onChange={(e) => setSearch((old) => e.target.value ?? "")}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <FiHash />
              </InputAdornment>
            ),
          }}
        />
        <FilterSelect
          label="اسم البنك"
          param={"bankId"}
          setFilters={setFilters}
          apiPoint={"/api/fast-handler?id=bank"}
        />
        <FormControl size="medium" sx={{ minWidth: 220 }}>
          <FormLabel>منطق البحث</FormLabel>
          <ToggleButtonGroup
            exclusive
            value={filters.mode || "AND"}
            onChange={(_, val) => {
              if (!val) return;
              setFilters((old) => ({ ...old, mode: val }));
            }}
            fullWidth
          >
            <ToggleButton value="AND">AND</ToggleButton>
            <ToggleButton value="OR">
              <FiFilter style={{ marginInlineEnd: 8 }} /> OR
            </ToggleButton>
          </ToggleButtonGroup>
        </FormControl>
      </FilterPaperContainer>

      <ViewComponent
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
        noCreate={true}
        title={"الدفعات"}
      />
      <EditPaymentMethodModal
        open={editPaymentMethodModal}
        handleClose={() => setPaymentMethodModal(false)}
        paymentId={editPaymentId}
        item={data?.find((i) => i.id === editPaymentId)}
        currentMethod={editPaymentMethod}
        currentChequeNumber={editChequeNumber}
        onSave={handleSavePaymentMethod}
        editBankId={editBankId}
      />
    </>
  );
};
