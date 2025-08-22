"use client";
import * as React from "react";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import {usePathname, useRouter} from "next/navigation";
import {TabScrollButton} from "@mui/material";

function CustomTabPanel(props) {
    const {children, value, index, ...other} = props;

    return (
          <div
                role="tabpanel"
                hidden={value !== index}
                id={`simple-tabpanel-${index}`}
                aria-labelledby={`simple-tab-${index}`}
                {...other}
          >
              {value === index && (
                    <Box sx={{p: 3}}>
                        <Typography>{children}</Typography>
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

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        "aria-controls": `simple-tabpanel-${index}`,
    };
}

const tabLinks = [
    {label: "الصلاحيات", href: "/settings/"},
    {
        label: "إعدادات نوع العقار",
        href: "/settings/property-type",
    },
    {label: "إعدادات نوع الوحدة", href: "/settings/unit-type"},
    {label: "إعدادات البنك", href: "/settings/bank"},
    {label: "إعدادات الامارات", href: "/settings/state"},

    {label: "اعدادات مصروفات العقود", href: "/settings/contract-expense-type"},
    {
        label: "إعدادات انواع الصيانة ",
        href: "/settings/property-expense-type",
    },
    {
        label: "المحصلون",
        href: "/settings/collectors",
    },
];
const reportLink = [
    {label: "تقارير شامل", href: "/reports/"},
    {label: "تقارير الصيانة", href: "/reports/maintenance"},
    {label: "تقارير الملاك", href: "/reports/owners"},
    {label: "تقارير المستاجرين", href: "/reports/renters"},
    {label: " تقارير مدفوعات العقد", href: "/reports/payments"},
    {label: "تقارير عدادات الكهرباء  ", href: "/reports/electricity"},
    {label: "تقارير العقود", href: "/reports/contracts"},
    {label: "العقود المنتهية", href: "/reports/expiring-contracts"},
    {label: "تقارير الضرائب", href: "/reports/tax"}, 
    {label: "تقارير الوحدات", href: "/reports/units"},
    {label: "مدفوعات العقد", href: "/reports/contract-payment"},
];

const requestLink = [
    {label: "تقارير الصيانة", href: "/request/maintenance"},
    {label: "تقارير الطلبات", href: "/request/contact"},
    {label: "تقارير الشكاوي", href: "/request/complaint"},
];
export function BasicTabs({reports, settings}) {
    const router = useRouter();
    const currentPath = usePathname();

    const currentIndex = tabLinks.findIndex((tab) => tab.href === currentPath);
    const [value, setValue] = React.useState(
          currentIndex !== -1 ? currentIndex : 0,
    );

    React.useEffect(() => {
        if (currentIndex !== -1) {
            setValue(currentIndex);
        }
    }, [currentIndex]);

    const handleChange = (event, newValue) => {
        setValue(newValue);
        router.push((reports ? reportLink : settings? tabLinks : requestLink)[newValue].href);
    };

    const getScrollButtonDirection = (direction) => {
        return direction === "left" ? "left" : "right";
    };

    return (
          <Box sx={{width: "100%"}}>
              <Box sx={{borderBottom: 1, borderColor: "divider"}}>
                  <Tabs
                        value={value}
                        onChange={handleChange}
                        aria-label="basic tabs"
                        variant="scrollable"
                        scrollButtons
                        allowScrollButtonsMobile
                        sx={{
                            "& .MuiTabs-flexContainer": {
                                justifyContent: "flex-start",
                            },
                        }}
                        ScrollButtonComponent={(props) => (
                              <TabScrollButton
                                    {...props}
                                    direction={getScrollButtonDirection(props.direction)}
                              />
                        )}
                  >
                      {(reports ? reportLink : settings? tabLinks : requestLink).map((tab, index) => (
                            <Tab key={tab.href} label={tab.label} {...a11yProps(index)} />
                      ))}
                  </Tabs>
              </Box>
          </Box>
    );
}
