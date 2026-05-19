import React, { useEffect, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg } from '@fullcalendar/core';
import { Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, CircularProgress } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { setHours, setMinutes, startOfDay } from 'date-fns';

interface Booking {
  id: number;
  room_id: number;
  user_id: number;
  title: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled';
  username?: string;
  room_name?: string;
}

interface CalendarProps {
  bookings: Booking[];
  roomId: number | null;
  onBookingDelete: (bookingId: number) => void;
  onBookingCreated: (booking: Booking) => void;
}

// Working hours: 9 AM to 7 PM (21:00)
const WORKING_HOUR_START = 9;
const WORKING_HOUR_END = 19;

export const Calendar: React.FC<CalendarProps> = ({
  bookings,
  roomId,
  onBookingDelete,
  onBookingCreated,
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedInfo, setSelectedInfo] = useState<DateSelectArg | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    start: new Date(),
    end: new Date(Date.now() + 60 * 60 * 1000),
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const filteredBookings = roomId
      ? bookings.filter(booking => booking.room_id === roomId)
      : bookings;

    const calendarEvents = filteredBookings.map(booking => ({
      id: booking.id.toString(),
      title: booking.title,
      start: booking.start_time,
      end: booking.end_time,
      backgroundColor: booking.status === 'confirmed' ? '#1976d2' : '#f44336',
      borderColor: booking.status === 'confirmed' ? '#1976d2' : '#f44336',
      extendedProps: {
        booking,
      },
    }));

    setEvents(calendarEvents);
  }, [bookings, roomId]);

  const constrainToWorkingHours = useCallback((date: Date): Date => {
    const constrainedDate = new Date(date);
    const hours = constrainedDate.getHours();

    if (hours < WORKING_HOUR_START) {
      return setHours(setMinutes(constrainedDate, 0), WORKING_HOUR_START);
    } else if (hours >= WORKING_HOUR_END) {
      return setHours(setMinutes(constrainedDate, 0), WORKING_HOUR_END);
    }
    return constrainedDate;
  }, []);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    // Constrain selection to working hours
    const startDate = constrainToWorkingHours(selectInfo.start);
    const endDate = constrainToWorkingHours(selectInfo.end);

    // If end is before start after constraining, adjust
    let finalEndDate = endDate;
    if (finalEndDate <= startDate) {
      finalEndDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Add 1 hour
    }

    setSelectedInfo(selectInfo);
    setFormData({
      title: '',
      start: startDate,
      end: finalEndDate,
    });
    setDialogOpen(true);
  }, [constrainToWorkingHours]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const booking = clickInfo.event.extendedProps.booking;
    
    if (window.confirm(`Delete booking: ${booking.title}?`)) {
      onBookingDelete(booking.id);
    }
  };

  const handleChange = (field: 'title' | 'start' | 'end', value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedInfo(null);
    setFormData({
      title: '',
      start: new Date(),
      end: new Date(Date.now() + 60 * 60 * 1000),
    });
    setError(null);
  };

  const handleSubmit = async () => {
    if (!roomId) {
      setError('Please select a room first');
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          title: formData.title,
          start_time: formData.start.toISOString(),
          end_time: formData.end.toISOString(),
          room_id: roomId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create booking');
      }

      const result = await response.json();
      
      if (result.success) {
        onBookingCreated(result.data.booking);
        handleCloseDialog();
        if (selectedInfo) {
          selectedInfo.view.calendar.unselect();
        }
      } else {
        throw new Error(result.error?.message || 'Failed to create booking');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBookButtonClick = () => {
    // Open dialog with today's 9am-10am slot by default
    const today = new Date();
    const defaultStart = setHours(setMinutes(startOfDay(today), 0), WORKING_HOUR_START);
    const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000);

    setSelectedInfo(null);
    setFormData({
      title: '',
      start: defaultStart,
      end: defaultEnd,
    });
    setDialogOpen(true);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">
          Meeting Schedule
        </Typography>
        <Button variant="contained" onClick={handleBookButtonClick}>
          Book Room
        </Button>
      </Box>
      
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Working hours: 9:00 AM - 7:00 PM
      </Typography>
      
      <Box sx={{ 
        '& .fc': {
          '--fc-border-color': '#e0e0e0',
          '--fc-primary-color': '#1976d2',
        },
        '& .fc-button-primary': {
          backgroundColor: '#1976d2',
          borderColor: '#1976d2',
          '&:hover': {
            backgroundColor: '#1565c0',
            borderColor: '#1565c0',
          },
        },
        '& .fc-event': {
          cursor: 'pointer',
        },
      }}>
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          initialView="timeGridWeek"
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          events={events}
          eventClick={handleEventClick}
          select={handleDateSelect}
          height="600px"
          slotMinTime={`${WORKING_HOUR_START}:00:00`}
          slotMaxTime={`${WORKING_HOUR_END}:00:00`}
          selectConstraint={{
            startTime: `${WORKING_HOUR_START}:00`,
            endTime: `${WORKING_HOUR_END}:00`,
          }}
        />
      </Box>

      {/* Booking Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Booking</DialogTitle>
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

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Start Time"
                value={formData.start}
                onChange={(value) => handleChange('start', value || new Date())}
                minDateTime={selectedInfo ? constrainToWorkingHours(selectedInfo.start) : undefined}
                maxDateTime={selectedInfo ? setHours(setMinutes(selectedInfo.start, 0), WORKING_HOUR_END) : undefined}
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading || !formData.title.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Booking'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};