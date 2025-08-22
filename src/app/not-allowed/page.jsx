"use client";
// pages/not-allowed.js
import { Container, Typography, Box, Button } from "@mui/material";
import { useRouter } from "next/navigation";

export default function NotAllowed() {
  const router = useRouter();

  const handleGoBack = () => {
    router.push("/");
  };

  return (
    <Container maxWidth="md" sx={{ textAlign: "center", marginTop: 8 }}>
      <Box
        sx={{
          padding: 4,
          borderRadius: 2,
          boxShadow: 3,
          backgroundColor: "#f9f9f9",
        }}
      >
        <Typography variant="h2" component="h1" gutterBottom>
          Access Denied
        </Typography>
        <Typography variant="body1" paragraph>
          You do not have permission to access this page.
        </Typography>
      </Box>
    </Container>
  );
}
