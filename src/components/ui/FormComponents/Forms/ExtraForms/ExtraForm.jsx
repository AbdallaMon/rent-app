import React, {useEffect, useState} from "react";
import {
  Alert,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import {useTableForm} from "@/app/context/TableFormProvider/TableFormProvider";

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
    const {openModal} = useTableForm();
    useEffect(() => {
        if (!openModal && !editPage) {
            setItems([]);
            setIsEditing({...isEditing, [name]: []});
        } else {
            setIsEditing({
                ...isEditing,
                [name]: items.map((item) => false),
            });
            setItems(items);
        }
    }, [openModal]);
    useEffect(() => {
        if (!items || items.length < 1) {
            if (resetNames.length > 0) {
                resetNames.forEach((name) => {
                    setIsEditing({...isEditing, [name]: []});
                });
            } else {
                setIsEditing({...isEditing, [name]: []});
            }
        }
    }, [items]);
    const handleAddItem = () => {
        const defaultValues = fields.reduce((acc, field) => {
            acc[field.id] = "";
            acc.uniqueId = Date.now() + Math.random();
            return acc;
        }, {});
        setItems((prev) => [...prev, defaultValues]);

        setIsEditing({...isEditing, [name]: [...isEditing[name], true]});
    };

    const handleRemoveItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        const removeEditIndex = isEditing[name].filter((_, i) => i !== index);
        setIsEditing({
            ...isEditing,
            [name]: removeEditIndex,
        });
    };

    const handleSnackbarClose = () => {
        setSnackbarOpen({
            ...snackbarOpen,
            [name]: false,
        });
    };

    function handleSnackbarOpen(message = "يجب ملئ جميع الحقول") {
        setSnackbarOpen({
            ...snackbarOpen,
            [name]: true,
        });
        setSnackbarMessage({
            ...snackbarMessage,
            [name]: message,
        });
    }

    return (
          <div className="dynamic-form">
              <h3 className="text-lg font-semibold mb-2">{formTitle}</h3>
              {items?.map((item, index) => (
                    <FormField
                          setIsEditing={setIsEditing}
                          fields={fields}
                          setItems={setItems}
                          key={item.id ? item.id : item.uniqueId}
                          index={index}
                          handleRemoveItem={handleRemoveItem}
                          handleSnackbarOpen={handleSnackbarOpen}
                          isEditing={isEditing}
                          items={items}
                          name={name}
                    />
              ))}
              <Button onClick={handleAddItem} variant="contained">
                  إضافة {title}
              </Button>

              <Snackbar
                    open={snackbarOpen[name]}
                    autoHideDuration={6000}
                    onClose={handleSnackbarClose}
              >
                  <Alert onClose={handleSnackbarClose} severity="warning">
                      {snackbarMessage[name]}
                  </Alert>
              </Snackbar>
          </div>
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
    const [value, setValue] = useState(items[index]);

    function handleItemChange(index, key, val) {
        setValue({...value, [key]: val});
    }

    function handleSaveItems() {
        const isNotEmpty = Object.values(value).every((val) => val !== "");
        if (!isNotEmpty) {
            handleSnackbarOpen();
            return;
        }
        const newItems = [...items];
        newItems[index] = value;

        setItems(newItems);

        setIsEditing({
            ...isEditing,
            [name]: isEditing[name].map((_, i) => (i === index ? false : _)),
        });
    }

    // const saved = isEditing[index];
    const saved = isEditing[name][index];

    function handleEdit() {
        setIsEditing({
            ...isEditing,
            [name]: isEditing[name].map((_, i) => (i === index ? true : _)),
        });
    }

    return (
          <div className={"flex items-center gap-2  mb-3"}>
              {fields.map((field, index) => {
                  if (field.type === "select") {
                      return (
                            <FormControl key={field.id}>
                                <InputLabel id="demo-simple-select-label">
                                    {field.label}
                                </InputLabel>

                                <Select
                                      label={field.label}
                                      value={value[field.id]}
                                      sx={{
                                          minWidth: 120,
                                      }}
                                      loading
                                      onChange={(e) =>
                                            handleItemChange(index, field.id, e.target.value)
                                      }
                                      className="mr-2"
                                      disabled={!saved}
                                >
                                    {field.options.map((option) => (
                                          <MenuItem key={option.value} value={option.value}>
                                              {option.label}
                                          </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                      );
                  } else {
                      return (
                            <TextField
                                  key={field.id}
                                  label={field.label}
                                  variant="outlined"
                                  value={value[field.id]}
                                  type={field.type}
                                  onChange={(e) =>
                                        handleItemChange(index, field.id, e.target.value)
                                  }
                                  className="mr-2"
                                  disabled={!saved}
                            />
                      );
                  }
              })}
              <Button
                    onClick={!saved ? handleEdit : handleSaveItems}
                    variant="contained"
                    color="primary"
                    sx={{
                        ml: 2,
                    }}
              >
                  {saved ? "حفظ" : "تعديل"}
              </Button>
              <IconButton onClick={() => handleRemoveItem(index)} color="secondary">
                  <DeleteIcon/>
              </IconButton>
          </div>
    );
}
