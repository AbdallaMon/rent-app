"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Avatar,
  Box,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import HouseIcon from "@mui/icons-material/House";
import ApartmentIcon from "@mui/icons-material/Apartment";
import ReceiptIcon from "@mui/icons-material/Receipt";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import BuildIcon from "@mui/icons-material/Build";
import PaymentIcon from "@mui/icons-material/Payment";
import PeopleIcon from "@mui/icons-material/People";
import SettingsIcon from "@mui/icons-material/Settings";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import GroupIcon from "@mui/icons-material/Group";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { alpha } from "@mui/material/styles";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthProvider/AuthProvider";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import {
  BalanceOutlined,
  CreditScoreOutlined,
  DashboardOutlined,
  HolidayVillageOutlined,
  PendingActionsOutlined,
} from "@mui/icons-material";

const drawerWidth = 240;

const navItems = [
  { href: "/", Icon: DashboardOutlined, text: "الرئيسيه", area: "HOME" },
  {
    href: "/follow-up",
    Icon: PendingActionsOutlined,
    text: "متابعة المستحقات",
    area: "FOLLOW_UP",
  },
  {
    href: "/payments",
    Icon: CreditScoreOutlined,
    text: "صفحة الشيكات",
    area: "FOLLOW_UP",
  },
  {
    href: "/properties",
    Icon: HolidayVillageOutlined,
    text: "العقارات",
    area: "PROPERTY",
  },

  { href: "/units", Icon: ApartmentIcon, text: "الوحدات", area: "UNIT" },
  { href: "/rent", Icon: PaymentIcon, text: "عقود الايجار", area: "RENT" },
  { href: "/invoices", Icon: ReceiptIcon, text: "الفواتير", area: "INVOICE" },
  {
    href: "/maintenance",
    Icon: BuildIcon,
    text: "المصروفات والصيانة",
    area: "MAINTENANCE",
  },
  {
    href: "/request",
    Icon: BuildIcon,
    text: "الطلبات والشكاوي",
    area: "MAINTENANCE",
  },

  { href: "/reports", Icon: ReceiptIcon, text: "التقارير", area: "REPORT" },
  { href: "/owners", Icon: PeopleIcon, text: "اصحاب الاملاك", area: "OWNER" },
  { href: "/renters", Icon: GroupIcon, text: "المستأجرين", area: "RENTER" },
  {
    href: "/accounting",
    Icon: AccountBalanceIcon,
    text: "المحاسبة",
    area: "ACCOUNTING",
  },
  {
    href: "/accounting/petty-cash",
    Icon: BalanceOutlined,
    text: "الصندوق الصغير",
    area: "ACCOUNTING",
  },
  {
    href: "/security-deposits",
    Icon: AttachMoneyIcon,
    text: "ودائع التامين",
    area: "SECURITY_DEPOSIT",
  },
  {
    href: "/whatsapp/dashboard",
    Icon: DashboardIcon,
    text: "لوحة تحكم الواتساب",
    area: "WHATSAPP",
  },

  {
    href: "/whatsapp/settings",
    Icon: SettingsIcon,
    text: "إعدادات الواتساب",
    area: "WHATSAPP",
  },

  { href: "/settings", Icon: SettingsIcon, text: "الاعدادات", area: "SETTING" },
];

