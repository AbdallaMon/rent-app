import prisma from "@/lib/prisma"; // Adjust the path to your Prisma instance
import bcrypt from "bcrypt";

/// State creation and update functions
export async function createState(data) {
    const {extraData: cities, ...stateData} = data;

    const newState = await prisma.state.create({
        data: {
            ...stateData,
            cities: {
                create: cities.map((city) => ({
                    name: city.name,
                })),
            },
        },
        include: {
            cities: true,
        },
    });
    return {...newState, citiesLength: newState.cities.length};
}

export async function updateState(id, data) {
    const {extraData: cities, ...stateData} = data;

    const updatedState = await prisma.state.update({
        where: {id},
        data: {
            ...stateData,
            cities: {
                deleteMany: {},
                create: cities.map((city) => ({
                    name: city.name,
                })),
            },
        },
        include: {
            cities: true,
        },
    });

    return {...updatedState, citiesLength: updatedState.cities.length};
}

export async function getStates(page, limit) {
    const offset = (page - 1) * limit;
    const states = await prisma.state.findMany({
        skip: offset,
        take: limit,
        include: {
            cities: true,
        },
    });
    const totalStates = await prisma.state.count();
    const totalPages = Math.ceil(totalStates / limit);

    return {
        data: states,
        totalPages,
        total: totalStates,
    };
}

export async function deleteState(id) {
    return await prisma.state.delete({
        where: {id},
    });
}

// City CRUD operations
export async function createCity(data, params) {
    const {extraData: districts, ...cityData} = data;
    const {id: stateId} = params;
    const newCity = await prisma.city.create({
        data: {
            ...cityData,
            state: {
                connect: {id: +stateId},
            },
            districts: {
                create: districts.map((district) => ({
                    name: district.name,
                })),
            },
        },
        include: {
            districts: true,
        },
    });
    return {...newCity, districtsLength: newCity.districts.length};
}

export async function getCities(page, limit, searchParams, params) {
    const {id: stateId} = params;
    const offset = (page - 1) * limit;
    const cities = await prisma.city.findMany({
        where: {stateId: +stateId},
        skip: offset,
        take: limit,
        include: {
            districts: true,
        },
    });
    const totalCities = await prisma.city.count({where: {stateId: +stateId}});
    const totalPages = Math.ceil(totalCities / limit);

    return {
        data: cities,
        totalPages,
        total: totalCities,
    };
}

export async function updateCity(id, data, params) {
    const {extraData: districts, ...cityData} = data;
    const {cityId} = params;

    const updatedCity = await prisma.city.update({
        where: {id: +cityId},
        data: {
            ...cityData,
            districts: {
                deleteMany: {},
                create: districts.map((district) => ({
                    name: district.name,
                })),
            },
        },
        include: {
            districts: true,
        },
    });

    return {...updatedCity, districtsLength: updatedCity.districts.length};
}

export async function deleteCity(id, params) {
    const {cityId} = params;
    return await prisma.city.delete({
        where: {id: +cityId},
    });
}

// District CRUD operations
export async function createDistrict(data, params) {
    const {extraData: neighbours, ...districtData} = data;
    const {cityId} = params;

    const newDistrict = await prisma.district.create({
        data: {
            ...districtData,
            city: {
                connect: {id: +cityId},
            },
            neighbours: {
                create: neighbours.map((neighbour) => ({
                    name: neighbour.name,
                })),
            },
        },
        include: {
            neighbours: true,
        },
    });
    return {...newDistrict, neighboursLength: newDistrict.neighbours.length};
}

export async function getDistricts(page, limit, searchParams, params) {
    const {cityId} = params;
    const offset = (page - 1) * limit;
    const districts = await prisma.district.findMany({
        where: {cityId: +cityId},
        skip: offset,
        take: limit,
        include: {
            neighbours: true,
        },
    });
    const totalDistricts = await prisma.district.count({
        where: {cityId: +cityId},
    });
    const totalPages = Math.ceil(totalDistricts / limit);

    return {
        data: districts,
        totalPages,
        total: totalDistricts,
    };
}

export async function updateDistrict(id, data, params) {
    const {extraData: neighbours, ...districtData} = data;
    const {districtId} = params;

    const updatedDistrict = await prisma.district.update({
        where: {id: +districtId},
        data: {
            ...districtData,
            neighbours: {
                deleteMany: {},
                create: neighbours.map((neighbour) => ({
                    name: neighbour.name,
                })),
            },
        },
        include: {
            neighbours: true,
        },
    });

    return {
        ...updatedDistrict,
        neighboursLength: updatedDistrict.neighbours.length,
    };
}

export async function deleteDistrict(id, params) {
    const {districtId} = params;
    return await prisma.district.delete({
        where: {id: +districtId},
    });
}

