"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";

// MUI
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Tabs,
  Tab,
  Grid,
  TextField,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Switch,
  Stack,
  IconButton,
  Tooltip,
  InputAdornment,
  Chip,
} from "@mui/material";
import { useTheme, styled } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

// React Icons
import {
  FiSettings,
  FiClock,
  FiUsers,
  FiBell,
  FiSave,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertTriangle,
  FiUser,
  FiHeadphones,
  FiPlus,
  FiX,
  FiInfo,
} from "react-icons/fi";
import { useToastContext } from "@/app/context/ToastLoading/ToastLoadingProvider";
import { handleRequestSubmit } from "@/helpers/functions/handleRequestSubmit";
import { getDataAndSet } from "../../../helpers/functions/getDataAndSet";

/* ---------- Helpers ---------- */
function a11yProps(index) {
  return {
    id: `settings-tab-${index}`,
    "aria-controls": `settings-tabpanel-${index}`,
  };
}

function TabPanel({ children, value, index }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const SectionCard = ({ icon, title, children, sx }) => {
  const theme = useTheme();
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        ...sx,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2 }}>
        <Box sx={{ display: "grid", placeItems: "center" }}>{icon}</Box>
        <Typography variant="subtitle1" fontWeight={700}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
};

/** محرر أيام التذكيرات كـ Chips + إدخال سريع */
const DaysChipsEditor = ({
  label,
  value = [],
  onChange,
  helperText,
  adornmentLabel = "يوم",
}) => {
  const [input, setInput] = useState("");

  const addDay = useCallback(() => {
    const n = parseInt(String(input).trim(), 10);
    if (!Number.isFinite(n) || n <= 0) return;
    const next = Array.from(new Set([...value, n])).sort((a, b) => a - b);
    onChange(next);
    setInput("");
  }, [input, value, onChange]);

  const removeDay = (day) => {
    onChange(value.filter((d) => d !== day));
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addDay();
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        label={label}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="اكتب رقم اليوم ثم Enter"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">{adornmentLabel}</InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Tooltip title="إضافة">
                <span>
                  <IconButton size="small" onClick={addDay} disabled={!input}>
                    <FiPlus />
                  </IconButton>
                </span>
              </Tooltip>
            </InputAdornment>
          ),
        }}
        helperText={helperText}
      />
      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
        {value.map((d) => (
          <Chip
            key={d}
            label={`${d}`}
            onDelete={() => removeDay(d)}
            deleteIcon={<FiX />}
            sx={{ mb: 1 }}
          />
        ))}
      </Stack>
    </Box>
  );
};

const SaveBar = ({ saving, disabled, onClick, tooltipTitle }) => {
  return (
    <Tooltip
      title={disabled && tooltipTitle ? tooltipTitle : ""}
      placement="bottom"
      arrow
      disableHoverListener={!disabled}
    >
      <span>
        <Button
          variant="contained"
          loading={saving}
          loadingPosition="start"
          startIcon={saving ? <FiRefreshCw /> : <FiSave />}
          onClick={onClick}
          disabled={disabled}
          sx={{ minWidth: 180, borderRadius: 2 }}
        >
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </Button>
      </span>
    </Tooltip>
  );
};

