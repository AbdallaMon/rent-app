"use client"
import {useEffect, useState} from "react";
import {
    Autocomplete,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Slide,
    TextField,
    Typography,
} from "@mui/material";
import {Close, Delete} from "@mui/icons-material";
import {useToastContext} from "@/app/context/ToastLoading/ToastLoadingProvider";
import {handleRequestSubmit} from "@/helpers/functions/handleRequestSubmit";

export default function AssignPropertiesForm({data, id, setUserId, setData}) {
    const [open, setOpen] = useState(false);
    const [user, setUser] = useState(null);
    useEffect(() => {
        if (id) {
            setOpen(true);
            setUser(data.find((u) => u.id === id));
        } else {
            setOpen(false);
        }
    }, [id]);

    return (
          <>
              {user && <AssignPropertiesModal user={user} open={open} setOpen={setOpen} setUserId={setUserId}
                                              setData={setData}/>}
          </>
    );
}

function AssignPropertiesModal({user, open, setOpen, setUserId, setData}) {
    const [properties, setProperties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [userProperties, setUserProperties] = useState(user.properties || []);
    const {setLoading: setSubmitLoading} = useToastContext()

    async function getProperties(withoutFetch) {
        setLoading(true);
        let response = [...properties, ...userProperties]
        if (!withoutFetch || properties.length < 1) {
            const request = await fetch("/api/fast-handler?id=properties");
            response = await request.json();
        }
        if (user.properties && user.properties.length > 0) {
            const userProps = response.filter((prop) =>
                  user.properties.some(userProp => userProp.propertyId === prop.id)
            );

            const filteredProps = response.filter((prop) =>
                  !user.properties.some(userProp => userProp.propertyId === prop.id)
            );
            setUserProperties(userProps);
            setProperties(filteredProps);
        } else {
            setProperties(response);
            setUserProperties([])
        }
        setLoading(false);
    }

    useEffect(() => {
        if (user.properties) {
            getProperties(true)
        } else {
            getProperties()
        }
    }, [user])


    async function handleSubmit() {
        const response = await handleRequestSubmit(userProperties, setSubmitLoading, `/settings/permissions/users/${user.id}`, false, "يتم اضافة الوحدات الي المستخدم", "PUT")
        if (response.status === 200) {
            setData((oldData) => oldData.map((item) => {
                if (item.id === user.id) {
                    item = {
                        ...item, properties: userProperties.map((prop) => ({
                            propertyId: prop.id
                        }))
                    }
                }
                return item
            }))
            setOpen(false);
            setUserId(null);
        }
    }

    return (
          <Dialog
                open={open}
                onClose={() => {
                    setOpen(false);
                    setUserId(null);
                }}
                TransitionComponent={Slide}
                TransitionProps={{direction: "up"}}
                fullWidth
                maxWidth="sm"
                PaperProps={{sx: {borderRadius: "16px 16px 0 0",}}}
          >
              <DialogTitle>
                  <Box sx={{display: "flex", alignItems: "center", justifyContent: "space-between"}}>
                      <Typography variant="h6">اضافة عقارات الي {user.name}</Typography>
                      <IconButton
                            edge="end"
                            color="inherit"
                            onClick={() => {
                                setOpen(false);
                                setUserId(null);
                            }}
                      >
                          <Close/>
                      </IconButton>
                  </Box>
              </DialogTitle>

              <DialogContent sx={{
                  height: "60vh"
              }}>
                  <PropertiesSelect
                        loading={loading}
                        properties={properties}
                        setProperties={setProperties}
                        setUserProperties={setUserProperties}
                  />
                  {loading ? "جاري التحميل" :
                        <UserProperties
                              setUserProperties={setUserProperties}
                              setProperties={setProperties}
                              userProperties={userProperties}
                        />}
              </DialogContent>

              <DialogActions>
                  <Button onClick={handleSubmit} variant="contained" color="primary" fullWidth>
                      {loading ? <CircularProgress size={24} color="inherit"/> : "اضافة"}
                  </Button>
              </DialogActions>
          </Dialog>
    );
}

function PropertiesSelect({properties, loading, setUserProperties, setProperties}) {
    function onChange(e, newValue) {
        setUserProperties((old) => ([...old, newValue]));
        const filteredProps = properties.filter((prop) => prop.id !== newValue.id);
        setProperties(filteredProps);
    }

    return (
          <Autocomplete
                disablePortal
                options={properties}
                onChange={onChange}
                loading={loading}
                getOptionLabel={(item) => item.name}
                renderInput={(params) => (
                      <TextField
                            {...params}
                            label="اختر عقار"
                            variant="outlined"
                            fullWidth
                            margin="normal"
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                      <>
                                          {loading ? <CircularProgress color="inherit" size={20}/> : null}
                                          {params.InputProps.endAdornment}
                                      </>
                                ),
                            }}
                      />
                )}
          />
    );
}

function UserProperties({userProperties, setProperties, setUserProperties}) {
    function handleDelete(property) {
        const newUserProperties = userProperties?.filter((prop) => prop.id !== property.id);
        setUserProperties(newUserProperties);
        setProperties((old) => [...old, property]);
    }


    return (
          <List sx={{mt: 2}}>
              {userProperties?.map((property) => (
                    <ListItem
                          key={property.id}
                          secondaryAction={
                              <IconButton edge="end" onClick={() => handleDelete(property)}>
                                  <Delete/>
                              </IconButton>
                          }
                          sx={{
                              borderBottom: "1px solid #e0e0e0",
                              ":last-child": {borderBottom: "none"},
                          }}
                    >
                        <ListItemText primary={property.name}/>
                    </ListItem>
              ))}
          </List>
    );
}
