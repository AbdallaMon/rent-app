"use client";
import TableFormProvider, {
  useTableForm,
} from "@/app/context/TableFormProvider/TableFormProvider";
import { useDataFetcher } from "@/helpers/hooks/useDataFetcher";
import ViewComponent from "@/components/ViewComponent/ViewComponent";
import { useState } from "react";
import { requestEditInputs, reqeustInputs } from "../reqeustInputs";
import { Box, Button, TextField, Typography } from "@mui/material";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/en-gb";

import { DatePicker } from "@mui/x-date-pickers/DatePicker";

import FilterSelect from "@/components/utility/FilterSelect";
import { PriorityTypes, RequestStatusTypes } from "@/config/Enums";
import FilterPaperContainer from "@/components/utility/FilterPaperContainer";

export default function MaintainceReqeusts({ searchParams }) {
  return (
    <TableFormProvider url={"fast-handler"}>
      <MaintainceReqeustWrapper />
    </TableFormProvider>
  );
}

const MaintainceReqeustWrapper = () => {
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
    filters,
    setFilters,
  } = useDataFetcher(`request/maintenance`);
  const { id } = useTableForm();
  const [propertyId, setPropertyId] = useState(null);
  const [disabled, setDisabled] = useState({
    unitId: true,
  });
  const [reFetch, setRefetch] = useState({
    unitId: false,
  });
  const [startDate, setStartDate] = useState(dayjs().startOf("month"));
  const [endDate, setEndDate] = useState(dayjs().endOf("month"));

  const handleDateChange = (type, date) => {
    if (type === "start") {
      setStartDate(date);
    } else {
      setEndDate(date);
    }
  };
  const handleFilter = async () => {
    const newFilters = {
      ...filters,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    setFilters(newFilters);
  };

  async function getProperties() {
    const res = await fetch("/api/fast-handler?id=properties");
    const data = await res.json();
    return { data };
  }

  function handlePropertyChange(value) {
    setPropertyId(value);
    setDisabled({
      ...disabled,
      unitId: false,
    });
    setRefetch({
      ...reFetch,
      unitId: true,
    });
  }

  async function getUnits() {
    const res = await fetch(
      "/api/fast-handler?id=unit&propertyId=" +
        propertyId +
        "&availableOnly=true"
    );
    const data = await res.json();

    return { data: data, id: propertyId };
  }

  const dataInputs = reqeustInputs.map((input) => {
    switch (input.data.id) {
      case "propertyId":
        return {
          ...input,
          getData: getProperties,
          onChange: handlePropertyChange,
        };
      case "unitId":
        return {
          ...input,
          getData: getUnits,
        };
      default:
        return input;
    }
  });

  const columns = [
    {
      field: "id",
      headerName: "معرف",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "displayId",
      headerName: "رقم الطلب",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "client",
      headerName: "اسم العميل",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link
          href={
            `${params.row.client.role === "OWNER" ? "/renters/" : "/owners/"}` +
            params.row.client?.id
          }
          className={"flex justify-center"}
        >
          <Button variant={"text"}>{params.row.client?.name}</Button>
        </Link>
      ),
    },
    {
      field: "client",
      headerName: "رقم العميل",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Typography>{params.row.client?.phone}</Typography>
      ),
    },
    {
      field: "propertyId",
      headerName: "العقار",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={"/properties/" + params.row.property?.id}>
          <Button variant={"text"}>{params.row.property?.name}</Button>
        </Link>
      ),
    },
    {
      field: "unit",
      headerName: "رقم الوحده",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => (
        <Link href={"/units/" + params.row.unit?.id}>
          <Button
            variant={"text"}
            sx={{
              maxWidth: 100,
              overflow: "auto",
            }}
          >
            {params.row.unit?.number}
          </Button>
        </Link>
      ),
    },

    {
      field: "description",
      headerName: "الوصف",
      width: 200,
      printable: true,
      cardWidth: 48,
    },
    {
      field: "priority",
      headerName: "الاولوية",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        return <Typography>{PriorityTypes[params.row.priority]}</Typography>;
      },
    },
    {
      field: "status",
      headerName: "الحالة",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        return <Typography>{RequestStatusTypes[params.row.status]}</Typography>;
      },
    },
    {
      field: "createdAt",
      headerName: "تاريخ الطلب",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        return (
          <Typography>
            {dayjs(params.row.createdAt).format("DD/MM/YYYY")}
          </Typography>
        );
      },
    },
    {
      field: "updatedAt",
      headerName: "اخر تحديث",
      width: 200,
      printable: true,
      cardWidth: 48,
      renderCell: (params) => {
        return (
          <Typography>
            {dayjs(params.row.createdAt).format("DD/MM/YYYY")}
          </Typography>
        );
      },
    },
  ];

  return (
    <>
      <FilterPaperContainer handleFilter={handleFilter}>
        <FilterSelect
          label="العقار"
          param={"propertyId"}
          setFilters={setFilters}
          apiPoint={"/api/fast-handler?id=properties"}
        />
        <FilterSelect
          label="الحالة"
          param={"status"}
          setFilters={setFilters}
          options={Object.keys(RequestStatusTypes).map((key) => ({
            id: key,
            name: RequestStatusTypes[key],
          }))}
        />
        <FilterSelect
          label="الاولوية"
          param={"priority"}
          setFilters={setFilters}
          options={Object.keys(PriorityTypes).map((key) => ({
            id: key,
            name: PriorityTypes[key],
          }))}
        />
        <DatePicker
          label="تاريخ البدء"
          value={startDate}
          onChange={(date) => handleDateChange("start", date)}
          renderInput={(params) => <TextField {...params} />}
          format="DD/MM/YYYY"
        />
        <DatePicker
          label="تاريخ الانتهاء"
          value={endDate}
          onChange={(date) => handleDateChange("end", date)}
          renderInput={(params) => <TextField {...params} />}
          format="DD/MM/YYYY"
        />
      </FilterPaperContainer>

      <ViewComponent
        inputs={dataInputs}
        formTitle={"طلب صيانة"}
        totalPages={totalPages}
        rows={data}
        columns={columns}
        page={page}
        setPage={setPage}
        limit={limit}
        setLimit={setLimit}
        loading={loading}
        setData={setData}
        setTotal={setTotal}
        total={total}
        id={id}
        disabled={disabled}
        reFetch={reFetch}
        url={"request/maintenance"}
        title={"طلبات الصيانة"}
        withEdit={true}
        parseNewData={true}
        editInputs={requestEditInputs}
      ></ViewComponent>
    </>
  );
};
