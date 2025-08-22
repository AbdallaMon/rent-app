import prisma from "@/lib/prisma";
import {convertToISO} from "@/helpers/functions/convertDateToIso";
import {updateWhereClauseWithUserProperties} from "@/app/api/utlis/userProperties";

export async function createProperty(data) {
    try {
        const bankAccount = await prisma.bankAccount.findFirst({
            where: {
                id: +data.bankAccount,
            },
            include: {
                bank: {
                    select: {
                        id: true,
                    },
                },
            },
        });
        let createData = {
            name: data.name,
            buildingGuardName: data.buildingGuardName,
            buildingGuardPhone: data.buildingGuardPhone,
            buildingGuardId: data.buildingGuardId,
            propertyId: data.propertyId,
            voucherNumber: data.voucherNumber,
            street: data.street,
            plateNumber: data.plateNumber,
            price: +data.price,
            dateOfBuilt: convertToISO(data.dateOfBuilt),
            managementCommission: +data.managementCommission,
            numElevators: +data.numElevators,
            numParkingSpaces: +data.numParkingSpaces,
            builtArea: +data.builtArea,
            location: data.location || "",
            type: {
                connect: {
                    id: +data.typeId,
                },
            },
            state: {
                connect: {
                    id: +data.stateId,
                },
            },
            city: {
                connect: {
                    id: +data.cityId,
                },
            },
            bank: {
                connect: {
                    id: +bankAccount.bank.id,
                },
            },
            bankAccount: {
                connect: {
                    id: +data.bankAccount,
                },
            },
            client: {
                connect: {
                    id: +data.clientId,
                },
            },
            collector: {
                connect: {
                    id: +data.collectorId,
                },
            },
        };

        if (data.districtId) {
            createData = {
                ...createData,
                district: {
                    connect: {
                        id: +data.districtId,
                    },
                },
            };
        }

        if (data.neighbourId && data.districtId) {
            createData = {
                ...createData,
                neighbour: {
                    connect: {
                        id: +data.neighbourId,
                    },
                },
            };
        }

        const newProperty = await prisma.property.create({
            data: createData,
            include: {
                type: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                client: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                collector: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
                _count: {
                    select: {
                        units: true,
                    },
                },
            },
        });

        return newProperty;
    } catch (error) {
        console.error("Error creating property:", error);
        throw error;
    }
}

export async function createElectricityMeters(data) {
    const {propertyId, electricityMeters} = data;
    try {
        if (electricityMeters && electricityMeters.length > 0) {
            await Promise.all(
                  electricityMeters.map((meter) =>
                        prisma.electricityMeter.create({
                            data: {
                                meterId: meter.meterId,
                                name: meter.name,
                                property: {
                                    connect: {
                                        id: propertyId,
                                    },
                                },
                            },
                        }),
                  ),
            );
        }

        return {
            data: {},
            message: "تمت اضافه عدادات الكهرباء بنجاح",
        };
    } catch (error) {
        console.error("Error creating electricity meters:", error);
        throw error;
    }
}

export async function createUnits(data) {
    const {propertyId, units} = data;
    try {
        if (units && units.length > 0) {
            await Promise.all(
                  units.map((unit) =>
                        prisma.unit.create({
                            data: {
                                unitId: unit.unitId,
                                floor: 0,
                                property: {
                                    connect: {
                                        id: propertyId,
                                    },
                                },
                            },
                        }),
                  ),
            );
        }

        return {
            data: units,
            message: "تمت اضافه الوحدات بنجاح",
        };
    } catch (error) {
        console.error("Error creating units:", error);
        throw error;
    }
}

