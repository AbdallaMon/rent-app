export const getFromName = (invoice) => {
  switch (invoice.invoiceType) {
    case "RENT":
    case "TAX":
    case "INSURANCE":
    case "REGISTRATION":
      return invoice.rentAgreement?.renter?.name;
    default:
      return invoice.owner?.name || "غير معروف";
  }
};
