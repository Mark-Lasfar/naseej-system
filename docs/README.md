
# Naseej Chat System - Complete Documentation

## 🚀 Overview

Naseej Chat System is a real-time messaging platform integrated within the Naseej marketplace. It provides instant communication between buyers and sellers with features like voice messages, read receipts, typing indicators, and online status.



  <img width="600" alt="Chat System Architecture" src="https://github.com/user-attachments/assets/c17e6230-449d-4440-aeea-87e17c8a0dfc" />

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| **Real-time Messaging** | Instant message delivery using WebSocket technology |
| **Floating Chat Bubble** | Draggable chat window accessible from any page |
| **Voice Messages** | Record and send voice messages (up to 60 seconds) |
| **Read Receipts** | Know when your messages are read |
| **Typing Indicators** | See when someone is typing |
| **Online Status** | Real-time online/offline status |
| **Unread Badge** | Notification badge with unread count |
| **Reply to Messages** | Quote and reply to specific messages |
| **Delete Messages** | Remove your own messages |
| **Emoji Support** | Full emoji picker integration |
| **Sound Notifications** | Customizable sound alerts |
| **Desktop Notifications** | Browser push notifications |

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (React)                          │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    ChatBubble Component                  │    │
│  │  • Floating draggable interface                         │    │
│  │  • Message list with proper alignment                   │    │
│  │  • Voice recorder integration                           │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ↓               ↓               ↓
┌─────────────────────┐ ┌─────────────────────────────────────────┐
│  Socket.IO Server   │ │           Main Backend API              │
│  (Hugging Face)     │ │  • REST API                            │
│                     │ │  • MongoDB                             │
│  • WebSocket        │ │  • Authentication                      │
│  • Real-time events │ │  • File uploads                        │
└─────────────────────┘ └─────────────────────────────────────────┘
```

## 📊 Database Schema

### Conversation Schema
| Field | Type | Description |
|-------|------|-------------|
| `participants` | Array | User IDs in the conversation |
| `lastMessage` | Object | Last message content and metadata |
| `unreadCount` | Number | Total unread messages |
| `settings` | Object | Conversation-specific settings |

### Message Schema
| Field | Type | Description |
|-------|------|-------------|
| `conversationId` | ObjectId | Reference to conversation |
| `senderId` | ObjectId | User who sent the message |
| `receiverId` | ObjectId | User who receives the message |
| `text` | String | Message content |
| `type` | String | text / image / audio / video |
| `mediaUrl` | String | URL for media files |
| `isRead` | Boolean | Read status |
| `replyTo` | ObjectId | Reference to replied message |

## 🔄 Message Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  User A  │───▶│  Client  │───▶│ Socket.IO│───▶│  User B  │
│  Sends   │    │  sends   │    │ forwards │    │ receives │
│  Message │    │  message │    │  message │    │  message │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
                    │                 │
                    ▼                 ▼
              ┌──────────┐     ┌──────────┐
              │  Stores  │     │  Stores  │
              │   in DB  │     │   in DB  │
              └──────────┘     └──────────┘
```

## 🎨 User Interface Components

### 1. Floating Chat Bubble
- **Location**: Bottom-right corner (draggable)
- **Features**: 
  - Drag to reposition
  - Shows unread count badge
  - Animated pulse on new messages
  - Toggle to open/close chat window

### 2. Chat Sidebar
- **Content**: List of all conversations
- **Features**:
  - Online status indicator
  - Last message preview
  - Unread count per conversation
  - Seller store logo display

### 3. Chat Window
- **Sections**:
  - Header: User info, online status, mute button
  - Messages area: Conversation history
  - Input area: Text input, emoji picker, voice recorder

### 4. Message Bubble
- **Own messages**: Right-aligned, gradient background
- **Other messages**: Left-aligned, white background
- **Features**:
  - Reply preview
  - Timestamp
  - Read receipt status
  - Delete option (own messages only)

## 🎵 Sound System

| Event | Sound Type | Description |
|-------|------------|-------------|
| New Message | Notification | Soft bell sound |
| Send Message | Send tone | Short confirmation tone |
| Voice Recording | Record tone | Indicates recording started/stopped |

## 📱 Responsive Design

| Device | Chat Window Size | Position |
|--------|-----------------|----------|
| Desktop | 380px × 550px | Bottom-right |
| Tablet | 400px × 600px | Bottom-right |
| Mobile | Full width (minus 16px) | Bottom center |

## 🔐 Security Features

- **Authentication**: JWT token validation
- **Authorization**: Users can only access their conversations
- **Message Privacy**: End-to-end encryption considerations
- **Rate Limiting**: Prevent spam and abuse

## 🚀 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel (Frontend)                       │
│  • React application                                            │
│  • ChatBubble component                                         │
│  • Static assets                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Hugging Face Spaces (Socket.IO)              │
│  • WebSocket server                                             │
│  • Real-time event handling                                     │
│  • Connection management                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Main Backend (Hugging Face)                   │
│  • REST API                                                     │
│  • MongoDB database                                             │
│  • Authentication                                               │
│  • File uploads (Cloudinary)                                   │
└─────────────────────────────────────────────────────────────────┘
```

## 📊 Performance Metrics

| Metric | Value |
|--------|-------|
| Message delivery time | < 100ms |
| Voice message upload | 1-2 seconds |
| Connection reconnection | Automatic (3 attempts) |
| Polling interval | 15 seconds (background) |

## 🎯 Use Cases

### 1. Customer Support
- Buyers can ask questions before purchasing
- Sellers can respond quickly

### 2. Order Negotiation
- Discuss custom orders
- Share images of products

### 3. Post-Sale Support
- Track order status
- Report issues

## 🛠️ Technologies Used

| Category | Technology |
|----------|------------|
| Frontend | React 18, Tailwind CSS |
| Real-time | Socket.IO Client |
| Backend API | Node.js, Express |
| Database | MongoDB |
| WebSocket | Socket.IO Server |
| Hosting | Vercel, Hugging Face Spaces |
| Authentication | JWT |
| File Storage | Cloudinary |

## 📈 Future Enhancements

- [ ] Video calls
- [ ] File sharing
- [ ] Message search
- [ ] Chat archiving
- [ ] Typing animations
- [ ] Custom themes
- [ ] Message reactions (👍, ❤️, etc.)
- [ ] Group chats
- [ ] Message scheduling

## 📝 License

ISC License - See LICENSE file for details

## 👥 Contributors

- Naseej Development Team

---

*Documentation version: 2.0.0*
*Last updated: April 2026*