/* ---------- Page ---------- */
export default function SettingsPage() {
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const { loading: saving, setLoading: setSaving } = useToastContext();
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  // إعدادات التذكيرات
  const [reminderSettings, setReminderSettings] = useState({
    paymentReminderDays: [7, 3, 1],
    contractReminderDays: [60, 30, 15, 7],
    maintenanceFollowupDays: [3, 7, 14],
    maxRetries: 3,
    messageDelay: 2000,
    enableAutoReminders: true,
    workingHoursStart: "09:00",
    workingHoursEnd: "18:00",
    workingDays: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    enabledReminderTypes: ["payment_reminder", "contract_expiry_reminder"],
    highPriorityThreshold: 3,
    mediumPriorityThreshold: 7,
    defaultLanguage: "ar_AE",
    includeCompanySignature: true,
    isActive: true,
  });

  // إعدادات فريق العمل
  const [teamSettings, setTeamSettings] = useState({
    technicianPhone: "",
    technicianName: "",
    notifyTechnicianForMaintenance: true,
    technicianWorkingHours: "من 8:00 صباحاً إلى 5:00 مساءً",
    customerServicePhone: "",
    customerServiceName: "",
    notifyCustomerServiceForComplaints: true,
    notifyCustomerServiceForContacts: true,
    customerServiceWorkingHours: "من 9:00 صباحاً إلى 6:00 مساءً",
    maxDailyNotifications: 10,
    notificationDelay: 5,
    enableUrgentNotifications: true,
    enableBackupNotifications: false,
    customNotificationMessage: "",
  });

  /* ---- effects ---- */
  useEffect(() => {
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSettings = async () => {
    const response = await getDataAndSet({
      setLoading,
      setData: () => {},
      url: `whatsapp/v2/settings`,
    });
    if (response.status === 200) {
      const data = response;
      if (data.reminderSettings)
        setReminderSettings((prev) => ({
          ...prev,
          ...data.reminderSettings,
        }));
      if (data.teamSettings)
        setTeamSettings((prev) => ({ ...prev, ...data.teamSettings }));
    } else {
      throw new Error("Failed to fetch settings");
    }
  };

  const saveSettings = async () => {
    await handleRequestSubmit(
      { reminderSettings, teamSettings },
      setSaving,
      "/whatsapp/v2/settings",
      false,
      "جاري حفظ الإعدادات..."
    );
  };

  const handleCloseSnack = () =>
    setNotification((prev) => ({ ...prev, open: false }));

  const validatePhoneNumber = (phone) =>
    process.env.NEXT_PUBLIC_EG === "true"
      ? /^20\d{10}$/.test(String(phone || "").replace(/\s/g, ""))
      : /^971\d{9}$/.test(String(phone || "").replace(/\s/g, ""));

  const isTechnicianPhoneInvalid =
    teamSettings.technicianPhone &&
    !validatePhoneNumber(teamSettings.technicianPhone);
  const isCSPhoneInvalid =
    teamSettings.customerServicePhone &&
    !validatePhoneNumber(teamSettings.customerServicePhone);

  const updateWorkingDays = (day, checked) => {
    setReminderSettings((prev) => ({
      ...prev,
      workingDays: checked
        ? [...new Set([...prev.workingDays, day])]
        : prev.workingDays.filter((d) => d !== day),
    }));
  };
  const disabledReasons = useMemo(() => {
    const reasons = [];
    if (saving) reasons.push("لا يمكن الحفظ أثناء عملية حفظ سابقة");
    if (isTechnicianPhoneInvalid)
      reasons.push(
        "رقم هاتف الفني غير صالح: يجب أن يبدأ بـ 971 ويتكوّن من 12 رقمًا"
      );
    if (isCSPhoneInvalid)
      reasons.push(
        "رقم هاتف خدمة العملاء غير صالح: يجب أن يبدأ بـ 971 ويتكوّن من 12 رقمًا"
      );
    // لو عندك شروط أخرى لتعطيل الحفظ ضيفها هنا...
    return reasons;
  }, [saving, isTechnicianPhoneInvalid, isCSPhoneInvalid]);

  const saveDisabled = useMemo(
    () => saving || isTechnicianPhoneInvalid || isCSPhoneInvalid,
    [saving, isTechnicianPhoneInvalid, isCSPhoneInvalid]
  );

  const saveDisabledTooltip = disabledReasons.join(" • ");

  /* Loading state */
  if (loading) {
    return (
      <Box
        // dir="ltr"
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          px: 2,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={24} />
          <Typography color="text.secondary">
            جاري تحميل الإعدادات...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      // dir="rtl"
      sx={{ minHeight: "100vh", bgcolor: "background.default", py: 4 }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: isSmDown ? 2 : 3,
            mb: 3,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
            position: "sticky",
            top: 16,
            zIndex: 1,
            backdropFilter: "blur(4px)",
          }}
        >
          <Stack
            direction={isSmDown ? "column" : "row"}
            alignItems={isSmDown ? "flex-start" : "center"}
            justifyContent="space-between"
            spacing={2}
          >
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <FiSettings
                size={28}
                style={{ color: theme.palette.primary.main }}
              />
              <Box>
                <Typography variant={isSmDown ? "h6" : "h5"} fontWeight={700}>
                  إعدادات الواتساب
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="body2" color="text.secondary">
                    إدارة إعدادات التذكيرات وفريق العمل
                  </Typography>
                  <Tooltip title="يتم حفظ الإعدادات في الـ API الخاص بك">
                    <Box
                      sx={{
                        display: "grid",
                        placeItems: "center",
                        color: "text.disabled",
                      }}
                    >
                      <FiInfo />
                    </Box>
                  </Tooltip>
                </Stack>
              </Box>
            </Stack>

            <SaveBar
              saving={saving}
              disabled={saveDisabled}
              onClick={saveSettings}
              tooltipTitle={saveDisabledTooltip}
            />
          </Stack>
        </Paper>

        {/* Snackbar notifications */}
        <Snackbar
          open={notification.open}
          autoHideDuration={3000}
          onClose={handleCloseSnack}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={handleCloseSnack}
            severity={notification.severity}
            variant="filled"
            iconMapping={{
              success: <FiCheckCircle />,
              error: <FiAlertTriangle />,
              warning: <FiAlertTriangle />,
              info: <FiBell />,
            }}
            sx={{ width: "100%" }}
          >
            {notification.message}
          </Alert>
        </Snackbar>

        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{ border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
        >
          <Box
            sx={{
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: "background.paper",
              borderTopLeftRadius: 8,
              borderTopRightRadius: 8,
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              variant="scrollable"
              scrollButtons="auto"
              aria-label="WhatsApp settings tabs"
              sx={{
                "& .MuiTab-root": {
                  gap: 8,
                  alignItems: "center",
                  minHeight: 56,
                },
              }}
            >
              <Tab
                icon={<FiBell />}
                iconPosition="end"
                label="إعدادات التذكيرات"
                {...a11yProps(0)}
              />
              <Tab
                icon={<FiClock />}
                iconPosition="end"
                label="إعدادات النظام"
                {...a11yProps(1)}
              />
              <Tab
                icon={<FiUsers />}
                iconPosition="end"
                label="فريق العمل"
                {...a11yProps(2)}
              />
            </Tabs>
          </Box>

          <Box sx={{ p: isSmDown ? 2 : 3 }}>
            {/* Tab 0: Reminders */}
            <TabPanel value={activeTab} index={0}>
              <Stack spacing={3}>
                <SectionCard
                  icon={<FiBell size={18} color={theme.palette.primary.main} />}
                  title="أيام التذكيرات"
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={4}>
                      <DaysChipsEditor
                        label="تذكيرات الدفع (أيام قبل الاستحقاق)"
                        value={reminderSettings.paymentReminderDays}
                        onChange={(list) =>
                          setReminderSettings((p) => ({
                            ...p,
                            paymentReminderDays: list,
                          }))
                        }
                        helperText="أضف رقم واضغط Enter — مثال: 7, 3, 1"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <DaysChipsEditor
                        label="تذكيرات العقود (أيام قبل انتهاء العقد)"
                        value={reminderSettings.contractReminderDays}
                        onChange={(list) =>
                          setReminderSettings((p) => ({
                            ...p,
                            contractReminderDays: list,
                          }))
                        }
                        helperText="مثال: 60, 30, 15, 7"
                      />
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <DaysChipsEditor
                        label="متابعة الصيانة (أيام بعد الطلب)"
                        value={reminderSettings.maintenanceFollowupDays}
                        onChange={(list) =>
                          setReminderSettings((p) => ({
                            ...p,
                            maintenanceFollowupDays: list,
                          }))
                        }
                        helperText="مثال: 3, 7, 14"
                        adornmentLabel="بعد"
                      />
                    </Grid>
                  </Grid>
                </SectionCard>

                <SectionCard
                  icon={
                    <FiSettings size={18} color={theme.palette.success.main} />
                  }
                  title="خيارات التفعيل"
                >
                  <FormGroup>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={reminderSettings.enableAutoReminders}
                          onChange={(e) =>
                            setReminderSettings((prev) => ({
                              ...prev,
                              enableAutoReminders: e.target.checked,
                            }))
                          }
                        />
                      }
                      label="تفعيل التذكيرات التلقائية"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={reminderSettings.includeCompanySignature}
                          onChange={(e) =>
                            setReminderSettings((prev) => ({
                              ...prev,
                              includeCompanySignature: e.target.checked,
                            }))
                          }
                        />
                      }
                      label="إدراج توقيع الشركة في الرسائل"
                    />
                  </FormGroup>
                </SectionCard>
              </Stack>
            </TabPanel>

            {/* Tab 1: System */}
            <TabPanel value={activeTab} index={1}>
              <Stack spacing={3}>
                <SectionCard
                  icon={
                    <FiClock size={18} color={theme.palette.primary.main} />
                  }
                  title="إعدادات الإرسال"
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        inputProps={{ min: 1, max: 10 }}
                        label="عدد محاولات الإعادة"
                        value={reminderSettings.maxRetries}
                        onChange={(e) =>
                          setReminderSettings((prev) => ({
                            ...prev,
                            maxRetries: parseInt(e.target.value || "0", 10),
                          }))
                        }
                        helperText="عدد المحاولات عند فشل إرسال الرسالة"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        inputProps={{ min: 500, step: 500 }}
                        label="التأخير بين الرسائل (ms)"
                        value={reminderSettings.messageDelay}
                        onChange={(e) =>
                          setReminderSettings((prev) => ({
                            ...prev,
                            messageDelay: parseInt(e.target.value || "0", 10),
                          }))
                        }
                        helperText="موصى به: 2000ms لتجنّب Rate Limiting"
                      />
                    </Grid>
                  </Grid>
                </SectionCard>

                <SectionCard
                  icon={
                    <FiClock size={18} color={theme.palette.warning.main} />
                  }
                  title="ساعات العمل"
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="وقت البداية"
                        value={reminderSettings.workingHoursStart}
                        onChange={(e) =>
                          setReminderSettings((p) => ({
                            ...p,
                            workingHoursStart: e.target.value,
                          }))
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="time"
                        label="وقت النهاية"
                        value={reminderSettings.workingHoursEnd}
                        onChange={(e) =>
                          setReminderSettings((p) => ({
                            ...p,
                            workingHoursEnd: e.target.value,
                          }))
                        }
                        InputLabelProps={{ shrink: true }}
                      />
                    </Grid>
                  </Grid>
                </SectionCard>

                <SectionCard
                  icon={<FiUsers size={18} color={theme.palette.info.main} />}
                  title="أيام العمل"
                >
                  <Grid container spacing={1}>
                    {[
                      { key: "Sunday", label: "الأحد" },
                      { key: "Monday", label: "الاثنين" },
                      { key: "Tuesday", label: "الثلاثاء" },
                      { key: "Wednesday", label: "الأربعاء" },
                      { key: "Thursday", label: "الخميس" },
                      { key: "Friday", label: "الجمعة" },
                      { key: "Saturday", label: "السبت" },
                    ].map((day) => (
                      <Grid item xs={6} md={3} key={day.key}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={reminderSettings.workingDays.includes(
                                day.key
                              )}
                              onChange={(e) =>
                                updateWorkingDays(day.key, e.target.checked)
                              }
                            />
                          }
                          label={day.label}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </SectionCard>
              </Stack>
            </TabPanel>

            {/* Tab 2: Team */}
            <TabPanel value={activeTab} index={2}>
              <Stack spacing={3}>
                <SectionCard
                  icon={<FiUser size={18} color={theme.palette.primary.main} />}
                  title="إعدادات الفني"
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="رقم هاتف الفني"
                        type="tel"
                        value={teamSettings.technicianPhone}
                        onChange={(e) =>
                          setTeamSettings((p) => ({
                            ...p,
                            technicianPhone: e.target.value,
                          }))
                        }
                        error={isTechnicianPhoneInvalid}
                        helperText={
                          isTechnicianPhoneInvalid
                            ? "يجب أن يبدأ الرقم بـ 971 ويتكون من 12 رقماً"
                            : " "
                        }
                        placeholder="971501234567"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">+</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="اسم الفني"
                        value={teamSettings.technicianName}
                        onChange={(e) =>
                          setTeamSettings((p) => ({
                            ...p,
                            technicianName: e.target.value,
                          }))
                        }
                        placeholder="أدخل اسم الفني"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="ساعات عمل الفني"
                        value={teamSettings.technicianWorkingHours}
                        onChange={(e) =>
                          setTeamSettings((p) => ({
                            ...p,
                            technicianWorkingHours: e.target.value,
                          }))
                        }
                        placeholder="من 8:00 صباحاً إلى 5:00 مساءً"
                      />
                    </Grid>
                    <Grid
                      item
                      xs={12}
                      md={6}
                      display="flex"
                      alignItems="center"
                    >
                      <FormControlLabel
                        control={
                          <Switch
                            checked={
                              teamSettings.notifyTechnicianForMaintenance
                            }
                            onChange={(e) =>
                              setTeamSettings((p) => ({
                                ...p,
                                notifyTechnicianForMaintenance:
                                  e.target.checked,
                              }))
                            }
                          />
                        }
                        label="إرسال تنبيهات الصيانة للفني"
                      />
                    </Grid>
                  </Grid>
                </SectionCard>

                <SectionCard
                  icon={
                    <FiHeadphones
                      size={18}
                      color={theme.palette.success.main}
                    />
                  }
                  title="إعدادات خدمة العملاء"
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="رقم هاتف خدمة العملاء"
                        type="tel"
                        value={teamSettings.customerServicePhone}
                        onChange={(e) =>
                          setTeamSettings((p) => ({
                            ...p,
                            customerServicePhone: e.target.value,
                          }))
                        }
                        error={isCSPhoneInvalid}
                        helperText={
                          isCSPhoneInvalid
                            ? "يجب أن يبدأ الرقم بـ 971 ويتكون من 12 رقماً"
                            : " "
                        }
                        placeholder="971501234567"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">+</InputAdornment>
                          ),
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="اسم خدمة العملاء"
                        value={teamSettings.customerServiceName}
                        onChange={(e) =>
                          setTeamSettings((p) => ({
                            ...p,
                            customerServiceName: e.target.value,
                          }))
                        }
                        placeholder="أدخل اسم خدمة العملاء"
                      />
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        label="ساعات عمل خدمة العملاء"
                        value={teamSettings.customerServiceWorkingHours}
                        onChange={(e) =>
                          setTeamSettings((p) => ({
                            ...p,
                            customerServiceWorkingHours: e.target.value,
                          }))
                        }
                        placeholder="من 9:00 صباحاً إلى 6:00 مساءً"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={
                                teamSettings.notifyCustomerServiceForComplaints
                              }
                              onChange={(e) =>
                                setTeamSettings((p) => ({
                                  ...p,
                                  notifyCustomerServiceForComplaints:
                                    e.target.checked,
                                }))
                              }
                            />
                          }
                          label="إرسال تنبيهات الشكاوى"
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={
                                teamSettings.notifyCustomerServiceForContacts
                              }
                              onChange={(e) =>
                                setTeamSettings((p) => ({
                                  ...p,
                                  notifyCustomerServiceForContacts:
                                    e.target.checked,
                                }))
                              }
                            />
                          }
                          label="إرسال تنبيهات التواصل"
                        />
                      </FormGroup>
                    </Grid>
                  </Grid>
                </SectionCard>

                <SectionCard
                  icon={<FiBell size={18} color={theme.palette.warning.main} />}
                  title="إعدادات التنبيهات"
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        inputProps={{ min: 1, max: 50 }}
                        label="الحد الأقصى للتنبيهات اليومية"
                        value={teamSettings.maxDailyNotifications}
                        onChange={(e) =>
                          setTeamSettings((p) => ({
                            ...p,
                            maxDailyNotifications: parseInt(
                              e.target.value || "0",
                              10
                            ),
                          }))
                        }
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <TextField
                        fullWidth
                        type="number"
                        inputProps={{ min: 1, max: 60 }}
                        label="تأخير التنبيهات (بالدقائق)"
                        value={teamSettings.notificationDelay}
                        onChange={(e) =>
                          setTeamSettings((p) => ({
                            ...p,
                            notificationDelay: parseInt(
                              e.target.value || "0",
                              10
                            ),
                          }))
                        }
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={teamSettings.enableUrgentNotifications}
                            onChange={(e) =>
                              setTeamSettings((p) => ({
                                ...p,
                                enableUrgentNotifications: e.target.checked,
                              }))
                            }
                          />
                        }
                        label="تفعيل التنبيهات العاجلة"
                      />
                    </Grid>

                    <Grid item xs={12} md={6}>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={teamSettings.enableBackupNotifications}
                            onChange={(e) =>
                              setTeamSettings((p) => ({
                                ...p,
                                enableBackupNotifications: e.target.checked,
                              }))
                            }
                          />
                        }
                        label="تفعيل التنبيهات الاحتياطية"
                      />
                    </Grid>
                  </Grid>
                </SectionCard>
              </Stack>
            </TabPanel>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
