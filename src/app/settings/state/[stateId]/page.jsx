"use client";
import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import Link from "next/link";
import { Button } from "@mui/material";
import { useState } from "react";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { cityInputs } from "@/app/settings/state/[stateId]/cityInputs";
import { ExtraForm } from "@/components/ui/FormComponents/Forms/ExtraForms/ExtraForm";
import useEditState from "@/helpers/hooks/useEditState";
import DeleteBtn from "@/components/ui/Buttons/DeleteBtn";

const CityPage = ({ params }) => {
  const { stateId } = params;

  return (
    <TableFormProvider url={"settings/states/" + stateId + "/cities"}>
      <CityWrapper stateId={stateId} />
    </TableFormProvider>
  );
};

const CityWrapper = ({ stateId }) => {
  const {
    data,
    loading,
    page,
    setPage,
    limit,
    setLimit,
    totalPages,
    setData,
    setRender,
    total,
    setTotal,
  } = useDataFetcher("settings/states/" + stateId + "/cities");
  const { setOpenModal, setId, id, submitData } = useTableForm();

  const handleEdit = (id) => {
    setId(id);
    setOpenModal(true);
  };

  async function handleDelete(id) {
    const res = await submitData(null, null, id, "DELETE");

    const filterData = data.filter((item) => item.id !== res.id);
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
        <Link href={`/settings/state/${stateId}/${params.row.id}/`}>
          <Button variant={"text"}>{params.row.id}</Button>
        </Link>
      ),
    },
    {
      field: "name",
      headerName: "اسم المدينه",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={`/settings/state/${stateId}/${params.row.id}/`}>
          <Button variant={"text"}>{params.row.name}</Button>
        </Link>
      ),
    },
    {
      field: "districts",
      type: "size",
      headerName: "عدد المناطق",
      width: 150,
      printable: true,
      cardWidth: 48,
      valueGetter: (params) => {
        return params.row.districts.length;
      },
    },
    {
      field: "actions",
      width: 250,
      printable: false,
      renderCell: (params) => (
        <>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleEdit(params.row.id)}
            sx={{ mt: 1, mr: 1 }}
          >
            تعديل
          </Button>
          <DeleteBtn handleDelete={() => handleDelete(params.row.id)} />
        </>
      ),
    },
  ];

  const [districts, setDistricts] = useState([]);
  const districtsFields = [
    {
      id: "name",
      type: "text",
      label: "اسم المنطقه",
    },
  ];
  const {
    isEditing: isDistrictEditing,
    setIsEditing: setIsDistrictEditing,
    snackbarOpen,
    setSnackbarOpen,
    snackbarMessage,
    setSnackbarMessage,
    handleEditBeforeSubmit,
  } = useEditState([{ name: "districts", message: "المناطق" }]);
  return (
    <>
      <Link href={`/settings/state/`}>
        <Button variant="contained" color="primary">
          العوده لاعدادت الامارات
        </Button>
      </Link>
      <ViewComponent
        inputs={cityInputs}
        formTitle={"مدينة"}
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
        extraData={districts}
        extraDataName={"districts"}
        setExtraData={setDistricts}
        total={total}
        setTotal={setTotal}
        handleEditBeforeSubmit={handleEditBeforeSubmit}
      >
        <ExtraForm
          setItems={setDistricts}
          items={districts}
          fields={districtsFields}
          title={"مناطق"}
          formTitle={"المناطق"}
          name={"districts"}
          setSnackbarMessage={setSnackbarMessage}
          setSnackbarOpen={setSnackbarOpen}
          snackbarMessage={snackbarMessage}
          snackbarOpen={snackbarOpen}
          isEditing={isDistrictEditing}
          setIsEditing={setIsDistrictEditing}
        />{" "}
      </ViewComponent>
    </>
  );
};
export default CityPage;