// Property Type
export async function createPropertyType(data) {
    const newPropertyType = await prisma.propertyType.create({
        data: {
            ...data,
        },
    });
    return newPropertyType;
}

export async function getPropertyTypes(page, limit) {
    const offset = (page - 1) * limit;
    const propertyTypes = await prisma.propertyType.findMany({
        skip: offset,
        take: limit,
    });
    const totalPropertyTypes = await prisma.propertyType.count();
    const totalPages = Math.ceil(totalPropertyTypes / limit);

    return {
        data: propertyTypes,
        totalPages,
        total: totalPropertyTypes,
    };
}

export async function updatePropertyType(id, data) {
    const updatedPropertyType = await prisma.propertyType.update({
        where: {id},
        data: {
            ...data,
        },
    });

    return updatedPropertyType;
}

export async function deletePropertyType(id) {
    return await prisma.propertyType.delete({
        where: {id},
    });
}

export async function createUnitType(data) {
    const newUnitType = await prisma.unitType.create({
        data: {
            ...data,
        },
    });
    return newUnitType;
}

export async function getUnitTypes(page, limit) {
    const offset = (page - 1) * limit;
    const unitTypes = await prisma.unitType.findMany({
        skip: offset,
        take: limit,
    });
    const totalUnitTypes = await prisma.unitType.count();
    const totalPages = Math.ceil(totalUnitTypes / limit);

    return {
        data: unitTypes,
        totalPages,
        total: totalUnitTypes,
    };
}

export async function updateUnitType(id, data) {
    const updatedUnitType = await prisma.unitType.update({
        where: {id},
        data: {
            ...data,
        },
    });
    return updatedUnitType;
}

export async function deleteUnitType(id) {
    return await prisma.unitType.delete({
        where: {id},
    });
}

// Bank
export async function createBank(data) {
    return await prisma.bank.create({data});
}

export async function getBanks(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [banks, total] = await prisma.$transaction([
        prisma.Bank.findMany({
            skip: offset,
            take: limit,
        }),
        prisma.bank.count(),
    ]);

    return {
        data: banks,
        total,
        totalPages: Math.ceil(total / limit),
    };
}

export async function updateBank(id, data) {
    id = +id;
    return await prisma.bank.update({
        where: {id},
        data,
    });
}

export async function deleteBank(id) {
    return await prisma.bank.delete({
        where: {id},
    });
}

// Contract Expense
export async function createContractExpense(data) {
    data = {
        name: data.name,
        value: +data.value,
    };
    return await prisma.contractExpense.create({data});
}

