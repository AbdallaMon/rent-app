import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import React from "react";
import { Button } from "@mui/material";
import MainTable from "@/components/Tables/MainTable";

export default function BankTable({
  rows,
  page,
  totalPages,
  limit,
  setPage,
  setLimit,
  setEditModel,
  setId,
  loading,
}) {
  const columns = [
    { field: "id", headerName: "ID", width: 100 },
    { field: "name", headerName: "الاسم", width: 200 },
    { field: "country", headerName: "البلد", width: 200 },
    { field: "city", headerName: "المدينة", width: 200 },
    {
      field: "actions",
      headerName: "تعديل",
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleEdit(params.row.id)}
        >
          تعديل
        </Button>
      ),
    },
  ];
  const handleEdit = (id, setId, setOpenModal) => {
    setId(id);
    setOpenModal(true);
  };

  return (
    <MainTable
      setPage={setPage}
      setLimit={setLimit}
      limit={limit}
      page={page}
      columns={columns}
      rows={rows}
      totalPages={totalPages}
    />
  );
}