export default function DashboardNav({ children }) {
  // === no behavior changes ===
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { isLoggedIn, user, setIsLoggedIn, setUser } = useAuth();
  const { setLoading } = useToastContext();
  const router = useRouter();
  const theme = useTheme();

  const handleDrawerToggle = () => setOpen(!open);
  const handleMobileDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = async () => {
    const signout = await handleRequestSubmit(
      {},
      setLoading,
      "auth/signout",
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
        sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, minHeight: "100vh" }}
      >
        {children}
      </Box>
    );
  }

  // === privileges (unchanged) ===
  const userPrivileges = user?.privileges?.reduce((acc, priv) => {
    acc[priv.area] = priv.privilege;
    return acc;
  }, {});
  const filteredNavItems = navItems.filter((item) =>
    user?.privileges?.some(
      (priv) => priv.area === item.area && priv.privilege?.canRead
    )
  );

  // ---- color tokens (from theme you liked) ----
  const selectedBg = alpha(theme.palette.primary.main, 0.12);
  const hoverBg = alpha(theme.palette.primary.main, 0.08);
  const paperBg = theme.palette.background.paper;
  const divider = theme.palette.divider;

  const drawerContent = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ py: 2, px: 2 }}>
        <Avatar
          sx={{
            bgcolor: alpha(theme.palette.primary.main, 0.15),
            color: theme.palette.primary.main,
            width: 36,
            height: 36,
            fontWeight: 600,
          }}
        >
          {(user?.name || "U").slice(0, 2).toUpperCase()}
        </Avatar>
      </Box>

      <Divider />

      <List sx={{ px: 1, py: 1, flex: 1 }}>
        {filteredNavItems.map((item) => {
          const selected = pathname === item.href;
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              onClick={handleMobileDrawerToggle}
              selected={selected}
              sx={{
                borderRadius: theme.shape.borderRadius * 1.5, // button shape you liked
                mb: 0.5,
                px: 1.25,
                "&.Mui-selected": {
                  backgroundColor: selectedBg,
                  "&:hover": { backgroundColor: selectedBg },
                },
                "&:hover": { backgroundColor: hoverBg },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 40,
                  color: selected
                    ? theme.palette.primary.main
                    : theme.palette.text.secondary,
                }}
              >
                <item.Icon />
              </ListItemIcon>

              {(open || mobileOpen) && (
                <ListItemText
                  primary={
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: selected ? 700 : 500,
                        color: selected
                          ? theme.palette.text.primary
                          : theme.palette.text.secondary,
                      }}
                    >
                      {item.text}
                    </Typography>
                  }
                />
              )}
            </ListItemButton>
          );
        })}
      </List>

      <Divider />

      <List sx={{ px: 1, py: 1 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: theme.shape.borderRadius * 1.5,
            "&:hover": { backgroundColor: hoverBg },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: theme.palette.error.main }}>
            <SettingsIcon />
          </ListItemIcon>
          {(open || mobileOpen) && (
            <ListItemText
              primary="تسجيل الخروج"
              primaryTypographyProps={{
                sx: { color: "error.main", fontWeight: 600 },
              }}
            />
          )}
        </ListItemButton>
      </List>
    </Box>
  );

  // keep your exact layout math
  const currentLgSidebarWidth = open ? drawerWidth : 60;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", lg: "row" },
        overflow: "auto",
        height: "100vh",
      }}
    >
      <Box sx={{ display: { xs: "block", lg: "none" } }}>
        <AppBar
          color="inherit"
          elevation={0}
          position="sticky"
          sx={{
            borderBottom: `1px solid ${divider}`,
            bgcolor: paperBg,
          }}
        >
          <Toolbar
            sx={{
              gap: 1,
              borderBottom: `1px solid ${divider}`,
              bgcolor: paperBg,
            }}
          >
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleMobileDrawerToggle}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              لوحة التحكم
            </Typography>
          </Toolbar>
        </AppBar>
      </Box>

      {/* Mobile temporary drawer */}
      <Box sx={{ display: { xs: "block", lg: "none" } }}>
        <Drawer
          variant="temporary"
          anchor="left"
          open={mobileOpen}
          onClose={handleMobileDrawerToggle}
          ModalProps={{ keepMounted: true }}
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
      </Box>

      {/* Permanent drawer on lg+ (always visible) */}
      <Box sx={{ display: { xs: "none", lg: "block" } }}>
        <Drawer
          variant="permanent"
          open={open}
          sx={{
            width: currentLgSidebarWidth,
            flexShrink: 0,
            position: "relative",
            "& .MuiDrawer-paper": {
              width: currentLgSidebarWidth,
              boxSizing: "border-box",
              overflowX: "hidden",
              transition: (t) =>
                t.transitions.create("width", {
                  easing: t.transitions.easing.sharp,
                  duration: t.transitions.duration.enteringScreen,
                }),
              borderRight: `1px solid ${divider}`,
            },
          }}
        >
          {/* your toggle button (unchanged) */}
          <Box
            sx={{
              position: "fixed",
              top: 12,
              left: open ? currentLgSidebarWidth + 10 : 75,
              zIndex: (t) => t.zIndex.drawer + 1,
            }}
          >
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
            >
              {open ? <ChevronLeftIcon /> : <MenuIcon />}
            </IconButton>
          </Box>

          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          transition: (t) =>
            t.transitions.create(["margin-left", "width"], {
              easing: t.transitions.easing.sharp,
              duration: t.transitions.duration.leavingScreen,
            }),
          ml: { lg: `0px`, xs: "0px" },
          width: { lg: `calc(100% - ${currentLgSidebarWidth}px)`, xs: "100%" },
          bgcolor: theme.palette.background.default,
          overflow: "auto",
          pb: 4,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
