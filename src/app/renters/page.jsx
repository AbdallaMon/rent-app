"use client";
import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import { Button } from "@mui/material";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { renterInputs } from "@/app/renters/renterInputs";
import { useEffect, useState } from "react";
import useEditState from "@/helpers/hooks/useEditState";
import { ExtraForm } from "@/components/ui/FormComponents/Forms/ExtraForms/ExtraForm";
import DeleteModal from "@/components/ui/Modals/DeleteModal";

export default function RenterPage() {
  return (
    <TableFormProvider url={"clients/renter"}>
      <RenterWrapper />
    </TableFormProvider>
  );
}

const RenterWrapper = () => {
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
  } = useDataFetcher("clients/renter");
  const { setOpenModal, setId, id, submitData } = useTableForm();
  const [currentLanguage, setCurrentLanguage] = useState("ARABIC"); // Default to Arabic
  const [modifiedRenterInputs, setModifiedRenterInputs] =
    useState(renterInputs);

  // Fetch the current language preference when editing a renter
  useEffect(() => {
    // Create a deep copy of the inputs to avoid mutating the original
    const updateInputs = (language = "ARABIC") => {
      // Create a deep copy of the renterInputs
      const updatedInputs = JSON.parse(JSON.stringify(renterInputs));

      // Find and update the prefersEnglish switch
      const prefersEnglishIndex = updatedInputs.findIndex(
        (input) => input.data.id === "prefersEnglish"
      );

      if (prefersEnglishIndex !== -1) {
        updatedInputs[prefersEnglishIndex].data.defaultValue =
          language === "ENGLISH";
      }

      return updatedInputs;
    };

    if (id) {
      const fetchRenterLanguage = async () => {
        try {
          const response = await fetch(`/api/clients/renter/${id}`);
          const renterData = await response.json();
          const language = renterData.language || "ARABIC";

          setCurrentLanguage(language);
          setModifiedRenterInputs(updateInputs(language));
        } catch (error) {
          console.error("Failed to fetch renter language:", error);
          setModifiedRenterInputs(updateInputs("ARABIC"));
        }
      };
      fetchRenterLanguage();
    } else {
      // Reset to default when adding a new renter
      setCurrentLanguage("ARABIC");
      setModifiedRenterInputs(updateInputs("ARABIC"));
    }
  }, [id]);

  // Custom submit handler to process the language preference before submitting
  const handleSubmit = async (formData, action) => {
    // Process the prefersEnglish field to set the language
    const processedData = { ...formData };

    // Convert the switch value to the language enum value
    if ("prefersEnglish" in processedData) {
      processedData.language = processedData.prefersEnglish
        ? "ENGLISH"
        : "ARABIC";
      // Remove the prefersEnglish field as it's not in the database schema
      delete processedData.prefersEnglish;
    }

    // Call the original submitData function with the processed data
    return await submitData(processedData, action);
  };

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
      headerName: "اسم المستاجر",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "nationalId",
      headerName: "الهوية الوطنية",
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
      field: "language",
      headerName: "اللغة",
      width: 150,
      printable: true,
      valueGetter: (params) =>
        params.row.language === "ARABIC" ? "العربية" : "الإنجليزية",
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
            href={`clients/renter`}
            item={params.row}
          />
          {/* <DeleteBtn handleDelete={() => handleDelete(params.row.id)} /> */}
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
        inputs={modifiedRenterInputs}
        formTitle={"مستاجر"}
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
        // Override submitData with our custom handler
        submitData={handleSubmit}
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
