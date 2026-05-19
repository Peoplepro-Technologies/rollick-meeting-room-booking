export interface User {
  id: number;
  username: string;
  role: 'user' | 'admin';
}

export interface Room {
  id: number;
  name: string;
  capacity: number;
  location?: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: number;
  room_id: number;
  user_id: number;
  title: string;
  start_time: string;
  end_time: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
  updated_at: string;
  username?: string;
  room_name?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}