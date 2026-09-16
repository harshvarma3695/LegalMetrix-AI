import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

const router =
  express.Router();

router.post(
  "/register",
  async (req, res) => {
    try {
      const {
        name,
        email,
        password
      } = req.body;

      if (
        !name ||
        !email ||
        !password
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Name, email and password are required."
        });
      }

      const exists =
        await User.findOne({
          email:
            email.toLowerCase()
        });

      if (exists) {
        return res.status(409).json({
          success: false,
          message:
            "User already exists."
        });
      }

      const passwordHash =
        await bcrypt.hash(
          password,
          12
        );

      const user =
        await User.create({
          name,
          email:
            email.toLowerCase(),
          passwordHash,
          role: "inspector"
        });

      res.status(201).json({
        success: true,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

router.post(
  "/login",
  async (req, res) => {
    try {
      const {
        email,
        password
      } = req.body;

      const user =
        await User.findOne({
          email:
            email?.toLowerCase()
        });

      if (
        !user ||
        !(await bcrypt.compare(
          password || "",
          user.passwordHash
        ))
      ) {
        return res.status(401).json({
          success: false,
          message:
            "Invalid email or password."
        });
      }

      const token =
        jwt.sign(
          {
            id:
              user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role
          },

          process.env.JWT_SECRET,

          {
            expiresIn: "8h"
          }
        );

      res.json({
        success: true,
        token,

        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;