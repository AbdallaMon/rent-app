"use client";
import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  Modal,
  Select,
  Snackbar,
  Typography,
} from "@mui/material";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useEffect, useState } from "react";
import Link from "next/link";
import { unitInputs } from "@/app/units/unitInputs";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import MenuItem from "@mui/material/MenuItem";
import { useRouter, useSearchParams } from "next/navigation";
import { rentAgreementInputs } from "@/app/rent/rentInputs";
import { submitRentAgreement } from "@/services/client/createRentAgreement";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { simpleModalStyle } from "@/config/constants";
import { Form } from "@/components/ui/FormComponents/Forms/Form";
import { InstallmentComponent } from "@/components/InstallmentComponent";
import DeleteModal from "@/components/ui/Modals/DeleteModal";
import FilterPaperContainer from "@/components/utility/FilterPaperContainer";
import UnitModal from "./UnitPageModal";

export default function UnitsPage() {
  return (
    <TableFormProvider url={"fast-handler"}>
      <UnitsWrapper />
    </TableFormProvider>
  );
}

const UnitsWrapper = () => {
  const { id, submitData } = useTableForm();
  const [disabled, setDisabled] = useState(false);
  const [properties, setProperties] = useState([]);
  const [loadingProperty, setLoadingProperty] = useState(true);
  const [reFetch, setRefetch] = useState({});
  const searchParams = useSearchParams();
  const rentStatusParam = searchParams.get("rentStatus");
  const [rentStatus, setRentStatus] = useState(rentStatusParam || "all");
  const [unit, setUnit] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [openRentModal, setOpenRentModal] = useState(false);

  const {
    data = [],
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
    setOthers,
    others,
    setFilters,
  } = useDataFetcher("main/units", null, { rentStatus: rentStatusParam });

  const { setLoading: setSubmitLoading } = useToastContext();
  const router = useRouter();

  useEffect(() => {
    async function fetchProperties() {
      setLoadingProperty(true);
      const propertiesData = await getProperties();
      setProperties(propertiesData.data || []); // Ensure properties is an array
      setLoadingProperty(false);
    }

    fetchProperties();
  }, []);

  useEffect(() => {
    setFilters({ rentStatus: rentStatusParam });
  }, [rentStatusParam]);

  async function getUnitTypes() {
    const res = await fetch("/api/fast-handler?id=unitType");
    const data = await res.json();
    return { data: data || [] }; // Ensure data is an array
  }

  async function getProperties() {
    const res = await fetch("/api/fast-handler?id=properties");
    const data = await res.json();
    return { data: data || [] }; // Ensure data is an array
  }

  unitInputs[2] = {
    ...unitInputs[2],
    extraId: false,
    getData: getUnitTypes,
  };

  unitInputs[0] = {
    ...unitInputs[0],
    data: {
      ...unitInputs[0].data,
      disabled: false,
    },
    value: null,
    extraId: false,
    getData: getProperties,
  };

  async function getRenters() {
    const res = await fetch("/api/fast-handler?id=renter");
    const data = await res.json();
    return { data: data || [] }; // Ensure data is an array
  }

  async function getRentCollectionType() {
    const data = [
      { id: "TWO_MONTHS", name: "شهرين" },
      { id: "THREE_MONTHS", name: "ثلاثة أشهر" },
      { id: "FOUR_MONTHS", name: "أربعة أشهر" },
      { id: "SIX_MONTHS", name: "ستة أشهر" },
      { id: "ONE_YEAR", name: "سنة واحدة" },
    ];
    return { data: data || [] }; // Ensure data is an array
  }

  async function getUnits() {
    const res = await fetch(
      "/api/fast-handler?id=unit&propertyId=" + propertyId
    );
    const data = await res.json();
    const dataWithLabel = (data || []).map((item) => {
      // Ensure data is an array
      return {
        ...item,
        name: item.number,
        disabled: item.rentAgreements?.some((rent) => rent.status === "ACTIVE"),
      };
    });

    return { data: dataWithLabel, id: propertyId };
  }

  const rentInputs = rentAgreementInputs.map((input) => {
    switch (input.data.id) {
      case "rentCollectionType":
        return {
          ...input,
          extraId: false,
          getData: getRentCollectionType,
        };
      case "renterId":
        return {
          ...input,
          extraId: false,
          getData: getRenters,
        };
      case "propertyId":
        return {
          ...input,
        };
      case "unitId":
        return {
          ...input,
        };
      default:
        return input;
    }
  });

  async function handleDelete(id) {
    const filterData = data.filter((item) => item.id !== +id);
    setData(filterData);
    setTotal((old) => old - 1);
    if (page === 1 && total >= limit) {
      setRender((old) => !old);
    } else {
      setPage((old) => (old > 1 ? old - 1 : 1) || 1);
    }
  }

  function onEdit(data) {
    setRender((old) => !old);
  }
  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={"units/" + params.row.id}>
          <Button variant={"text"}>{params.row.id}</Button>
        </Link>
      ),
    },
    {
      field: "property",
      headerName: "العقار",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={"/properties/" + params.row.property?.id}>
          <Button variant={"text"}>{params.row.property?.name}</Button>
        </Link>
      ),
    },
    {
      field: "number",
      headerName: "رقم الوحدة",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "type",
      headerName: "نوع الوحدة",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => <>{params.row.type?.name}</>,
    },
    {
      field: "yearlyRentPrice",
      headerName: "سعر الإيجار السنوي",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <>{formatCurrencyAED(params.row.yearlyRentPrice)}</>
      ),
    },
    {
      field: "electricityMeter",
      headerName: "رقم عداد الكهرباء",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "floor",
      headerName: "الدور",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "actions",
      width: 350,
      printable: false,
      renderCell: (params) => (
        <div className={"flex items-center gap-2"}>
          <UnitModal unitId={params.row.id} onSubmit={onEdit} />

          {rentStatusParam === "notRented" && (
            <Button
              variant="contained"
              color="success"
              onClick={() => {
                setUnit(params.row);
                setOpenRentModal(true);
              }}
              sx={{ mr: 1 }}
            >
              انشاء عقد ايجار
            </Button>
          )}
          <DeleteModal
            href={`main/units`}
            item={params.row}
            handleClose={() => handleDelete(params.row.id)}
          />
        </div>
      ),
    },
  ];

  function handlePropertyFilterChange(event) {
    setOthers("propertyId=" + event.target.value);
  }

  function handleRentStatus(event) {
    const rentStatus = event.target.value;
    router.push(`?rentStatus=${rentStatus}`);
    setRentStatus(rentStatus);
  }

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const validateTotalPrice = (data) => {
    const discountedTotalPrice =
      parseFloat(data.totalPrice) - (parseFloat(data.discount) || 0);
    const totalInstallmentAmount = (data.installments || []).reduce(
      (sum, installment) => sum + parseFloat(installment.amount),
      0
    );
    return totalInstallmentAmount === discountedTotalPrice;
  };

  async function submitRent(formData) {
    if (!validateTotalPrice(formData)) {
      setSnackbarOpen(true);
      return;
    }
    formData.propertyId = unit.propertyId;
    formData.unitId = unit.id;
    const response = await submitRentAgreement(
      formData,
      setSubmitLoading,
      null,
      null,
      null,
      true
    );

    if (response) {
      const newData = (data || []).filter((oldUnit) => oldUnit.id !== unit.id); // Ensure data is an array
      setData(newData);
      setOpenRentModal(false);
      setUnit(null);
    }
  }

  return (
    <>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert onClose={handleSnackbarClose} severity="error">
          المجموع الكلي للأقساط لا يتطابق مع السعر الكلي. يرجى التحقق من
          المدخلات.
        </Alert>
      </Snackbar>
      <FilterPaperContainer>
        <FormControl sx={{ mb: 2, maxWidth: 300 }}>
          <InputLabel>العقار</InputLabel>
          <Select
            value={others.split("=")[1] || "all"}
            onChange={handlePropertyFilterChange}
            displayEmpty
            fullWidth
            loading={loadingProperty}
          >
            <MenuItem value="all">جميع العقارات </MenuItem>
            {(properties || []).map(
              (
                property // Ensure properties is an array
              ) => (
                <MenuItem value={property.id} key={property.id}>
                  {property.name}
                </MenuItem>
              )
            )}
          </Select>
        </FormControl>
        <FormControl sx={{ mb: 2, maxWidth: 300 }}>
          <InputLabel>حالة الوحدة</InputLabel>
          <Select
            value={rentStatus}
            onChange={handleRentStatus}
            displayEmpty
            fullWidth
            loading={loadingProperty}
          >
            <MenuItem value="all">جميع الحالات </MenuItem>
            <MenuItem value="rented">مؤجرة</MenuItem>
            <MenuItem value="notRented">شاغرة</MenuItem>
          </Select>
        </FormControl>
      </FilterPaperContainer>
      {unit && (
        <RentModal
          openModal={openRentModal}
          data={{
            property: unit.property,
            propertyId: unit.property.id,
            unitId: unit.id,
            unitNumber: unit.unitId,
            ...unit,
          }}
          handleClose={() => {
            setOpenRentModal(false);
            setUnit(null);
          }}
          inputs={rentInputs}
          submit={submitRent}
        />
      )}
      <ViewComponent
        inputs={unitInputs}
        formTitle={"وحده جديده"}
        totalPages={totalPages}
        rows={data}
        columns={columns}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        id={id}
        loading={loading}
        setData={setData}
        setTotal={setTotal}
        total={total}
        disabled={disabled}
        reFetch={reFetch}
        url={"main/units"}
      />
    </>
  );
};

