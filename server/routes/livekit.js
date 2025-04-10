const express = require("express");
const { AccessToken } = require("livekit-server-sdk");
const router = express.Router();

// Tạo token cho LiveKit
router.get("/get-livekit-token", (req, res) => {
  const { room, username } = req.query;

  if (!room || !username) {
    return res.status(400).json({ error: "Missing room or username" });
  }

  try {
    // Tạo token với API key và secret
    const apiKey = process.env.LIVEKIT_API_KEY || "APIKPafXgDRxdLD";
    const apiSecret =
      process.env.LIVEKIT_API_SECRET ||
      "D6eaH0EH0fxqw2f37Uju8kfK5DLgooZ2rcE79pa3IhfD";

    const at = new AccessToken(apiKey, apiSecret, {
      identity: username,
    });

    at.addGrant({ roomJoin: true, room, canPublish: true, canSubscribe: true });

    const token = at.toJwt();
    res.json({ token });
  } catch (error) {
    console.error("Error creating LiveKit token:", error);
    res.status(500).json({ error: "Failed to create token" });
  }
});

module.exports = router;
