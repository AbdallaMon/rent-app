"use client";
import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import { Button } from "@mui/material";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useEffect, useState } from "react";
import { TextField, IconButton } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { ownerInputs } from "@/app/owners/ownerInputs";
import Link from "next/link";
import DeleteBtn from "@/components/ui/Buttons/DeleteBtn";
import { ExtraForm } from "@/components/ui/FormComponents/Forms/ExtraForms/ExtraForm";
import useEditState from "@/helpers/hooks/useEditState";
import DeleteModal from "@/components/ui/Modals/DeleteModal";

export default function OwnerPage() {
  return (
    <TableFormProvider url={"clients/owner"}>
      <OwnerWrapper />
    </TableFormProvider>
  );
}

const OwnerWrapper = () => {
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
  } = useDataFetcher("clients/owner");
  const { setOpenModal, setId, id, submitData } = useTableForm();

  const handleEdit = (id) => {
    setId(id);
    setOpenModal(true);
  };

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
    },
    {
      field: "name",
      headerName: "اسم المالك",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "phone",
      headerName: "رقم الهاتف",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "email",
      headerName: "الإيميل",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "nationalId",
      headerName: "هوية المالك",
      width: 200,
      printable: true,
      cardWidth: 48,
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
            sx={{ mr: 1, borderRadius: 2 }}
          >
            تعديل
          </Button>
          <DeleteModal
            handleClose={() => handleDelete(params.row.id)}
            href={`clients/owner`}
            item={params.row}
          />
        </>
      ),
    },
  ];
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [bankAccountsFields, setBankAccountFields] = useState([
    {
      id: "accountName",
      type: "text",
      label: "اسم الحساب",
    },
    {
      id: "accountNumber",
      type: "text",
      label: "رقم الحساب",
    },
    {
      id: "bankId",
      type: "select",
      label: "البنك",
    },
  ]);
  useEffect(() => {
    async function getBanksData() {
      setLoadingOptions(true);
      const res = await fetch("/api/fast-handler?id=bank");
      const data = await res.json();
      const newFields = [...bankAccountsFields];
      newFields[2].options = data.map((item) => ({
        value: item.id,
        label: item.name,
      }));
      setBankAccountFields(newFields);
      setLoadingOptions(false);
    }

    getBanksData();
  }, []);
  const {
    isEditing,
    setIsEditing,
    snackbarOpen,
    setSnackbarOpen,
    snackbarMessage,
    setSnackbarMessage,
    handleEditBeforeSubmit,
  } = useEditState([{ name: "bankAccounts", message: "الحسابات" }]);

  return (
    <>
      <ViewComponent
        inputs={ownerInputs}
        formTitle={"مالك"}
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
        handleEditBeforeSubmit={handleEditBeforeSubmit}
        extraData={{ bankAccounts }}
        setExtraData={setBankAccounts}
        extraDataName={"bankAccounts"}
      >
        {loadingOptions ? (
          "جاري تحميل بيانات البنوك"
        ) : (
          <ExtraForm
            setItems={setBankAccounts}
            items={bankAccounts}
            fields={bankAccountsFields}
            title={"حساب جديد"}
            formTitle={"الحسابات"}
            name={"bankAccounts"}
            setSnackbarMessage={setSnackbarMessage}
            setSnackbarOpen={setSnackbarOpen}
            snackbarMessage={snackbarMessage}
            snackbarOpen={snackbarOpen}
            isEditing={isEditing}
            setIsEditing={setIsEditing}
          />
        )}
      </ViewComponent>
    </>
  );
};
