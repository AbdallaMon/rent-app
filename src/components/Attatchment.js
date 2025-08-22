import React, {useEffect, useState} from "react";
import {Alert, Box, Button, CircularProgress, IconButton, Modal, Snackbar, Typography,} from "@mui/material";
import {useToastContext} from "@/app/context/ToastLoading/ToastLoadingProvider";
import {handleRequestSubmit} from "@/helpers/functions/handleRequestSubmit";
import DeleteIcon from "@mui/icons-material/Delete";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import {styled} from '@mui/material/styles';


const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

const AttachmentUploader = ({rentAgreementId}) => {
    const [attachments, setAttachments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [attachmentToDelete, setAttachmentToDelete] = useState(null);
    const {setLoading: setFileUpload} = useToastContext();

    useEffect(() => {
        async function fetchAttachments() {
            setLoading(true);
            try {
                const res = await fetch(
                      `/api/main/rentAgreements/${rentAgreementId}/attachments`,
                );
                const data = await res.json();
                setAttachments(data.data);
            } catch (error) {
                setError("Error fetching attachments");
                console.error("Error fetching attachments:", error);
            }
            setLoading(false);
        }

        fetchAttachments();
    }, [rentAgreementId]);
    const handleImageUpload = async (e) => {
        try {
            console.log(e.target.files[0], "e")
            const file = e.target.files[0]

            const formData = new FormData();
            formData.append("file", file);
            const uploadImage = await handleRequestSubmit(
                  formData,
                  setFileUpload,
                  `/upload`,
                  true,
                  "جاري رفع الصوره",
            );

            const url = "https://files.suhail.cc/u/" + await uploadImage.url
            await handleUpload(url)
        } catch (error) {
            setError("Error uploading attachment");
            console.error("Error uploading attachment:", error);
        }
        setUploading(false);
    }
    const handleUpload = async (url) => {
        try {
            const res = await handleRequestSubmit(
                  {url},
                  setFileUpload,
                  `/main/rentAgreements/${rentAgreementId}/attachments`,
                  false,
                  "جاري حفظ الصوره",
            );
            setAttachments((prev) => [...prev, res.data]);
        } catch (error) {
            setError("Error uploading attachment");
            console.error("Error uploading attachment:", error);
        }
        setUploading(false);
    };

    const handleDelete = async () => {
        try {
            await handleRequestSubmit(
                  null,
                  setFileUpload,
                  `/main/rentAgreements/${rentAgreementId}/attachments/${attachmentToDelete}`,
                  false,
                  "جاري حذف الصوره",
                  "DELETE",
            );
            setAttachments((prev) =>
                  prev.filter((att) => att.id !== attachmentToDelete),
            );
            setDeleteModalOpen(false);
        } catch (error) {
            setError("حدث خطاؤ ما");
            console.error("حدث خطاء ما", error);
        }
    };

    const openDeleteModal = (id) => {
        setAttachmentToDelete(id);
        setDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setAttachmentToDelete(null);
    };

    const openImage = (url) => {
        setSelectedImage(url);
    };

    const closeImage = () => {
        setSelectedImage(null);
    };

    return (
          <Box>
              <Typography variant="h6">مرفقات العقد</Typography>
              <Button
                    component="label"
                    role={undefined}
                    variant="contained"
                    tabIndex={-1}
              >
                  Upload file
                  <VisuallyHiddenInput type="file" onChange={async (e) => await handleImageUpload(e)}/>
              </Button>
              {/*<UploadButton*/}
              {/*  endpoint="imageUploader"*/}
              {/*  onClientUploadComplete={(res) => {*/}
              {/*    const url = res[0].url;*/}
              {/*    handleUpload(url);*/}
              {/*  }}*/}
              {/*  onUploadError={(error) => {*/}
              {/*    alert(`ERROR! ${error.message}`);*/}
              {/*  }}*/}
              {/*/>*/}
              {loading ? (
                    <CircularProgress/>
              ) : (
                    <Box
                          sx={{
                              display: "grid",
                              gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                              gap: 2,
                              marginTop: 2,
                          }}
                    >
                        {attachments?.map((attachment) => (
                              <Box key={attachment.id} sx={{position: "relative"}}>
                                  <img
                                        src={attachment.url}
                                        alt="Attachment"
                                        style={{width: "100%", cursor: "pointer"}}
                                        onClick={() => openImage(attachment.url)}
                                  />
                                  <IconButton
                                        onClick={() => openDeleteModal(attachment.id)}
                                        sx={{
                                            position: "absolute",
                                            top: 8,
                                            right: 8,
                                            backgroundColor: "rgba(255, 255, 255, 0.7)",
                                        }}
                                  >
                                      <DeleteIcon/>
                                  </IconButton>
                                  <IconButton
                                        onClick={() => openImage(attachment.url)}
                                        sx={{
                                            position: "absolute",
                                            bottom: 8,
                                            right: 8,
                                            backgroundColor: "rgba(255, 255, 255, 0.7)",
                                        }}
                                  >
                                      <FullscreenIcon/>
                                  </IconButton>
                              </Box>
                        ))}
                    </Box>
              )}
              {selectedImage && (
                    <Modal open={Boolean(selectedImage)} onClose={closeImage}>
                        <Box
                              sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "100vh",
                                  backgroundColor: "rgba(0, 0, 0, 0.8)",
                              }}
                        >
                            <img
                                  src={selectedImage}
                                  alt="Fullscreen Attachment"
                                  style={{maxHeight: "90%", maxWidth: "90%"}}
                            />
                            <IconButton
                                  onClick={closeImage}
                                  sx={{
                                      position: "absolute",
                                      top: 16,
                                      right: 16,
                                      color: "#fff",
                                  }}
                            >
                                <CloseIcon/>
                            </IconButton>
                        </Box>
                    </Modal>
              )}
              <Modal open={deleteModalOpen} onClose={closeDeleteModal}>
                  <Box
                        sx={{
                            position: "absolute",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            width: 300,
                            bgcolor: "background.paper",
                            p: 4,
                            boxShadow: 24,
                            borderRadius: 2,
                        }}
                  >
                      <Typography variant="h6" gutterBottom>
                          تأكيد الحذف
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                          هل أنت متأكد أنك تريد حذف هذا المرفق؟
                      </Typography>
                      <Box sx={{display: "flex", justifyContent: "space-between", mt: 2}}>
                          <Button
                                variant="contained"
                                color="secondary"
                                onClick={closeDeleteModal}
                          >
                              إلغاء
                          </Button>
                          <Button variant="contained" color="primary" onClick={handleDelete}>
                              تأكيد
                          </Button>
                      </Box>
                  </Box>
              </Modal>
              {error && (
                    <Snackbar
                          open={!!error}
                          autoHideDuration={6000}
                          onClose={() => setError(null)}
                    >
                        <Alert severity="error" onClose={() => setError(null)}>
                            {error}
                        </Alert>
                    </Snackbar>
              )}
              {successMessage && (
                    <Snackbar
                          open={!!successMessage}
                          autoHideDuration={6000}
                          onClose={() => setSuccessMessage(null)}
                    >
                        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
                            {successMessage}
                        </Alert>
                    </Snackbar>
              )}
          </Box>
    );
};

export default AttachmentUploader;
