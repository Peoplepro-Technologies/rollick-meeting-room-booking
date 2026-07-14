import React, { useEffect, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, EventChangeArg } from '@fullcalendar/core';
import { apiClient } from '../../api/client';
import { ApiResponse } from '../../types';
import { Alert, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Button, Box, Typography, MenuItem, Tooltip } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { setHours, setMinutes, format } from 'date-fns';

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
  onBookingUpdate: (updatedBooking: Booking) => void;
  onBookingResized?: (updatedBooking: { id: number; room_id: number; user_id: number; title: string; start_time: string; end_time: string; status: 'confirmed' | 'cancelled' }) => void;
  currentUserId?: number;
  currentUserRole?: 'user' | 'admin';
  rooms?: Array<{ id: number; name: string; capacity: number; location?: string; description?: string }>;
  onRoomSelect?: (roomId: number) => void;
  roomColors?: Map<number, string>;
  textColor?: string;
}

// 24-hour availability - no business-hour restriction
const WORKING_HOUR_END = 24;

export const Calendar: React.FC<CalendarProps> = ({
  bookings,
  roomId,
  onBookingDelete,
  onBookingCreated,
  onBookingUpdate,
  onBookingResized,
  currentUserId,
  currentUserRole,
  rooms,
  onRoomSelect,
  roomColors,
  textColor,
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [selectedInfo, setSelectedInfo] = useState<DateSelectArg | null>(null);

  useEffect(() => {
    const filteredBookings = roomId
      ? bookings.filter(booking => booking.room_id === roomId)
      : bookings;

    const calendarEvents = filteredBookings.map(booking => {
      const bgColor = roomColors?.get(booking.room_id) || '#1976d2';
      return {
        id: booking.id.toString(),
        title: booking.title,
        start: booking.start_time,
        end: booking.end_time,
        backgroundColor: bgColor,
        borderColor: bgColor,
        extendedProps: {
          booking,
        },
      };
    });

    setEvents(calendarEvents);
   }, [bookings, roomId, roomColors]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    room_id: 0,
    start: new Date(),
    end: new Date(Date.now() + 60 * 60 * 1000),
  });

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: '',
    room_id: 0,
    start: new Date(),
    end: new Date(),
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editLoadingDelete, setEditLoadingDelete] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);

  const constrainToWorkingHours = useCallback((date: Date): Date => {
    // 24-hour booking window - all hours/minutes are allowed
    return date;
  }, []);

  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    const startDate = constrainToWorkingHours(selectInfo.start);
    const endDate = constrainToWorkingHours(selectInfo.end);

    let finalEndDate = endDate;
    if (finalEndDate <= startDate) {
      finalEndDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    }

    setSelectedInfo(selectInfo);
    setFormData({
      title: '',
      room_id: roomId ?? (rooms && rooms.length > 0 ? rooms[0].id : 0),
      start: startDate,
      end: finalEndDate,
    });
    setDialogOpen(true);
  }, [constrainToWorkingHours, roomId, rooms]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    const booking = clickInfo.event.extendedProps.booking;

    const canEdit = currentUserRole === 'admin' || booking.user_id === currentUserId;

    if (!canEdit) {
      alert('You do not have permission to edit this booking.');
      return;
    }

    setEditingBooking(booking);
    setEditFormData({
      title: booking.title,
      room_id: booking.room_id,
      start: new Date(booking.start_time),
      end: new Date(booking.end_time),
    });
    setEditError(null);
    setEditDialogOpen(true);
  };

  const handleChange = (field: 'title' | 'room_id' | 'start' | 'end', value: any) => {
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
      room_id: 0,
      start: new Date(),
      end: new Date(Date.now() + 60 * 60 * 1000),
    });
    setError(null);
  };

  const handleEditDialogClose = () => {
    setEditDialogOpen(false);
    setEditingBooking(null);
    setEditFormData({
      title: '',
      room_id: 0,
      start: new Date(),
      end: new Date(),
    });
    setEditError(null);
  };

  const handleEditChange = (field: 'title' | 'room_id' | 'start' | 'end', value: any) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setEditError(null);
  };

  const handleEditSubmit = async () => {
    if (!editingBooking) return;

    let updateResponse: any = null;
    setEditLoading(true);
    setEditError(null);

    try {
      updateResponse = await apiClient.updateBooking(editingBooking.id, {
        title: editFormData.title,
        room_id: editFormData.room_id,
        start_time: editFormData.start.toISOString(),
        end_time: editFormData.end.toISOString(),
      });
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'An error occurred');
      setEditLoading(false);
      return;
    }

    const updatedBooking: Booking = {
      id: editingBooking.id,
      room_id: updateResponse.data.booking.room_id,
      user_id: editingBooking.user_id,
      title: updateResponse.data.booking.title,
      start_time: updateResponse.data.booking.start_time,
      end_time: updateResponse.data.booking.end_time,
      status: updateResponse.data.booking.status,
      username: editingBooking.username,
      room_name: updateResponse.data.booking.room_name,
    };

    onBookingUpdate(updatedBooking);
    handleEditDialogClose();
    setEditLoading(false);
  };

  const handleEditDelete = async () => {
    if (!editingBooking) return;

    setEditLoadingDelete(true);
    setEditError(null);

    try {
      await apiClient.deleteBooking(editingBooking.id);
      onBookingDelete(editingBooking.id);
      handleEditDialogClose();
    } catch (err) {
      setEditError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setEditLoadingDelete(false);
    }
  };

  const handleSubmit = async () => {
    const targetRoomId = formData.room_id || roomId;
    if (!targetRoomId) {
      setError('Please select a room');
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
          room_id: targetRoomId,
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
    // Default to the next round 15-minute mark, +1 hour duration
    const now = new Date();
    const defaultStart = new Date(now);
    const minutes = defaultStart.getMinutes();
    defaultStart.setMinutes(Math.ceil(minutes / 15) * 15, 0, 0);
    const defaultEnd = new Date(defaultStart.getTime() + 60 * 60 * 1000);

    setSelectedInfo(null);
    setFormData({
      title: '',
      room_id: roomId ?? (rooms && rooms.length > 0 ? rooms[0].id : 0),
      start: defaultStart,
      end: defaultEnd,
    });
    setDialogOpen(true);
  };

  const handleDragAndDrop = async (dropInfo: EventChangeArg) => {
    const booking = dropInfo.event.extendedProps.booking;

    const canMove = currentUserRole === 'admin' || booking.user_id === currentUserId;
    if (!canMove) {
      dropInfo.revert();
      alert('You do not have permission to move this booking.');
      return;
    }

    const newStart = (dropInfo.event as any).start as Date | null;
    const newEnd   = (dropInfo.event as any).end   as Date | null;
    if (!newStart || !newEnd) { dropInfo.revert(); return; }

    setError(null);

    try {
      const resp = await apiClient.updateBooking(booking.id, {
        title: booking.title,
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      }) as ApiResponse<{ booking: Booking }>;

      if (resp.success) {
        onBookingResized?.({
          id: booking.id,
          room_id: booking.room_id,
          user_id: booking.user_id,
          title: resp.data!.booking.title,
          start_time: resp.data!.booking.start_time,
          end_time: resp.data!.booking.end_time,
          status: resp.data!.booking.status,
        });
      } else {
        dropInfo.revert();
        alert(resp.error?.message || 'Failed to save booking.');
      }
    } catch (e) {
      dropInfo.revert();
      setError(e instanceof Error ? e.message : 'Failed to save booking. Please try again.');
    }
  };

  const handleResize = async (resizeInfo: EventChangeArg) => {
    const booking = resizeInfo.event.extendedProps.booking;

    const canResize = currentUserRole === 'admin' || booking.user_id === currentUserId;
    if (!canResize) {
      resizeInfo.revert();
      alert('You do not have permission to resize this booking.');
      return;
    }

    const newStart = (resizeInfo.event as any).start as Date | null;
    const newEnd   = (resizeInfo.event as any).end   as Date | null;
    if (!newStart || !newEnd) { resizeInfo.revert(); return; }

    const originalDateStr = booking.start_time.substring(0, 10);
    if (newStart.toDateString() !== originalDateStr) {
      resizeInfo.revert();
      setError('Resizing outside the current day is not allowed.');
      return;
    }

    setError(null);

    try {
      const resp = await apiClient.updateBooking(booking.id, {
        title: booking.title,
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      }) as ApiResponse<{ booking: Booking }>;

      if (resp.success) {
        onBookingResized?.({
          id: booking.id,
          room_id: booking.room_id,
          user_id: booking.user_id,
          title: resp.data!.booking.title,
          start_time: resp.data!.booking.start_time,
          end_time: resp.data!.booking.end_time,
          status: resp.data!.booking.status,
        });
      } else {
        resizeInfo.revert();
        alert(resp.error?.message || 'Failed to save booking.');
      }
    } catch (e) {
      resizeInfo.revert();
      setError(e instanceof Error ? e.message : 'Failed to save booking. Please try again.');
    }
  };

  const handleRoomSelect = (roomId: number) => {
    setSelectedRoomId(roomId);
  };

  const handleRoomConfirm = () => {
    if (selectedRoomId && onRoomSelect) {
      onRoomSelect(selectedRoomId);
    }
    setRoomDialogOpen(false);
    setSelectedRoomId(null);
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
        Available 24 hours · pick any hour, any minute
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
        '& .fc-event-dragging': {
          borderColor: '#ff9800',
          borderStyle: 'dashed',
          opacity: 0.7,
          cursor: 'grabbing',
        },
        // Compact view: tighter slots and events to fit 24h
        '& .fc-timegrid-slot': {
          height: '24px',
        },
        '& .fc-timegrid-slot-label': {
          fontSize: '0.7rem',
        },
        '& .fc-timegrid-event': {
          padding: '1px 2px',
          fontSize: '0.7rem',
        },
        '& .fc-timegrid-event-harness': {
          margin: '0 1px',
        },
        '& .fc-col-header-cell': {
          padding: '4px 2px',
          fontSize: '0.75rem',
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
          allDaySlot={false}
          scrollTime="00:00:00"
          dayMaxEvents={true}
          events={events}
          dayHeaderContent={(arg) => format(arg.date, 'EEE, d/M')}
          slotLabelFormat={{ hour: 'numeric', minute: '2-digit', hour12: false }}
          eventContent={(arg) => {
            const booking = arg.event.extendedProps.booking;
            const bgColor = booking ? roomColors?.get(booking.room_id) || '#1976d2' : '#1976d2';
            const username = booking?.username || 'Unknown';
            const roomName = booking?.room_name || 'Unknown Room';
            return (
                <Tooltip
                title={
                  <Box sx={{ color: textColor || '#333' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Room: {roomName}</Typography>
                    <Typography variant="body2">Booked By: {username}</Typography>
                  </Box>
                }
                arrow
                enterDelay={300}
                enterNextDelay={300}
                placement="top"
                slotProps={{
                  popper: {
                    modifiers: [
                      {
                        name: 'offset',
                        options: { offset: [0, -8] },
                      },
                    ],
                  },
                }}
              >
                <Box sx={{ backgroundColor: bgColor, width: '100%', height: '100%', p: 0.5, cursor: 'default', color: textColor || '#333' }}>
                  <Typography variant="caption" component="div" sx={{ fontWeight: 'bold', lineHeight: 1.2 }}>
                    {arg.event.title}
                  </Typography>
                  <Typography variant="caption" component="div" sx={{ fontSize: '0.65rem', opacity: 0.9, lineHeight: 1.2 }}>
                    By: {username}
                  </Typography>
                </Box>
              </Tooltip>
            );
          }}
          eventClick={handleEventClick}
          select={handleDateSelect}
          eventDrop={handleDragAndDrop}
          eventResize={handleResize}
          height="640px"
          slotDuration="00:30:00"
          slotLabelInterval="01:00"
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          selectConstraint={{
            startTime: '00:00',
            endTime: '24:00',
          }}
        />
      </Box>

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

            <TextField
              select
              label="Meeting Room"
              value={formData.room_id || ''}
              onChange={(e) => handleChange('room_id', Number(e.target.value))}
              required
              fullWidth
            >
              {rooms && rooms.map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  {room.name} (Capacity: {room.capacity})
                </MenuItem>
              ))}
            </TextField>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Start Time"
                value={formData.start}
                onChange={(value) => handleChange('start', value || new Date())}
                minDateTime={selectedInfo ? constrainToWorkingHours(selectedInfo.start) : undefined}
                maxDateTime={selectedInfo ? setHours(setMinutes(selectedInfo.start, 0), WORKING_HOUR_END) : undefined}
                timeSteps={{ hours: 1, minutes: 1 }}
                slotProps={{ textField: { fullWidth: true, required: true } }}
                ampm={false}
              />

              <DateTimePicker
                label="End Time"
                value={formData.end}
                onChange={(value) => handleChange('end', value || new Date())}
                minDateTime={formData.start}
                maxDateTime={setHours(setMinutes(formData.start, 0), WORKING_HOUR_END)}
                timeSteps={{ hours: 1, minutes: 1 }}
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
            disabled={loading || !formData.title.trim() || !formData.room_id}
          >
            {loading ? <CircularProgress size={24} /> : 'Create Booking'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={handleEditDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Booking</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            {editError && (
              <Alert severity="error" onClose={() => setEditError(null)}>
                {editError}
              </Alert>
            )}

            <TextField
              label="Meeting Title"
              value={editFormData.title}
              onChange={(e) => handleEditChange('title', e.target.value)}
              required
              fullWidth
            />

            <TextField
              select
              label="Meeting Room"
              value={editFormData.room_id || ''}
              onChange={(e) => handleEditChange('room_id', Number(e.target.value))}
              required
              fullWidth
            >
              {rooms && rooms.map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  {room.name} (Capacity: {room.capacity})
                </MenuItem>
              ))}
            </TextField>

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Start Time"
                value={editFormData.start}
                onChange={(value) => handleEditChange('start', value || new Date())}
                minDateTime={constrainToWorkingHours(editFormData.start)}
                maxDateTime={setHours(setMinutes(editFormData.start, 0), WORKING_HOUR_END)}
                timeSteps={{ hours: 1, minutes: 1 }}
                slotProps={{ textField: { fullWidth: true, required: true } }}
                ampm={false}
              />

              <DateTimePicker
                label="End Time"
                value={editFormData.end}
                onChange={(value) => handleEditChange('end', value || new Date())}
                minDateTime={editFormData.start}
                maxDateTime={setHours(setMinutes(editFormData.start, 0), WORKING_HOUR_END)}
                timeSteps={{ hours: 1, minutes: 1 }}
                slotProps={{ textField: { fullWidth: true, required: true } }}
                ampm={false}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleEditDelete}
            disabled={editLoading || editLoadingDelete}
            startIcon={editLoadingDelete ? <CircularProgress size={16} /> : null}
          >
            Delete
          </Button>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={handleEditDialogClose} disabled={editLoading || editLoadingDelete}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleEditSubmit}
              disabled={editLoading || editLoadingDelete || !editFormData.title.trim()}
            >
              {editLoading ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <Dialog open={roomDialogOpen} onClose={() => setRoomDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Select a Room</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Please select a room to create a booking.
            </Typography>
            <TextField
              select
              label="Room"
              value={selectedRoomId || ''}
              onChange={(e) => handleRoomSelect(Number(e.target.value))}
              fullWidth
              required
            >
              {rooms && rooms.map((room) => (
                <MenuItem key={room.id} value={room.id}>
                  {room.name} (Capacity: {room.capacity})
                </MenuItem>
              ))}
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoomDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRoomConfirm}
            disabled={!selectedRoomId}
          >
            Select Room
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};