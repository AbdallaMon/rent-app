import {
  ComplaintCategory,
  MaintenanceType,
  PriorityTypes,
  RequestStatusTypes,
} from "@/config/Enums";
const priorityInput = {
  data: {
    id: "priority",
    type: "select",
    label: "الاولوية",
    name: "priority",
  },
  getData: () => {
    return {
      data: Object.keys(PriorityTypes).map((key) => ({
        id: key,
        name: PriorityTypes[key],
      })),
    };
  },
  pattern: {
    required: {
      value: true,
      message: "يرجى اختيار الاولوية",
    },
  },
  sx: {
    width: {
      xs: "100%",
      md: "48%",
    },
  },
};
export const reqeustInputs = [
  {
    data: {
      id: "clientType",
      type: "select",
      label: "نوع العميل",
      name: "clientType",
    },
    autocomplete: true,
    getData: () => {
      return {
        data: [
          {
            id: "OWNER",
            name: "مالك",
          },
          {
            id: "RENTER",
            name: "مستاجر",
          },
        ],
      };
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى اختيار نوع العميل",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
  },
  {
    data: {
      id: "propertyId",
      type: "select",
      label: "العقار",
      name: "propertyId",
    },
    autocomplete: true,
    extraId: false,
    pattern: {
      required: {
        value: true,
        message: "يرجى اختيار العقار",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
  },
  {
    data: {
      id: "unitId",
      type: "select",
      label: "الوحدة",
      name: "unitId",
    },
    autocomplete: true,
    extraId: true,
    rerender: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى اختيار الوحدة",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
    },
  },
  priorityInput,
  {
    data: {
      id: "type",
      type: "select",
      label: "نوع الطلب",
      name: "type",
    },
    getData: () => {
      return {
        data: Object.keys(MaintenanceType).map((key) => ({
          id: key,
          name: MaintenanceType[key],
        })),
      };
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى اختيار نوع الطلب",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
    },
  },
  {
    data: {
      id: "description",
      type: "text",
      label: "الوصف",
      name: "description",
    },
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال الوصف",
      },
    },
    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
  },
  {
    data: {
      id: "createdAt",
      type: "date",
      label: "تاريخ الطلب",
      name: "createdAt",
    },
    mobilePiker: true,
    pattern: {
      required: {
        value: true,
        message: "يرجى إدخال تاريخ الطلب",
      },
    },

    sx: {
      width: {
        xs: "100%",
        md: "48%",
      },
      mr: "auto",
    },
  },
];

export const complaintInputs = reqeustInputs.map((input) => {
  const copiedInput = { ...input }; // shallow copy

  if (copiedInput.data?.id === "type") {
    copiedInput.getData = () => {
      return {
        data: Object.keys(ComplaintCategory).map((key) => ({
          id: key,
          name: ComplaintCategory[key],
        })),
      };
    };
  }

  return copiedInput;
});

const statusInput = {
  data: {
    id: "status",
    type: "select",
    label: "حالة الطلب",
    name: "status",
  },
  getData: () => {
    return {
      data: Object.keys(RequestStatusTypes).map((key) => ({
        id: key,
        name: RequestStatusTypes[key],
      })),
    };
  },
  pattern: {
    required: {
      value: true,
      message: "يرجى اختيار الاولوية",
    },
  },
  sx: {
    width: {
      xs: "100%",
      md: "48%",
    },
  },
};
export const requestEditInputs = [priorityInput, statusInput];
