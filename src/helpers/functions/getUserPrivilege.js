export const getCurrentPrivilege = (user, pathName) => {
  const pathMap = {
    "/login": "HOME",
    "/": "HOME",
    "/follow-up": "FOLLOW_UP",
    "/properties": "PROPERTY",
    "/units": "UNIT",
    "/rent": "RENT",
    "/invoices": "INVOICE",
    "/maintenance": "MAINTENANCE",
    "/reports": "REPORT",
    "/owners": "OWNER",
    "/renters": "RENTER",
    "/settings": "SETTING",
    "/admin": "SETTING", // مسار لوحة الإدارة
    "/whatsapp": "SETTING", // مسار لوحة تحكم WhatsApp
  };
  if (pathName.split("/").length > 2) {
    pathName = "/" + pathName.split("/")[1];
  }
  return user.privileges.find((priv) => priv.area === pathMap[pathName]);
};
