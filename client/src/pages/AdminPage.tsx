import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
  Chip,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

interface RoomRow {
  id: number;
  name: string;
  capacity: number;
  location: string | null;
  description: string | null;
}

interface UserRow {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export const AdminPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomDialogOpen, setRoomDialogOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<RoomRow | null>(null);
  const [roomFormData, setRoomFormData] = useState({
    name: '',
    capacity: '',
    location: '',
    description: '',
  });
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [userFormData, setUserFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [roomsRes, usersRes] = await Promise.all([
        apiClient.getRooms(),
        apiClient.getUsers(),
      ]);
      if (roomsRes.success && roomsRes.data?.rooms) {
        setRooms(roomsRes.data.rooms);
      }
      if (usersRes.success && usersRes.data?.users) {
        setUsers(usersRes.data.users);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  // ---------- Room handlers ----------
  const handleRoomDialogOpen = (room?: RoomRow) => {
    if (room) {
      setEditingRoom(room);
      setRoomFormData({
        name: room.name,
        capacity: room.capacity.toString(),
        location: room.location || '',
        description: room.description || '',
      });
    } else {
      setEditingRoom(null);
      setRoomFormData({ name: '', capacity: '', location: '', description: '' });
    }
    setError('');
    setRoomDialogOpen(true);
  };

  const handleRoomDialogClose = () => {
    setRoomDialogOpen(false);
    setEditingRoom(null);
  };

  const handleRoomSubmit = async () => {
    try {
      const roomData = {
        name: roomFormData.name,
        capacity: parseInt(roomFormData.capacity),
        location: roomFormData.location || null,
        description: roomFormData.description || null,
      };

      if (editingRoom) {
        await apiClient.updateRoom(editingRoom.id, roomData);
      } else {
        await apiClient.createRoom(roomData);
      }

      await fetchData();
      handleRoomDialogClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save room');
    }
  };

  const handleRoomDelete = async (roomId: number) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await apiClient.deleteRoom(roomId);
        await fetchData();
      } catch (err: any) {
        setError(err.message || 'Failed to delete room');
      }
    }
  };

  // ---------- User handlers ----------
  const handleUserDialogOpen = (u?: UserRow) => {
    if (u) {
      setEditingUser(u);
      setUserFormData({
        username: u.username,
        email: u.email,
        password: '',
        role: u.role,
      });
    } else {
      setEditingUser(null);
      setUserFormData({ username: '', email: '', password: '', role: 'user' });
    }
    setError('');
    setUserDialogOpen(true);
  };

  const handleUserDialogClose = () => {
    setUserDialogOpen(false);
    setEditingUser(null);
  };

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleUserSubmit = async () => {
    if (!userFormData.username.trim() || !userFormData.email.trim()) {
      setError('Username and email are required');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userFormData.email)) {
      setError('Invalid email format');
      return;
    }

    try {
      const payload: any = {
        username: userFormData.username.trim(),
        email: userFormData.email.trim(),
        role: userFormData.role,
      };

      if (userFormData.password) {
        payload.password = userFormData.password;
      }

      if (editingUser) {
        await apiClient.updateUser(editingUser.id, payload);
      } else {
        if (userFormData.role !== 'user' && !userFormData.password) {
          setError('Password is required for admin users');
          return;
        }
        await apiClient.createUser(payload);
      }

      await fetchData();
      handleUserDialogClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save user');
    }
  };

  const handleUserDelete = async (userId: number, username: string) => {
    if (window.confirm(`Delete user "${username}"? Their bookings will also be removed.`)) {
      try {
        await apiClient.deleteUser(userId);
        await fetchData();
      } catch (err: any) {
        setError(err.message || 'Failed to delete user');
      }
    }
  };

  // ---------- Render ----------
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
          <Button
            color="inherit"
            startIcon={<ArrowBack />}
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            Back to Dashboard
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Admin Panel
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>
            Welcome, {user?.username}
          </Typography>
          <Button color="inherit" onClick={logout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => { setTabValue(v); setError(''); }}
          sx={{ mb: 3 }}
        >
          <Tab label="Room Management" />
          <Tab label={`User Management (${users.length})`} />
        </Tabs>

        {/* ──── Room Management ──── */}
        <TabPanel value={tabValue} index={0}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4">Room Management</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleRoomDialogOpen()}
            >
              Add Room
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Capacity</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id} hover>
                    <TableCell>{room.name}</TableCell>
                    <TableCell>{room.capacity}</TableCell>
                    <TableCell>{room.location || '-'}</TableCell>
                    <TableCell>{room.description || '-'}</TableCell>
                    <TableCell align="center">
                      <IconButton color="primary" size="small" onClick={() => handleRoomDialogOpen(room)}>
                        <Edit />
                      </IconButton>
                      <IconButton color="error" size="small" onClick={() => handleRoomDelete(room.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* ──── User Management ──── */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h4">User Management</Typography>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleUserDialogOpen()}
            >
              Add User
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Created At</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id} hover>
                    <TableCell>{u.id}</TableCell>
                    <TableCell>{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Chip
                        label={u.role}
                        size="small"
                        color={u.role === 'admin' ? 'secondary' : 'default'}
                        variant={u.role === 'admin' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>{new Date(u.created_at).toLocaleDateString()}</TableCell>
                    <TableCell align="center">
                      <IconButton
                        color="primary"
                        size="small"
                        onClick={() => handleUserDialogOpen(u)}
                        disabled={u.id === user?.id}
                      >
                        <Edit />
                      </IconButton>
                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleUserDelete(u.id, u.username)}
                        disabled={u.id === user?.id}
                      >
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Container>

      {/* ──── Room Edit/Add Dialog ──── */}
      <Dialog
        open={roomDialogOpen}
        onClose={handleRoomDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          component: 'form',
          onSubmit: (e: React.FormEvent) => { e.preventDefault(); handleRoomSubmit(); },
        }}
      >
        <DialogTitle>{editingRoom ? 'Edit Room' : 'Add New Room'}</DialogTitle>
        <DialogContent>
          {error && tabValue === 0 && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Room Name"
              fullWidth
              required
              value={roomFormData.name}
              onChange={(e) => setRoomFormData(prev => ({ ...prev, name: e.target.value }))}
            />
            <TextField
              margin="dense"
              name="capacity"
              label="Capacity"
              type="number"
              fullWidth
              required
              value={roomFormData.capacity}
              onChange={(e) => setRoomFormData(prev => ({ ...prev, capacity: e.target.value }))}
            />
            <TextField
              margin="dense"
              name="location"
              label="Location"
              fullWidth
              value={roomFormData.location}
              onChange={(e) => setRoomFormData(prev => ({ ...prev, location: e.target.value }))}
            />
            <TextField
              margin="dense"
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={roomFormData.description}
              onChange={(e) => setRoomFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleRoomDialogClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {editingRoom ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ──── User Edit/Add Dialog ──── */}
      <Dialog
        open={userDialogOpen}
        onClose={handleUserDialogClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          component: 'form',
          onSubmit: (e: React.FormEvent) => { e.preventDefault(); handleUserSubmit(); },
        }}
      >
        <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
        <DialogContent>
          {error && tabValue === 1 && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              autoFocus
              margin="dense"
              name="username"
              label="Username"
              fullWidth
              required
              value={userFormData.username}
              onChange={handleUserInputChange}
            />
            <TextField
              margin="dense"
              name="email"
              label="Email Address"
              type="email"
              fullWidth
              required
              value={userFormData.email}
              onChange={handleUserInputChange}
            />
            <TextField
              margin="dense"
              name="password"
              label={
                editingUser
                  ? userFormData.role === 'admin'
                    ? 'New Password (required)'
                    : 'New Password (optional)'
                  : userFormData.role === 'admin'
                  ? 'Password *'
                  : 'Password'
              }
              type="password"
              fullWidth
              required={!editingUser && userFormData.role === 'admin'}
              value={userFormData.password}
              onChange={handleUserInputChange}
              helperText={
                editingUser
                  ? 'Leave blank to keep current password'
                  : userFormData.role === 'user'
                  ? 'Optional — users can log in via email without a password'
                  : 'Required for admin users'
              }
            />
            <TextField
              select
              margin="dense"
              name="role"
              label="Role"
              fullWidth
              value={userFormData.role}
              onChange={handleUserInputChange}
              SelectProps={{ native: true }}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </TextField>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUserDialogClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
