"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
} from "@mui/material";

import { Form } from "@/components/ui/FormComponents/Forms/Form";
import { ExtraForm } from "@/components/ui/FormComponents/Forms/ExtraForms/ExtraForm";
import { propertyInputs } from "./propertyInputs";
import CloseIcon from "@mui/icons-material/Close";

import { getChangedFields } from "@/helpers/functions/getChangedFields";
import useEditState from "@/helpers/hooks/useEditState";
import { usePathname } from "next/navigation";
import TableFormProvider, {
  useTableForm,
} from "../context/TableFormProvider/TableFormProvider";
import { getCurrentPrivilege } from "@/helpers/functions/getUserPrivilege";
import { useAuth } from "../context/AuthProvider/AuthProvider";
export default function EditProperty({ id, onUpdate }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const pathName = usePathname();
  function canEdit() {
    const currentPrivilege = getCurrentPrivilege(user, pathName);
    return currentPrivilege?.privilege.canEdit;
  }
  function handleClose() {
    setOpen(false);
  }
  if (!canEdit()) return;
  return (
    <TableFormProvider url={"fast-handler"}>
      <Button
        onClick={() => setOpen(true)}
        variant={"contained"}
        sx={{ mr: 1 }}
      >
        تعديل العقار
      </Button>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
        <DialogTitle>
          <IconButton
            onClick={handleClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <EditPropertyDialog
            urlId={id}
            setOpen={setOpen}
            open={open}
            onUpdated={onUpdate}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)} variant="outlined">
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </TableFormProvider>
  );
}
function EditPropertyDialog({ urlId, onUpdated, open, setOpen }) {
  const { submitData, openModal } = useTableForm();
  const [stateId, setStateId] = useState(null);
  const [cityId, setCityId] = useState(null);
  const [districtId, setDistrictId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const [ownerId, setOwnerId] = useState(null);
  const [renderedDefault, setRenderedDefault] = useState(false);

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
  const [electricityMeters, setMeters] = useState(
    data?.electricityMeters || []
  );
  const metersFields = [
    { id: "name", label: "اسم العداد", type: "text" },
    { id: "meterId", label: "رقم العداد", type: "number" },
  ];
  const {
    isEditing: isMetersEditing,
    setIsEditing: setIsMetersEditing,
    snackbarOpen,
    setSnackbarOpen,
    snackbarMessage,
    setSnackbarMessage,
    handleEditBeforeSubmit,
  } = useEditState([{ name: "meters", message: "عدادات الكهرباء" }]);

  useEffect(() => {
    async function getPropertyData() {
      const res = await fetch("/api/main/properties/" + urlId);
      const data = await res.json();
      setData(data.data);
      setLoading(false);
    }

    getPropertyData();
  }, []);
  useEffect(() => {
    if (typeof data === "object" && !loading) {
      setStateId(data.stateId);
      setCityId(data.cityId);
      setDistrictId(data.districtId);
      setMeters(data.electricityMeters);
      setOwnerId(data.clientId);

      setIsMetersEditing({
        meters: data.electricityMeters.map(() => false),
      });
      setDisabled({
        cityId: data.stateId ? false : true,
        districtId: data.cityId ? false : true,
        neighbourId: data.districtId ? false : true,
        bankAccount: data.bankId ? false : true,
      });
      window.setTimeout(() => setRenderedDefault(true), 100);
    }
  }, [loading, data]);

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
    input = {
      ...input,
      value: data ? data[input.data.id] : null,
    };
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

  async function create(returnedData) {
    const contintueCreation = handleEditBeforeSubmit();
    if (!contintueCreation) {
      return;
    }
    const changedData = getChangedFields(data, returnedData);

    const electricityMetersChanged = getChangedFields(
      data.electricityMeters,
      electricityMeters
    );
    const deletedMeters = data.electricityMeters.filter(
      (meter) => !electricityMeters.find((m) => m.id === meter.id)
    );
    returnedData = {
      ...changedData,
      extraData: {
        electricityMeters:
          Object.keys(electricityMetersChanged).length > 0
            ? electricityMeters
            : null,
        deletedMeters,
      },
    };
    const updated = await submitData(
      returnedData,
      null,
      null,
      "PUT",
      null,
      "json",
      "main/properties/" + urlId
    );

    if (data.status === 500) return;
    if (onUpdated) {
      onUpdated(updated);
    }
    setOpen(false);
  }
  if (loading || !renderedDefault) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <CircularProgress color="primary" size={48} thickness={4} />
      </Box>
    );
  }
  return (
    <>
      <Box>
        <Form
          formTitle={"تعديل العقار"}
          inputs={dataInputs}
          onSubmit={(data) => {
            create(data);
          }}
          disabled={disabled}
          variant={"outlined"}
          btnText={"تعديل"}
          reFetch={reFetch}
        >
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
            isEditing={isMetersEditing}
            setIsEditing={setIsMetersEditing}
            editPage={true}
          />
        </Form>
      </Box>
    </>
  );
}
