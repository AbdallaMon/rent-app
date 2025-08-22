"use client";
import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import { Button } from "@mui/material";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import ViewComponent from "@/components/ViewComponent/ViewComponent";

import { contractExpenseInputs } from "@/app/settings/contract-expense-type/contractExpenseInputs";
import DeleteBtn from "@/components/ui/Buttons/DeleteBtn";

export default function ContractExpensePage() {
  return (
    <TableFormProvider url={"settings/contract-expense-type"}>
      <ContractExpenseWrapper />
    </TableFormProvider>
  );
}

const ContractExpenseWrapper = () => {
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
  } = useDataFetcher("settings/contract-expense-type");
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
    },
    {
      field: "name",
      headerName: "اسم المصروف",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "value",
      headerName: "القيمة",
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
            sx={{ mt: 1, mr: 1 }}
          >
            تعديل
          </Button>
          <DeleteBtn handleDelete={() => handleDelete(params.row.id)} />
        </>
      ),
    },
  ];

  return (
    <>
      <ViewComponent
        inputs={contractExpenseInputs}
        formTitle={"نوع مصاريف العقد"}
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
        total={total}
        setTotal={setTotal}
      />
    </>
  );
};
