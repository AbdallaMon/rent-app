import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
  Paper,
  Stack,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useTableForm } from "@/app/context/TableFormProvider/TableFormProvider";

function createEmptyItem(fields) {
  const base = { uniqueId: `${Date.now()}-${Math.random()}` };
  fields.forEach((f) => (base[f.id] = ""));
  return base;
}

export const ExtraForm = ({
  items,
  setItems,
  title,
  fields,
  isEditing,
  setIsEditing,
  snackbarOpen,
  setSnackbarOpen,
  snackbarMessage,
  setSnackbarMessage,
  name,
  formTitle,
  editPage = false,
  resetNames = [],
}) => {
  const { openModal } = useTableForm();

  useEffect(() => {
    if (!isEditing[name]) {
      setIsEditing({ ...isEditing, [name]: items?.map(() => false) || [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!openModal && !editPage) {
      setItems([]);
      setIsEditing({ ...isEditing, [name]: [] });
    } else {
      setIsEditing({ ...isEditing, [name]: items.map(() => false) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openModal]);

  useEffect(() => {
    if (!items || items.length < 1) {
      if (resetNames.length > 0) {
        const next = { ...isEditing };
        resetNames.forEach((rn) => (next[rn] = []));
        setIsEditing(next);
      } else {
        setIsEditing({ ...isEditing, [name]: [] });
      }
    } else {
      const arr = isEditing[name] || [];
      if (arr.length !== items.length) {
        setIsEditing({
          ...isEditing,
          [name]: items.map((_, i) => arr[i] ?? false),
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleAddItem = () => {
    const empty = createEmptyItem(fields);
    setItems((prev) => [...prev, empty]);
    setIsEditing({ ...isEditing, [name]: [...(isEditing[name] || []), true] });
  };

  const handleRemoveItem = (idx) => {
    const newItems = items.filter((_, i) => i !== idx);
    setItems(newItems);
    const newEdits = (isEditing[name] || []).filter((_, i) => i !== idx);
    setIsEditing({ ...isEditing, [name]: newEdits });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen({ ...snackbarOpen, [name]: false });
  };

  const handleSnackbarOpen = (message = "يجب ملء جميع الحقول") => {
    setSnackbarOpen({ ...snackbarOpen, [name]: true });
    setSnackbarMessage({ ...snackbarMessage, [name]: message });
  };

  return (
    <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        {formTitle}
      </Typography>

      <Stack direction="column" spacing={1.5} sx={{ mb: 2 }}>
        {items?.map((item, idx) => (
          <FormField
            key={item.id ?? item.uniqueId ?? `${name}-${idx}`}
            fields={fields}
            setIsEditing={setIsEditing}
            setItems={setItems}
            handleRemoveItem={handleRemoveItem}
            index={idx}
            handleSnackbarOpen={handleSnackbarOpen}
            isEditing={isEditing}
            items={items}
            name={name}
          />
        ))}
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Button onClick={handleAddItem} variant="contained">
        إضافة {title}
      </Button>

      <Snackbar
        open={Boolean(snackbarOpen?.[name])}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity="warning"
          variant="filled"
        >
          {snackbarMessage?.[name]}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

function FormField({
  fields,
  setIsEditing,
  setItems,
  handleRemoveItem,
  index,
  name,
  handleSnackbarOpen,
  isEditing,
  items,
}) {
  const initial = useMemo(() => items[index], [items, index]);
  const [value, setValue] = useState(initial);

  useEffect(() => {
    setValue(items[index]);
  }, [items, index]);

  const saved = Boolean(isEditing?.[name]?.[index] === false);

  function handleItemChange(key, val) {
    setValue((prev) => ({ ...prev, [key]: val }));
  }

  function handleSaveItems() {
    const requiredIds = fields.map((f) => f.id);
    const allFilled = requiredIds.every((fid) => {
      const v = value[fid];
      return v !== "" && v !== null && v !== undefined;
    });

    if (!allFilled) {
      handleSnackbarOpen();
      return;
    }

    const newItems = [...items];
    newItems[index] = value;
    setItems(newItems);

    setIsEditing({
      ...isEditing,
      [name]: (isEditing[name] || []).map((flag, i) =>
        i === index ? false : flag
      ),
    });
  }

  function handleEdit() {
    setIsEditing({
      ...isEditing,
      [name]: (isEditing[name] || []).map((flag, i) =>
        i === index ? true : flag
      ),
    });
  }

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
      }}
    >
      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", flex: 1 }}>
        {fields.map((field) => {
          if (field.type === "select") {
            const labelId = `${name}-${field.id}-label-${index}`;
            return (
              <FormControl key={field.id} sx={{ minWidth: 160 }}>
                <InputLabel id={labelId}>{field.label}</InputLabel>
                <Select
                  labelId={labelId}
                  label={field.label}
                  value={value[field.id] ?? ""}
                  onChange={(e) => handleItemChange(field.id, e.target.value)}
                  disabled={saved}
                >
                  {(field.options || []).map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            );
          }

          return (
            <TextField
              key={field.id}
              label={field.label}
              variant="outlined"
              value={value[field.id] ?? ""}
              type={field.type}
              onChange={(e) => handleItemChange(field.id, e.target.value)}
              disabled={saved}
              sx={{ minWidth: 160 }}
            />
          );
        })}
      </Stack>

      <Stack direction="row" spacing={1}>
        <Button
          onClick={saved ? handleEdit : handleSaveItems}
          variant="contained"
          color="primary"
        >
          {saved ? "تعديل" : "حفظ"}
        </Button>

        <IconButton onClick={() => handleRemoveItem(index)} color="secondary">
          <DeleteIcon />
        </IconButton>
      </Stack>
    </Paper>
  );
}
