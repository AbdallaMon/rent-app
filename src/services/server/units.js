import prisma from "@/lib/prisma";
import {updateWhereClauseWithUserProperties} from "@/app/api/utlis/userProperties";

export async function createUnit(data) {
    const createData = {
        number: data.number,
        yearlyRentPrice: +data.yearlyRentPrice,
        electricityMeter: data.electricityMeter,
        numBedrooms: +data.numBedrooms,
        floor: +data.floor,
        numBathrooms: +data.numBathrooms,
        numACs: +data.numACs,
        numLivingRooms: +data.numLivingRooms,
        numKitchens: +data.numKitchens,
        numSaloons: +data.numSaloons,
        unitId: data.unitId,
        notes: data.notes,
        type: {
            connect: {
                id: +data.typeId,
            },
        },
        property: {
            connect: {
                id: +data.propertyId,
            },
        },
    };

    const newUnit = await prisma.unit.create({
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
            property: {
                select: {
                    id: true,
                    name: true,
                },
            },
            rentAgreements: true,
        },
    });
    return newUnit;
}

export async function getUnits(page, limit, searchParams) {
    const propertyId = searchParams.get("propertyId");
    const filters = searchParams.get("filters")
          ? JSON.parse(searchParams.get("filters"))
          : {};
    const {rentStatus} = filters;
    let where = {};
    if (propertyId && propertyId !== "all") {
        where = {
            propertyId: +propertyId,
        };
    }
    if (!propertyId || propertyId === "all") {
        where = await updateWhereClauseWithUserProperties("propertyId", where)
    }
    if (rentStatus && rentStatus !== "all") {
        if (rentStatus === "rented") {
            where.rentAgreements = {
                some: {
                    status: {
                        not: "CANCELED",
                    },
                },
            };        } else if (rentStatus === "notRented") {
            // الوحدة شاغرة إذا لم تكن لديها اتفاقيات نشطة فقط
            where.OR = [
                {
                    rentAgreements: {
                        none: {},
                    },
                },
                {
                    rentAgreements: {
                        none: {
                            status: "ACTIVE",
                        },
                    },
                },
            ];
        }
    }
    const offset = (page - 1) * limit;
    const units = await prisma.unit.findMany({
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
            client: {
                select: {
                    id: true,
                    name: true,
                },
            },
            property: {
                select: {
                    id: true,
                    name: true,
                },
            },
            rentAgreements: true,
        },
    });

    const totalUnits = await prisma.unit.count(
          {
              where
          }
    );

    const totalPages = Math.ceil(totalUnits / limit);

    return {
        data: units,
        totalPages,
        total: totalUnits,
    };
}

// Get a single unit by ID
export async function getUnitById(page, limit, searchParams, params) {
    const id = +params.id;
    let where = {id: +id}
    where = await updateWhereClauseWithUserProperties("propertyId", where)
    const unit = await prisma.unit.findUnique({
        where,
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
            property: {
                select: {
                    id: true,
                    name: true,
                },
            },
            rentAgreements: true,
        },
    });
    if (!unit) {
        return {
            data: {}, status: 401
        }
    }
    return {
        data: unit,
        status: 200
    };

}

// Update a unit by ID
export async function updateUnit(id, data) {
    const updateData = {};

    const clientId = data.clientId;
    const typeId = data.typeId;
    delete data.clientId;
    delete data.typeId;

    Object.keys(data).forEach((key) => {
        if (data[key] !== undefined) {
            if (
                  key === "yearlyRentPrice" ||
                  key === "numBedrooms" ||
                  key === "floor" ||
                  key === "numBathrooms" ||
                  key === "numACs" ||
                  key === "numLivingRooms" ||
                  key === "numKitchens" ||
                  key === "numSaloons"
            ) {
                updateData[key] = +data[key];
            } else {
                updateData[key] = data[key];
            }
        }
    });

    if (clientId) {
        updateData.client = {
            connect: {
                id: +clientId,
            },
        };
    }

    if (typeId) {
        updateData.type = {
            connect: {
                id: +typeId,
            },
        };
    }

    const updatedUnit = await prisma.unit.update({
        where: {id: +id},
        data: updateData,
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
        },
    });

    return updatedUnit;
}

// Delete a unit by ID
export async function deleteUnit(id) {
    const deletedUnit = await prisma.unit.delete({
        where: {id: +id},
    });

    return deletedUnit;
}
