import express from "express";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";
import { StreamChat } from "stream-chat";

import Meet from "../models/meet.model.js";
import { protectRoute } from "../middleware/auth.middleware.js";

dotenv.config();
const router = express.Router();

const serverClient = StreamChat.getInstance(
  process.env.STREAM_API_KEY,
  process.env.STREAM_API_SECRET
);


router.post("/create", protectRoute, async (req, res) => {
  try {
    if (req.user.role !== "interviewer") {
      return res.status(403).json({ message: "Only interviewers can create meets" });
    }

    const meetId = uuidv4();

    const meet = await Meet.create({
      meetId,
      interviewerId: req.user._id,
    });

    await serverClient.upsertUser({
      id: req.user._id.toString(),
      name: req.user.username,
      role: "admin", 
    });

    const channel = serverClient.channel("messaging", meetId, {
      name: `Meet ${meetId}`,
      created_by_id: req.user._id.toString(),
    });

    await channel.create();
    await channel.addMembers([req.user._id.toString()]);

    const token = serverClient.createToken(req.user._id.toString());

    return res.status(201).json({
      message: "Meet created successfully",
      meetId,
      stream: {
        apiKey: process.env.STREAM_API_KEY,
        token,
        user: {
          id: req.user._id.toString(),
          name: req.user.username,
          role: "admin",
        },
      },
    });
  } catch (error) {
    console.error("❌ Error creating meet:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});
router.post("/join", protectRoute, async (req, res) => {
  try {
    const { meetId } = req.body;
    const userId = req.user._id.toString();
    const username = req.user.username;
    const role = req.user.role;

    const meet = await Meet.findOne({ meetId });
    if (!meet) {
      return res.status(404).json({ message: "Meet not found" });
    }

    if (!meet.candidateId) {
      meet.candidateId = req.user._id;
      await meet.save();
    }

    await serverClient.upsertUser({
      id: userId,
      name: username,
      role: "user",
    });

    const channel = serverClient.channel("messaging", meetId);
    await channel.addMembers([userId]);

    const token = serverClient.createToken(userId);

    return res.status(200).json({
      message: "Joined meet successfully",
      meetId,
      stream: {
        apiKey: process.env.STREAM_API_KEY,
        token,
        user: {
          id: userId,
          name: username,
          role: "user",
        },
      },
    });
  } catch (error) {
    console.error("❌ Error joining meet:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;
