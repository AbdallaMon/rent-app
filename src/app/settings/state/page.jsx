"use client";
import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import { Button } from "@mui/material";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { stateInputs } from "@/app/settings/state/inputs";
import { useState } from "react";
import Link from "next/link";
import { ExtraForm } from "@/components/ui/FormComponents/Forms/ExtraForms/ExtraForm";
import useEditState from "@/helpers/hooks/useEditState";
import DeleteBtn from "@/components/ui/Buttons/DeleteBtn";

export default function StatePage() {
  return (
    <TableFormProvider url={"settings/states"}>
      <StateWrapper />
    </TableFormProvider>
  );
}

const StateWrapper = () => {
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
  } = useDataFetcher("settings/states");
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
        <Link href={`state/${params.row.id}`}>
          <Button variant={"text"}>{params.row.id}</Button>
        </Link>
      ),
    },
    {
      field: "name",
      headerName: "اسم الاماره",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={`state/${params.row.id}`}>
          <Button variant={"text"}>{params.row.name}</Button>
        </Link>
      ),
    },
    {
      field: "cities",
      type: "size",
      headerName: "عدد المدن",
      width: 150,
      printable: true,
      cardWidth: 48,
      valueGetter: (params) => {
        return params.length;
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
  const [cities, setCities] = useState([]);
  const cityFields = [
    {
      id: "name",
      type: "text",
      label: "اسم المدينة",
    },
  ];
  const {
    isEditing: isCityEditing,
    setIsEditing: setIsCityEditing,
    snackbarOpen,
    setSnackbarOpen,
    snackbarMessage,
    setSnackbarMessage,
    handleEditBeforeSubmit,
  } = useEditState([{ name: "cities", message: "المدن" }]);

  return (
    <>
      <ViewComponent
        inputs={stateInputs}
        formTitle={"اماره"}
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
        extraData={cities}
        extraDataName={"cities"}
        setExtraData={setCities}
        total={total}
        setTotal={setTotal}
        handleEditBeforeSubmit={handleEditBeforeSubmit}
      >
        <ExtraForm
          setItems={setCities}
          items={cities}
          fields={cityFields}
          title={"مدن"}
          formTitle={"المدن"}
          name={"cities"}
          setSnackbarMessage={setSnackbarMessage}
          setSnackbarOpen={setSnackbarOpen}
          snackbarMessage={snackbarMessage}
          snackbarOpen={snackbarOpen}
          isEditing={isCityEditing}
          setIsEditing={setIsCityEditing}
        />
      </ViewComponent>
    </>
  );
};
