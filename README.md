# 📱 Tóm tắt Frontend Chat App

## ✅ Đã hoàn thành

### 1. **Cấu trúc Thư mục** 📁

```
client/src/
├── components/
│   ├── Sidebar.jsx          # Sidebar hiển thị danh sách users
│   ├── ChatContainer.jsx    # Container hiển thị tin nhắn
│   └── MessageInput.jsx     # Input để gửi tin nhắn & hình ảnh
├── pages/
│   ├── Login.jsx           # Trang đăng nhập
│   ├── Signup.jsx          # Trang đăng ký
│   ├── Home.jsx            # Trang chính (chat)
│   └── Profile.jsx         # Trang cập nhật profile
├── hooks/
│   ├── useAuth.js          # Hook quản lý authentication
│   └── useChat.js          # Hook quản lý chat & messages
├── lib/
│   └── api.js              # Tất cả API calls
├── context/
│   └── AuthContext.jsx     # Context cho authentication
└── App.jsx                 # Main app với routing
```

### 2. **API Integration** 🔌

File `lib/api.js` chứa tất cả các API calls:

#### Auth APIs:
- `signup(userData)` → `POST /api/auth/signup`
- `login(credentials)` → `POST /api/auth/login`
- `checkAuth()` → `GET /api/auth/check-auth`
- `updateProfile(profileData)` → `PUT /api/auth/update-profile`

#### Message APIs:
- `getAllUsers()` → `GET /api/messages/users`
- `getMessages(userId)` → `GET /api/messages/:id`
- `sendMessage(userId, message)` → `POST /api/messages/send/:id`
- `markMessagesAsSeen(userId)` → `PUT /api/messages/mark-seen/:id`

### 3. **Custom Hooks** 🪝

#### `useAuth()`
Quản lý:
- Authentication state
- Login/Logout
- Socket connection
- Online users
- Profile updates

#### `useChat()`
Quản lý:
- Danh sách users
- Selected user
- Messages
- Sending messages
- Unseen messages count
- Socket.IO realtime updates

### 4. **Pages** 📄

#### **Login.jsx**
- Form đăng nhập với email & password
- Gradient background đẹp
- Redirect to Signup
- Auto redirect to Home nếu đã đăng nhập

#### **Signup.jsx**
- Form đăng ký với: username, email, password, avatar, bio
- Upload ảnh với preview
- Validation form
- Auto redirect to Home sau khi đăng ký

#### **Home.jsx**
- Layout chính với Sidebar + ChatContainer
- Hiển thị welcome message khi chưa chọn user
- Responsive design

#### **Profile.jsx**
- Cập nhật username, bio, avatar
- Preview avatar hiện tại
- Back to chat button

### 5. **Components** 🧩

#### **Sidebar.jsx**
Features:
- Hiển thị profile user đang đăng nhập
- Button Profile & Logout
- Search box (UI ready)
- List tất cả users với:
  - Avatar
  - Username & bio
  - Online/Offline indicator (chấm xanh)
  - Unseen messages badge (số tin nhắn chưa đọc)
  - Highlight user đang được chọn

#### **ChatContainer.jsx**
Features:
- Header với thông tin user đang chat
- Online/Offline status
- Message list với:
  - Tin nhắn của mình (bên phải, màu gradient)
  - Tin nhắn của người khác (bên trái, màu trắng)
  - Hiển thị cả text và hình ảnh
  - Timestamp
  - Auto scroll to bottom
- Loading state
- Empty state

#### **MessageInput.jsx**
Features:
- Input text message
- Button upload hình ảnh
- Image preview với button xóa
- Button gửi tin nhắn
- Icons đẹp với SVG

### 6. **Routing & Protection** 🛡️

```jsx
Routes:
/ → Home (Protected)
/login → Login (Redirect if logged in)
/signup → Signup (Redirect if logged in)
/profile → Profile (Protected)
```

Protected Routes:
- Kiểm tra `authUser`
- Redirect to `/login` nếu chưa đăng nhập

### 7. **Socket.IO Integration** 🔌

Tích hợp trong `AuthContext.jsx`:
- Connect khi user login
- Disconnect khi logout
- Listen event `getOnlineUsers`
- Listen event `newMessage` trong `useChat()`

### 8. **Styling** 🎨

- **Tailwind CSS** cho tất cả styling
- **Gradient backgrounds** (blue to purple)
- **Rounded corners** & shadows
- **Hover effects** & transitions
- **Responsive design**
- **Icons** với SVG inline

### 9. **Các fix đã thực hiện trên Server** 🔧

#### File paths fixes:
- `../controller/` thay vì `../controllers/`
- `../models/user.js` thay vì `../model/User.js`
- `../models/Message.js` thay vì `../model/Message.js`
- `../middleware/auth.js` thay vì `../middleware/authMiddleware.js`

#### Import fixes:
- Import `ProtectedRoute` thay vì `protectedRoute`
- Thêm import `jwt`, `User`, `dotenv` trong auth.js
- Fix tên hàm trong routes

#### Logic fixes:
- Thêm `JWT_SECRET` trong jwt.sign()
- Thêm `connectDB()` trong server.js
- Export `logout` function trong AuthContext

### 10. **Environment Variables** 🌍

#### Client (.env):
```env
VITE_BACKEND_URL=http://localhost:5000
```

#### Server (.env) cần có:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

## 🚀 Cách chạy

### Server:
```bash
cd server
npm install
# Tạo file .env với các biến cần thiết
npm start
```

### Client:
```bash
cd client
npm install
# File .env đã có sẵn
npm run dev
```

