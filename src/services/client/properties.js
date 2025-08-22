import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";

export async function submitProperty(data, setLoading) {
  try {
    // Create Property
    const propertyResponse = await handleRequestSubmit(
      data,
      setLoading,
      "main/properties",
      false,
      "جاري إنشاء العقار...",
    );

    if (propertyResponse.status !== 200) {
      return;
    }

    const propertyId = propertyResponse.data.id;

    // Create Electricity Meters
    const electricityMetersData = {
      propertyId,
      electricityMeters: data.extraData.electricityMeters,
    };
    await handleRequestSubmit(
      electricityMetersData,
      setLoading,
      `main/properties/${propertyId}/electricityMeters`,
      false,
      "جاري إنشاء عدادات الكهرباء...",
    );

    // Create Units
    const unitsData = {
      propertyId,
      units: data.extraData.units,
    };
    const units = await handleRequestSubmit(
      unitsData,
      setLoading,
      `main/properties/${propertyId}/units`,
      false,
      "جاري إنشاء الوحدات...",
    );
    propertyResponse.data._count = {
      units: units.data.length,
    };

    return propertyResponse.data;
  } catch (error) {
    console.error("Error submitting property:", error);
    throw error;
  }
}
