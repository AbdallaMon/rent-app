"use client";
import TableFormProvider, {useTableForm,} from "@/app/context/TableFormProvider/TableFormProvider";
import {useDataFetcher} from "@/helpers/hooks/useDataFetcher";
import {useEffect, useState} from "react";
import {propertyInputs} from "@/app/properties/propertyInputs";
import {Form} from "@/components/ui/FormComponents/Forms/Form";
import {ExtraForm} from "@/components/ui/FormComponents/Forms/ExtraForms/ExtraForm";
import {Box, Button, Modal} from "@mui/material";
import Link from "next/link";
import CustomTable from "@/components/Tables/CustomTable";
import {unitInputs} from "@/app/units/unitInputs";
import {CreateModal} from "@/components/ui/Modals/CreateModal";
import useEditState from "@/helpers/hooks/useEditState";
import {getChangedFields} from "@/helpers/functions/getChangedFields";
import DeleteBtn from "@/components/ui/Buttons/DeleteBtn";
import {formatCurrencyAED} from "@/helpers/functions/convertMoneyToArabic";
import {usePathname} from "next/navigation";
import {getCurrentPrivilege} from "@/helpers/functions/getUserPrivilege";
import {useAuth} from "@/app/context/AuthProvider/AuthProvider";

export default function PropertyPage({params}) {
    const id = params.id;
    return (
          <TableFormProvider url={"fast-handler"}>
              <PropertyWrapper urlId={id}/>
          </TableFormProvider>
    );
}

