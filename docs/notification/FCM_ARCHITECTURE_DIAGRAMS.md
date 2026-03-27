# FCM Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        safzan DATA FRONTEND                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────┐        │
│  │          COMPONENTS & PAGES                                 │        │
│  ├─────────────────────────────────────────────────────────────┤        │
│  │ - LoginForm → useLogin()                                    │        │
│  │ - RegisterForm → useRegister()                              │        │
│  │ - LogoutButton → useLogout()                                │        │
│  │ - RootLayout → useSyncFcmOnMount()                          │        │
│  └────────────────────┬────────────────────────────────────────┘        │
│                       │                                                  │
│  ┌────────────────────▼────────────────────────────────────────┐        │
│  │          CUSTOM HOOKS (React Query)                         │        │
│  ├─────────────────────────────────────────────────────────────┤        │
│  │ ┌──────────────────────────────────────────────────────┐   │        │
│  │ │ useAuth()                                            │   │        │
│  │ │ - Returns user state, permissions, role checks      │   │        │
│  │ │ - Queries: GET /user/profile/me                     │   │        │
│  │ └──────────────────────────────────────────────────────┘   │        │
│  │                                                             │        │
│  │ ┌──────────────────────────────────────────────────────┐   │        │
│  │ │ useRegister()                                        │   │        │
│  │ │ - Mutation: POST /auth/register                     │   │        │
│  │ │ - onSuccess → syncFcmToken("web") → navigate        │   │        │
│  │ └──────────────────────────────────────────────────────┘   │        │
│  │                                                             │        │
│  │ ┌──────────────────────────────────────────────────────┐   │        │
│  │ │ useLogin()                                           │   │        │
│  │ │ - Mutation: POST /auth/login                        │   │        │
│  │ │ - onSuccess → syncFcmToken("web") → navigate        │   │        │
│  │ └──────────────────────────────────────────────────────┘   │        │
│  │                                                             │        │
│  │ ┌──────────────────────────────────────────────────────┐   │        │
│  │ │ useLogout()                                          │   │        │
│  │ │ - Mutation: unlinkFcmToken() → logout() → navigate  │   │        │
│  │ └──────────────────────────────────────────────────────┘   │        │
│  │                                                             │        │
│  │ ┌──────────────────────────────────────────────────────┐   │        │
│  │ │ useSyncFcmOnMount() [NEW]                           │   │        │
│  │ │ - useEffect: if user && !loading → syncFcmToken()  │   │        │
│  │ └──────────────────────────────────────────────────────┘   │        │
│  └────────────────────┬────────────────────────────────────────┘        │
│                       │                                                  │
│  ┌────────────────────▼────────────────────────────────────────┐        │
│  │          SERVICES LAYER                                     │        │
│  ├─────────────────────────────────────────────────────────────┤        │
│  │ ┌──────────────────────────────────────────────────────┐   │        │
│  │ │ authService                                          │   │        │
│  │ │ - register() → POST /auth/register                   │   │        │
│  │ │ - login() → POST /auth/login                         │   │        │
│  │ │ - logout() → POST /auth/logout                       │   │        │
│  │ │ - getProfile() → GET /user/profile/me                │   │        │
│  │ │ - refreshToken() → POST /auth/refresh                │   │        │
│  │ └──────────────────────────────────────────────────────┘   │        │
│  │                                                             │        │
│  │ ┌──────────────────────────────────────────────────────┐   │        │
│  │ │ notificationService [ENHANCED]                       │   │        │
│  │ │ ┌─────────────────────────────────────────────────┐  │   │        │
│  │ │ │ syncFcmToken(platform)                          │  │   │        │
│  │ │ │ ✅ Main function - Smart token syncing           │  │   │        │
│  │ │ │ 1. Register service worker                       │  │   │        │
│  │ │ │ 2. Get FCM token from Firebase                   │  │   │        │
│  │ │ │ 3. Check localStorage for last sent token       │  │   │        │
│  │ │ │ 4. Only send to API if different                │  │   │        │
│  │ │ │ 5. Save to localStorage                          │  │   │        │
│  │ │ │ → POST /notifications/register-token             │  │   │        │
│  │ │ └─────────────────────────────────────────────────┘  │   │        │
│  │ │                                                       │   │        │
│  │ │ ┌─────────────────────────────────────────────────┐  │   │        │
│  │ │ │ unlinkFcmToken() [NEW]                          │  │   │        │
│  │ │ │ ⚠️  CRITICAL - Remove token on logout            │  │   │        │
│  │ │ │ 1. Read token from localStorage                 │  │   │        │
│  │ │ │ 2. Send to backend for deletion                 │  │   │        │
│  │ │ │ 3. Clear localStorage                            │  │   │        │
│  │ │ │ → POST /notifications/unlink-token              │  │   │        │
│  │ │ │ Prevents: Next user gets old user's alerts      │  │   │        │
│  │ │ └─────────────────────────────────────────────────┘  │   │        │
│  │ │                                                       │   │        │
│  │ │ ┌─────────────────────────────────────────────────┐  │   │        │
│  │ │ │ requestNotificationPermission()                 │  │   │        │
│  │ │ │ - Request browser notification permission      │  │   │        │
│  │ │ └─────────────────────────────────────────────────┘  │   │        │
│  │ │                                                       │   │        │
│  │ │ ┌─────────────────────────────────────────────────┐  │   │        │
│  │ │ │ areNotificationsEnabled()                       │  │   │        │
│  │ │ │ - Check permission status                       │  │   │        │
│  │ │ └─────────────────────────────────────────────────┘  │   │        │
│  │ └──────────────────────────────────────────────────────┘   │        │
│  └────────────────────┬────────────────────────────────────────┘        │
│                       │                                                  │
│  ┌────────────────────▼────────────────────────────────────────┐        │
│  │          API CLIENT (Axios)                                │        │
│  ├─────────────────────────────────────────────────────────────┤        │
│  │ - baseURL: NEXT_PUBLIC_API_URL/v1                           │        │
│  │ - withCredentials: true (sends HTTP-only cookies)           │        │
│  │ - Request Interceptor: Sets headers                         │        │
│  │ - Response Interceptor:                                     │        │
│  │   ├─ 401? → Try refresh token                              │        │
│  │   ├─ Success? → Retry original request                     │        │
│  │   └─ Fail? → Redirect to /login                            │        │
│  └────────────────────┬────────────────────────────────────────┘        │
│                       │                                                  │
└───────────────────────┼──────────────────────────────────────────────────┘
                        │
         ┌──────────────┼──────────────┐
         │              │              │
         ▼              ▼              ▼
    ┌────────┐   ┌─────────────┐  ┌──────────┐
    │Firebase│   │   Backend   │  │localStorage
    │Messaging     │   API      │  │
    │ (FCM)       │             │  │ Token tracking
    └────────┘   └─────────────┘  └──────────┘
