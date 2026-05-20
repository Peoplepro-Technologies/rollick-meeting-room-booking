import React from 'react';
import { Tabs, Tab, Box, Typography } from '@mui/material';

interface Room {
  id: number;
  name: string;
  capacity: number;
  location?: string;
  description?: string;
}

interface RoomTabsProps {
  rooms: Room[];
  selectedRoom: number | null;
  onRoomSelect: (roomId: number | null) => void;
  roomColors?: Map<number, string>;
  textColor?: string;
}

export const RoomTabs: React.FC<RoomTabsProps> = ({
  rooms,
  selectedRoom,
  onRoomSelect,
  roomColors,
  textColor,
}) => {
  const handleChange = (_event: React.SyntheticEvent, newValue: number | null) => {
    onRoomSelect(newValue);
  };

  const renderTabLabel = (room: Room) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          backgroundColor: roomColors?.get(room.id) || '#1976d2',
          flexShrink: 0,
        }}
      />
      <Typography variant="body2" sx={{ lineHeight: 1.2, color: textColor || 'inherit' }}>
        {room.name}
      </Typography>
    </Box>
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={selectedRoom}
          onChange={handleChange}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="room tabs"
        >
          <Tab
            key="all-rooms"
            label="All Rooms"
            value={null}
            id={`tab-all`}
            aria-controls={`tabpanel-all`}
          />
          {rooms.map((room) => (
            <Tab
              key={room.id}
              label={renderTabLabel(room)}
              value={room.id}
              id={`tab-${room.id}`}
              aria-controls={`tabpanel-${room.id}`}
            />
          ))}
        </Tabs>
      </Box>
      
      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" color="text.secondary">
          {selectedRoom === null
            ? 'Showing bookings for all rooms'
            : `Showing bookings for: ${rooms.find(r => r.id === selectedRoom)?.name || 'Unknown Room'}`}
        </Typography>
      </Box>
    </Box>
  );
};