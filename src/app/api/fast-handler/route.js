import {
  createBank,
  createCity,
  createCollector,
  createContractExpense,
  createDistrict,
  createNeighbour,
  createOwner,
  createPropertyType,
  createRenter,
  createRentType,
  createState,
  createUnit,
  createUnitType,
  getBanks,
  getCitiesByStateId,
  getCollectors,
  getContractExpenses,
  getDistrictsByCityId,
  getExpenseTypes,
  getNeighboursByDistrictId,
  getOwners,
  getOwnersByProperty,
  getProperties,
  getPropertyTypes,
  getRenters,
  getRentTypes,
  getStates,
  getUnits,
  getUnitTypes,
  getContractPayments,
  createBankAccount,
} from "@/services/server/fastHandlers";
import { createNewBankAccount } from "@/services/server/payments";

const handlerObject = {
  state: {
    POST: createState,
    GET: getStates,
  },
  city: {
    POST: createCity,
    GET: getCitiesByStateId,
  },
  district: {
    POST: createDistrict,
    GET: getDistrictsByCityId,
  },
  neighbour: {
    POST: createNeighbour,
    GET: getNeighboursByDistrictId,
  },
  bank: {
    POST: createBank,
    GET: getBanks,
  },
  bankAccount: {
    POST: createNewBankAccount,
    // GET: getBanks,
  },
  owner: {
    POST: createOwner,
    GET: getOwners,
  },
  owners: {
    GET: getOwners,
  },
  ownerByProperty: {
    GET: getOwnersByProperty,
  },
  renter: {
    POST: createRenter,
    GET: getRenters,
  },
  propertyType: {
    POST: createPropertyType,
    GET: getPropertyTypes,
  },
  unitType: {
    POST: createUnitType,
    GET: getUnitTypes,
  },
  properties: {
    GET: getProperties,
  },
  unit: {
    GET: getUnits,
    POST: createUnit,
  },
  collector: {
    GET: getCollectors,
    POST: createCollector,
  },
  rentType: {
    GET: getRentTypes,
    POST: createRentType,
  },
  contractExpenses: {
    GET: getContractExpenses,
    POST: createContractExpense,
  },
  expenseTypes: {
    GET: getExpenseTypes,
  },
  contractPayments: {
    GET: getContractPayments,
  },
};

export async function POST(request, { params }) {
  try {
    const { searchParams } = request.nextUrl;
    const body = await request.json();

    const id = searchParams.get("id");
    const data = await handlerObject[id].POST(body, searchParams);
    return Response.json({ ...data, status: 200, message: "تم الإضافة بنجاح" });
  } catch (error) {
    console.error(error);
    return Response.json({
      status: "error",
      message: "An error occurred while processing your request.",
    });
  }
}

export async function GET(request, { params }) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get("id");
    const data = await handlerObject[id].GET(searchParams);
    return Response.json(data);
  } catch (error) {
    console.error(error);
    return Response.json({
      status: "error",
      message: "An error occurred while processing your request.",
    });
  }
}
