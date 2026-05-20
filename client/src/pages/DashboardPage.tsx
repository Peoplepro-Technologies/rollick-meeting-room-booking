import React, { useState, useEffect, useMemo } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  IconButton,
  AppBar,
  Toolbar,
} from '@mui/material';
import { Logout } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { RoomTabs } from '../components/RoomTabs/RoomTabs';
import { Calendar } from '../components/Calendar/Calendar';
import { apiClient } from '../api/client';
import { useTheme } from '../hooks/useTheme';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { palette, textColor } = useTheme();

  const roomColors = useMemo(() => {
    const colorMap = new Map<number, string>();
    let idx = 0;
    const seen = new Set<number>();
    bookings.forEach(b => {
      if (!seen.has(b.room_id)) {
        seen.add(b.room_id);
        colorMap.set(b.room_id, palette[idx % palette.length]);
        idx++;
      }
    });
    rooms.forEach(r => {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        colorMap.set(r.id, palette[idx % palette.length]);
        idx++;
      }
    });
    return colorMap;
  }, [bookings, rooms, palette]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [roomsResponse, bookingsResponse] = await Promise.all([
          apiClient.getRooms(),
          apiClient.getBookings(),
        ]);

        if (roomsResponse.success && roomsResponse.data?.rooms) {
          setRooms(roomsResponse.data.rooms);
        }

        if (bookingsResponse.success && bookingsResponse.data?.bookings) {
          setBookings(bookingsResponse.data.bookings);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBookingCreated = (newBooking: any) => {
    setBookings(prev => [...prev, newBooking]);
  };

  const handleBookingDeleted = (bookingId: number) => {
    setBookings(prev => prev.filter(booking => booking.id !== bookingId));
  };

  const handleBookingUpdated = (updatedBooking: any) => {
    setBookings(prev =>
      prev.map(booking => (booking.id === updatedBooking.id ? updatedBooking : booking))
    );
  };

  const handleBookingResized = (updatedBooking: {
    id: number; room_id: number; user_id: number;
    title: string; start_time: string; end_time: string; status: 'confirmed' | 'cancelled';
  }) => {
    setBookings(prev =>
      prev.map(booking => (booking.id === updatedBooking.id ? updatedBooking : booking))
    );
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Meeting Room Booking
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.username}
          </Typography>
          {user?.role === 'admin' && (
            <Button 
              color="inherit" 
              href="/admin"
              sx={{ mr: 2 }}
            >
              Admin Panel
            </Button>
          )}
          <IconButton color="inherit" onClick={logout}>
            <Logout />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Dashboard
        </Typography>
        
        <RoomTabs
          rooms={rooms}
          selectedRoom={selectedRoom}
          onRoomSelect={setSelectedRoom}
          roomColors={roomColors}
          textColor={textColor}
        />
        
        <Box sx={{ mt: 3 }}>
          <Calendar
            bookings={bookings}
            roomId={selectedRoom}
            onBookingDelete={handleBookingDeleted}
            onBookingCreated={handleBookingCreated}
            onBookingUpdate={handleBookingUpdated}
            onBookingResized={handleBookingResized}
            currentUserId={user?.id}
            currentUserRole={user?.role}
            rooms={rooms}
            onRoomSelect={setSelectedRoom}
            roomColors={roomColors}
            textColor={textColor}
          />
        </Box>
      </Container>
    </Box>
  );
};