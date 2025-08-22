export const propertyExpenseTypeInputs = [
  {
    data: {
      id: "name",
      type: "text",
      label: "اسم نوع الصيانة",
      name: "name",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال اسم نوع الصيانة",
      },
    },
  },
];
