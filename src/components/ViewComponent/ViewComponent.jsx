"use client";

import { useEffect, useState } from "react";
import DataGrid from "@/components/DataGrid/DataGrid";
import CustomTable from "@/components/Tables/CustomTable";
import { EditTableModal } from "@/components/ui/Modals/EditTableModal";
import { useTableForm } from "@/app/context/TableFormProvider/TableFormProvider";
import { Box, Button, Stack, Typography } from "@mui/material";
import { CreateFormModal } from "@/components/ui/Modals/CreateFormModal";
import { useAuth } from "@/app/context/AuthProvider/AuthProvider";
import { usePathname } from "next/navigation";
import { getCurrentPrivilege } from "@/helpers/functions/getUserPrivilege";

export default function ViewComponent({
  columns,
  rows = [],
  page,
  limit,
  setPage,
  setLimit,
  loading,
  inputs,
  setData,
  id,
  children,
  extraData,
  extraDataName,
  setExtraData,
  fullWidth,
  setTotal,
  total,
  noModal = false,
  directEdit = false,
  disabled,
  createModalsData,
  reFetch,
  url,
  handleEditBeforeSubmit,
  noTabs,
  submitFunction,
  setIdEditing,
  onModalOpen,
  formTitle,
  title,
  extraComponent,
  rerender,
}) {
  const [view, setView] = useState("table");
  const [showForm, setShowForm] = useState(directEdit);
  const { openModal, submitData } = useTableForm();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const { user } = useAuth();
  const pathName = usePathname();

  function canEdit() {
    const currentPrivilege = getCurrentPrivilege(user, pathName);
    return currentPrivilege?.privilege.canEdit;
  }

  function canCreate() {
    const currentPrivilege = getCurrentPrivilege(user, pathName);
    return currentPrivilege?.privilege.canWrite;
  }

  async function create(data) {
    if (handleEditBeforeSubmit) {
      const continueCreation = handleEditBeforeSubmit();
      if (!continueCreation) return;
    }
    data = { ...data, extraData };

    const newData = submitFunction
      ? await submitFunction(data)
      : await submitData(data, null, null, "POST", null, "json", url);

    if (rows.length < limit && newData) {
      setData((old) => [...old, newData]);
    } else {
      setTotal((old) => old + 1);
    }
    return newData;
  }

  useEffect(() => {
    if (openModal && !noModal) {
      setShowForm(false);
    }
  }, [openModal, noModal]);

  const handleOpenCreateModal = () => {
    if (setIdEditing) setIdEditing(null);
    setCreateModalOpen(true);
    onModalOpen && onModalOpen();
  };
  const handleCloseCreateModal = () => setCreateModalOpen(false);

  return (
    <Box>
      {openModal && !noModal && (
        <EditTableModal
          fullWidth={fullWidth}
          inputs={inputs}
          formTitle={"تعديل " + formTitle}
          rows={rows}
          id={id}
          setData={setData}
          extraDataName={extraDataName}
          setExtraData={setExtraData}
          extraData={extraData}
          handleEditBeforeSubmit={handleEditBeforeSubmit}
          canEdit={canEdit}
          rerender={rerender}
        >
          {children}
        </EditTableModal>
      )}

      {!noTabs && (
        <Stack
          direction="row"
          justifyContent="flex-end"
          alignItems="center"
          spacing={1.5}
          sx={{ mb: 2 }}
        >
          {canCreate() && (
            <Button
              variant="outlined"
              color="primary"
              onClick={handleOpenCreateModal}
            >
              {showForm ? "إخفاء النموذج" : "انشاء"}
            </Button>
          )}

          <Button
            variant="outlined"
            color="primary"
            onClick={() => setView("table")}
          >
            عرض الجدول
          </Button>

          <Button
            variant="outlined"
            color="primary"
            onClick={() => setView("dataGrid")}
          >
            عرض كارت
          </Button>
        </Stack>
      )}

      <Typography variant="h5" fontWeight={700} sx={{ mb: -1, mt: 1 }}>
        {title}
      </Typography>

      {view === "table" && (
        <CustomTable
          columns={columns}
          rows={rows}
          page={page}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
          loading={loading}
          total={total}
          setTotal={setTotal}
        />
      )}

      {view === "dataGrid" && (
        <DataGrid
          columns={columns}
          rows={rows}
          page={page}
          limit={limit}
          setPage={setPage}
          setLimit={setLimit}
          loading={loading}
          total={total}
          setTotal={setTotal}
        />
      )}

      <CreateFormModal
        open={createModalOpen}
        handleClose={handleCloseCreateModal}
        inputs={inputs}
        formTitle={formTitle}
        onSubmit={async (data) => {
          const submit = await create(data);
          if (submit) handleCloseCreateModal();
        }}
        extraComponent={extraComponent}
        disabled={disabled}
        createModalsData={createModalsData}
        reFetch={reFetch}
      >
        {children}
      </CreateFormModal>
    </Box>
  );
}
