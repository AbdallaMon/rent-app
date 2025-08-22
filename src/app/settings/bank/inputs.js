export const bankInputs = [
  {
    data: {
      id: "name",
      type: "text",
      label: "اسم البنك",
      name: "name",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال اسم البنك",
      },
    },
  },
  {
    data: {
      id: "country",
      type: "text",
      label: "الدولة",
      name: "country",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال الدولة",
      },
    },
  },
  {
    data: {
      id: "city",
      type: "text",
      label: "المدينة",
      name: "city",
    },
    pattern: {
      required: {
        value: false,
        message: "يرجى إدخال المدينة",
      },
    },
  },
];
