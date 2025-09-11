export const getFromName = (invoice) => {
  return invoice.billedClient.name;
  // switch (invoice.invoiceType) {
  //   case "RENT":
  //   case "TAX":
  //   case "INSURANCE":
  //   case "REGISTRATION":
  //     return invoice.rentAgreement?.renter?.name;
  //   default:
  //     return invoice.owner?.name || "غير معروف";
  // }
};
