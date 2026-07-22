const crypto = require("crypto");
const Chat = require("../models/Chat");
const { AppError } = require("../middleware/errorMiddleware");
const { HTTP_STATUS } = require("../config/constants");

function generateToken04(
  appId,
  userId,
  secret,
  effectiveTimeInSeconds,
  payload = "",
) {
  if (!appId || typeof appId !== "number")
    throw new Error("ZegoCloud: Invalid appId");
  if (!userId) throw new Error("ZegoCloud: userId is required");
  if (!secret || secret.length !== 32)
    throw new Error("ZegoCloud: Server secret must be 32 characters");

  const now = Math.floor(Date.now() / 1000);
  const expire = now + effectiveTimeInSeconds;

  const random = crypto.randomBytes(8).toString("hex");

  // raw token
  const tokenContent = JSON.stringify({
    app_id: appId,
    user_id: userId,
    random,
    ctime: now,
    expire,
    payload,
  });

  // HMAC-SHA256 signature
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(tokenContent);
  const signature = hmac.digest("hex");

  const tokenData = Buffer.from(
    JSON.stringify({
      ver: "04",
      expire,
      hash: signature,
      content: tokenContent,
    }),
  ).toString("base64");

  return `04${tokenData}`;
}

const zegoService = {
  async generateCallToken(chatId, userId, existingRoomId = null) {
    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) {
      throw new AppError(
        "You are not a participant in this chat",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    const appId = parseInt(process.env.ZEGO_APP_ID, 10);
    const serverSecret = process.env.ZEGO_SERVER_SECRET;

    if (!appId || !serverSecret) {
      throw new Error(
        "ZegoCloud credentials missing. Add ZEGO_APP_ID and ZEGO_SERVER_SECRET to your .env file",
      );
    }

    const roomId = existingRoomId || `cognon-${chatId}-${Date.now()}`;

    const token = generateToken04(appId, userId.toString(), serverSecret, 3600);

    return {
      roomId,
      appId,
      serverSecret,
      token,
    };
  },
};

module.exports = zegoService;
