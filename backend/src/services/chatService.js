const Chat = require("../models/Chat");
const Course = require("../models/Course");
const User = require("../models/User");
const notificationService = require("./notificationService");
const { NOTIFICATION_TYPES, USER_ROLES } = require("../config/constants");

const chatService = {
  async validateEnrollmentRelationship(studentId, tutorId) {
    const exists = await Course.exists({
      tutor: tutorId,
      studentsEnrolled: studentId,
    });
    return !!exists;
  },

  async createOrGetChat(userId1, userId2) {
    const user1 = await User.findById(userId1).select("role");
    const user2 = await User.findById(userId2).select("role");

    if (!user1 || !user2) throw new Error("One or both users not found");

    if (user1.role === user2.role) {
      throw new Error("Chat is only allowed between a student and a tutor");
    }

    const studentId = user1.role === USER_ROLES.STUDENT ? userId1 : userId2;
    const tutorId = user1.role === USER_ROLES.TUTOR ? userId1 : userId2;

    const isAuthorized = await this.validateEnrollmentRelationship(
      studentId,
      tutorId,
    );
    if (!isAuthorized) {
      throw new Error(
        "Chat is only available for students enrolled in this tutor's courses",
      );
    }

    let chat = await Chat.findOne({
      participants: { $all: [userId1, userId2] },
    }).populate("participants", "name email profileImage role");

    if (chat) return chat;

    chat = new Chat({ participants: [userId1, userId2], messages: [] });
    await chat.save();

    return await Chat.findById(chat._id).populate(
      "participants",
      "name email profileImage role",
    );
  },

  async saveMessage(chatId, senderId, text) {
    const chat = await Chat.findOne({ _id: chatId, participants: senderId });
    if (!chat) throw new Error("Chat not found or unauthorized");

    const message = {
      sender: senderId,
      text,
      status: "sent",
      deliveredTo: [],
      readBy: [senderId],
    };

    chat.messages.push(message);
    chat.lastMessage = text;
    chat.lastMessageAt = new Date();
    await chat.save();

    const savedChat = await Chat.findById(chatId).populate(
      "messages.sender",
      "name email profileImage",
    );

    return savedChat.messages[savedChat.messages.length - 1];
  },

  async markDelivered(chatId, messageId, userId) {
    const chat = await Chat.findOne({ _id: chatId, participants: userId });
    if (!chat) return null;

    const message = chat.messages.id(messageId);
    if (!message) return null;

    const alreadyDelivered = message.deliveredTo.some(
      (id) => id.toString() === userId.toString(),
    );
    if (alreadyDelivered) return message;

    message.deliveredTo.push(userId);

    const nonSenders = chat.participants.filter(
      (p) => p.toString() !== message.sender.toString(),
    );
    const allDelivered = nonSenders.every((p) =>
      message.deliveredTo.some((id) => id.toString() === p.toString()),
    );
    if (allDelivered && message.status === "sent") {
      message.status = "delivered";
    }

    await chat.save();
    return message;
  },

  async markMessagesRead(chatId, readerId) {
    const chat = await Chat.findOne({ _id: chatId, participants: readerId });
    if (!chat) return [];

    const updatedMessageIds = [];

    chat.messages.forEach((msg) => {
      const isSender = msg.sender.toString() === readerId.toString();
      const alreadyRead = msg.readBy.some(
        (id) => id.toString() === readerId.toString(),
      );

      if (!isSender && !alreadyRead) {
        msg.readBy.push(readerId);
        msg.status = "read";
        updatedMessageIds.push(msg._id);
      }
    });

    if (updatedMessageIds.length > 0) {
      await chat.save();
    }

    return updatedMessageIds;
  },

  async getUserChats(userId) {
    const chats = await Chat.find({ participants: userId })
      .populate("participants", "name email profileImage role")
      .sort({ lastMessageAt: -1 });

    return chats.map((chat) => ({
      _id: chat._id,
      participants: chat.participants,
      lastMessage: chat.lastMessage,
      lastMessageAt: chat.lastMessageAt,
      unreadCount: chat.messages.filter(
        (m) =>
          !m.readBy.some((id) => id.toString() === userId.toString()) &&
          m.sender.toString() !== userId.toString(),
      ).length,
    }));
  },

  async getChatMessages(chatId, userId, page = 1, limit = 50) {
    const chat = await Chat.findOne({
      _id: chatId,
      participants: userId,
    }).populate("messages.sender", "name email profileImage");

    if (!chat) throw new Error("Chat not found or unauthorized");

    const total = chat.messages.length;
    const skip = (page - 1) * limit;
    const messages = chat.messages
      .slice()
      .reverse()
      .slice(skip, skip + limit)
      .reverse();

    return {
      messages,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalMessages: total,
      },
    };
  },

  async getEligibleContacts(userId) {
    const user = await User.findById(userId).select("role");
    if (!user) throw new Error("User not found");

    if (user.role === USER_ROLES.STUDENT) {
      const courses = await Course.find({ studentsEnrolled: userId }).populate(
        "tutor",
        "name email profileImage role tutorProfile.bio",
      );

      const tutorMap = new Map();
      courses.forEach((c) => {
        if (c.tutor) tutorMap.set(c.tutor._id.toString(), c.tutor);
      });

      return Array.from(tutorMap.values());
    }

    if (user.role === USER_ROLES.TUTOR) {
      const courses = await Course.find({ tutor: userId }).populate(
        "studentsEnrolled",
        "name email profileImage role",
      );

      const studentMap = new Map();
      courses.forEach((c) => {
        c.studentsEnrolled.forEach((s) => {
          studentMap.set(s._id.toString(), s);
        });
      });

      return Array.from(studentMap.values());
    }

    return [];
  },

  async notifyNewMessage(chatId, senderId, text, recipients) {
    const sender = await User.findById(senderId).select("name");
    const senderName = sender ? sender.name : "someone";

    for (const recipient of recipients) {
      const isTutor = recipient.role === "tutor";
      await notificationService.create({
        recipient: recipient._id,
        type: NOTIFICATION_TYPES.NEW_CHAT_MESSAGE,
        title: `New message from ${senderName}`,
        message: text.length > 60 ? `${text.slice(0, 60)}...` : text,
        priority: "high",
        actionUrl: isTutor ? "/tutor/chat" : "/student/chat",
        data: { chatId, senderId },
      });
    }
  },
};

module.exports = chatService;
