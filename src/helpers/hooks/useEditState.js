import {useState} from "react";

const useEditState = (initialItems, rerender) => {
    const initialSnackbarState = initialItems.reduce((acc, item) => {
        acc[item.name] = false;
        return acc;
    }, {});

    const initialMessageState = initialItems.reduce((acc, item) => {
        acc[item.name] = "";
        return acc;
    }, {});

    const initialEditingState = initialItems.reduce((acc, item) => {
        acc[item.name] = [];
        return acc;
    }, {});

    const [isEditing, setIsEditing] = useState(initialEditingState);
    const [snackbarOpen, setSnackbarOpen] = useState(initialSnackbarState);
    const [snackbarMessage, setSnackbarMessage] = useState(initialMessageState);

    const handleEditBeforeSubmit = () => {
        let allChecksPassed = true;

        initialItems.forEach((item) => {
            if (isEditing[item.name].some((edit) => edit)) {
                setSnackbarOpen((prev) => ({
                    ...prev,
                    [item.name]: true,
                }));
                setSnackbarMessage((prev) => ({
                    ...prev,
                    [item.name]: `يرجى حفظ جميع ${item.message}`,
                }));
                allChecksPassed = false;
            }
        });
        return allChecksPassed;
    };

    const resetStates = () => {
        setIsEditing(initialEditingState);
        setSnackbarOpen(initialSnackbarState);
        setSnackbarMessage(initialMessageState);
    };

    const triggerRerender = () => {
        setIsEditing((prev) => ({...prev}));
        setSnackbarOpen((prev) => ({...prev}));
        setSnackbarMessage((prev) => ({...prev}));
    };

    return {
        isEditing,
        setIsEditing,
        snackbarOpen,
        setSnackbarOpen,
        snackbarMessage,
        setSnackbarMessage,
        handleEditBeforeSubmit,
        resetStates,
        triggerRerender,
    };
};

export default useEditState;
