"use client";
import * as React from "react";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { usePathname, useRouter } from "next/navigation";
import { TabScrollButton } from "@mui/material";
import { alpha } from "@mui/material/styles";

/* =========================
   Unchanged component name
========================= */
function CustomTabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography component="div">{children}</Typography>
        </Box>
      )}
    </div>
  );
}

CustomTabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

/* =========================
   Unchanged helper name
========================= */
function a11yProps(index) {
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

/* =========================
   SAME DATA (unchanged)
========================= */
const tabLinks = [
  { label: "الصلاحيات", href: "/settings/" },
  { label: "إعدادات نوع العقار", href: "/settings/property-type" },
  { label: "إعدادات نوع الوحدة", href: "/settings/unit-type" },
  { label: "إعدادات البنك", href: "/settings/bank" },
  { label: "إعدادات الامارات", href: "/settings/state" },
  { label: "اعدادات مصروفات العقود", href: "/settings/contract-expense-type" },
  { label: "إعدادات انواع المصروفات", href: "/settings/property-expense-type" },
  { label: "المحصلون", href: "/settings/collectors" },
];

const reportLink = [
  { label: "تقارير شامل", href: "/reports/" },
  { label: "تقارير الصيانة", href: "/reports/maintenance" },
  { label: "تقارير الملاك", href: "/reports/owners" },
  { label: "تقارير المستاجرين", href: "/reports/renters" },
  { label: " تقارير مدفوعات العقد", href: "/reports/payments" },
  { label: "تقارير عدادات الكهرباء  ", href: "/reports/electricity" },
  { label: "تقارير العقود", href: "/reports/contracts" },
  { label: "العقود المنتهية", href: "/reports/expiring-contracts" },
  { label: "تقارير الضرائب", href: "/reports/tax" },
  { label: "تقارير الوحدات", href: "/reports/units" },
  { label: "مدفوعات العقد", href: "/reports/contract-payment" },
];

const requestLink = [
  { label: "تقارير الصيانة", href: "/request/maintenance" },
  { label: "تقارير الطلبات", href: "/request/contact" },
  { label: "تقارير الشكاوي", href: "/request/complaint" },
];
const accountingLink = [
  { label: "حسابات الشركة", href: "/accounting/" },
  { label: "كشوف الحسابات", href: "/accounting/statements" },
  { label: "دفتر اليومية", href: "/accounting/journal" },
  { label: "ميزان المراجعة", href: "/accounting/trial-balance" },
];

/* =========================
   Unchanged export name
========================= */
export function BasicTabs({ reports, settings, accounting }) {
  const router = useRouter();
  const currentPath = usePathname();

  // keep same logic; just small guard for correct list
  const list = accounting
    ? accountingLink
    : reports
      ? reportLink
      : settings
        ? tabLinks
        : requestLink;

  const currentIndex = list.findIndex((tab) => tab.href === currentPath);
  const [value, setValue] = React.useState(
    currentIndex !== -1 ? currentIndex : 0
  );

  React.useEffect(() => {
    if (currentIndex !== -1) {
      setValue(currentIndex);
    }
  }, [currentIndex]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
    router.push(list[newValue].href);
  };

  const getScrollButtonDirection = (direction) => {
    return direction === "left" ? "left" : "right";
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box
        sx={(theme) => ({
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: theme.palette.background.paper,
        })}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs"
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
          textColor="primary"
          indicatorColor="primary"
          sx={{
            "& .MuiTabs-flexContainer": {
              justifyContent: "flex-start",
            },
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: 3,
            },
          }}
          ScrollButtonComponent={(props) => (
            <TabScrollButton
              {...props}
              direction={getScrollButtonDirection(props.direction)}
            />
          )}
        >
          {list.map((tab, index) => (
            <Tab
              key={tab.href}
              label={tab.label}
              {...a11yProps(index)}
              sx={(theme) => ({
                minHeight: 48,
                px: { xs: 1.5, sm: 2.5 },
                mx: { xs: 0.25, sm: 0.5 },
                borderRadius: 2,
                // hover/selected purely via MUI palette
                "&:hover": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.06),
                },
                "&.Mui-selected": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  fontWeight: 600,
                },
              })}
            />
          ))}
        </Tabs>
      </Box>
    </Box>
  );
}

BasicTabs.propTypes = {
  reports: PropTypes.bool,
  settings: PropTypes.bool,
};
