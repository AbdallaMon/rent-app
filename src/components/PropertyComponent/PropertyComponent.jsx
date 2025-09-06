import { useTableForm } from "@/app/context/TableFormProvider/TableFormProvider";
import { Button } from "@mui/material";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useState } from "react";
import { propertyInputs } from "@/app/properties/propertyInputs";
import { ExtraForm } from "@/components/ui/FormComponents/Forms/ExtraForms/ExtraForm";
import useEditState from "@/helpers/hooks/useEditState";
import Link from "next/link";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { submitProperty } from "@/services/client/properties";
import { formatCurrencyAED } from "@/helpers/functions/convertMoneyToArabic";
import { ownerInputs } from "@/app/owners/ownerInputs";
import DeleteModal from "../ui/Modals/DeleteModal";
import EditProperty from "@/app/properties/EditPropertyDialog";

const PropertyComponent = ({ clientId, noTabs }) => {
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
  } = useDataFetcher("main/properties", false, { clientId });

  const { id, submitData } = useTableForm();

  const [stateId, setStateId] = useState(null);
  const [cityId, setCityId] = useState(null);
  const [ownerId, setOwnerId] = useState(null);
  const [districtId, setDistrictId] = useState(null);
  const [disabled, setDisabled] = useState({
    cityId: true,
    districtId: true,
    neighbourId: true,
    bankAccount: true,
  });

  const [reFetch, setRefetch] = useState({
    cityId: false,
    districtId: false,
    neighbourId: false,
    bankAccount: false,
  });

  async function getStatesData() {
    const res = await fetch("/api/fast-handler?id=state");
    const data = await res.json();

    return { data };
  }

  async function getCitiesDataByStateId() {
    const res = await fetch("/api/fast-handler?id=city&stateId=" + stateId);
    const data = await res.json();

    return { data, id: stateId };
  }

  async function getDistrictsDataByCityId() {
    const res = await fetch("/api/fast-handler?id=district&cityId=" + cityId);
    const data = await res.json();

    return { data, id: cityId };
  }

  async function getNeighboursDataByDistrictId() {
    const res = await fetch(
      "/api/fast-handler?id=neighbour&districtId=" + districtId
    );
    const data = await res.json();
    return { data, id: districtId };
  }

  async function getOwners() {
    const res = await fetch("/api/fast-handler?id=owner");
    const data = await res.json();
    return { data };
  }
  async function getCurrentOwner() {
    return { data: [{ id: ownerId, name: `#${ownerId}` }] };
  }

  function getCurrentOwnerId() {
    return ownerId;
  }
  async function getPropertyTypes() {
    const res = await fetch("/api/fast-handler?id=propertyType");
    const data = await res.json();
    return { data };
  }

  async function getCollectors() {
    const res = await fetch("/api/fast-handler?id=collector");
    const data = await res.json();
    return { data };
  }

  async function getOwnerAccountData() {
    const res = await fetch("/api/clients/owner/" + ownerId);
    const data = await res.json();
    const bankAccounts = data?.bankAccounts.map((account) => ({
      id: account.id,
      name: account.accountNumber,
      ownerId: ownerId,
    }));
    return { data: bankAccounts };
  }

  const handleStateChange = (newValue) => {
    setStateId(newValue);
    setCityId(null);
    setDistrictId(null);
    setDisabled({
      ...disabled,
      cityId: newValue === null,
      districtId: true,
      neighbourId: true,
    });
    setRefetch({ ...reFetch, cityId: true });
  };

  const handleCityChange = (newValue) => {
    setCityId(newValue);
    setDistrictId(null);
    setDisabled({
      ...disabled,
      districtId: newValue === null,
      neighbourId: true,
    });
    setRefetch({ ...reFetch, districtId: true, cityId: false });
  };

  const handleDistrictChange = (newValue) => {
    setDistrictId(newValue);
    setDisabled({
      ...disabled,
      neighbourId: newValue === null,
    });
    setRefetch({ ...reFetch, neighbourId: true, districtId: false });
  };

  const handleNeighbourChange = (newValue) => {
    setRefetch({ ...reFetch, neighbourId: false });
  };

  const dataInputs = propertyInputs.map((input) => {
    switch (input.data.id) {
      case "stateId":
        return {
          ...input,
          extraId: false,
          getData: getStatesData,
          onChange: handleStateChange,
        };
      case "cityId":
        return {
          ...input,
          getData: getCitiesDataByStateId,
          onChange: handleCityChange,
          disabled: disabled.cityId,
        };
      case "districtId":
        return {
          ...input,
          getData: getDistrictsDataByCityId,
          onChange: handleDistrictChange,
          disabled: disabled.districtId,
        };
      case "neighbourId":
        return {
          ...input,
          getData: getNeighboursDataByDistrictId,
          onChange: handleNeighbourChange,
          disabled: disabled.neighbourId,
        };
      case "bankAccount":
        return {
          ...input,
          extraId: false,
          getData: getOwnerAccountData,
          disabled: disabled.bankAccount,
          createData: [
            ...input.createData,
            {
              id: "owner",
              data: {
                id: "clientId",
                type: "select",
                label: "معرف المالك",
                name: "clientId",
                disabled: true,
              },
              preValue: getCurrentOwnerId(),
              createData: ownerInputs,
              getData: getCurrentOwner,
              pattern: {
                required: {
                  value: true,
                  message: "يرجى اختيار اسم المالك",
                },
              },
              sx: {
                width: {
                  xs: "100%",
                  md: "48%",
                },
                mr: "auto",
              },
            },
          ],
        };
      case "collectorId":
        return {
          ...input,
          extraId: false,
          getData: getCollectors,
        };
      case "clientId":
        return {
          ...input,
          extraId: false,
          getData: getOwners,
          onChange: (newValue) => {
            setOwnerId(newValue);
            setRefetch({ ...reFetch, bankAccount: true });
            setDisabled({ ...disabled, bankAccount: newValue === null });
          },
        };
      case "typeId":
        return {
          ...input,
          extraId: false,
          getData: getPropertyTypes,
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

  const columns = [
    {
      field: "id",
      headerName: "ID",
      width: 100,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={"/properties/" + params.row.id}>
          <Button variant={"text"}>{params.row.id}</Button>
        </Link>
      ),
    },
    {
      field: "name",
      headerName: "اسم العقار",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={"/properties/" + params.row.id}>
          <Button variant={"text"}>{params.row.name}</Button>
        </Link>
      ),
    },
    {
      field: "type",
      headerName: "نوع العقار",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => <>{params.row.type?.name}</>,
    },
    {
      field: "propertyId",
      headerName: "معرف العقار",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "ownerName",
      headerName: "اسم المالك",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={"/owners/" + params.row.client?.id}>
          <Button variant={"text"}>{params.row.client?.name}</Button>
        </Link>
      ),
    },

    {
      field: "price",
      headerName: "قيمة العقار",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <>{params.row.price ? formatCurrencyAED(params.row.price) : 0}</>
      ),
    },

    {
      field: "buildingGuardName",
      headerName: "اسم حارس العقار",
      width: 200,
      printable: true,
      cardWidth: 48,
    },

    {
      field: "_count",
      headerName: "عدد الوحدات",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <>{params.row._count?.units ? params.row._count.units : 0}</>
      ),
    },
    {
      field: "actions",
      width: 350,
      printable: false,
      renderCell: (params) => (
        <>
          <EditProperty
            id={params.row.id}
            onUpdate={() => {
              setRender((old) => !old);
            }}
          />
          <DeleteModal
            href={`main/properties`}
            item={params.row}
            handleClose={() => handleDelete(params.row.id)}
          />
        </>
      ),
    },
  ];
  const metersFields = [
    { id: "name", label: "اسم العداد", type: "text" },
    { id: "meterId", label: "رقم العداد", type: "number" },
  ];
  const [electricityMeters, setMeters] = useState([]);
  const [units, setUnits] = useState([]);
  const unitsFields = [{ id: "unitId", label: "معرف الوحده", type: "text" }];
  const {
    isEditing,
    setIsEditing,
    snackbarOpen,
    setSnackbarOpen,
    snackbarMessage,
    setSnackbarMessage,
    handleEditBeforeSubmit,
  } = useEditState([
    { name: "meters", message: "عدادات الكهرباء" },
    { name: "units", message: "وحدات العقار" },
  ]);
  const { setLoading: setSubmitLoading } = useToastContext();

  async function submit(data) {
    return await submitProperty(data, setSubmitLoading);
  }

  return (
    <>
      <ViewComponent
        inputs={dataInputs}
        formTitle={"عقار"}
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
        extraData={{ electricityMeters, units }}
        total={total}
        disabled={disabled}
        reFetch={reFetch}
        url={"main/properties"}
        handleEditBeforeSubmit={handleEditBeforeSubmit}
        noTabs={noTabs}
        submitFunction={submit}
      >
        {!noTabs && (
          <>
            <ExtraForm
              setItems={setMeters}
              items={electricityMeters}
              fields={metersFields}
              title={"عداد"}
              formTitle={"عدادات الكهرباء"}
              name={"meters"}
              setSnackbarMessage={setSnackbarMessage}
              setSnackbarOpen={setSnackbarOpen}
              snackbarMessage={snackbarMessage}
              snackbarOpen={snackbarOpen}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              resetNames={["units", "meters"]}
            />
            <ExtraForm
              setItems={setUnits}
              items={units}
              fields={unitsFields}
              name={"units"}
              formTitle={"وحدات العقار"}
              title={"وحدة"}
              setSnackbarMessage={setSnackbarMessage}
              setSnackbarOpen={setSnackbarOpen}
              snackbarMessage={snackbarMessage}
              snackbarOpen={snackbarOpen}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              resetNames={["units", "meters"]}
            />
          </>
        )}
      </ViewComponent>
    </>
  );
};

export default PropertyComponent;
