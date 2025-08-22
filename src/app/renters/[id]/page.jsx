"use client"
import {Form} from "@/components/ui/FormComponents/Forms/Form";
import {renterInputs} from "@/app/renters/renterInputs";
import {useAuth} from "@/app/context/AuthProvider/AuthProvider";
import {usePathname} from "next/navigation";
import {getCurrentPrivilege} from "@/helpers/functions/getUserPrivilege";
import {useEffect, useState} from "react";
import {ExtraForm} from "@/components/ui/FormComponents/Forms/ExtraForms/ExtraForm";
import useEditState from "@/helpers/hooks/useEditState";
import {handleRequestSubmit} from "@/helpers/functions/handleRequestSubmit";
import {useToastContext} from "@/app/context/ToastLoading/ToastLoadingProvider";
import TableFormProvider from "@/app/context/TableFormProvider/TableFormProvider";

export default function Renter({params: {id}}) {
    const [data, setData] = useState(null)
    const [loading, setLoader] = useState(true)
    const {user} = useAuth()
    const pathName = usePathname();

    const [disabled, setDisabled] = useState({});
    const [reFetch, setRefetch] = useState({});
    const [bankAccounts, setBankAccounts] = useState(data?.bankAccounts);
    const [loadingOptions, setLoadingOptions] = useState(false);
    const {setLoading} = useToastContext()
    const [renderedDefault, setRenderedDefault] = useState(false);

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

        async function getClient() {
            setLoader(true)
            const request = await fetch("/api/clients/renter/" + id)
            const response = await request.json()
            setData(response)
            setLoader(false)
        }

        getClient()
    }, [])

    function canEdit() {
        const currentPrivilege = getCurrentPrivilege(user, pathName);
        return currentPrivilege?.privilege.canEdit;
    }

    const {
        isEditing,
        setIsEditing,
        snackbarOpen,
        setSnackbarOpen,
        snackbarMessage,
        setSnackbarMessage,
        handleEditBeforeSubmit,
    } = useEditState([{name: "bankAccounts", message: "الحسابات"}]);


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
    useEffect(() => {
        if (!loading) {
            setBankAccounts(data.bankAccounts)
            setRenderedDefault(true);
        }
    }, [loading, data]);
    if (loading) return <div>Loading...</div>;
    if (!renderedDefault) return;
    const dataInputs = renterInputs.map((input) => {
        input = {
            ...input,
            value: data[input.data.id],
        };
        return input;
    });


    async function edit(data) {
        const continueCreation = handleEditBeforeSubmit();
        if (!continueCreation) return;

        data = {...data, extraData: {bankAccounts}};
        const res = await handleRequestSubmit(data, setLoading, `/clients/renter/${id}`, false, "Updating", "PUT")
    }

    return (
          <TableFormProvider>

              <div className="mb-4">
                  <Form
                        formTitle={"تعديل"}
                        inputs={dataInputs}
                        onSubmit={(data) => {
                            if (canEdit()) {
                                edit(data)
                            }
                        }}
                        disabled={disabled}
                        variant={"outlined"}
                        btnText={"تعديل"}
                        reFetch={reFetch}
                        removeButton={!canEdit()}
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
                                  editPage={true}
                            />)
                      }
                  </Form>
              </div>
          </TableFormProvider>
    )
}