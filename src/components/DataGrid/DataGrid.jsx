import React, {useRef, useState} from "react";
import {IconButton, Paper, Toolbar,} from "@mui/material";
import {useReactToPrint} from "react-to-print";
import PrintIcon from "@mui/icons-material/Print";
import DataCard from "@/components/ui/Cards/DataCard";
import FullScreenLoader from "@/components/Loaders/SpinnerLoader";
import CustomPagination from "@/components/CutsomPagination";

export default function DataGrid({
                                     columns,
                                     rows = [], // Default to an empty array
                                     page,
                                     total,
                                     setTotal,
                                     limit,
                                     setPage,
                                     setLimit,
                                     loading,
                                 }) {
    const componentRef = useRef();
    const [printMode, setPrintMode] = useState(false);
    const totalPages = Math.ceil(total / limit);
    const handlePrint = useReactToPrint({
        content: () => componentRef.current,
        pageStyle: "@media print { .MuiTablePagination-root { display: none; } }",
        onBeforeGetContent: () => {
            setPrintMode(true);
            return Promise.resolve();
        },
        onAfterPrint: () => setPrintMode(false),
    });

    const printableColumns = columns.filter((column) => column.printable);

    return (
          <Paper className="p-4">
              {loading && <FullScreenLoader/>}
              <Toolbar className="flex justify-between">
                  <div>
                      <IconButton onClick={handlePrint}>
                          <PrintIcon/>
                      </IconButton>

                  </div>
              </Toolbar>
              <div
                    ref={componentRef}
                    className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3  gap-4"
              >
                  {rows.map((row) => (
                        <DataCard
                              key={row.id}
                              row={row}
                              columns={printMode ? printableColumns : columns}
                        />
                  ))}
              </div>
              <CustomPagination
                    setLimit={setLimit}
                    limit={limit}
                    setPage={setPage}
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    setTotal={setTotal}
              />
          </Paper>
    );
}
