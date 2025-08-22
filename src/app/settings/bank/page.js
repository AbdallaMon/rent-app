"use client";
import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import { Button } from "@mui/material";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import { bankInputs } from "@/app/settings/bank/inputs";

import ViewComponent from "@/components/ViewComponent/ViewComponent";
import DeleteBtn from "@/components/ui/Buttons/DeleteBtn";

export default function BankPage() {
  return (
    <TableFormProvider url={"settings/banks"}>
      <BankWrapper />
    </TableFormProvider>
  );
}
const BankWrapper = () => {
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
  } = useDataFetcher("settings/banks");
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
      headerName: "اسم البنك",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "country",
      headerName: "الدولة",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "city",
      headerName: "المدينة",
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
        inputs={bankInputs}
        formTitle={"بنك"}
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
      />
    </>
  );
};
