import { API_BASE_URL } from '../../constants';
import { AuthResponse, LoginRequest, RegisterRequest, VerifyOTPRequest, User } from '../../types/api';

class AuthService {
  private baseUrl = `${API_BASE_URL}/auth`;

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data: AuthResponse = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error during login');
    }
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data: AuthResponse = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error during registration');
    }
  }

  async verifyOTP(otpData: VerifyOTPRequest): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(otpData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'OTP verification failed');
      }

      const data: AuthResponse = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error during OTP verification');
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Token refresh failed');
      }

      const data: AuthResponse = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error during token refresh');
    }
  }

  async updateProfile(userData: Partial<User>, token: string): Promise<User> {
    try {
      const response = await fetch(`${this.baseUrl}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Profile update failed');
      }

      const data: User = await response.json();
      return data;
    } catch (error: any) {
      throw new Error(error.message || 'Network error during profile update');
    }
  }

  async logout(token: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Logout failed');
      }
    } catch (error: any) {
      // Don't throw error for logout, just log it
      console.warn('Logout error:', error.message);
    }
  }

  async sendOTP(phoneNumber: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error during OTP send');
    }
  }

  async forgotPassword(phoneNumber: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send password reset');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error during password reset');
    }
  }

  async resetPassword(phoneNumber: string, otp: string, newPassword: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, otp, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Password reset failed');
      }
    } catch (error: any) {
      throw new Error(error.message || 'Network error during password reset');
    }
  }
}

export const authService = new AuthService();