export async function getProperties(page, limit, searchParams) {
    const filters = searchParams.get("filters");
    const jsonFilters = filters?.length > 0 ? JSON.parse(filters) : null;
    const offset = (page - 1) * limit;
    let where = jsonFilters.clientId ? {clientId: +jsonFilters.clientId} : {}
    where = await updateWhereClauseWithUserProperties("id", where)
    const properties = await prisma.property.findMany({
        where,
        skip: offset,
        take: limit,
        include: {
            type: {
                select: {
                    id: true,
                    name: true,
                },
            },
            bankAccount: {
                select: {
                    id: true,
                    accountNumber: true,
                },
            },
            client: {
                select: {
                    id: true,
                    name: true,
                },
            },
            collector: {
                select: {
                    id: true,
                    name: true,
                },
            },
            _count: {
                select: {
                    units: true,
                },
            },
        },
    });
    const totalProperties = await prisma.property.count();
    const totalPages = Math.ceil(totalProperties / limit);

    const data = properties.map((property) => ({
        ...property,
    }));

    return {
        data,
        totalPages,
        total: totalProperties,
    };
}

export async function getPropertyById(page, limit, searchParams, params) {
    const id = +params.id;
    const property = await prisma.property.findUnique({
        where: {id: +id},
        include: {
            electricityMeters: true,
            units: true,
            bankAccount: {
                select: {
                    id: true,
                },
            },
        },
    });

    if (property.bankAccount) {
        property.bankAccount = property.bankAccount.id;
    } else {
        property.bankAccount = null; // or handle it accordingly
    }
    return {
        data: property,
        total: property.units.length,
    };
}

export async function updateProperty(id, data) {
    const {extraData} = data;
    const {electricityMeters, deletedMeters} = extraData;
    delete data.extraData;
    const bankAccount = data.bankAccount;

    const updateData = {};
    Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
            if (
                  key === "price" ||
                  key === "managementCommission" ||
                  key === "numElevators" ||
                  key === "numParkingSpaces" ||
                  key === "builtArea"
            ) {
                updateData[key] = +data[key];
            } else if (key === "dateOfBuilt") {
                updateData[key] = convertToISO(data[key]);
            } else if (key === "bankAccount") {
                updateData.bankAccountId = +bankAccount
            } else {
                updateData[key] = data[key];
            }
        }
    });

    if (deletedMeters && deletedMeters.length > 0) {
        for (const meter of deletedMeters) {
            await prisma.electricityMeter.delete({
                where: {
                    id: +meter.id,
                },
            });
        }
    }
    if (electricityMeters && Object.keys(electricityMeters).length > 0) {
        const electricityMeters = Object.values(extraData.electricityMeters);

        for (const meter of electricityMeters) {
            if (meter.id) {
                await prisma.electricityMeter.update({
                    where: {
                        id: meter.id,
                    },
                    data: {
                        name: meter.name,
                        meterId: meter.meterId,
                    },
                });
            } else {
                await prisma.electricityMeter.create({
                    data: {
                        name: meter.name,
                        meterId: meter.meterId,
                        property: {
                            connect: {
                                id: +id,
                            },
                        },
                    },
                });
            }
        }
    }

    let updatedProperty = await prisma.property.update({
        where: {id: +id},
        data: updateData,
        include: {
            electricityMeters: true,
            bankAccount: true,
        },
    });
    updatedProperty.bankAccount = updatedProperty.bankAccount?.id || null;
    return updatedProperty;
}

export async function deleteProperty(id) {
    return await prisma.property.delete({
        where: {id},
    });
}

export async function getUnitsByPropertyId(page, limit, searchParams, params) {
    const offset = (page - 1) * limit;
    const id = +params.id;
    const units = await prisma.unit.findMany({
        where: {
            propertyId: id,
        },
        include: {
            type: {
                select: {
                    id: true,
                    name: true,
                },
            },
            client: {
                select: {
                    id: true,
                    name: true,
                },
            },
            rentAgreements: true,
        },
        skip: offset,
        take: limit,
    });
    const totalUnits = await prisma.unit.count({
        where: {
            propertyId: id,
        },
    });

    return {
        data: units,
        total: totalUnits,
    };
}
