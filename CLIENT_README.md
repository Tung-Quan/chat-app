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