```

---

## Data Flow: Registration

```
┌────────────────────┐
│  RegisterForm      │
│  - fullName        │
│  - email           │
│  - phone           │
│  - password        │
└────────┬───────────┘
         │ submit
         ▼
┌─────────────────────────────┐
│ useRegister() mutation      │
│ mutationFn() ──────────────→ authService.register()
└────────────┬────────────────┘
             │
             ▼ Backend validates
      ┌───────────────┐
      │ Backend API   │
      │ POST /auth/   │
      │   register    │
      └───────┬───────┘
              │ Returns: { accessToken, refreshToken, user }
              ▼
   ┌────────────────────────┐
   │ onSuccess callback     │
   ├────────────────────────┤
   │ 1. Cache user data     │  ← queryClient.setQueryData()
   │ 2. Sync FCM token      │  ← syncFcmToken("web")
   │ 3. Navigate            │  ← router.push("/dashboard")
   └───┬────────────────────┘
       │
       ├─→ syncFcmToken("web")
       │   ├─ registerServiceWorker()
       │   ├─ getTokenFromFirebase()
       │   ├─ Check localStorage
       │   ├─ POST /notifications/register-token
       │   └─ Save to localStorage
       │
       └─→ Dashboard page

Browser localStorage:
├─ last_fcm_token: "abc123xyz..."
└─ fcm_token_timestamp: "1700000000000"

