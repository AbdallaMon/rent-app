import React, { useRef, useState } from "react";
import {
  DataGrid,
  GridToolbarColumnsButton,
  GridToolbarContainer,
  GridToolbarDensitySelector,
  GridToolbarExport,
} from "@mui/x-data-grid";
import { paginationOptions } from "@/config/constants";
import { useReactToPrint } from "react-to-print";

export default function MainTable({
  columns,
  rows = [], // Default to an empty array
  page,
  totalPages,
  limit,
  setPage,
  setLimit,
  loading,
}) {
  const handlePaginationChange = (paginationModel) => {
    setPage(paginationModel.page + 1);
    setLimit(paginationModel.pageSize);
  };
  const componentRef = useRef();

  return (
    <div
      style={{
        maxHeight: "70vh",
        width: "100%",
        marginRight: "auto",
        marginTop: "50px",
      }}
    >
      <DataGrid
        rows={rows}
        columns={columns}
        pageSize={limit}
        paginationMode="server"
        onPaginationModelChange={handlePaginationChange}
        loading={loading}
        ref={componentRef}
        page={page - 1}
        rowCount={totalPages}
        printOptions={{
          hideFooter: true,
          hideToolbar: true,
          hideFooterPagination: true,
          hideHeaderFilterMenus: true,
        }}
        disableRowSelectionOnClick
        disableColumnMenu
        initialState={{
          pagination: { paginationModel: { pageSize: limit } },
        }}
        pageSizeOptions={paginationOptions}
        slots={{
          toolbar: () => <CustomToolbar componentRef={componentRef} />,
        }}
        sx={{
          "& .MuiDataGrid-cell": {
            borderRight: "1px solid #e0e0e0", // Add border to cells
          },
          "& .MuiDataGrid-columnSeparator": {
            visibility: "visible", // Ensure column separators are visible for resizing
            "&.MuiDataGrid-iconSeparator": {
              color: "#e0e0e0", // Color of the column separator
            },
          },
          "& .MuiDataGrid-row": {
            borderBottom: "1px solid #e0e0e0", // Add border to rows
          },
          "& .MuiDataGrid-columnHeaders": {
            color: "#ffffff",
          },
        }}
      />
    </div>
  );
}

function CustomToolbar({ componentRef }) {
  const ref = useRef();
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  function handlePrintS() {
    const role = "menuitem";
    window.setTimeout(() => {
      const buttons = document.querySelectorAll(`[role="${role}"]`);
      const cvsButton = buttons[0];
      cvsButton.style.display = "none";
      const printButton = buttons[1];
      printButton.style.display = "none";
      window.setTimeout(() => {
        handlePrint();
        // printButton.click();
      }, 50);
    }, 50);
  }

  return (
    <GridToolbarContainer>
      <GridToolbarColumnsButton />
      <GridToolbarDensitySelector />
      <GridToolbarExport
        onPrint={() => console.log("Printing...")}
        ref={ref}
        csvOptions={{
          fileName: "my_data_export",
          delimiter: ";",
        }}
        printOptions={{
          disableToolbarButton: false,
        }}
        slotProps={{
          button: {
            onClick: () => {
              handlePrintS();
            },
          },
        }}
      />
    </GridToolbarContainer>
  );
}