function RentModal({
  data,
  inputs,
  openModal,
  handleClose,
  canEdit = true,
  submit,
}) {
  let modalInputs = inputs.map((input) => {
    return {
      ...input,
      data: {
        ...input.data,
      },
      value: data ? data[input.data.id] : input.value,
    };
  });

  modalInputs[0] = {
    data: {
      id: "propertyId",
      label: "العقار",
      type: "text",
      name: "propertyId",
      disabled: true,
    },
    value: data?.property.name,
    sx: {
      width: {
        xs: "100%",
        sm: "48%",
      },
      mr: "auto",
    },
  };

  modalInputs[1] = {
    data: {
      id: "unitNumber",
      label: "رقم الوحدة",
      type: "text",
      disabled: true,
    },
    value: data?.number,
    sx: {
      width: {
        xs: "100%",
        sm: "48%",
      },
    },
  };

  modalInputs[modalInputs.length] = {
    data: {
      id: "unitId",
      label: "الوحدة",
      type: "text",
      name: "unitId",
    },
    sx: {
      width: {
        xs: "100%",
        sm: "48%",
      },
      display: "none",
    },
  };

  return (
    <Modal open={openModal} onClose={() => handleClose()}>
      {canEdit ? (
        <Box sx={{ ...simpleModalStyle, minWidth: "60%" }}>
          <Form
            formTitle={"انشاء عقد ايجار"}
            inputs={modalInputs}
            onSubmit={async (data) => {
              await submit(data);
            }}
            variant={"outlined"}
            btnText={"انشاء"}
            extraComponent={InstallmentComponent}
          />
        </Box>
      ) : (
        <Box sx={simpleModalStyle}>
          <Typography
            variant={"h5"}
            align={"center"}
            color={"error"}
            sx={{ fontWeight: "bold" }}
          >
            ليس لديك الصلاحية لتعديل هذا العنصر
          </Typography>
        </Box>
      )}
    </Modal>
  );
}
