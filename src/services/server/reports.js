import prisma from "@/lib/prisma";
import {PaymentStatus, StatusType} from "@/config/Enums";
import {endOfDay, startOfDay} from "@/helpers/functions/dates";
import {updateWhereClauseWithUserProperties} from "@/app/api/utlis/userProperties";


export async function getReports(page, limit, searchParams, params) {
    const filters = searchParams.get("filters")
          ? JSON.parse(searchParams.get("filters"))
          : {};
    const {propertyIds, startDate, endDate} = filters;
    const reportData = [];

    const start = startOfDay(startDate);
    const end = endOfDay(endDate);

    try {
        const properties = await prisma.property.findMany({
            where: {id: {in: propertyIds}},
            select: {
                id: true,
                name: true,
                builtArea: true,
                price: true,
                numElevators: true,
                numParkingSpaces: true,
                propertyId: true,
                client: {
                    select: {
                        name: true,
                        nationalId: true,
                        email: true,
                        phone: true,
                    },
                },
                units: {
                    select: {
                        id: true,
                        number: true,
                        yearlyRentPrice: true,
                        floor: true,
                        numBedrooms: true,
                        numBathrooms: true,
                        numACs: true,
                        numLivingRooms: true,
                        rentAgreements: {
                            where: {
                                status: {
                                    in: ["ACTIVE"],
                                },
                            },
                            select: {
                                renter: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                id: true,
                                rentAgreementNumber: true,
                                startDate: true,
                                endDate: true,
                                totalPrice: true,
                                status: true,
                            },
                        },
                    },
                },
                maintenances: {
                    where: {
                        date: {
                            gte: start,
                            lte: end,
                        },
                    },
                    select: {
                        id: true,
                        description: true,
                        date: true,
                        unit: {
                            select: {
                                number: true,
                            },
                        },
                        payments: {
                            where: {
                                dueDate: {
                                    gte: start,
                                    lte: end,
                                },
                            },
                            select: {
                                amount: true,
                                paidAmount: true,
                                dueDate: true,
                                status: true,
                            },
                        },
                    },
                },
                incomes: {
                    where: {
                        date: {
                            gte: start,
                            lte: end,
                        },
                        invoice: {
                            rentAgreement: {
                                status: 'ACTIVE',
                            },
                        },
                    },
                    select: {
                        date: true,
                        amount: true,
                        description: true,
                        createdAt: true,
                        invoice: {
                            select: {
                                id: true,
                                invoiceType: true,
                                property: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                rentAgreement: {
                                    select: {
                                        id: true,
                                        rentAgreementNumber: true,
                                        status: true,
                                        endDate: true,
                                        unit: {
                                            select: {
                                                id: true,
                                                number: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                expenses: {
                    where: {
                        date: {
                            gte: start,
                            lte: end,
                        },
                    },
                    select: {
                        date: true,
                        amount: true,
                        description: true,
                        createdAt: true,
                        invoice: {
                            select: {
                                id: true,
                                invoiceType: true,
                                property: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        reportData.push(
              ...properties.map((property) => ({
                  id: property.id,
                  name: property.name,
                  client: property.client,
                  builtArea: property.builtArea,
                  propertyId: property.propertyId,
                  price: property.price,
                  numElevators: property.numElevators,
                  numParkingSpaces: property.numParkingSpaces,
                  units: property.units.map((unit) => {
                      const currentDate = new Date();
                      let unitStatus = "شاغرة";
                      const activeAgreement = unit.rentAgreements?.find(
                            (agreement) => agreement.status === "ACTIVE",
                      );
                      if (activeAgreement) {
                          if (new Date(activeAgreement.endDate) <= currentDate) {
                              unitStatus = "يجب اتخاذ اجراء";
                              activeAgreement.renter = activeAgreement.renter.name;
                          } else {
                              unitStatus = "مؤجرة";
                              activeAgreement.renter = activeAgreement.renter.name;
                          }
                      } else if (unit.rentAgreements.length > 0) {
                          unitStatus = "شاغرة";
                      }
                      return {
                          id: unit.id,
                          number: unit.number,
                          yearlyRentPrice: unit.yearlyRentPrice,
                          floor: unit.floor,
                          numBedrooms: unit.numBedrooms,
                          numBathrooms: unit.numBathrooms,
                          numACs: unit.numACs,
                          numLivingRooms: unit.numLivingRooms,
                          actualRentPrice: activeAgreement?.totalPrice,
                          activeAgreement,
                          status: unitStatus,
                          rentAgreements: unit.rentAgreements.map((agreement) => ({
                              id: agreement.id,
                              rentAgreementNumber: agreement.rentAgreementNumber,
                              startDate: agreement.startDate,
                              endDate: agreement.endDate,
                              totalPrice: agreement.totalPrice,
                              status: StatusType[agreement.status] || agreement.status,
                              unit: unit.number,
                          })),
                      };
                  }),
                  maintenances: property.maintenances.map((maintenance) => ({
                      id: maintenance.id,
                      description: maintenance.description,
                      date: maintenance.date,
                      unit: maintenance.unit,
                      payments: maintenance.payments.map((payment) => ({
                          amount: payment.amount,
                          paidAmount: payment.paidAmount,
                          dueDate: payment.dueDate,
                          status: PaymentStatus[payment.status],
                      })),
                  })),
                  income: property.incomes.map((income) => {
                      const currentDate = new Date();
                      let needsAction = false;
                      if (new Date(income.invoice.rentAgreement.endDate) <= currentDate) {
                          needsAction = true
                      }
                      return {
                          date: income.date,
                          amount: income.amount,
                          description: income.description,
                          invoice: {
                              ...income.invoice,
                              rentAgreement: {
                                  ...income.invoice.rentAgreement,
                                  status: needsAction ? "NEEDSACTION" : income.invoice.rentAgreement.status
                              }
                          },
                          createdAt: income.createdAt,
                      }
                  }),
                  expenses: property.expenses.map((expense) => ({
                      date: expense.date,
                      amount: expense.amount,
                      description: expense.description,
                      invoice: expense.invoice,
                      createdAt: expense.createdAt,
                  })),
              })),
        );
    } catch (error) {
        console.error("Error fetching property report data", error);
    }

    return {data: reportData};
}


export async function getUnitsReports(page, limit, searchParams) {
    const filters = searchParams.get("filters")
          ? JSON.parse(searchParams.get("filters"))
          : {};
    const {propertyIds} = filters;
    const reportData = [];


    try {
        const properties = await prisma.property.findMany({
            where: {id: {in: propertyIds}},
            select: {
                id: true,
                name: true,
                builtArea: true,
                price: true,
                numElevators: true,
                numParkingSpaces: true,
                propertyId: true,
                client: {
                    select: {
                        name: true,
                        nationalId: true,
                        email: true,
                        phone: true,
                    },
                },
                units: {
                    select: {
                        id: true,
                        number: true,
                        yearlyRentPrice: true,
                        floor: true,
                        numBedrooms: true,
                        numBathrooms: true,
                        numACs: true,
                        numLivingRooms: true,
                        rentAgreements: {
                            where: {
                                status: {
                                    in: ["ACTIVE", "EXPIRED"],
                                },
                            },
                            select: {
                                renter: {
                                    select: {
                                        id: true,
                                        name: true,
                                    },
                                },
                                id: true,
                                rentAgreementNumber: true,
                                startDate: true,
                                endDate: true,
                                totalPrice: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        });

        reportData.push(
              ...properties.map((property) => ({
                  id: property.id,
                  name: property.name,
                  client: property.client,
                  builtArea: property.builtArea,
                  propertyId: property.propertyId,
                  price: property.price,
                  numElevators: property.numElevators,
                  numParkingSpaces: property.numParkingSpaces,
                  units: property.units.map((unit) => {
                      const currentDate = new Date();
                      let unitStatus = "شاغرة";
                      const activeAgreement = unit.rentAgreements?.find(
                            (agreement) => agreement.status === "ACTIVE",
                      );
                      if (activeAgreement) {
                          if (new Date(activeAgreement.endDate) <= currentDate) {
                              unitStatus = "يجب اتخاذ اجراء";
                              activeAgreement.renter = activeAgreement.renter.name;
                          } else {
                              unitStatus = "مؤجرة";
                              activeAgreement.renter = activeAgreement.renter.name;
                          }
                      } else if (unit.rentAgreements.length > 0) {
                          unitStatus = "شاغرة";
                      }
                      return {
                          id: unit.id,
                          number: unit.number,
                          yearlyRentPrice: unit.yearlyRentPrice,
                          floor: unit.floor,
                          numBedrooms: unit.numBedrooms,
                          numBathrooms: unit.numBathrooms,
                          numACs: unit.numACs,
                          numLivingRooms: unit.numLivingRooms,
                          actualRentPrice: activeAgreement?.totalPrice,
                          activeAgreement,
                          status: unitStatus,
                          rentAgreements: unit.rentAgreements.map((agreement) => ({
                              id: agreement.id,
                              rentAgreementNumber: agreement.rentAgreementNumber,
                              startDate: agreement.startDate,
                              endDate: agreement.endDate,
                              totalPrice: agreement.totalPrice,
                              status: StatusType[agreement.status] || agreement.status,
                              unit: unit.number,
                          })),
                      };
                  }),
              })),
        );
    } catch (error) {
        console.error("Error fetching property report data", error);
    }

    return {data: reportData};
}

export async function getMaintenanceReports(page, limit, searchParams, params) {
    const filters = searchParams.get("filters")
          ? JSON.parse(searchParams.get("filters"))
          : {};
    const {propertyIds, startDate, endDate} = filters;
    const start = startOfDay(startDate);

    const end = endOfDay(endDate);
    try {
        const properties = await prisma.property.findMany({
            where: {
                id: {in: propertyIds},
            },
            select: {
                id: true,
                name: true,
                client: true,
                maintenances: {
                    where: {
                        date: {
                            gte: start,
                            lte: end,
                        },
                    },
                    select: {
                        id: true,
                        description: true,
                        date: true,
                        unit: {
                            select: {
                                number: true,
                            },
                        },
                        payments: {
                            where: {
                                dueDate: {
                                    gte: start,
                                    lte: end,
                                },
                            },
                            select: {
                                amount: true,
                                paidAmount: true,
                                dueDate: true,
                                status: true,
                            },
                        },
                    },
                },
            },
        });

        return {data: properties};
    } catch (error) {
        console.error("Error fetching maintenance report data", error);
        return {data: []};
    }
}

export async function getOwnersReport(page, limit, searchParams, params) {
    const filters = searchParams.get("filters")
          ? JSON.parse(searchParams.get("filters"))
          : {};
    const {ownerIds, startDate, endDate} = filters;
    const start = startOfDay(new Date(startDate));
    const end = endOfDay(new Date(endDate));
    let where = {
        id: {
            in: ownerIds.map((id) => parseInt(id, 10)),
        },
    }
    let propertiesWhere = {};
    propertiesWhere = await updateWhereClauseWithUserProperties("id", propertiesWhere)
    try {
        const owners = await prisma.client.findMany({
            where,
            select: {
                id: true,
                name: true,
                nationalId: true,
                email: true,
                phone: true,
                properties: {
                    where: propertiesWhere
                    ,
                    select: {
                        id: true,
                        name: true,
                        builtArea: true,
                        price: true,
                        numElevators: true,
                        numParkingSpaces: true,
                        propertyId: true,
                        units: {
                            select: {
                                id: true,
                                number: true,
                                yearlyRentPrice: true,
                                floor: true,
                                numBedrooms: true,
                                numBathrooms: true,
                                numACs: true,
                                numLivingRooms: true,
                                rentAgreements: {
                                    select: {
                                        id: true,
                                        status: true,
                                        totalPrice: true,
                                        endDate: true,
                                        renter: {
                                            select: {
                                                name: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        incomes: {
                            where: {
                                date: {
                                    gte: start,
                                    lte: end,
                                },
                                invoice: {
                                    rentAgreement: {
                                        status: 'ACTIVE',
                                    },
                                },
                            },
                            select: {
                                date: true,
                                amount: true,
                                description: true,
                                createdAt: true,
                                invoice: {
                                    select: {
                                        id: true,
                                        invoiceType: true,
                                        property: {
                                            select: {
                                                id: true,
                                                name: true,
                                            },
                                        },
                                        rentAgreement: {
                                            select: {
                                                id: true,
                                                rentAgreementNumber: true,
                                                status: true,
                                                unit: {
                                                    select: {
                                                        id: true,
                                                        number: true,
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        expenses: {
                            where: {
                                date: {
                                    gte: start,
                                    lte: end,
                                },
                            },
                            select: {
                                date: true,
                                amount: true,
                                description: true,
                                createdAt: true,
                                invoice: {
                                    select: {
                                        id: true,
                                        invoiceType: true,
                                        property: {
                                            select: {
                                                id: true,
                                                name: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        owners.forEach((owner) => {
            owner.properties.forEach((property) => {
                property.units.forEach((unit) => {
                    const activeAgreement = unit.rentAgreements?.find(
                          (agreement) => agreement.status === "ACTIVE",
                    );
                    if (!activeAgreement) {
                        unit.status = "EXPIRED";
                    }
                    if (activeAgreement) {
                        const currentDate = new Date();

                        if (new Date(activeAgreement.endDate) < currentDate) {
                            unit.status = "EXPIRED";
                            unit.rentAgreements.map((rent) => {
                                if (rent.id === activeAgreement.id) {
                                    rent.status = "EXPIRED";
                                }
                                return rent;
                            });
                        } else {
                            unit.actualRentPrice = activeAgreement.totalPrice;
                            unit.renter = activeAgreement.renter.name;
                        }
                    }
                });
            });
        });
        return {data: owners};
    } catch (error) {
        console.error("Error fetching owners' report data", error);
        return {data: []};
    }
}

export async function getPaymentsReport(page, limit, searchParams, params) {
    const filters = searchParams.get("filters")
          ? JSON.parse(searchParams.get("filters"))
          : {};
    const {unitIds, paymentTypes, paymentStatus, startDate, endDate, rentStatus} =
          filters;


    const rentAgreements = await prisma.rentAgreement.findMany({
        where: {
            unitId: {in: unitIds.map((id) => parseInt(id, 10))},
            status: {
                in: !rentStatus || rentStatus === "all" ? ["ACTIVE", "EXPIRED"] : [rentStatus],
            },
        },
        select: {
            id: true,
        },
    });
    const rentAgreementsIds = rentAgreements.map(
          (rentAgreement) => rentAgreement.id,
    );
    try {
        let whereCondition = {
            rentAgreementId: {in: rentAgreementsIds},
            dueDate: {
                gte: new Date(startDate),
                lte: new Date(endDate),
            },
        };

        if (paymentTypes && paymentTypes.length > 0) {
            whereCondition.paymentType = {in: paymentTypes};
        }
        if (paymentStatus !== "ALL") {
            whereCondition.status = paymentStatus === "PAID" ? "PAID" : "PENDING";
        }

        const payments = await prisma.payment.findMany({
            where: whereCondition,
            select: {
                id: true,
                paymentType: true,
                amount: true,
                paidAmount: true,
                status: true,
                dueDate: true,
                invoices: {
                    select: {
                        id: true,
                        createdAt: true,
                        amount: true,
                    }
                },
                rentAgreement: {
                    select: {
                        rentAgreementNumber: true,
                        status: true,
                        endDate: true,
                        unit: {
                            select: {
                                number: true,
                                property: {
                                    select: {
                                        name: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        const formattedPayments = payments.map((payment) => {
            if (payment.rentAgreement) {
                if (payment.rentAgreement.status === "ACTIVE") {
                    const currentDate = new Date();
                    if (new Date(payment.rentAgreement.endDate) < currentDate) {
                        payment.rentAgreement.status = "NEEDSACTION";
                    }
                }
            }
            return {
                paymentType: payment.paymentType,
                isFullPaid: payment.amount === payment.paidAmount ? "نعم" : "لا",
                paidAmount: payment.paidAmount,
                amount: payment.amount,
                unit: payment.rentAgreement.unit,
                rentAgreement: payment.rentAgreement,
                date: payment.dueDate,
                invoices: payment.invoices,
                rentAgreementStatus: StatusType[payment.rentAgreement?.status],
            };
        });

        return {data: formattedPayments};
    } catch (error) {
        console.error("Error fetching payments report data", error);
        return {data: []}; // Ensure a consistent return format
    }
}

export const getTaxPaymentsReport = async (
      page,
      limit,
      searchParams,
) => {
    const filters = searchParams.get("filters")
          ? JSON.parse(searchParams.get("filters"))
          : {};
    const {ownerId, startDate, endDate} = filters;
    let where = {
        paymentType: "TAX",
        clientId: parseInt(ownerId, 10),
        dueDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
        },
    }
    where = await updateWhereClauseWithUserProperties("propertyId", where)
    try {
        const payments = await prisma.payment.findMany({
            where,
            select: {
                id: true,
                paymentType: true,
                amount: true,
                paidAmount: true,
                dueDate: true,
                rentAgreement: {
                    select: {
                        totalPrice: true,
                        tax: true,
                    },
                },
                unit: {
                    select: {
                        number: true,
                        property: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
                client: {
                    select: {
                        name: true,
                    },
                },
            },
        });
        const formattedPayments = payments.map((payment) => ({
            ownerName: payment.client.name,
            propertyName: payment.unit.property.name,
            unitNumber: payment.unit.number,
            amount: payment.amount,
            paidAmount: payment.paidAmount,
            dueDate: payment.dueDate,
            rentAgreement: payment.rentAgreement,
        }));

        return {data: formattedPayments};
    } catch (error) {
        console.error("Error fetching tax payments report data", error);
        throw new Error("Internal server error");
    }
};

export async function getElectricMetersReports(
      page,
      limit,
      searchParams,
      params,
) {
    const filters = searchParams.get("filters")
          ? JSON.parse(searchParams.get("filters"))
          : {};
    const {propertyIds} = filters;
    try {
        let properties = await prisma.property.findMany({
            where: {
                id: {in: propertyIds},
            },
            select: {
                id: true,
                name: true,
                client: true,
                propertyId: true,
                electricityMeters: {
                    select: {
                        id: true,
                        meterId: true,
                        name: true,
                        property: {
                            select: {
                                propertyId: true,
                                name: true,
                            },
                        },
                    },
                },
                units: {
                    select: {
                        id: true,
                        number: true,
                        electricityMeter: true,
                        unitId: true,
                        property: {
                            select: {
                                propertyId: true,
                                name: true,
                            },
                        },
                    },
                },
            },
        });

        return {data: properties};
    } catch (error) {
        console.error("Error fetching electric meters report data", error);
    }
}

export async function getRentAgreementsReports(
    page,
    limit,
    searchParams,
  ) {
    const filters = searchParams.get("filters")
          ? JSON.parse(searchParams.get("filters"))
          : {};
    const {propertyIds, startDate, endDate, rentStatus} = filters;
    
    let statusFilter = {
        status: {
            in: rentStatus === "all" || !rentStatus ? ["ACTIVE", "EXPIRED"] : [rentStatus],
        },
    };
  
    try {
        const properties = await prisma.property.findMany({
            where: {
                id: {in: propertyIds},
            },
            select: {
                id: true,
                name: true,
                managementCommission: true,
                client: {
                    select: {
                        name: true,
                        nationalId: true,
                        email: true,
                        phone: true,
                    },
                },
                units: {
                    select: {
                        id: true,
                        number: true,
                        rentAgreements: {
                            where: statusFilter,
                            select: {
                                id: true,
                                rentAgreementNumber: true,
                                startDate: true,
                                endDate: true,
                                status: true,
                                totalPrice: true,
                                totalContractPrice: true,
                                tax: true,
                                registrationFees: true,
                                insuranceFees: true,
                                payments: {
                                    select: {
                                        amount: true,
                                        paidAmount: true,
                                        status: true,
                                    },
                                },
                                contractExpenses: {
                                    include: {
                                        contractExpense: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        
        // Process rent agreements to add custom status and payment summaries
        properties.forEach((property) => {
            property.rentAgreements = [];
            property.units.forEach((unit) => {
                unit.rentAgreements.forEach((agreement) => {
                    agreement.unitNumber = unit.number;
  
                    // Base contract amount (without taxes and fees)
                    agreement.totalAmount = agreement.totalPrice || 0;
                    
                    // Calculate additional fees and taxes
                    const taxAmount = agreement.tax || 0;
                    const registrationFees = agreement.registrationFees || 0;
                    const insuranceFees = agreement.insuranceFees || 0;
                    
                    // Calculate contract expenses total
                    const contractExpensesTotal = agreement.contractExpenses?.reduce(
                        (sum, expenseItem) => sum + (expenseItem.contractExpense?.value || 0),
                        0
                    ) || 0;
                    
                    // Total with all taxes and fees included
                    const totalWithTaxesAndFees = agreement.totalAmount + taxAmount + 
                        registrationFees + insuranceFees + contractExpensesTotal;
                    
                    // Calculate what was actually paid by the client
                    agreement.paidAmount = agreement.payments.reduce(
                        (acc, payment) => acc + payment.paidAmount,
                        0
                    );
                    
                    // Calculate remaining amount based on total with taxes and fees
                    agreement.remainingAmount = totalWithTaxesAndFees - agreement.paidAmount;
                    
                    // Calculate management commission based on base contract amount only
                    agreement.managementCommission = agreement.totalAmount * (property.managementCommission / 100);
                    
                    if (agreement.status === "ACTIVE") {
                        const currentDate = new Date();
                        if (new Date(agreement.endDate) < currentDate) {
                            agreement.customStatus = "يجب اتخاذ اجراء ";
                        } else {
                            agreement.customStatus = "نشط";
                        }
                    } else if (agreement.status === "EXPIRED") {
                        agreement.customStatus = "منتهي";
                    } else if (agreement.status === "CANCELED") {
                        agreement.customStatus = "ملغي";
                    } else {
                        agreement.customStatus = "غير معروف";
                    }
                    
                    property.rentAgreements.push(agreement);
                });
            });
        });
        
        return {data: properties};
    } catch (error) {
        console.error("Error fetching rent agreements report data", error);
        return {data: []};
    }
  }

export async function getRentedUnitsReport(page, limit, searchParams, params) {
    const filters = searchParams.get("filters")
          ? JSON.parse(searchParams.get("filters"))
          : {};
    const {propertyIds} = filters;

    const today = new Date();
    try {
        const properties = await prisma.property.findMany({
            where: {
                id: {in: propertyIds},
            },
            select: {
                id: true,
                name: true,
                propertyId: true,
                electricityMeters: {
                    select: {
                        id: true,
                        meterId: true,
                        name: true,
                    },
                },
                client: {
                    select: {
                        name: true,
                        nationalId: true,
                        phone: true,
                        email: true,
                    },
                },
                units: {
                    select: {
                        id: true,
                        number: true,
                        unitId: true,
                        type: {
                            select: {
                                name: true,
                            },
                        },
                        rentAgreements: {
                            where: {
                                status: "ACTIVE",
                                endDate: {
                                    gt: today,
                                },
                            },
                            select: {
                                status: true,
                                endDate: true,
                                renter: {
                                    select: {
                                        name: true,
                                        nationalId: true,
                                        phone: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        properties.forEach((property) => {
            property.units.forEach((unit) => {
                const activeAgreement = unit.rentAgreements?.find(
                      (agreement) => agreement.status === "ACTIVE",
                );
                if (activeAgreement) {
                    unit.activeAgreement = activeAgreement;
                }
            });
        });

        return {
            data: properties,
            status: 200,
        };
    } catch (error) {
        console.error("Error fetching rented units report:", error);
        throw error;
    }
}
