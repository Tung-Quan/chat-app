import express from 'express';
import { signup,
  login,
  checkAuth,
  updateProfile
 } from '../controller/userController.js';
 import { ProtectedRoute as protectedRoute } from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post("/signup", signup)
userRouter.post("/login", login);
userRouter.get("/check-auth", protectedRoute, checkAuth);
userRouter.put("/update-profile", protectedRoute, updateProfile);

export default userRouter;