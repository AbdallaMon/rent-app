export const pathMap = {
  "/login": "HOME",
  "/": "HOME",
  "/follow-up": "FOLLOW_UP",
  "/payments": "FOLLOW_UP",
  "/properties": "PROPERTY",
  "/units": "UNIT",
  "/rent": "RENT",
  "/invoices": "INVOICE",
  "/maintenance": "MAINTENANCE",
  "/request": "MAINTENANCE",
  "/reports": "REPORT",
  "/owners": "OWNER",
  "/renters": "RENTER",
  "/settings": "SETTING",
  "/whatsapp": "WHATSAPP",
  "/whatsapp/dashboard": "WHATSAPP",
  "/whatsapp/reminders": "WHATSAPP",
  "/whatsapp/settings": "WHATSAPP",
  "/admin": "SETTING",
  "/admin/whatsapp": "SETTING",
  "/accounting": "ACCOUNTING",
  "/security-deposits": "SECURITY_DEPOSIT",
};
export const getCurrentPrivilege = (user, pathName) => {
  if (pathName.split("/").length > 2) {
    pathName = "/" + pathName.split("/")[1];
  }
  return user.privileges.find((priv) => priv.area === pathMap[pathName]);
};
