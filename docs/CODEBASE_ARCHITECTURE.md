# safzan Data Frontend - Codebase Architecture Guide

## Overview

This document explains the complete architecture of the safzan Data Frontend, focusing on the authentication flow, API client, React Query integration, and notification service.

---

## 1. Architecture Layers

```
┌─────────────────────────────────────────────────┐
│          UI Components                          │
│  (LoginForm, RegisterForm, Dashboard)           │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Custom Hooks (React Query)             │
│  (useLogin, useRegister, useAuth, etc.)         │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Services Layer                         │
│  (authService, userService, etc.)               │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│      API Client (Axios + Interceptors)          │
│  - Request/Response handling                    │
│  - Token refresh logic                          │
│  - Cookie management (withCredentials)          │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│        Backend API (REST)                       │
└─────────────────────────────────────────────────┘
```

---

## 2. API Client Architecture (`lib/api-client.ts`)

### Core Concepts

#### Axios Instance

```typescript
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1",
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // 🔑 Critical: Sends cookies automatically
});
```

**Key Features:**

- `withCredentials: true` - Automatically sends HTTP-only cookies with every request
- Access token is stored in an HTTP-only cookie (secure, can't be accessed by JavaScript)
- Refresh token is also stored in an HTTP-only cookie

#### Token Refresh Flow

The API client implements an automatic token refresh mechanism:

1. **Initial Request**: Made with access token from HTTP-only cookie
2. **401 Response**: If access token is expired
   - Check if already refreshing (prevents duplicate refresh calls)
   - If not refreshing, trigger refresh endpoint
   - Queue any pending requests while refreshing
3. **Refresh Success**:
   - Backend sets new access token in HTTP-only cookie
   - Retry original request with new token
4. **Refresh Failure**:
   - Redirect to login page
   - Clear all state

```typescript
// Token refresh queue to handle concurrent requests
let isRefreshing = false;
let failedQueue = []; // Queue of pending requests during token refresh

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve();
  });
  failedQueue = [];
};
```

#### Protected Endpoints (No Token Refresh)

```typescript
const authEndpoints = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/password/forgot-password",
  "/password/reset-password",
];
```

These endpoints don't trigger token refresh on 401 because they're for auth operations.

---

## 3. Authentication Service (`services/auth.service.ts`)

The service layer provides clean API methods:

```typescript
export const authService = {
  register: async (data: RegisterRequest) => ApiResponse<AuthResponse>,
  login: async (data: LoginRequest) => ApiResponse<AuthResponse>,
  logout: async () => ApiResponse,
  getProfile: async () => User | null,
  refreshToken: async () => ApiResponse<{ accessToken: string }>,
  forgotPassword: async (data: ForgotPasswordRequest) => ApiResponse,
  resetPassword: async (data: ResetPasswordRequest) => ApiResponse,
  updatePassword: async (data: UpdatePasswordRequest) => ApiResponse,
};
```

All methods use the `apiClient` which handles token refresh automatically.

---

## 4. React Query Integration (`lib/react-query.ts` & `hooks/useAuth.ts`)

### QueryClient Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - how long data is "fresh"
      refetchOnWindowFocus: false, // Don't refetch when window regains focus
      retry: 1, // Retry failed queries once
    },
    mutations: {
      retry: false, // Don't retry mutations
    },
  },
});
```

### Authentication Hooks

#### `useCurrentUser()`

Fetches the current logged-in user profile:

```typescript
export const useCurrentUser = () => {
  return useQuery({
    queryKey: authKeys.currentUser(), // Cache key: ["auth", "current-user"]
    queryFn: authService.getProfile,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
  });
};
```

#### `useAuth()`

Custom hook for authentication state and permission checks:

```typescript
const {
  user, // Current user object
  isLoading, // Loading state
  isError, // Error state
  isAuthenticated, // true if user exists and not suspended
  isAdmin, // User is admin
  isSuspended, // User is suspended
  isVerified, // User email verified
  hasPermission, // Check specific permission
  hasRole, // Check user role
} = useAuth();
```

#### `useLogin()`

Handles user login with React Query mutation:

```typescript
const useLogin = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) => authService.login(data),
    onSuccess: async (data) => {
      // 1. Update React Query cache with user data
      queryClient.setQueryData(authKeys.currentUser(), data.data?.user);

      // 2. Register FCM token (fire-and-forget, non-blocking)
      registerFcmToken("web").catch(console.warn);

      // 3. Navigate based on role
      if (data.data?.user?.role === "admin") {
        router.push("/admin/dashboard");
      } else {
        router.push("/dashboard");
      }
    },
  });
};
```

**Flow:**

1. User submits login form
2. `loginMutation.mutate(payload)` called
3. Backend validates and returns `{ accessToken, refreshToken, user }`
4. Frontend caches user data
5. FCM token registered for push notifications
6. Navigation redirects to dashboard

#### `useRegister()`

Similar to login but for new user registration:

```typescript
const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.currentUser(), data.data?.user);
      // Navigate to appropriate dashboard
    },
  });
};
```

#### `useLogout()`

Clears user data and redirects:

```typescript
const useLogout = () => {
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      queryClient.clear(); // Clear all cached data
      router.push("/login");
    },
  });
};
```

---

## 5. Login/Registration Flow

### Complete Login Flow

```
┌────────────────────────────────────────────────────────┐
│ User visits /login and sees LoginForm component        │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│ LoginForm (React Hook Form + Zod validation)           │
│ - Validates email/phone + password                     │
│ - Calls useLogin() mutation on submit                  │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│ loginMutation.mutate({ email/phone, password })        │
│ (triggers React Query mutation)                        │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│ authService.login(data)                                │
│ → apiClient.post("/auth/login", data)                  │
│ → Axios sends request with cookies (withCredentials)   │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│ Backend Response:                                       │
│ {                                                       │
│   success: true,                                        │
│   data: {                                               │
│     accessToken: "eyJhbGc...",                          │
│     refreshToken: "eyJhbGc...",                         │
│     user: { userId, email, role, ... }                 │
│   }                                                     │
│ }                                                       │
│ Backend also sets HTTP-only cookies                    │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│ onSuccess callback executes:                           │
│ 1. Cache user data: queryClient.setQueryData(...)      │
│ 2. Register FCM token: registerFcmToken("web")         │
│ 3. Navigate: router.push("/dashboard")                 │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│ User is now authenticated and viewing dashboard        │
│ All subsequent API calls include access token cookie   │
└────────────────────────────────────────────────────────┘
```

### Key Security Points

1. **HTTP-Only Cookies**:
   - Tokens stored in HTTP-only cookies (can't be accessed by JavaScript)
   - Automatically sent with every request
   - Protected against XSS attacks

2. **Automatic Token Refresh**:
   - Access token expires regularly
   - On 401, client automatically refreshes
   - User doesn't need to log in again

3. **CSRF Protection**:
   - Cookies sent with `withCredentials: true`
   - Backend validates CSRF tokens

4. **Form Validation**:
   - Client-side validation with Zod
   - Backend also validates and returns field-specific errors

---

## 6. Notification Service (`services/notification.service.ts`)

### FCM Token Registration

```typescript
export async function registerFcmToken(platform = "web"): Promise<boolean> {
  try {
    // 1. Register service worker
    await registerServiceWorker();

    // 2. Request browser notification permission
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;
    const token = await requestAndGetFcmToken(vapidKey);

    // 3. Send token to backend
    const response = await apiClient.post("/notifications/tokens", {
      token,
      platform,
    });

    // Token is automatically included in HTTP-only cookie
    // No need to manually attach it

    return response.status < 300;
  } catch (err) {
    console.error("FCM registration failed:", err);
    return false;
  }
}
```

### Integration with Login

The FCM token registration is called after successful login:

```typescript
// In useLogin mutation
onSuccess: async (data) => {
  // ... cache user data, navigate ...

  // Fire-and-forget FCM registration (non-blocking)
  registerFcmToken("web").catch((err) => {
    console.warn("FCM failed (non-critical):", err);
  });
};
```

**Why Non-Blocking?**

- User should reach dashboard immediately after login
- FCM is for push notifications (non-critical feature)
- If registration fails, user can still use the app
- Retried on next app interaction if needed

### Push Notification Flow

```
┌────────────────────────────────────┐
│ User grants notification permission │
└────────────────────────────────────┘
                ↓
