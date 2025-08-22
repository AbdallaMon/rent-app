import React, {useState} from 'react';
import {DataGrid, GridToolbar} from '@mui/x-data-grid';
import { Button, Link } from '@mui/material';
import printJS from 'print-js'

export default function RentAgreements({ rents, loading, page, limit, setPage, setLimit }) {

    const [editModel, setEditModel] = useState({});
    const [id, setId] = useState(null);
    if (loading) return <div>Loading...</div>;

    const exportToPrint = (rowData) => {
        const selectedFields = [
            { field: 'unitId', headerName: 'اسم الوحده' },
            { field: 'renterId', headerName: 'المستاجر' },
            { field: 'price', headerName: 'مبلغ الايجار السنوي' },
            { field: 'tax', headerName: 'قيمة الضريبه' },
            { field: 'startDate', headerName: 'تاريخ البدء' },
            { field: 'endDate', headerName: 'تاريخ الانتهاء' },
        ];

        let rentAgreementHtml = `
    <div style="border: 1px solid black; padding: 10px; margin: 10px; direction: rtl">
        <h2 style="text-align: center ;font-weight: bold">عقد ايجار</h2>
        ${selectedFields.map(field => `
            <p style="display: flex; gap: 5px; justify-content: space-between">
                <strong>${field.headerName}:</strong> ${rowData[field.field]}
            </p>
        `).join('')}
    </div>`;

        printJS({printable: rentAgreementHtml, type: 'raw-html'});
    };
    const columns = [
        { field: 'id', headerName: 'ID', width: 90 },
        { field: 'unitId', headerName: 'اسم الوحده', width: 150,  },
        { field: 'renterId', headerName: 'المستاجر', width: 150, },
        { field: 'price', headerName: 'مبلغ الايجار السنوي', width: 150},
        { field: 'tax', headerName: "قيمة الضريبه", width: 150},
        { field: 'startDate', headerName: 'تاريخ البدء', width: 150 },
        { field: 'endDate', headerName: 'تاريخ الانتهاء', width: 150 },
        {
            field:"طباعه",
            headerName: "طباعه",
            width: 150,
            renderCell: (params) => (
                  <Button variant="contained" color="primary" onClick={() => exportToPrint(params.row)}>
                      Print
                  </Button>
            ),
        },
        {
            field: 'viewDetails',
            headerName: 'رؤية التفاصيل',
            width: 200,
            renderCell: (params) => (
                  <Link href={`/properties/${params.row._id}`}>
                      View Details
                  </Link>
            ),
        },
        {
            field: 'تعديل',
            headerName: 'تعديل',
            width: "fit-content",
            renderCell: (params) => (
                  <Button variant="contained" color="primary" onClick={() => handleEdit(params.row._id)}>
                      Edit
                  </Button>
            ),
        },
    ];

    const handleEdit = (id) => {
        setId(id);
        setEditModel(true)
    };

    const handlePageChange = (params) => {
        setPage(params.page);
    };

    const handlePageSizeChange = (params) => {
        setLimit(params.pageSize);
    };
    const processedRents = rents?.rentAgreements.map(rent => ({
        ...rent,
        unitId: rent.unitId.name,
        renterId: rent.renterId.name,
        startDate: new Date(rent.startDate).toLocaleDateString(),
        endDate: new Date(rent.endDate).toLocaleDateString(),
    }));
    console.log(processedRents,"processedRents")
    return (
          <div style={{ height:"80vh", width: '100%',marginRight:"auto" ,marginTop:"50px"}}>
              <DataGrid
                    rows={processedRents}
                    columns={columns}
                    pageSize={limit}
                    paginationMode="server"
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    rowCount={rents.pagination.total}
                    page={page - 1}
                    slots={{ toolbar: GridToolbar }}
              />
          </div>)

}
