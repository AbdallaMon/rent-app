"use client";

import { useEffect, useState } from "react";
import DataGrid from "@/components/DataGrid/DataGrid";
import CustomTable from "@/components/Tables/CustomTable";
import { EditTableModal } from "@/components/ui/Modals/EditTableModal";
import { useTableForm } from "@/app/context/TableFormProvider/TableFormProvider";
import {
  alpha,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { CreateFormModal } from "@/components/ui/Modals/CreateFormModal";
import { EditFormModal } from "@/components/ui/Modals/EditFormModal";

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
  noPagination,
  noCreate,
  footerRow,
  withEdit,
  editInputs,
  onEdit,
  parseNewData,
  anotherComponent: AnotherComponent,
}) {
  const [view, setView] = useState("table");
  const [showForm, setShowForm] = useState(directEdit);
  const { openModal, submitData } = useTableForm();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const theme = useTheme();
  function openEditModal(data) {
    setCurrentId(data.id);
    setEditModalOpen(true);
  }
  function closeEditModal(data) {
    setCurrentId(null);
    setEditModalOpen(false);
  }
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

  const isAbleToCreate = canCreate();
  async function create(data) {
    if (handleEditBeforeSubmit) {
      const continueCreation = handleEditBeforeSubmit();
      if (!continueCreation) return;
    }
    data = { ...data, extraData };

    const newData = submitFunction
      ? await submitFunction(data)
      : await submitData(data, null, null, "POST", null, "json", url);

    if (newData.status === 500) return;
    if (newData) {
      if ((rows.length < limit && newData) || parseNewData) {
        setData((old) => [newData, ...old]);
      } else {
        setTotal((old) => old + 1);
      }
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
    <Paper
      elevation={1}
      sx={{
        p: 3,
        mb: 3,

        borderRadius: 2,
      }}
    >
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

        <Box
          direction="row"
          justifyContent="space-between"
          flexWrap="wrap"
          spacing={2}
          alignItems="center"
          display="flex"
          sx={{ mb: 2 }}
        >
          <Typography variant="h5" fontWeight={700}>
            {title}
          </Typography>
          {!noTabs && (
            <Stack
              direction="row"
              justifyContent="flex-end"
              alignItems="center"
              spacing={1.5}
            >
              {isAbleToCreate && !noCreate && (
                <Button
                  variant="outlined"
                  color="primary"
                  onClick={handleOpenCreateModal}
                >
                  {showForm ? "إخفاء النموذج" : "انشاء"}
                </Button>
              )}
              {isAbleToCreate && AnotherComponent && (
                <AnotherComponent onSaved={submitFunction} />
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
        </Box>

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
            disablePagination={noPagination}
            footerRow={footerRow}
            edit={canEdit && withEdit}
            openEditModal={openEditModal}
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
        {!noCreate && (
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
        )}
        {withEdit && canEdit && currentId && (
          <EditFormModal
            open={editModalOpen}
            inputs={editInputs}
            formTitle={formTitle}
            onSubmit={onEdit}
            extraComponent={extraComponent}
            disabled={disabled}
            setData={setData}
            reFetch={reFetch}
            rows={rows}
            currentId={currentId}
            closeEditModal={closeEditModal}
            url={url}
          >
            {children}
          </EditFormModal>
        )}
      </Box>
    </Paper>
  );
}
