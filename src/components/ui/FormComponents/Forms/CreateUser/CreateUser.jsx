"use client";
import { useEffect, useMemo } from "react";
import {
  Box,
  Button,
  Checkbox,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Divider,
} from "@mui/material";
import { useTableForm } from "@/app/context/TableFormProvider/TableFormProvider";

// ثابت العرض (بدون تغيير)
const PrivilegeArea = {
  HOME: "الرئيسية",
  FOLLOW_UP: "متابعة المستحقات",
  PROPERTY: "العقارات",
  UNIT: "الوحدات",
  RENT: "عقود الايجار",
  INVOICE: "الفواتير",
  MAINTENANCE: "الصيانه",
  REQUEST: "الطلبات",
  REPORT: "التقارير",
  OWNER: "الملاك",
  RENTER: "المستاجرين",
  SETTING: "الاعدادات",
  WHATSAPP: "واتساب",
  ACCOUNTING: "المحاسبة",
  SECURITY_DEPOSIT: "ودائع التأمين",
};

function UserFields({
  id,
  name,
  setName,
  email,
  setEmail,
  password,
  setPassword,
  role,
  setRole,
}) {
  return (
    <>
      <TextField
        label="اسم المستخدم"
        fullWidth
        value={name}
        onChange={(e) => setName(e.target.value)}
        margin="normal"
      />
      <TextField
        label="البريد الإلكتروني"
        fullWidth
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        margin="normal"
      />
      {!id && (
        <TextField
          label="كلمة المرور"
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          margin="normal"
        />
      )}
      <FormControl fullWidth margin="normal">
        <InputLabel>الدور</InputLabel>
        <Select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          label="الدور"
        >
          <MenuItem value="ADMIN">مسؤول</MenuItem>
          <MenuItem value="USER">مستخدم</MenuItem>
        </Select>
      </FormControl>
    </>
  );
}

function PrivilegeRow({ area, label, privileges, onChange, onSelectAll }) {
  const areaPriv = privileges[area] || {};
  return (
    <Grid
      container
      spacing={2}
      sx={{ borderBottom: 1, borderColor: "divider", pb: 2, mb: 1 }}
      key={area}
    >
      <Grid size={12}>
        <Box display="flex" gap={2} alignItems="center" mt={2}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {label}
          </Typography>
          <Button
            variant="text"
            color="secondary"
            onClick={() => onSelectAll(area)}
          >
            تحديد الكل
          </Button>
        </Box>
      </Grid>

      <Grid size={{ xs: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={!!areaPriv.canRead}
              onChange={(e) => onChange(area, "canRead", e.target.checked)}
            />
          }
          label="قراءة"
        />
      </Grid>

      <Grid size={{ xs: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={!!areaPriv.canWrite}
              onChange={(e) => onChange(area, "canWrite", e.target.checked)}
            />
          }
          label="انشاء"
        />
      </Grid>

      <Grid size={{ xs: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={!!areaPriv.canEdit}
              onChange={(e) => onChange(area, "canEdit", e.target.checked)}
            />
          }
          label="تعديل"
        />
      </Grid>

      <Grid size={{ xs: 3 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={!!areaPriv.canDelete}
              onChange={(e) => onChange(area, "canDelete", e.target.checked)}
            />
          }
          label="حذف"
        />
      </Grid>
    </Grid>
  );
}

function PrivilegesGrid({ privileges, setPrivileges }) {
  const entries = useMemo(() => Object.entries(PrivilegeArea), []);

  const handlePrivilegeChange = (area, field, value) => {
    setPrivileges((prev) => {
      const updated = { ...prev };
      if (!updated[area]) {
        updated[area] = {
          area,
          name: area,
          canRead: false,
          canWrite: false,
          canEdit: false,
          canDelete: false,
        };
      }
      updated[area][field] = value;
      // تأكيد area و name
      updated[area].area = area;
      updated[area].name = area;
      return updated;
    });
  };

  const handleSelectAll = (area) => {
    setPrivileges((prev) => ({
      ...prev,
      [area]: {
        canRead: true,
        canWrite: true,
        canEdit: true,
        canDelete: true,
        area,
        name: area,
      },
    }));
  };

  return (
    <>
      <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
        الامتيازات
      </Typography>
      <Divider sx={{ mb: 1 }} />
      {entries.map(([area, label]) => (
        <PrivilegeRow
          key={area}
          area={area}
          label={label}
          privileges={privileges}
          onChange={handlePrivilegeChange}
          onSelectAll={handleSelectAll}
        />
      ))}
    </>
  );
}

/* ------------------------- المكوّن الرئيسي (نفس السلوك) ------------------------- */

const CreateUserForm = (props) => {
  const {
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    role,
    setRole,
    privileges,
    setPrivileges,
    data,
  } = props;

  const { id } = useTableForm();

  useEffect(() => {
    if (data && id) {
      const user = data.find((u) => u.id === id);
      if (user) {
        setName(user.name);
        setEmail(user.email);
        setRole(user.role);
        setPassword(user.password);

        const userPrivileges =
          user.privileges?.reduce((acc, priv) => {
            acc[priv.area] = {
              ...priv.privilege,
              area: priv.area,
              name: priv.area,
            };
            return acc;
          }, {}) || {};

        setPrivileges(userPrivileges);
      }
    } else {
      setEmail("");
      setName("");
      setPassword("");
      setRole("USER");

      const initialPrivileges = {};
      Object.keys(PrivilegeArea).forEach((area) => {
        initialPrivileges[area] = {
          area,
          name: area,
          canRead: true,
          canWrite: false,
          canEdit: false,
          canDelete: false,
        };
      });
      setPrivileges(initialPrivileges);
    }
  }, [data, id, setName, setEmail, setRole, setPassword, setPrivileges]);

  return (
    <Container>
      <UserFields
        id={id}
        name={name}
        setName={setName}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        role={role}
        setRole={setRole}
      />

      <PrivilegesGrid privileges={privileges} setPrivileges={setPrivileges} />
    </Container>
  );
};

export default CreateUserForm;