## 🎯 Flow hoạt động

1. **Đăng ký/Đăng nhập**:
   - User điền form
   - Call API → Nhận token & userData
   - Lưu token vào localStorage
   - Set token vào axios header
   - Connect socket với userId
   - Redirect to Home

2. **Chat**:
   - Load danh sách users từ `/api/messages/users`
   - Click vào user → `setSelectedUser()`
   - Fetch messages của user đó
   - Socket listen `newMessage` event
   - Gửi tin nhắn qua API
   - Server emit qua Socket.IO cho receiver

3. **Online/Offline**:
   - Socket connect → server add vào `userSocketMap`
   - Server emit `getOnlineUsers` cho tất cả clients
   - Client update `onlineUsers` state
   - Sidebar hiển thị chấm xanh

4. **Unseen Messages**:
   - API `/api/messages/users` trả về `unSeenMessages` object
   - Hiển thị badge số lượng
   - Khi click vào user → auto mark as seen
   - Badge biến mất

## 📱 UI Highlights

- **Gradient backgrounds**: Blue to purple
- **Smooth transitions**: Transform & shadow on hover
- **Rounded designs**: rounded-lg, rounded-full, rounded-2xl
- **Clean layout**: Sidebar (320px) + Chat area (flex-1)
- **Responsive**: Works on all screen sizes
- **Professional look**: Modern & clean design

## 🎉 Kết luận

Frontend đã hoàn thành 100% với:
✅ Tất cả pages
✅ Tất cả components
✅ API integration đầy đủ
✅ Socket.IO realtime
✅ Protected routes
✅ Beautiful UI với Tailwind
✅ Custom hooks
✅ Context API
✅ File structure rõ ràng
✅ Server fixes

**Client đang chạy tại: http://localhost:5173/**
**Server cần chạy tại: http://localhost:5000**

Chúc bạn code vui vẻ! 🚀

# Chat App - Ứng dụng Chat Realtime

Ứng dụng chat realtime được xây dựng với React, Node.js, Socket.IO và MongoDB.

## 🚀 Tính năng

- ✅ Đăng ký/Đăng nhập người dùng
- ✅ Chat realtime với Socket.IO
- ✅ Gửi tin nhắn văn bản và hình ảnh
- ✅ Hiển thị trạng thái online/offline
- ✅ Đếm tin nhắn chưa đọc
- ✅ Cập nhật thông tin cá nhân
- ✅ Upload hình ảnh lên Cloudinary
- ✅ UI đẹp với Tailwind CSS
- ✅ Responsive design

## 📦 Cài đặt

### Server

```bash
cd server
npm install
```

Tạo file `.env` trong thư mục `server`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Chạy server:

```bash
npm start
```

### Client

```bash
cd client
npm install
```

Tạo file `.env` trong thư mục `client`:

```env
VITE_BACKEND_URL=http://localhost:5000
```

Chạy client:

```bash
npm run dev
```

## 📚 API Endpoints

### Authentication Routes (`/api/auth`)

- `POST /signup` - Đăng ký tài khoản mới
- `POST /login` - Đăng nhập
- `GET /check-auth` - Kiểm tra trạng thái đăng nhập (protected)
- `PUT /update-profile` - Cập nhật thông tin cá nhân (protected)

### Message Routes (`/api/messages`)

- `GET /users` - Lấy danh sách người dùng (protected)
- `GET /:id` - Lấy tin nhắn với một người dùng (protected)
- `POST /send/:id` - Gửi tin nhắn (protected)
- `PUT /mark-seen/:id` - Đánh dấu tin nhắn đã đọc (protected)

## 🎨 Cấu trúc Frontend

```
client/src/
├── components/          # React components
│   ├── Sidebar.jsx
│   ├── ChatContainer.jsx
│   └── MessageInput.jsx
├── pages/              # Pages
│   ├── Login.jsx
│   ├── Signup.jsx
│   ├── Home.jsx
│   └── Profile.jsx
├── hooks/              # Custom hooks
│   ├── useAuth.js
│   └── useChat.js
├── lib/                # Utilities
│   └── api.js
├── context/            # Context API
│   └── AuthContext.jsx
└── App.jsx            # Main app component
```

## 🔐 Authentication

Ứng dụng sử dụng JWT (JSON Web Token) để xác thực. Token được lưu trong localStorage và gửi kèm trong header của mọi request.

## 🌐 Socket.IO Events

- `connection` - Khi user kết nối
- `disconnect` - Khi user ngắt kết nối
- `getOnlineUsers` - Lấy danh sách user online
- `newMessage` - Nhận tin nhắn mới

## 🛠️ Công nghệ sử dụng

### Frontend
- React 19
- React Router DOM
- Socket.IO Client
- Axios
- Tailwind CSS
- Vite

### Backend
- Node.js
- Express
- Socket.IO
- MongoDB + Mongoose
- JWT
- Bcrypt
- Cloudinary
- Cors

## 📝 Lưu ý

- Đảm bảo MongoDB đang chạy
- Cần có tài khoản Cloudinary để upload ảnh
- Port mặc định: Server (5000), Client (5173)

## 🎯 Workflow

1. User đăng ký/đăng nhập
2. Sau khi đăng nhập, Socket.IO tự động kết nối
3. User có thể xem danh sách người dùng khác
4. Click vào user để bắt đầu chat
5. Gửi tin nhắn text hoặc hình ảnh
6. Nhận tin nhắn realtime qua Socket.IO
7. Cập nhật profile khi cần

## 👨‍💻 Developer

Tạo bởi: Tung-Quan

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
