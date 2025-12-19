import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';
import cloudinary from '../lib/cloudinary.js';
dotenv.config();

// Signup user
export const signup = async (req, res) => {
  const { username, email, password, profilePicture, bio } = req.body;

  try {
    if (!username || !email || !password || !profilePicture) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Additional validation can be added here (e.g., email format, password strength)
    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }
    if (username.length < 3) {
      return res.status(400).json({ message: "Username must be at least 3 characters long" });
    }

    if (bio && bio.length > 150) {
      return res.status(400).json({ message: "Bio cannot exceed 150 characters" });
    }

    // If validation passes, proceed to create the user (this part is not implemented here)
    const existintUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existintUser) {
      return res.status(409).json({ message: "Username or email already in use" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      profilePicture,
      bio: bio || "",
    });

    const token = jwt.sign({ id: newUser._id, username: newUser.username, email: newUser.email }, process.env.JWT_SECRET);

    await newUser.save();

    res.status(201).json({
      success: true,
      userData: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        profilePicture: newUser.profilePicture,
        bio: newUser.bio,
        createdAt: newUser.createdAt,
      },
      token,
      message: "User registered successfully",
    })
  } catch (error) {
    console.error("Error during user signup:", error);
    res.status(500).json({
      success: false,
      message: "Server error during signup"
    });
  }
};

// Login user
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const token = jwt.sign({ id: user._id, username: user.username, email: user.email }, process.env.JWT_SECRET);
    res.status(200).json({
      success: true,
      userData: {
        id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        bio: user.bio,
        createdAt: user.createdAt,
      },
      token,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Error during user login:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login"
    });
  }
};

// controller to check if user is authenticated
export const checkAuth = (req, res) => {
  res.status(200).json({
    success: true,
    userData: req.user,
    message: 'User is authenticated'
  });
}

// controller to update user profile
export const updateProfile = async (req, res) => {
  try{
    const { username, bio, profilePicture } = req.body;
    const userId = req.user._id;
    let updateData = {};

    if(!profilePicture){
      await User.findByIdAndUpdate(userId, { username, bio }, { new: true });
      return res.status(200).json({
        success: true,
        message: "Profile updated successfully"
      });
    }else{
      // Upload new profile picture to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(profilePicture);
      updatedData = await User.findByIdAndUpdate(userId, {
        username,
        bio,
        profilePicture: uploadResult.secure_url
      }, { new: true });
    }
    res.status(200).json({
      success: true,
      userData: updatedData,
      message: "Profile updated successfully"
    });
  }catch(error){
    console.error("Error updating user profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error during profile update"
    });
  }
};