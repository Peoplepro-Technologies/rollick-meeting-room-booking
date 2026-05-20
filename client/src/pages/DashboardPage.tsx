import React, { useState, useEffect } from 'react';
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

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
          />
        </Box>
      </Container>
    </Box>
  );
};