// file: src/app/maintenance/page.jsx
"use client";

import { useEffect, useMemo, useCallback } from "react";
import { Box, Tabs, Tab, Paper } from "@mui/material";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { FiTool, FiFileText } from "react-icons/fi";
import NormalMaintenance from "@/components/maintenance/NormalMaintenance";
import MaintenanceContracts from "@/components/maintenance/MaintenanceContracts";
import TableFormProvider from "@/app/context/TableFormProvider/TableFormProvider";

const TAB_KEYS = ["normal", "contract"];
const DEFAULT_TAB = "normal";

export default function MaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  // Read tab from URL; fallback to DEFAULT_TAB if invalid/missing
  const currentTab = useMemo(() => {
    const t = searchParams.get("tab");
    return TAB_KEYS.includes(t) ? t : DEFAULT_TAB;
  }, [searchParams]);

  // Ensure URL always has a valid ?tab= on first load / bad value
  useEffect(() => {
    if (
      !searchParams.get("tab") ||
      !TAB_KEYS.includes(searchParams.get("tab"))
    ) {
      const params = new URLSearchParams(searchParams);
      params.set("tab", DEFAULT_TAB);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTabInUrl = useCallback(
    (nextTab) => {
      const params = new URLSearchParams(searchParams);
      params.set("tab", nextTab);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const handleTabChange = (_e, newValue) => {
    setTabInUrl(newValue);
  };

  return (
    <TableFormProvider url={"fast-handler"}>
      <Box>
        <Paper
          elevation={1}
          sx={{
            mb: 3,
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant="fullWidth"
            textColor="primary"
            indicatorColor="primary"
            sx={{
              "& .MuiTab-root": {
                py: 1.5,
                minHeight: 0,
                fontWeight: 500,
                gap: 1,
                // subtle bg for hover
                "&:hover": { bgcolor: "action.hover" },
              },
              "& .Mui-selected": {
                bgcolor: "action.selected",
                borderBottom: "2px solid",
                borderColor: "primary.main",
              },
              "& .MuiTabs-indicator": {
                height: 0, // we’re styling the selected tab instead
              },
            }}
          >
            <Tab
              icon={<FiTool size={18} />}
              iconPosition="start"
              label="المصروفات"
              value="normal"
              disableRipple
            />
            <Tab
              icon={<FiFileText size={18} />}
              iconPosition="start"
              label="عقود الصيانة"
              value="contract"
              disableRipple
            />
          </Tabs>
        </Paper>

        <Box>
          {currentTab === "normal" ? (
            <NormalMaintenance />
          ) : (
            <MaintenanceContracts />
          )}
        </Box>
      </Box>
    </TableFormProvider>
  );
}
