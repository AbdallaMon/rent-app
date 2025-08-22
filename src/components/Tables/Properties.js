import React, { useState } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import { Button, Link } from "@mui/material";

export default function Properties({
  properties,
  loading,
  page,
  limit,
  setPage,
  setLimit,
}) {
  const [editModel, setEditModel] = useState({});
  const [id, setId] = useState(null);

  if (loading) return <div>Loading...</div>;

  const columns = [
    { field: "name", headerName: "الاسم", width: 200 },
    { field: "address", headerName: "العنوان", width: 200 },
    {
      field: "units",
      headerName: "الوحدات",
      width: 100,
      valueGetter: (params) => params.length,
    },
    { field: "ownerId", headerName: "المالك", width: 150 },
    { field: "cityId", headerName: "المدينه", width: 200 },
    {
      field: "viewDetails",
      headerName: "رؤية التفاصيل",
      width: 200,
      renderCell: (params) => (
        <Link href={`/properties/${params.row._id}`}>View Details</Link>
      ),
    },
    {
      field: "تعديل",
      width: "fit-content",
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleEdit(params.row._id)}
        >
          Edit
        </Button>
      ),
    },
  ];

  const handleEdit = (id) => {
    setId(id);
    setEditModel(true);
  };

  const handlePageChange = (params) => {
    setPage(params.page);
  };

  const handlePageSizeChange = (params) => {
    setLimit(params.pageSize);
  };
  const processedProperties = properties?.properties.map((property) => ({
    ...property,
    ownerId: property.ownerId.name,
    cityId: property.cityId.name,
  }));
  return (
    <div
      style={{
        height: "80vh",
        width: "100%",
        marginRight: "auto",
        marginTop: "50px",
      }}
      className="rtl-print"
    >
      <DataGrid
        rows={processedProperties}
        columns={columns}
        pageSize={limit}
        paginationMode="server"
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        rowCount={properties.pagination.total}
        page={page - 1}
        slots={{
          toolbar: GridToolbar,
          hideToolbar: true,
        }}
      />
    </div>
  );
}
