import React, { useState, useEffect, useCallback } from 'react';
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
  FormLabel,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { Add, Edit, Delete, ArrowBack, Upload, FileUpload, CloudUpload, Download } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { THEME_CHANGED_EVENT } from '../hooks/useTheme';

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
  active: boolean;
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
    active: true,
  });
  const [error, setError] = useState('');
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeSaved, setThemeSaved] = useState(false);
  const [paletteIndex, setPaletteIndex] = useState(0);
  const [textColorIndex, setTextColorIndex] = useState(0);

  const PALETTES = [
    { colors: ['#ABDEE6', '#CBAACB', '#FFFFB5', '#FFCCB6', '#F3B0C3'] },
    { colors: ['#C6DBDA', '#FEE1E8', '#FED7C3', '#F6EAC2', '#ECD5E3'] },
    { colors: ['#FF968A', '#FFAEA5', '#FFC5BF', '#FFD8BE', '#FFC8A2'] },
    { colors: ['#D4F0F0', '#8FCACA', '#CCE2CB', '#B6CFB6', '#97C1A9'] },
    { colors: ['#FCB9AA', '#FFDBCC', '#ECEAE4', '#A2E1DB', '#55CBCD'] },
  ];

  const TEXT_COLORS = ['#2B2B2B', '#4A4A4A', '#5C3D4D'];

  // State for file upload
  const [fileUploadDialogOpen, setFileUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    fetchData();
   }, []);

  const fetchTheme = useCallback(async () => {
    try {
      const res = await apiClient.getTheme();
      const theme = res.success ? res.data?.theme : null;
      if (theme) {
        setPaletteIndex(theme.paletteIndex ?? 0);
        setTextColorIndex(theme.textColorIndex ?? 0);
      }
    } catch (err) {
      console.error('Failed to fetch theme:', err);
    }
  }, []);

  useEffect(() => {
    fetchTheme();
  }, [fetchTheme]);

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
        active: u.active,
      });
    } else {
      setEditingUser(null);
      setUserFormData({ username: '', email: '', password: '', role: 'user', active: true });
    }
    setError('');
    setUserDialogOpen(true);
  };

  const handleUserDialogClose = () => {
    setUserDialogOpen(false);
    setEditingUser(null);
  };

  const handleUserInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setUserFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
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
        active: userFormData.active,
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

  const handleThemeSave = async () => {
    setThemeLoading(true);
    try {
      await apiClient.updateTheme(paletteIndex, textColorIndex);
      window.dispatchEvent(new Event(THEME_CHANGED_EVENT));
      setThemeSaved(true);
      setTimeout(() => setThemeSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save theme');
    } finally {
      setThemeLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!uploadFile) return;

    setUploading(true);
    setUploadProgress(0);
    setUploadError('');
    setUploadMessage('');

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', uploadFile);

      // Upload the file
      await apiClient.uploadUsers(uploadFile);

      setUploadMessage('File uploaded successfully!');
      setTimeout(() => {
        setFileUploadDialogOpen(false);
        setUploadMessage('');
        fetchData();
      }, 2000);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file type
      if (file.type === 'text/csv' ||
          file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
          file.name.endsWith('.csv') ||
          file.name.endsWith('.xlsx')) {
        setUploadFile(file);
        setUploadError('');
      } else {
        setUploadError('Please upload a CSV or Excel file');
      }
    }
  };

  const handleDownloadTemplate = async () => {
    // Build an API URL that works on both localhost and host-IP (LAN) access:
    //  - If VITE_API_URL is relative or unset → use same-origin /api (proxied by Vite/nginx)
    //  - If VITE_API_URL is absolute and points to localhost/127.0.0.1
    //    → rewrite the hostname to the current host so LAN access still resolves
    const envUrl = import.meta.env.VITE_API_URL;
    let apiUrl: string;
    if (!envUrl) {
      apiUrl = '/api';
    } else if (envUrl.startsWith('/')) {
      apiUrl = envUrl;
    } else {
      try {
        const u = new URL(envUrl);
        if (u.hostname === 'localhost' || u.hostname === '127.0.0.1') {
          apiUrl = `${u.protocol}//${window.location.hostname}:${u.port}${u.pathname}`;
        } else {
          apiUrl = envUrl;
        }
      } catch {
        apiUrl = envUrl;
      }
    }

    try {
      // Fetch as a blob so the browser actually downloads the file instead
      // of opening the JSON error response in a new tab. Falls back to the
      // server's Content-Disposition filename when available.
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiUrl}/users/template`, {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      });
      if (!response.ok) {
        let message = 'Failed to download template';
        try {
          const data = await response.json();
          message = data.error?.message || message;
        } catch {
          // response wasn't JSON — keep default message
        }
        throw new Error(message);
      }

      const disposition = response.headers.get('Content-Disposition') || '';
      const match = /filename="?([^"]+)"?/i.exec(disposition);
      const filename = match?.[1] || 'user-template.csv';

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || 'Failed to download template');
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
          <Box
            component="img"
            src="/logo.png"
            alt="Rollick"
            sx={{ height: 40, mr: 2 }}
          />
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
          <Tab label="Theme Settings" />
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
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<Download />}
                onClick={handleDownloadTemplate}
                sx={{ mr: 1 }}
              >
                Download Template
              </Button>
              <Button
                variant="outlined"
                startIcon={<Upload />}
                onClick={() => setFileUploadDialogOpen(true)}
              >
                Upload Users
              </Button>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleUserDialogOpen()}
              >
                Add User
              </Button>
            </Box>
          </Box>

          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Username</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
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
                    <TableCell>
                      <Chip
                        label={u.active ? 'Active' : 'Inactive'}
                        size="small"
                        color={u.active ? 'success' : 'error'}
                        variant="outlined"
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

        {/* ──── Theme Settings ──── */}
        <TabPanel value={tabValue} index={2}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              py: 2,
            }}
          >
            {/* Palette selector */}
            <Box>
              <FormLabel sx={{ mb: 1.5, display: 'block', fontWeight: 600 }}>
                Color Palette
              </FormLabel>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
                {PALETTES.map((palette, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setPaletteIndex(idx)}
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      p: 1.5,
                      borderRadius: 2,
                      border: paletteIndex === idx ? '2px solid #1976d2' : '2px solid transparent',
                      bgcolor: paletteIndex === idx ? 'rgba(25,118,210,0.06)' : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: '#90caf9',
                        bgcolor: 'rgba(25,118,210,0.04)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', gap: 0.5, mb: 1 }}>
                      {palette.colors.map((c, ci) => (
                        <Box
                          key={ci}
                          sx={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            backgroundColor: c,
                            border: '1px solid rgba(0,0,0,0.1)',
                          }}
                        />
                      ))}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      Palette {idx + 1}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Text color selector */}
            <Box>
              <FormLabel sx={{ mb: 1.5, display: 'block', fontWeight: 600 }}>
                Text Color
              </FormLabel>
              <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', justifyContent: 'center' }}>
                {TEXT_COLORS.map((color, idx) => (
                  <Box
                    key={idx}
                    onClick={() => setTextColorIndex(idx)}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      cursor: 'pointer',
                      p: 1,
                      borderRadius: 2,
                      border: textColorIndex === idx ? '2px solid #EB1170' : '2px solid transparent',
                      bgcolor: textColorIndex === idx ? 'rgba(235,17,112,0.06)' : 'transparent',
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: '#f48fb1',
                        bgcolor: 'rgba(235,17,112,0.04)',
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: color,
                        border: '2px solid rgba(0,0,0,0.15)',
                        flexShrink: 0,
                      }}
                    />
                    <Typography variant="body2" sx={{ color }}>
                      Aa
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Save button */}
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleThemeSave}
              disabled={themeLoading}
              sx={{ mt: 1 }}
            >
              {themeLoading ? <CircularProgress size={20} color="inherit" /> : 'Save Theme'}
            </Button>
          </Box>
        </TabPanel>
      </Container>

      {/* Snackbar */}
      <Snackbar
        open={themeSaved}
        autoHideDuration={3000}
        onClose={() => setThemeSaved(false)}
        message="Theme settings saved successfully!"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />

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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={userFormData.active}
                onChange={handleUserInputChange}
                style={{ marginTop: 8 }}
              />
              <label htmlFor="active" style={{ marginTop: 8 }}>
                <Typography variant="body2">Active Account</Typography>
              </label>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUserDialogClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            {editingUser ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ──── File Upload Dialog ──── */}
      <Dialog
        open={fileUploadDialogOpen}
        onClose={() => {
          setFileUploadDialogOpen(false);
          setUploadFile(null);
          setUploadError('');
          setUploadMessage('');
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Upload User List</DialogTitle>
        <DialogContent>
          {uploadError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setUploadError('')}>
              {uploadError}
            </Alert>
          )}
          {uploadMessage && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setUploadMessage('')}>
              {uploadMessage}
            </Alert>
          )}

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 3, textAlign: 'center' }}>
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Upload a CSV or Excel file containing user list
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                Expected columns: username, email, password (optional), role (optional), active (optional)
              </Typography>
              <Button
                variant="outlined"
                component="label"
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : 'Choose File'}
                <input
                  type="file"
                  hidden
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </Button>
              {uploadFile && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                  Selected: {uploadFile.name}
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setFileUploadDialogOpen(false);
            setUploadFile(null);
            setUploadError('');
            setUploadMessage('');
          }} disabled={uploading}>
            Cancel
          </Button>
          <Button
            onClick={handleFileUpload}
            variant="contained"
            disabled={!uploadFile || uploading}
            startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
