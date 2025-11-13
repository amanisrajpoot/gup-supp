# TeleClone

A smart, open-source Telegram clone that keeps high-value features while removing cruft. Built with React Native (client) and Go (server), designed for extensibility and performance.

> **Status**: MVP Server PoC Complete ✅ | Client Integration In Progress ⏳

## 🎯 Project Overview

TeleClone replicates Telegram's core features (cloud chats, groups, bots, file sharing, voice calls) while maintaining a clean, modular architecture. The project uses Telegram's open-source tooling (TDLib) where it speeds development and implements a custom server protocol optimized for MVP delivery.

**Key Principles:**
- ✅ High-value, high-usage features only
- ✅ Modular, testable, containerized codebase
- ✅ Bot API compatibility for easy bot migration
- ✅ Performance-first: < 300ms message delivery
- ❌ Removed: High-abuse features, legacy cruft

## 🚀 Features

### Phase 1: Foundation & Core Framework ✅
- [x] **Authentication System**
  - User registration with phone number verification
  - Login/logout functionality
  - OTP verification
  - Password reset
- [x] **Basic Navigation**
  - Stack navigation for auth flow
  - Tab navigation for main app
  - Deep linking support
- [x] **Core UI Components**
  - Chat list screen
  - Individual chat screen
  - Settings screen
  - Profile management
- [x] **State Management**
  - Redux Toolkit for state management
  - Redux Persist for data persistence
  - Type-safe actions and reducers

### Phase 2: Messaging & User Management (In Progress)
- [ ] **Real-time Messaging**
  - WebSocket integration
  - Message delivery status
  - Typing indicators
  - Message encryption
- [ ] **Contacts Management**
  - Phone contacts sync
  - User profiles with avatars
  - Contact search and filtering
- [ ] **Media Attachments**
  - Image sharing
  - Video sharing
  - Document sharing
  - Audio messages

### Phase 3: Privacy & Security (Planned)
- [ ] **End-to-End Encryption**
  - Signal Protocol implementation
  - Key exchange and management
  - Message encryption/decryption
- [ ] **Privacy Features**
  - Last seen controls
  - Read receipts
  - Profile photo privacy
  - Status privacy
- [ ] **Notifications**
  - Push notifications
  - Local notifications
  - Notification preferences

### Phase 4: Advanced Features (Planned)
- [ ] **Voice & Video Calls**
  - WebRTC integration
  - Call management
  - Call history
- [ ] **Group Chats**
  - Group creation and management
  - Group settings
  - Admin controls
- [ ] **Status Updates**
  - Stories functionality
  - Status sharing
  - Status privacy controls

## 🏗️ Architecture

### Clean Architecture Layers
```
src/
├── components/          # Reusable UI components
│   ├── common/         # Common components
│   ├── chat/           # Chat-specific components
│   ├── auth/           # Authentication components
│   ├── contacts/       # Contact management components
│   └── settings/       # Settings components
├── screens/            # Screen components
│   ├── auth/           # Authentication screens
│   ├── chat/           # Chat screens
│   ├── contacts/       # Contact screens
│   └── settings/       # Settings screens
├── navigation/         # Navigation configuration
├── services/           # Business logic layer
│   ├── api/            # API services
│   ├── storage/        # Local storage services
│   ├── encryption/     # Encryption services
│   └── notifications/  # Notification services
├── store/              # State management
│   ├── slices/         # Redux slices
│   └── selectors/      # State selectors
├── types/              # TypeScript type definitions
│   ├── api/            # API types
│   ├── ui/             # UI types
│   └── store/          # Store types
├── utils/              # Utility functions
├── constants/          # App constants
└── hooks/              # Custom React hooks
```

### Technology Stack
- **Frontend**: React Native 0.82.0
- **Language**: TypeScript
- **State Management**: Redux Toolkit + Redux Persist
- **Navigation**: React Navigation 6
- **UI Components**: Custom components with React Native Vector Icons
- **Storage**: AsyncStorage for local data
- **Networking**: Fetch API with custom service layer
- **Architecture**: Clean Architecture with MVVM pattern

## 🛠️ Development Setup

### Prerequisites
- Node.js >= 20.19.4 (currently using 20.12.2 with warnings)
- React Native CLI
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS dependencies)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd WhatsAppClone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup**
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Run the application**
   ```bash
   # iOS
   npx react-native run-ios
   
   # Android
   npx react-native run-android
   ```

### Development Commands

```bash
# Start Metro bundler
npx react-native start

# Run on iOS
npx react-native run-ios

# Run on Android
npx react-native run-android

# Run tests
npm test

# Lint code
npm run lint

# Type check
npx tsc --noEmit
```

## 📱 Screenshots

### Authentication Flow
- Login Screen with phone number and password
- Registration Screen with OTP verification
- Forgot Password Screen

### Main App
- Chats Tab with conversation list
- Individual Chat Screen with message bubbles
- Settings Screen with user profile
- Status and Calls tabs (placeholder)

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
API_BASE_URL=http://localhost:3000/api
WS_BASE_URL=ws://localhost:3000
```

### API Configuration
Update the API base URL in `src/constants/index.ts`:

```typescript
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000/api' 
  : 'https://your-production-api.com/api';
```

## 🧪 Testing

The project includes comprehensive testing setup:

```bash
# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e
```

## 📦 Build & Deployment

### iOS
```bash
# Build for iOS
npx react-native run-ios --configuration Release

# Archive for App Store
# Use Xcode to create archive
```

### Android
```bash
# Build APK
cd android
./gradlew assembleRelease

# Build AAB for Play Store
./gradlew bundleRelease
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React Native team for the amazing framework
- Redux team for state management
- React Navigation team for navigation
- All open source contributors

## 📞 Support

For support, email support@whatsappclone.com or create an issue in the repository.

---

**Note**: This is a clone project for educational purposes. WhatsApp is a trademark of Meta Platforms, Inc.