Backend Database:
├─ User record created
├─ userId → encrypted password
└─ FCM Tokens table:
   └─ userId_123 → token_abc123xyz
```

---

## Data Flow: Login

```
┌────────────────────┐
│  LoginForm         │
│ - email/phone      │
│ - password         │
└────────┬───────────┘
         │ submit
         ▼
┌──────────────────────┐
│ useLogin() mutation  │
│ mutationFn() ──────→ authService.login()
└────────┬─────────────┘
         │
         ▼ Backend validates
  ┌────────────────┐
  │  Backend API   │
  │ POST /auth/    │
  │   login        │
  └────────┬───────┘
           │ Returns: { accessToken, refreshToken, user }
           ▼
 ┌──────────────────────────┐
 │ onSuccess callback       │
 ├──────────────────────────┤
 │ 1. Cache user data       │  ← queryClient.setQueryData()
 │ 2. Sync FCM token        │  ← syncFcmToken("web")
 │ 3. Navigate              │  ← router.push("/dashboard")
 └───┬──────────────────────┘
     │
     └─→ syncFcmToken("web")
         ├─ getTokenFromFirebase() → "new_token_xyz"
         ├─ getLastSentToken() from localStorage
         │  ├─ If localStorage has "old_token_abc"
         │  ├─ Compares: new_token_xyz !== old_token_abc
         │  └─ Different! Send to backend
         ├─ POST /notifications/register-token
         │  {
         │    token: "new_token_xyz",
         │    platform: "web"
         │  }
         └─ Save to localStorage: "new_token_xyz"

Browser localStorage (UPDATED):
├─ last_fcm_token: "new_token_xyz..."
└─ fcm_token_timestamp: "1700001234567"

Backend Database (UPDATED):
├─ User authenticated with tokens in cookies
└─ FCM Tokens table:
   ├─ userId_123 → token_new_token_xyz
   └─ (old token removed/replaced)
```

---

## Data Flow: App Open (User Already Logged In)

```
┌──────────────────┐
│ User opens app   │
│ (already logged  │
│ in from before)  │
└────────┬─────────┘
         │
         ▼
┌────────────────────────┐
│ RootLayout renders     │
│ useSyncFcmOnMount()    │
└────────┬───────────────┘
         │
         ▼
┌───────────────────────────────┐
│ useEffect runs:               │
│ • useAuth() → user exists     │
│ • !isLoading → auth complete  │
│ → syncFcmToken("web")         │
└────────┬──────────────────────┘
         │
         ▼
┌────────────────────────┐
│ syncFcmToken()         │
├────────────────────────┤
│ 1. Get FCM from        │
│    Firebase            │
│    → "same_token_xyz"  │
│                        │
│ 2. Check localStorage  │
│    → "same_token_xyz"  │
│                        │
│ 3. Compare:            │
│    same === same       │
│    ✅ MATCH!          │
│                        │
│ 4. Skip API call ✨    │
│    (no redundant send) │
│                        │
│ 5. Return true         │
└────────────────────────┘
         │
         ▼
   ✅ App ready
   ✅ No wasted API call
   ✅ Token already synced
```

---

## Data Flow: Logout

```
┌──────────────────────┐
│ User clicks Logout   │
└────────┬─────────────┘
         │
         ▼