┌────────────────────────────────────┐
│ Browser generates FCM token        │
└────────────────────────────────────┘
                ↓
┌────────────────────────────────────┐
│ Frontend sends token to backend     │
│ POST /notifications/tokens          │
└────────────────────────────────────┘
                ↓
┌────────────────────────────────────┐
│ Backend stores FCM token in DB      │
│ Associated with user account        │
└────────────────────────────────────┘
                ↓
┌────────────────────────────────────┐
│ Backend can now send push          │
│ notifications to user's device     │
└────────────────────────────────────┘
```

---

## 7. Type Definitions

### API Response Types

```typescript
interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}

interface ErrorResponse {
  success: boolean;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}
```

### Authentication Types

```typescript
interface LoginRequest {
  password: string;
  email?: string; // Either email
  phone?: string; // Or phone
}

interface RegisterRequest {
  email: string;
  password: string;
  phoneNumber: string;
  fullName?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

interface User {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  role: string; // "user" | "admin"
  isSuspended: boolean;
  isVerified: boolean;
  twoFactorEnabled: boolean;
  accountNumber: string;
  providerName: string;
  balance: string;
  profilePictureUrl?: string;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}
```

---

## 8. Data Flow Summary

### Request Flow

```
Component (LoginForm)
  ↓
Hook (useLogin)
  ↓
Service (authService.login)
  ↓
API Client (apiClient.post)
  ↓
Axios Interceptor (adds cookies)
  ↓
Backend API
```

### Response Flow

```
Backend API
  ↓
Response with tokens in Set-Cookie headers
  ↓
Axios Interceptor (response)
  ↓
Service returns ApiResponse
  ↓
Hook onSuccess callback (cache user, register FCM, navigate)
  ↓
Component updates (reflects in UI)
  ↓
User redirected to dashboard
```

### Token Refresh Flow

```
Component makes API request
  ↓
Request sent with access token from HTTP-only cookie
  ↓
Backend returns 401 (token expired)
  ↓
API Client intercepts 401
  ↓
Checks if already refreshing (prevents duplicates)
  ↓
Calls /auth/refresh endpoint
  ↓
Backend validates refresh token, returns new access token
  ↓
Backend sets new token in Set-Cookie header
  ↓
Original request automatically retried with new token
  ↓
Request succeeds
```

---

## 9. Key Design Patterns

### 1. **Separation of Concerns**

- Components: UI and user interaction
- Hooks: State management and business logic
- Services: API communication
- API Client: HTTP handling and interceptors

### 2. **Cache Management**

- React Query handles all data caching
- Query keys ensure proper invalidation
- `staleTime` vs `gcTime` for smart caching

### 3. **Error Handling**

- API client handles 401 and token refresh
- Services handle API errors
- Hooks provide error state for components
- Components display error messages to users

### 4. **Security**

- HTTP-only cookies for tokens
- CSRF protection via cookies
- No tokens in localStorage (vulnerable to XSS)
- Automatic token refresh without user interaction

### 5. **Non-Blocking Operations**

- FCM registration is fire-and-forget
- Doesn't block user navigation
- Retry on next interaction if needed

---

## 10. Usage Examples

### Login Component

```tsx
const LoginForm = () => {
  const loginMutation = useLogin();

  const onSubmit = (credentials) => {
    loginMutation.mutate(credentials);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields */}
      <Button disabled={loginMutation.isPending}>
        {loginMutation.isPending ? "Logging in..." : "Login"}
      </Button>
      {loginMutation.isError && (
        <Alert>{loginMutation.error.response.data.message}</Alert>
      )}
    </form>
  );
};
```

### Protected Component

```tsx
const Dashboard = () => {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" />;

  return <div>Welcome, {user.fullName}!</div>;
};
```

### API Request in Hook

```tsx
const { data: posts, isLoading } = useQuery({
  queryKey: ["posts"],
  queryFn: () => apiClient.get("/posts"),
  // Token automatically included via withCredentials
});
```

---

## 11. Environment Configuration

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_vapid_key_here
```

---

## Summary

The codebase follows a clean architecture pattern:

1. **API Client** handles all HTTP communication with automatic token refresh
2. **Services** provide high-level API methods
3. **React Query** manages all data caching and state
4. **Custom Hooks** combine services and React Query for easy component usage
5. **Components** are clean and focused on UI
6. **Notifications** are registered non-blockingly after login
7. **Security** is built-in with HTTP-only cookies and automatic token refresh

This design ensures:

- ✅ Secure authentication (HTTP-only cookies)
- ✅ Seamless token refresh (automatic, transparent)
- ✅ Efficient data caching (React Query)
- ✅ Clean code architecture (separation of concerns)
- ✅ Good user experience (non-blocking operations)
- ✅ Maintainability (reusable hooks and services)
