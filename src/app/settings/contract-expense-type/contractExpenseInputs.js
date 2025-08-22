export const contractExpenseInputs = [
  {
    data: {
      id: "name",
      type: "text",
      label: "اسم المصروف",
      name: "name",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال اسم المصروف",
      },
    },
  },
  {
    data: {
      id: "value",
      type: "number",
      label: "القيمة",
      name: "value",
      helperText: "القيمة كنسبه مئويه",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال القيمة",
      },
    },
  },
];
