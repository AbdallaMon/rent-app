"use client";
import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useEffect, useState } from "react";
import { rentAgreementInputs } from "./rentInputs";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { submitRentAgreement } from "@/services/client/createRentAgreement";
import { RenewRentModal } from "@/components/ui/Modals/RenewRent";
import { CancelRentModal } from "@/components/ui/Modals/CancelRentModal";
import {
  Alert,
  Box,
  Button,
  FormControl,
  Select,
  Snackbar,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { StatusType } from "@/config/Enums";
import MenuItem from "@mui/material/MenuItem";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import dayjs from "dayjs";
import "dayjs/locale/en-gb";
import { useAuth } from "@/app/context/AuthProvider/AuthProvider";
import { usePathname, useRouter } from "next/navigation";
import { getCurrentPrivilege } from "@/helpers/functions/getUserPrivilege";
import { InstallmentComponent } from "@/components/InstallmentComponent";
import {
  AllContracts,
  ActiveContracts,
  ExpiredContracts,
  CancelledContracts,
  Home,
} from "@/components/ui/icons";

export default function RentPage({ searchParams }) {
  const propertyId = searchParams?.propertyId;
  const status = searchParams?.status;
  const rented = searchParams?.rented;

  return (
    <TableFormProvider url={"fast-handler"}>
      <RentWrapper
        propperty={propertyId}
        statusFilter={status}
        rentedFilter={rented}
      />
    </TableFormProvider>
  );
}

const RentWrapper = ({ propperty, statusFilter, rentedFilter }) => {
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
    others,
    setOthers,
    search,
    setSearch,
    reFetch: dataReFetch,
  } = useDataFetcher(`main/rentAgreements?rented=true&`);
  const {
    data: expiredData,
    loading: expiredLoading,
    page: expiredPage,
    setPage: setExpiredPage,
    limit: expiredLimit,
    setLimit: setExpiredLimit,
    totalPages: expiredTotalPages,
    setData: setExpiredData,
    total: expiredTotal,
    setTotal: setExpiredTotal,
    setRender: setExpiredRender,
    others: expiredOthers,
    setOthers: setExpiredOthers,
    search: expiredSearch,
    setSearch: setExpiredSearch,
    reFetch: expiredDataReFetch,
  } = useDataFetcher(
    `main/rentAgreements?rented=expired&sort=createdAt&order=asc&`
  );
  const { id } = useTableForm();
  const [propertyId, setPropertyId] = useState(null);
  const [properties, setProperties] = useState([]);
  const { user } = useAuth();
  const router = useRouter();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [rerender, setRerender] = useState(false);
  const pathName = usePathname();

  // Determine which tables to show based on URL parameters
  const showOnlyExpired =
    statusFilter === "expired" && rentedFilter === "expired";
  const showOnlyActive =
    statusFilter === "active" ||
    (statusFilter === "active" && rentedFilter === "true");
  const showBoth = !statusFilter || (!showOnlyExpired && !showOnlyActive);

  // Get current property filter from URL
  const currentPropertyFilter = propperty || "all";

  // Get property name for display
  const selectedProperty = properties.find((p) => p.id === propperty);
  const propertyDisplayName = selectedProperty
    ? ` - ${selectedProperty.name}`
    : "";

  function canEdit() {
    const currentPrivilege = getCurrentPrivilege(user, pathName);
    return currentPrivilege?.privilege.canEdit;
  }

  useEffect(() => {
    async function getD() {
      const properties = await getProperties();

      setProperties(properties.data);
    }

    getD();
  }, []);

  // Update filters when property changes from URL
  useEffect(() => {
    if (propperty && propperty !== "all") {
      setOthers(`propertyId=${propperty}`);
      setExpiredOthers(`propertyId=${propperty}`);
    } else {
      setOthers("");
      setExpiredOthers("");
    }
  }, [propperty, setOthers, setExpiredOthers]);

  // Re-fetch data when property filter changes
  useEffect(() => {
    if (propperty !== undefined) {
      // Only trigger on actual changes, not initial load
      setRender((prev) => !prev);
      setExpiredRender((prev) => !prev);
    }
  }, [propperty, setRender, setExpiredRender]);
  const [disabled, setDisabled] = useState({
    unitId: true,
  });
  const [reFetch, setRefetch] = useState({
    unitId: false,
  });
  const [renewModalOpen, setRenewModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [renewData, setRenewData] = useState(null);
  const [cancelData, setCancelData] = useState(null);

  async function getRenters() {
    const res = await fetch("/api/fast-handler?id=renter");
    const data = await res.json();

    return { data };
  }

  async function getProperties() {
    const res = await fetch("/api/fast-handler?id=properties");
    const data = await res.json();
    return { data };
  }

  function handlePropertyChange(value) {
    setPropertyId(value);
    setDisabled({
      ...disabled,
      unitId: false,
    });
    setRefetch({
      ...reFetch,
      unitId: true,
    });
  }

  async function getUnits() {
    const res = await fetch(
      "/api/fast-handler?id=unit&propertyId=" +
        propertyId +
        "&availableOnly=true"
    );
    const data = await res.json();
    // const dataWithLabel = data.map((item) => {
    //   return {
    //     ...item,
    //     name: item.number,
    //   };
    // });

    return { data: data, id: propertyId };
  }

  const dataInputs = rentAgreementInputs.map((input) => {
    switch (input.data.id) {
      case "renterId":
        return {
          ...input,
          extraId: false,
          getData: getRenters,
        };

      case "propertyId":
        return {
          ...input,
          getData: getProperties,
          onChange: handlePropertyChange,
        };
      case "unitId":
        return {
          ...input,
          getData: getUnits,
        };
      default:
        return input;
    }
  });

  const handleOpenRenewModal = (rentData) => {
    setRenewData(rentData);
    setRenewModalOpen(true);
  };

  const handleCloseRenewModal = () => {
    setRenewModalOpen(false);
    setRenewData(null);
  };

  const handleOpenCancelModal = (rentData) => {
    setCancelData(rentData);
    setCancelModalOpen(true);
  };

  const handleCloseCancelModal = () => {
    setCancelModalOpen(false);
    setCancelData(null);
  };

  const handleCancelConfirm = async () => {
    await submitRentAgreement(
      { ...cancelData, canceling: true },
      setSubmitLoading,
      "PUT",
      [
        {
          route: `/${cancelData.id}?installments=true`,
          message: "جاري البحث عن اي دفعات لم يتم استلامها...",
        },
        {
          route: `/${cancelData.id}?feeInvoices=true`,
          message: "جاري البحث عن اي رسوم لم يتم دفعها...",
        },
        {
          route: `/${cancelData.id}?otherExpenses=true`,
          message: "جاري البحث عن اي مصاريف اخري لم يتم دفعها...",
        },
        {
          route: `/${cancelData.id}?cancel=true`,
          message: "جاري تحديث حالة العقد القديم...",
        },
      ],
      true
    );
    const newData = data.filter((item) => {
      return +item.id !== +cancelData.id;
    });
    setData(newData);
    handleCloseCancelModal();
  };
  const validateTotalPrice = (data) => {
    const discountedTotalPrice =
      parseFloat(data.totalPrice) - (parseFloat(data.discount) || 0);
    const totalInstallmentAmount = data.installments.reduce(
      (sum, installment) => sum + parseFloat(installment.amount),
      0
    );

    return totalInstallmentAmount === discountedTotalPrice;
  };
  const { setLoading: setSubmitLoading } = useToastContext();
  const handleRenewSubmit = async (formData) => {
    if (!validateTotalPrice(formData)) {
      setSnackbarMessage(
        "المجموع الكلي للأقساط لا يتطابق مع السعر الكلي. يرجى التحقق من المدخلات."
      );
      setSnackbarOpen(true);
      return;
    }
    const extraData = { otherExpenses: [] };
    formData = { ...formData, extraData };
    await submitRentAgreement(
      { ...formData },
      setSubmitLoading,
      "PUT",
      [
        {
          route: `/${renewData.id}?installments=true`,
          message: "جاري البحث عن اي دفعات لم يتم استلامها...",
        },
        {
          route: `/${renewData.id}?feeInvoices=true`,
          message: "جاري البحث عن اي رسوم لم يتم دفعها...",
        },
        {
          route: `/${renewData.id}?otherExpenses=true`,
          message: "جاري البحث عن اي مصاريف اخري لم يتم دفعها...",
        },
        {
          route: `/${renewData.id}?renew=true`,
          message: "جاري تحديث حالة العقد القديم...",
        },
      ],
      null,
      true
    );
    const newData = data.filter((item) => +item.id !== +renewData.id);
    setData(newData);
    handleCloseRenewModal();
  };
  const columns = [
    {
      field: "rentAgreementNumber",
      headerName: "رقم العقد",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={"rent/" + params.row.id}>
          <Button variant={"text"}>{params.row.rentAgreementNumber}</Button>
        </Link>
      ),
    },
    {
      field: "propertyId",
      headerName: "اسم العقار",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={"/properties/" + params.row.unit.property.id}>
          <Button variant={"text"}>{params.row.unit.property.name}</Button>
        </Link>
      ),
    },
    {
      field: "unit",
      headerName: "رقم الوحده",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={"/units/" + params.row.unit?.id}>
          <Button
            variant={"text"}
            sx={{
              maxWidth: 100,
              overflow: "auto",
            }}
          >
            {params.row.unit?.number}
          </Button>
        </Link>
      ),
    },

    {
      field: "renter",
      headerName: "المستأجر",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link
          href={"/renters/" + params.row.renter?.id}
          className={"flex justify-center"}
        >
          <Button variant={"text"}>{params.row.renter?.name}</Button>
        </Link>
      ),
    },
    {
      field: "status",
      headerName: "الحالة",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        const today = new Date();
        const endDate = new Date(params.row.endDate);

        return (
          <Typography
            sx={{
              color:
                params.row.status === "ACTIVE" && endDate < today
                  ? "purple"
                  : params.row.status === "ACTIVE"
                    ? "green"
                    : "red",
            }}
          >
            {params.row.status === "ACTIVE" && endDate < today
              ? "يجب اتخاذ اجراء"
              : StatusType[params.row.status]}
          </Typography>
        );
      },
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
                sx={{
                  mt: 1,
                  mr: 1,
                }}
                onClick={() => handleOpenRenewModal(params.row)}
              >
                تجديد
              </Button>
              {params.row.status === "ACTIVE" && (
                <>
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{
                      mt: 1,
                      mr: 1,
                    }}
                    onClick={() => handleOpenCancelModal(params.row)}
                  >
                    الغاء العقد
                  </Button>
                </>
              )}
            </>
          )}
        </>
      ),
    },
    {
      field: "startDate",
      headerName: "تاريخ البداية",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <>{dayjs(params.row.startDate).format("DD/MM/YYYY")}</>
      ),
    },
    {
      field: "endDate",
      headerName: "تاريخ النهاية",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <>{dayjs(params.row.endDate).format("DD/MM/YYYY")}</>
      ),
    },
    {
      field: "totalPrice",
      headerName: "السعر الكلي",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => <>{formatCurrencyAED(params.row.totalPrice)}</>,
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
                sx={{
                  mt: 1,
                  mr: 1,
                }}
                onClick={() => handleOpenRenewModal(params.row)}
              >
                تجديد
              </Button>
              <Button
                variant="contained"
                color="info"
                sx={{
                  mt: 1,
                  mr: 1,
                }}
                onClick={() => handleOpenEditPaymentMethod(params.row)}
              >
                طريقة الدفع
              </Button>
              {params.row.status === "ACTIVE" && (
                <>
                  <Button
                    variant="contained"
                    color="secondary"
                    sx={{
                      mt: 1,
                      mr: 1,
                    }}
                    onClick={() => handleOpenCancelModal(params.row)}
                  >
                    الغاء العقد
                  </Button>
                </>
              )}
            </>
          )}
        </>
      ),
    },
  ];
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  async function submit(data) {
    if (!validateTotalPrice(data)) {
      setSnackbarMessage(
        "المجموع الكلي للأقساط لا يتطابق مع السعر الكلي. يرجى التحقق من المدخلات."
      );
      setSnackbarOpen(true);
      return;
    }
    return await submitRentAgreement(
      data,
      setSubmitLoading,
      null,
      null,
      null,
      true
    );
  }

  function handlePropertyFilterChange(event) {
    const propertyId = event.target.value;
    const currentParams = new URLSearchParams(window.location.search);

    if (propertyId === "all") {
      currentParams.delete("propertyId");
    } else {
      currentParams.set("propertyId", propertyId);
    }

    const newUrl = `/rent${currentParams.toString() ? "?" + currentParams.toString() : ""}`;
    router.push(newUrl);
  }

  function handleStatusFilterChange(event) {
    const value = event.target.value;
    const currentParams = new URLSearchParams(window.location.search);

    // Preserve property filter if it exists
    if (currentPropertyFilter !== "all") {
      currentParams.set("propertyId", currentPropertyFilter);
    } else {
      currentParams.delete("propertyId");
    }

    switch (value) {
      case "active":
        currentParams.set("status", "active");
        currentParams.set("rented", "true");
        break;
      case "expired":
        currentParams.set("status", "expired");
        currentParams.set("rented", "expired");
        break;
      default:
        currentParams.delete("status");
        currentParams.delete("rented");
        break;
    }

    const newUrl = `/rent${currentParams.toString() ? "?" + currentParams.toString() : ""}`;
    router.push(newUrl);
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          alignItems: "flex-start",
          mb: 3,
        }}
      >
        {/* Properties Filter Dropdown */}
        <FormControl sx={{ minWidth: 250 }}>
          <Typography
            variant="h6"
            sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
          >
            <Home className="w-5 h-5" />
            فلترة حسب العقار
          </Typography>
          <Select
            value={currentPropertyFilter}
            onChange={handlePropertyFilterChange}
            displayEmpty
            fullWidth
            variant="outlined"
            sx={{
              "& .MuiSelect-select": {
                display: "flex",
                alignItems: "center",
                gap: 1,
              },
            }}
          >
            <MenuItem value="all">
              <AllContracts className="mr-2" />
              جميع العقارات
            </MenuItem>
            {properties?.map((property) => (
              <MenuItem value={property.id} key={property.id}>
                <Home className="mr-2" />
                {property.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status Filter Dropdown */}
        <FormControl sx={{ minWidth: 250 }}>
          <Typography
            variant="h6"
            sx={{ mb: 1, display: "flex", alignItems: "center", gap: 1 }}
          >
            <AllContracts className="w-5 h-5" />
            فلترة حسب حالة العقد
          </Typography>
          <Select
            value={
              showOnlyExpired ? "expired" : showOnlyActive ? "active" : "all"
            }
            onChange={handleStatusFilterChange}
            displayEmpty
            fullWidth
            variant="outlined"
            sx={{
              "& .MuiSelect-select": {
                display: "flex",
                alignItems: "center",
                gap: 1,
              },
            }}
          >
            <MenuItem value="all">
              <AllContracts className="mr-2" />
              جميع العقود
            </MenuItem>
            <MenuItem value="active">
              <ActiveContracts className="mr-2" />
              العقود النشطة فقط
            </MenuItem>
            <MenuItem value="expired">
              <ExpiredContracts className="mr-2" />
              العقود المنتهية فقط
            </MenuItem>
          </Select>
        </FormControl>

        {/* Canceled Contracts Link */}
        <Box sx={{ alignSelf: "flex-end" }}>
          <Link href="rent/canceled">
            <Button
              variant="outlined"
              color="error"
              size="large"
              startIcon={<CancelledContracts />}
              sx={{ height: "56px" }}
            >
              العقود الملغية
            </Button>
          </Link>
        </Box>
      </Box>{" "}
      {/* Dynamic Title */}
      <Typography
        variant="h4"
        component="h1"
        sx={{
          mb: 3,
          fontWeight: "bold",
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        {showOnlyExpired ? (
          <>
            <ExpiredContracts className="w-6 h-6" />
            العقود المنتهية - تحتاج إلى إجراء{propertyDisplayName}
          </>
        ) : showOnlyActive ? (
          <>
            <ActiveContracts className="w-6 h-6" />
            العقود النشطة{propertyDisplayName}
          </>
        ) : (
          <>
            <AllContracts className="w-6 h-6" />
            جميع عقود الإيجار{propertyDisplayName}
          </>
        )}
      </Typography>
      {showOnlyActive && (
        <ViewComponent
          inputs={dataInputs}
          formTitle={"عقد ايجار "}
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
          extraData={{ otherExpenses: [] }}
          extraDataName={"otherExpenses"}
          id={id}
          noModal={true}
          disabled={disabled}
          reFetch={reFetch}
          submitFunction={submit}
          url={"main/rentAgreements"}
          title={"عقود الايجار النشطة"}
          extraComponent={InstallmentComponent}
          rerender={rerender}
        ></ViewComponent>
      )}
      {showOnlyExpired && (
        <ViewComponent
          inputs={dataInputs}
          formTitle={"عقد ايجار "}
          totalPages={expiredTotalPages}
          rows={expiredData}
          columns={columns}
          page={expiredPage}
          setPage={setExpiredPage}
          limit={expiredLimit}
          setLimit={setExpiredLimit}
          id={id}
          loading={expiredLoading}
          setData={setExpiredData}
          setTotal={setExpiredTotal}
          total={expiredTotal}
          noModal={true}
          disabled={disabled}
          reFetch={reFetch}
          submitFunction={submit}
          noTabs={true}
          url={"main/expiredRentAgreements"}
          title={"عقود ايجار بحاجة الي اتخاذ اجراء معها"}
        />
      )}
      {showBoth && (
        <>
          <ViewComponent
            inputs={dataInputs}
            formTitle={"عقد ايجار "}
            totalPages={totalPages}
            rows={data}
            columns={columns}
            page={page}
            setPage={setPage}
            limit={limit}
            setLimit={setLimit}
            extraData={{ otherExpenses: [] }}
            extraDataName={"otherExpenses"}
            id={id}
            loading={loading}
            setData={setData}
            setTotal={setTotal}
            total={total}
            noModal={true}
            disabled={disabled}
            reFetch={reFetch}
            submitFunction={submit}
            url={"main/rentAgreements"}
            title={"عقود الايجار النشطة"}
            extraComponent={InstallmentComponent}
            rerender={rerender}
          ></ViewComponent>
          <ViewComponent
            inputs={dataInputs}
            formTitle={"عقد ايجار "}
            totalPages={expiredTotalPages}
            rows={expiredData}
            columns={columns}
            page={expiredPage}
            setPage={setExpiredPage}
            limit={expiredLimit}
            setLimit={setExpiredLimit}
            id={id}
            loading={expiredLoading}
            setData={setExpiredData}
            setTotal={setExpiredTotal}
            total={expiredTotal}
            noModal={true}
            disabled={disabled}
            reFetch={reFetch}
            submitFunction={submit}
            noTabs={true}
            url={"main/expiredRentAgreements"}
            title={"عقود ايجار بحاجة الي اتخاذ اجراء معها"}
          />
        </>
      )}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="error">
          {snackbarMessage ||
            "المجموع الكلي للأقساط لا يتطابق مع السعر الكلي. يرجى التحقق من المدخلات."}
        </Alert>
      </Snackbar>
      <RenewRentModal
        open={renewModalOpen}
        handleClose={handleCloseRenewModal}
        initialData={renewData}
        inputs={dataInputs}
        onSubmit={handleRenewSubmit}
      ></RenewRentModal>
      <CancelRentModal
        open={cancelModalOpen}
        handleClose={handleCloseCancelModal}
        handleConfirm={handleCancelConfirm}
      />
    </>
  );
};
