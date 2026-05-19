import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { setHours, setMinutes, startOfDay } from 'date-fns';

interface BookingFormProps {
  open?: boolean;
  onClose?: () => void;
  roomId: number | string;
  selectedStart?: Date;
  selectedEnd?: Date;
  onBookingCreated: (booking: any) => void;
}

interface BookingFormData {
  title: string;
  description: string;
  start: Date;
  end: Date;
}

// Working hours: 9 AM to 7 PM (21:00)
const WORKING_HOUR_START = 9;
const WORKING_HOUR_END = 19;

// Helper to constrain time to working hours
const constrainToWorkingHours = (date: Date): Date => {
  const hours = date.getHours();
  if (hours < WORKING_HOUR_START) {
    return setHours(setMinutes(date, 0), WORKING_HOUR_START);
  } else if (hours >= WORKING_HOUR_END) {
    return setHours(setMinutes(date, 0), WORKING_HOUR_END);
  }
  return date;
};

export const BookingForm: React.FC<BookingFormProps> = ({
   open = true,
   onClose = () => {},
   roomId,
   selectedStart,
   selectedEnd,
   onBookingCreated,
  }) => {
   const getWorkingHoursStart = (date: Date): Date => {
     return setHours(setMinutes(startOfDay(date), 0), WORKING_HOUR_START);
   };

   const [formData, setFormData] = useState<BookingFormData>({
     title: '',
     description: '',
     start: constrainToWorkingHours(selectedStart || getWorkingHoursStart(new Date())),
     end: constrainToWorkingHours(selectedEnd || new Date(getWorkingHoursStart(new Date()).getTime() + 60 * 60 * 1000)),
   });
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState<string | null>(null);

   const handleChange = (field: keyof BookingFormData, value: any) => {
     setFormData(prev => ({
       ...prev,
       [field]: value,
     }));
     setError(null);
   };

   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();
     
     const start = constrainToWorkingHours(formData.start);
     const end = constrainToWorkingHours(formData.end);

     if (end <= start) {
       setError('End time must be after start time');
       return;
     }

     setLoading(true);
     setError(null);

     try {
       const response = await fetch(`/api/bookings`, {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           Authorization: `Bearer ${localStorage.getItem('token')}`,
         },
         body: JSON.stringify({
           title: formData.title,
           description: formData.description,
           start_time: start.toISOString(),
           end_time: end.toISOString(),
           roomId: Number(roomId),
         }),
       });

       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'Failed to create booking');
       }

       const result = await response.json();
       
       if (result.success) {
         onBookingCreated(result.data);
         onClose();
         setFormData({
           title: '',
           description: '',
           start: getWorkingHoursStart(new Date()),
           end: new Date(getWorkingHoursStart(new Date()).getTime() + 60 * 60 * 1000),
         });
       } else {
         throw new Error(result.error?.message || 'Failed to create booking');
       }
     } catch (err) {
       setError(err instanceof Error ? err.message : 'An error occurred');
     } finally {
       setLoading(false);
     }
   };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create New Booking</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            
            <TextField
              label="Meeting Title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
              fullWidth
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              multiline
              rows={3}
              fullWidth
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Start Time"
                value={formData.start}
                onChange={(value) => handleChange('start', value || new Date())}
                minDateTime={getWorkingHoursStart(new Date())}
                maxDateTime={setHours(setMinutes(new Date(), 0), WORKING_HOUR_END)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
                ampm={false}
              />

              <DateTimePicker
                label="End Time"
                value={formData.end}
                onChange={(value) => handleChange('end', value || new Date())}
                minDateTime={formData.start}
                maxDateTime={setHours(setMinutes(formData.start, 0), WORKING_HOUR_END)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
                ampm={false}
              />
            </LocalizationProvider>
            
            <Typography variant="body2" color="text.secondary">
              Working hours: 9:00 AM - 7:00 PM
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading || !formData.title.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Booking'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};