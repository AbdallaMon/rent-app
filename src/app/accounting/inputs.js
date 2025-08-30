import { accountType } from "@/config/Enums";

export const accountInputs = [
  {
    data: {
      id: "name",
      type: "text",
      label: "اسم الحساب",
      name: "name",
    },
    sx: {
      width: {
        xs: "100%",
      },
      mr: "auto",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال اسم الحساب",
      },
    },
  },
  {
    data: {
      id: "code",
      type: "text",
      label: "كود الحساب",
      name: "code",
    },
    sx: {
      width: {
        xs: "100%",
      },
      mr: "auto",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال رقم الحساب",
      },
    },
  },
  {
    id: "type",
    data: {
      id: "type",
      type: "select",
      label: "نوع الحساب",
      name: "type",
    },
    hasOptions: true,
    getData: getAccountTypes,

    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال نوع الحساب",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "100%",
      },
    },
  },
];
async function getAccountTypes() {
  return {
    data: Object.entries(accountType).map(([key, value]) => ({
      id: key,
      name: value,
    })),
  };
}