const PropertyWrapper = ({urlId}) => {
    const {
        data: units,
        loading: unitsLoading,
        page,
        setPage,
        limit,
        setLimit,
        setData: setUnits,
        total,
        setTotal,
    } = useDataFetcher("main/properties/" + urlId + "/units", true);
    const {submitData, openModal} = useTableForm();
    const [stateId, setStateId] = useState(null);
    const [cityId, setCityId] = useState(null);
    const [districtId, setDistrictId] = useState(null);
    const [renderedDefault, setRenderedDefault] = useState(false);
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({});
    const [ownerId, setOwnerId] = useState(null);

    const [disabled, setDisabled] = useState({
        cityId: true,
        districtId: true,
        neighbourId: true,
        bankAccount: true,
    });

    const [reFetch, setRefetch] = useState({
        cityId: false,
        districtId: false,
        neighbourId: false,
        bankAccount: false,
    });
    const [electricityMeters, setMeters] = useState(
          data?.electricityMeters || [],
    );
    const metersFields = [
        {id: "name", label: "اسم العداد", type: "text"},
        {id: "meterId", label: "رقم العداد", type: "number"},
    ];
    const {
        isEditing: isMetersEditing,
        setIsEditing: setIsMetersEditing,
        snackbarOpen,
        setSnackbarOpen,
        snackbarMessage,
        setSnackbarMessage,
        handleEditBeforeSubmit,
    } = useEditState([{name: "meters", message: "عدادات الكهرباء"}]);
    const {user} = useAuth()
    const pathName = usePathname();

    function canEdit() {
        const currentPrivilege = getCurrentPrivilege(user, pathName);
        return currentPrivilege?.privilege.canEdit;
    }

    const [editModalOpen, setEditModalOpen] = useState(false);

    const handleOpenEditModal = () => setEditModalOpen(true);
    const handleCloseEditModal = () => setEditModalOpen(false);

    useEffect(() => {
        async function getPropertyData() {
            const res = await fetch("/api/main/properties/" + urlId);
            const data = await res.json();
            setData(data.data);
            setLoading(false);
        }

        getPropertyData();
    }, []);
    useEffect(() => {
        if (typeof data === "object" && !loading) {
            setStateId(data.stateId);
            setCityId(data.cityId);
            setDistrictId(data.districtId);
            setMeters(data.electricityMeters);
            setOwnerId(data.clientId);

            setIsMetersEditing({
                meters: data.electricityMeters.map(() => false),
            });
            setDisabled({
                cityId: data.stateId ? false : true,
                districtId: data.cityId ? false : true,
                neighbourId: data.districtId ? false : true,
                bankAccount: data.bankId ? false : true,
            });

            window.setTimeout(() => setRenderedDefault(true), 100);
        }
    }, [loading, data]);

    async function getStatesData() {
        const res = await fetch("/api/fast-handler?id=state");
        const data = await res.json();

        return {data};
    }

    async function getCitiesDataByStateId() {
        const res = await fetch("/api/fast-handler?id=city&stateId=" + stateId);
        const data = await res.json();

        return {data, id: stateId};
    }

    async function getDistrictsDataByCityId() {
        const res = await fetch("/api/fast-handler?id=district&cityId=" + cityId);
        const data = await res.json();

        return {data, id: cityId};
    }

    async function getNeighboursDataByDistrictId() {
        const res = await fetch(
              "/api/fast-handler?id=neighbour&districtId=" + districtId,
        );
        const data = await res.json();
        return {data, id: districtId};
    }

    async function getOwners() {
        const res = await fetch("/api/fast-handler?id=owner");
        const data = await res.json();
        return {data};
    }

    async function getPropertyTypes() {
        const res = await fetch("/api/fast-handler?id=propertyType");
        const data = await res.json();
        return {data};
    }

    async function getCollectors() {
        const res = await fetch("/api/fast-handler?id=collector");
        const data = await res.json();
        return {data};
    }

    async function getOwnerAccountData() {
        const res = await fetch("/api/clients/owner/" + ownerId);
        const data = await res.json();
        const bankAccounts = data?.bankAccounts.map((account) => ({
            id: account.id,
            name: account.accountNumber,
        }));
        return {data: bankAccounts};
    }

    const handleStateChange = (newValue) => {
        setStateId(newValue);
        setCityId(null);
        setDistrictId(null);
        setDisabled({
            ...disabled,
            cityId: newValue === null,
            districtId: true,
            neighbourId: true,
        });
        setRefetch({...reFetch, cityId: true});
    };

    const handleCityChange = (newValue) => {
        setCityId(newValue);
        setDistrictId(null);
        setDisabled({
            ...disabled,
            districtId: newValue === null,
            neighbourId: true,
        });
        setRefetch({...reFetch, districtId: true, cityId: false});
    };

    const handleDistrictChange = (newValue) => {
        setDistrictId(newValue);
        setDisabled({
            ...disabled,
            neighbourId: newValue === null,
        });
        setRefetch({...reFetch, neighbourId: true, districtId: false});
    };

    const handleNeighbourChange = (newValue) => {
        setRefetch({...reFetch, neighbourId: false});
    };
    const dataInputs = propertyInputs.map((input) => {
        input = {
            ...input,
            value: data ? data[input.data.id] : null,
        };
        switch (input.data.id) {
            case "stateId":
                return {
                    ...input,
                    extraId: false,
                    getData: getStatesData,
                    onChange: handleStateChange,
                };
            case "cityId":
                return {
                    ...input,
                    getData: getCitiesDataByStateId,
                    onChange: handleCityChange,
                    disabled: disabled.cityId,
                };
            case "districtId":
                return {
                    ...input,
                    getData: getDistrictsDataByCityId,
                    onChange: handleDistrictChange,
                    disabled: disabled.districtId,
                };
            case "neighbourId":
                return {
                    ...input,
                    getData: getNeighboursDataByDistrictId,
                    onChange: handleNeighbourChange,
                    disabled: disabled.neighbourId,
                };
            case "bankAccount":
                return {
                    ...input,
                    extraId: false,
                    getData: getOwnerAccountData,
                    disabled: disabled.bankAccount,
                };
            case "collectorId":
                return {
                    ...input,
                    extraId: false,
                    getData: getCollectors,
                };
            case "clientId":
                return {
                    ...input,
                    extraId: false,
                    getData: getOwners,
                    onChange: (newValue) => {
                        setOwnerId(newValue);
                        setRefetch({...reFetch, bankAccount: true});
                        setDisabled({...disabled, bankAccount: newValue === null});
                    },
                };
            case "typeId":
                return {
                    ...input,
                    extraId: false,
                    getData: getPropertyTypes,
                };
            default:
                return input;
        }
    });

    async function create(returnedData) {
        const contintueCreation = handleEditBeforeSubmit();
        if (!contintueCreation) {
            return;
        }
        const changedData = getChangedFields(data, returnedData);

        const electricityMetersChanged = getChangedFields(
              data.electricityMeters,
              electricityMeters,
        );
        const deletedMeters = data.electricityMeters.filter(
              (meter) => !electricityMeters.find((m) => m.id === meter.id),
        );
        returnedData = {
            ...changedData,
            extraData: {
                electricityMeters:
                      Object.keys(electricityMetersChanged).length > 0
                            ? electricityMeters
                            : null,
                deletedMeters,
            },
        };
        const updated = await submitData(
              returnedData,
              null,
              null,
              "PUT",
              null,
              "json",
              "main/properties/" + urlId,
        );
        setMeters(updated.electricityMeters);
        setData(updated);
    }

    async function handleDelete(id) {
        const deleted = await submitData(
              null,
              null,
              null,
              "DELETE",
              null,
              "json",
              "main/units/" + id,
        );
        if (deleted) {
            setUnits(units.filter((unit) => unit.id !== id));
        }
    }

    const columns = [
        {
            field: "id",
            headerName: "ID",
            width: 100,
            printable: true,
            cardWidth: 48,
            renderCell: (params) => (
                  <Link href={"/units/" + params.row.id}>
                      <Button variant={"text"}>{params.row.id}</Button>
                  </Link>
            ),
        },

        {
            field: "number",
            headerName: "رقم الوحدة",
            width: 200,
            printable: true,
            cardWidth: 48,
        },
        {
            field: "unitId",
            headerName: "معرف الوحده",
            width: 200,
            printable: true,
            cardWidth: 48,
        },
        {
            field: "typeId",
            headerName: "نوع الوحدة",
            width: 200,
            printable: true,
            cardWidth: 48,
            renderCell: (params) => <>{params.row.type?.name}</>,
        },
        {
            field: "yearlyRentPrice",
            headerName: "سعر الإيجار السنوي",
            width: 200,
            printable: true,
            cardWidth: 48,
            renderCell: (params) => (
                  <>{formatCurrencyAED(params.row.yearlyRentPrice)}</>
            ),
        },
        {
            field: "client",
            headerName: "اسم المستاجر",
            width: 200,
            printable: true,
            cardWidth: 48,
            renderCell: (params) => <>{params.row.client?.name}</>,
        },
        {
            field: "rentAgreements",
            headerName: "الحاله",
            width: 200,
            printable: true,
            cardWidth: 48,
            renderCell: (params) => {
                let id;
                const isActiveAndNotExpired = params.row.rentAgreements?.some(
                      (agreement) => {
                          if (
                                agreement.status === "ACTIVE" &&
                                new Date(agreement.endDate) > new Date()
                          ) {
                              id = agreement.id;
                              return true;
                          }
                      },
                );

                return (
                      <div>
                          {isActiveAndNotExpired ? (
                                <Link href={`/rent/${id}`}>
                                    <Button variant={"text"}>مؤجره</Button>
                                </Link>
                          ) : (
                                <div>شاغرة</div>
                          )}
                      </div>
                );
            },
        },
        {
            field: "electricityMeter",
            headerName: "عداد الكهرباء",
            width: 200,
            printable: true,
            cardWidth: 48,
        },
        {
            field: "floor",
            headerName: "الدور",
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
                      <DeleteBtn handleDelete={() => handleDelete(params.row.id)}/>
                  </>
            ),
        },
    ];


    return (
          <div>
              {loading || !renderedDefault ? (
                    <div>جاري تحميل بيانات العقار</div>
              ) : (
                    <>
                        {unitsLoading && !units ? (
                              <div>جاري تحميل </div>
                        ) : (
                              <>
                                  {canEdit() &&
                                        <div className={"flex gap-3 items-center"}>
                                            <Button variant="outlined" onClick={handleOpenEditModal}>
                                                تعديل العقار
                                            </Button>
                                            <div className={"flex gap-3 items-center"}>
                                                اضافه وحده جديده
                                                <CreateUnit
                                                      propertyId={urlId}
                                                      setUnits={setUnits}
                                                      units={units}
                                                />
                                            </div>
                                        </div>}
                              </>
                        )}
                        <Modal open={editModalOpen} onClose={handleCloseEditModal}>
                            <Box
                                  sx={{
                                      position: "absolute",
                                      top: "50%",
                                      left: "50%",
                                      transform: "translate(-50%, -50%)",
                                      width: {
                                          xs: "90%",
                                          md: "fit-content",
                                      },
                                      height: "90%",
                                      overflowY: "auto",
                                      bgcolor: "background.paper",
                                      border: "2px solid #000",
                                      boxShadow: 24,
                                      p: {
                                          xs: 1,
                                          sm: 2,
                                          md: 4,
                                      },
                                  }}
                            >
                                <Form
                                      formTitle={"تعديل العقار"}
                                      inputs={dataInputs}
                                      onSubmit={(data) => {
                                          create(data);
                                          handleCloseEditModal();
                                      }}
                                      disabled={disabled}
                                      variant={"outlined"}
                                      btnText={"تعديل"}
                                      reFetch={reFetch}
                                >
                                    <ExtraForm
                                          setItems={setMeters}
                                          items={electricityMeters}
                                          fields={metersFields}
                                          title={"عداد"}
                                          formTitle={"عدادات الكهرباء"}
                                          name={"meters"}
                                          setSnackbarMessage={setSnackbarMessage}
                                          setSnackbarOpen={setSnackbarOpen}
                                          snackbarMessage={snackbarMessage}
                                          snackbarOpen={snackbarOpen}
                                          isEditing={isMetersEditing}
                                          setIsEditing={setIsMetersEditing}
                                          editPage={true}
                                    />
                                </Form>
                            </Box>
                        </Modal>
                    </>
              )}
              {unitsLoading && !units ? (
                    <div>جاري تحميل وحدات العقار</div>
              ) : (
                    <CustomTable
                          rows={units ? units : []}
                          columns={columns}
                          loading={unitsLoading || !units}
                          setTotal={setTotal}
                          total={total}
                          page={page}
                          setPage={setPage}
                          limit={limit}
                          setLimit={setLimit}
                    />
              )}
          </div>
    );
};

function CreateUnit({propertyId, setUnits, units}) {
    async function getUnitTypes() {
        const res = await fetch("/api/fast-handler?id=unitType");
        const data = await res.json();

        return {data};
    }

    async function getProperties() {
        const res = await fetch("/api/fast-handler?id=properties");
        const data = await res.json();
        return {data};
    }

    const modalInputs = unitInputs;
    modalInputs[2] = {
        ...modalInputs[2],
        extraId: false,
        getData: getUnitTypes,
    };
    modalInputs[0] = {
        ...modalInputs[0],
        extraId: false,
        getData: getProperties,
        value: propertyId,
        data: {
            ...modalInputs[0].data,
            disabled: true,
        },
    };
    return (
          <CreateModal
                oldData={units}
                setData={setUnits}
                modalInputs={modalInputs}
                id={"unit"}
          />
    );
}