export async function getContractExpenses(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [contractExpenses, total] = await prisma.$transaction([
        prisma.contractExpense.findMany({
            skip: offset,
            take: limit,
        }),
        prisma.contractExpense.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data: contractExpenses,
        total,
        totalPages,
    };
}

export async function updateContractExpense(id, data) {
    data = {
        name: data.name,
        value: +data.value,
    };
    return await prisma.contractExpense.update({
        where: {id},
        data,
    });
}

export async function deleteContractExpense(id) {
    return await prisma.contractExpense.delete({
        where: {id},
    });
}

// Property Expense Type
export async function createPropertyExpenseType(data) {
    return await prisma.propertyExpenseType.create({data});
}

export async function getPropertyExpenseTypes(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [propertyExpenseTypes, total] = await prisma.$transaction([
        prisma.propertyExpenseType.findMany({
            skip: offset,
            take: limit,
        }),
        prisma.propertyExpenseType.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data: propertyExpenseTypes,
        total,
        totalPages,
    };
}

export async function updatePropertyExpenseType(id, data) {
    return await prisma.propertyExpenseType.update({
        where: {id},
        data,
    });
}

export async function deletePropertyExpenseType(id) {
    return await prisma.propertyExpenseType.delete({
        where: {id},
    });
}

// Collector
export async function createCollector(data) {
    return await prisma.collector.create({data});
}

export async function getCollectors(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [collectors, total] = await prisma.$transaction([
        prisma.collector.findMany({
            skip: offset,
            take: limit,
        }),
        prisma.collector.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data: collectors,
        total,
        totalPages,
    };
}

export async function updateCollector(id, data) {
    return await prisma.collector.update({
        where: {id},
        data,
    });
}

export async function deleteCollector(id) {
    return await prisma.collector.delete({
        where: {id},
    });
}

export async function createRentAgreementType(data) {
    const {extraData: description, ...typesData} = data;
    data = {
        ...typesData,
        description,
    };
    return await prisma.rentAgreementType.create({data});
}

export async function getRentAgreementTypes(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [types, total] = await prisma.$transaction([
        prisma.rentAgreementType.findMany({
            skip: offset,
            take: limit,
        }),
        prisma.rentAgreementType.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data: types,
        total,
        totalPages,
    };
}

export async function updateRentAgreementType(id, data) {
    const {extraData: description, ...typesData} = data;
    data = {
        ...typesData,
        description,
    };
    return await prisma.rentAgreementType.update({
        where: {id},
        data,
    });
}

export async function deleteRentAgreementType(id) {
    return await prisma.rentAgreementType.delete({
        where: {id},
    });
}

// privilege

// Create a new user with privileges
export async function createUser(data) {
    const extraData = data.extraData;
    const {name, email, password, role, privileges} = extraData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const privilegesData = Object.values(privileges);
    const newUser = await prisma.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
            privileges: {
                create: privilegesData.map((privilege) => ({
                    privilege: {
                        create: {
                            name: privilege.area,
                            canRead:
                                  privilege.canRead !== undefined ? privilege.canRead : false,
                            canWrite:
                                  privilege.canWrite !== undefined ? privilege.canWrite : false,
                            canEdit:
                                  privilege.canEdit !== undefined ? privilege.canEdit : false,
                            canDelete:
                                  privilege.canDelete !== undefined ? privilege.canDelete : false,
                        },
                    },
                    area: privilege.area,
                })),
            },
        },
        include: {
            privileges: {
                include: {
                    privilege: true,
                },
            },
        },
    });

    return newUser;
}

// Fetch all privileges
export async function getAllPrivileges() {
    const priv = await prisma.privilege.findMany();
    return {
        data: priv,
    };
}

// Fetch all users with pagination
export async function getAllUsers(page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [users, total] = await prisma.$transaction([
        prisma.user.findMany({
            skip: offset,
            take: limit,
            include: {
                properties: true,
                privileges: {
                    include: {
                        privilege: true,
                    },
                },
            },
        }),
        prisma.user.count(),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
        data: users,
        total,
        totalPages,
    };
}

export async function assignPropertiesToUser(id, data) {
    console.log(id, "id")
    // Remove all existing property associations for the user
    await prisma.userProperty.deleteMany({
        where: {userId: +id},
    });

    // Create new property associations
    const updatedUser = await prisma.user.update({
        where: {id: +id},
        data: {
            properties: {
                create: data.map((property) => ({
                    property: {
                        connect: {id: property.id},
                    },
                })),
            },
        },
    });

    return updatedUser;

}

export async function updateUser(id, data) {
  const extraData = data.extraData;
  const { name, email, role, privileges } = extraData;
  const privilegesData = Object.values(privileges);
  
  // First, find or create all privileges
  const privilegePromises = privilegesData.map(async (privilege) => {
    // Get the area name (could be 'area' or 'name' depending on the source)
    const areaName = privilege.area || privilege.name;
    
    if (!areaName) {
      console.error('❌ لا يوجد اسم منطقة للصلاحية:', privilege);
      return null;
    }
    
    // Try to find existing privilege by name
    let existingPrivilege = await prisma.privilege.findFirst({
      where: { name: areaName }
    });
    
    // If it doesn't exist, create it
    if (!existingPrivilege) {
      existingPrivilege = await prisma.privilege.create({
        data: {
          name: areaName,
          canRead: privilege.canRead !== undefined ? privilege.canRead : false,
          canWrite: privilege.canWrite !== undefined ? privilege.canWrite : false,
          canEdit: privilege.canEdit !== undefined ? privilege.canEdit : false,
          canDelete: privilege.canDelete !== undefined ? privilege.canDelete : false,
        }
      });
    } else {
      // Update existing privilege with new permissions
      existingPrivilege = await prisma.privilege.update({
        where: { id: existingPrivilege.id },
        data: {
          canRead: privilege.canRead !== undefined ? privilege.canRead : existingPrivilege.canRead,
          canWrite: privilege.canWrite !== undefined ? privilege.canWrite : existingPrivilege.canWrite,
          canEdit: privilege.canEdit !== undefined ? privilege.canEdit : existingPrivilege.canEdit,
          canDelete: privilege.canDelete !== undefined ? privilege.canDelete : existingPrivilege.canDelete,
        }
      });
    }
    
    return {
      area: areaName,
      privilegeId: existingPrivilege.id
    };
  });
  
  // Wait for all privilege operations to complete
  const userPrivileges = (await Promise.all(privilegePromises)).filter(Boolean);
  
  // Now update the user with the prepared privilege data
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      name,
      email,
      role,
      privileges: {
        deleteMany: {}, // Delete existing user-privilege associations
        create: userPrivileges, // Create new associations with existing privileges
      },
    },
    include: {
      privileges: {
        include: {
          privilege: true,
        },
      },
    },
  });
  
  return updatedUser;
}

export async function deleteUser(id) {
    return await prisma.user.delete({
        where: {id},
    });
}
