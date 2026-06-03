import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireActive?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireActive = true
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireActive && !user.active) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400, textAlign: 'center' }}>
          <Typography variant="h4" gutterBottom>
            Account Deactivated
          </Typography>
          <Typography variant="body1" gutterBottom>
            Your account has been deactivated by the administrator.
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Please contact your administrator for assistance.
          </Typography>
          <Button
            variant="contained"
            onClick={() => window.location.href = '/login'}
            sx={{ mt: 2 }}
          >
            Go to Login
          </Button>
        </Paper>
      </Box>
    );
  }

  return <>{children}</>;
};