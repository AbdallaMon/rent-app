"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Box,
  Drawer,
  Hidden,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import HouseIcon from "@mui/icons-material/House";
import ApartmentIcon from "@mui/icons-material/Apartment";
import ReceiptIcon from "@mui/icons-material/Receipt";
import BuildIcon from "@mui/icons-material/Build";
import PaymentIcon from "@mui/icons-material/Payment";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import GroupIcon from "@mui/icons-material/Group";
import MessageIcon from "@mui/icons-material/Message";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ApiIcon from "@mui/icons-material/Api";
import NotificationsIcon from "@mui/icons-material/Notifications";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import BarChartIcon from "@mui/icons-material/BarChart";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthProvider/AuthProvider";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";

const drawerWidth = 240;

const navItems = [
  { href: "/", Icon: HomeIcon, text: "الرئيسيه", area: "HOME" },
  {
    href: "/follow-up",
    Icon: HomeIcon,
    text: "متابعة المستحقات",
    area: "FOLLOW_UP",
  },
  { href: "/properties", Icon: HouseIcon, text: "العقارات", area: "PROPERTY" },
  { href: "/units", Icon: ApartmentIcon, text: "الوحدات", area: "UNIT" },
  { href: "/rent", Icon: PaymentIcon, text: "عقود الايجار", area: "RENT" },
  { href: "/invoices", Icon: ReceiptIcon, text: "الفواتير", area: "INVOICE" },
  {
    href: "/maintenance",
    Icon: BuildIcon,
    text: "الصيانه",
    area: "MAINTENANCE",
  },    // نظام الواتساب الموحد - محدث ومنظم
  {
    href: "/whatsapp/dashboard",
    Icon: DashboardIcon,
    text: "لوحة تحكم الواتساب",
    area: "WHATSAPP"
  },
  {
    href: "/whatsapp/reminders",
    Icon: NotificationsIcon,
    text: "إدارة التذكيرات",
    area: "WHATSAPP"
  },
  {
    href: "/whatsapp/settings",
    Icon: SettingsIcon,
    text: "إعدادات الواتساب",
    area: "WHATSAPP"
  },
  {
    href: "/whatsapp/analytics",
    Icon: BarChartIcon,
    text: "تحليلات الواتساب",
    area: "WHATSAPP"
  },
  
  {
    href: "/request",
    Icon: BuildIcon,
    text: "طلبات الصيانة",
    area: "MAINTENANCE",
  },  { href: "/reports", Icon: ReceiptIcon, text: "التقارير", area: "REPORT" },
  { href: "/reports/expiring-contracts", Icon: BarChartIcon, text: "العقود المنتهية", area: "REPORT" },
  { href: "/owners", Icon: PeopleIcon, text: "اصحاب الاملاك", area: "OWNER" },
  { href: "/renters", Icon: GroupIcon, text: "المستأجرين", area: "RENTER" },
  { href: "/settings", Icon: SettingsIcon, text: "الاعدادات", area: "SETTING" },
];

export default function DashboardNav({ children }) {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isLoggedIn, user, setIsLoggedIn, setUser } = useAuth();
  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMobileDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  const { setLoading } = useToastContext();
  const router = useRouter();
  const handleLogout = async () => {
    const signout = await handleRequestSubmit(
      {},
      setLoading,
      `auth/signout`,
      false,
      "جاري تسجيل الخروج"
    );
    if (signout?.status === 200) {
      router.push("/login");
      setIsLoggedIn(false);
      setUser({});
    }
  };

  if (!isLoggedIn) {
    return (
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: {
            xs: 2,
            sm: 3,
          },
          minHeight: "100vh",
        }}
      >
        {children}
      </Box>
    );
  }

  const userPrivileges = user?.privileges?.reduce((acc, priv) => {
    acc[priv.area] = priv.privilege;
    return acc;
  }, {});  const filteredNavItems = navItems.filter((item) => {
    // Check if user has any privilege in this area with read access
    const hasAccess = user?.privileges?.some(priv => 
      priv.area === item.area && priv.privilege?.canRead
    );
    return hasAccess;
  });
  const drawerContent = (
    <Box>
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" align="center">
          {user?.name}
        </Typography>
      </Box>
      <List>
        {filteredNavItems.map((item) => (
          <Link
            href={item.href}
            passHref
            key={item.href}
            onClick={() => handleMobileDrawerToggle()}
          >
            <ListItem
              button
              sx={{
                backgroundColor: pathname === item.href ? "#efefef" : "inherit",
                "&:hover": {
                  backgroundColor: "#f5f5f5",
                }
              }}
            >
              <ListItemIcon>
                <item.Icon />
              </ListItemIcon>
              {(open || mobileOpen) && (
                <ListItemText 
                  primary={item.text}
                  secondary={item.description && (
                    <Typography 
                      variant="caption" 
                      sx={{
                        color: "text.secondary",
                        fontSize: '11px',
                        fontStyle: 'italic'
                      }}
                    >
                      {item.description}
                    </Typography>
                  )}
                />
              )}
            </ListItem>
          </Link>
        ))}
        
        {/* زر تسجيل الخروج */}
        <ListItem button onClick={handleLogout} sx={{ mt: 2, borderTop: '1px solid #eee' }}>
          <ListItemIcon>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="تسجيل الخروج" />
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" } }}>
      <Hidden lgUp>
        <Box
          sx={{
            display: { xs: "flex", lg: "none" },
            width: "100%",
            justifyContent: "between",
            padding: 1,
            px: 2,
          }}
        >
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleMobileDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        </Box>
      </Hidden>
      <Hidden lgUp>
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleMobileDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", lg: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Hidden>
      <Hidden lgDown>
        <Drawer
          variant="permanent"
          sx={{
            width: open ? drawerWidth : 60,
            flexShrink: 0,
            transition: "width 0.3s",
            position: "relative",
            [`& .MuiDrawer-paper`]: {
              width: open ? drawerWidth : 60,
              transition: "width 0.3s",
              boxSizing: "border-box",
              overflowX: "hidden",
            },
          }}
          open={open}
        >
          <Hidden lgDown>
            <Box
              sx={{
                position: open ? "fixed" : "fixed",
                top: 16,
                zIndex: 1300,
                left: open ? drawerWidth + 10 : 75,
              }}
            >
              <IconButton
                color="inherit"
                aria-label="open drawer"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 2 }}
              >
                {open ? <ChevronLeftIcon /> : <MenuIcon />}
              </IconButton>
            </Box>
          </Hidden>
          {drawerContent}
        </Drawer>
      </Hidden>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: "margin-left 0.3s",
          ml: { lg: open ? `60px` : "60px", xs: "0px" },
          width: { lg: open ? `calc(100% - 300px)` : "100%" },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