┌──────────────────────────┐
│ useLogout() mutation     │
│ triggered               │
└────────┬─────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ mutationFn() executed:         │
│ 1. unlinkFcmToken() called    │
│ 2. authService.logout()       │
│    (sequential - first one     │
│     must complete)             │
└────┬───────────────────────────┘
     │
     ├─→ unlinkFcmToken()
     │   ├─ Read from localStorage
     │   │  → "same_token_xyz"
     │   ├─ POST /notifications/
     │   │      unlink-token
     │   │  {
     │   │    token: "same_token_xyz"
     │   │  }
     │   ├─ Backend deletes mapping
     │   │  userId_123 → (removed)
     │   └─ Clear localStorage
     │      ├─ Remove last_fcm_token
     │      └─ Remove fcm_token_timestamp
     │
     └─→ authService.logout()
         ├─ POST /auth/logout
         ├─ Backend clears
         │  └─ HTTP-only cookies
         └─ Returns response
             │
             ▼
         ┌──────────────────────┐
         │ onSuccess callback   │
         ├──────────────────────┤
         │ • queryClient.clear()│
         │ • router.push(       │
         │   "/login"           │
         │ )                    │
         └──────────────────────┘
             │
             ▼
        ✅ User logged out
        ✅ Token removed
        ✅ Device cleaned
        ✅ Ready for next user

Browser localStorage (CLEARED):
├─ last_fcm_token: (deleted)
└─ fcm_token_timestamp: (deleted)

Backend Database (CLEANED):
├─ User no longer has session
└─ FCM Tokens table:
   └─ userId_123 → (deleted)
      ↑
      No more notifications
      will go to this token
```

---

## localStorage Optimization Diagram

```
┌─────────────────────────────────────────────────────────────┐
│              localStorage Smart Checking                   │
└─────────────────────────────────────────────────────────────┘

Scenario: User logs in, closes browser, opens next day

Day 1 Login:
┌──────────────────┐
│ syncFcmToken()   │
├──────────────────┤
│ Firebase:        │
│ "token_abc123"   │
│                  │
│ localStorage:    │
│ (empty - first   │
│  time)           │
│                  │
│ Action:          │
│ 💾 Save to API  │
│ 💾 Save to      │
│    localStorage  │
└──────────────────┘

Browser closes...

Day 2 App Open:
┌──────────────────┐
│ useSyncFcmOnMount│
│ syncFcmToken()   │
├──────────────────┤
│ Firebase:        │
│ "token_abc123"   │
│ (same as day 1)  │
│                  │
│ localStorage:    │
│ "token_abc123"   │
│ (from day 1)     │
│                  │
│ Comparison:      │
│ abc123 ===       │
│ abc123?          │
│ YES! ✅         │
│                  │
│ Action:          │
│ ⏭️  Skip API    │
│    (already      │
│     synced)      │
└──────────────────┘

Network tab result:
Request 1: ✅ API call made (token registered)
Request 2: ✅ API call SKIPPED (smart check prevented it)
           ↑
           This is the optimization!
           Reduces server load
           Improves response time
```

---

## Error Handling Flow

```
┌─────────────────────────────────┐
│ Any FCM Operation               │
│ (sync, unlink, etc)             │
└────────────┬────────────────────┘
             │
             ▼ try/catch
    ┌─────────────────┐
    │ Success?        │
    ├────────┬────────┤
    │Yes     │No      │
    ▼        ▼
   ✅      ⚠️ Error caught
   Log     console.error()
   success console.warn()
   Return  (fire-and-forget)
   true    Return false

Key: Never blocks user action
     Always logs for debugging
     Graceful fallback
```

---

## Summary: Complete Lifecycle

```
USER JOURNEY:

Registration ─→ Login ──→ App Open → ... → Logout
     │            │          │              │
     └──────┬─────┴────┬─────┴──────────────┘
            │          │
     syncFcmToken()   useSyncFcmOnMount()    unlinkFcmToken()
     ✅ Setup         ✅ Verify              ✅ Cleanup
     device          device sync            security
     linking         on reopens


DETAILED STATE:

Register  → 📱 Device linked to new user account
             ✅ Can receive notifications

Login     → 📱 Device linked to this user account
             ✅ Can receive notifications

App Open  → 📱 Token refreshed (if needed)
             ✅ Device still linked and valid

Logout    → 📱 Device unlinked from user
             ✅ Ready for next user
             ✅ Old user won't get new alerts
```
