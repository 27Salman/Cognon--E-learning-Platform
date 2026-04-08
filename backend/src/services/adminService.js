const User = require('../models/User');
const { USER_ROLES, USER_STATUS, TUTOR_APPROVAL_STATUS } = require('../config/constants');
const { deleteOldProfileImage } = require('./fileService');
const { createOTP, verifyOTP } = require('./otpService');
const { sendOTPEmail } = require('./emailService');

const buildImageURL = (profileImage) => {
    if(!profileImage) return null;
    if(profileImage.startsWith('http')) return profileImage;
    const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${BASE_URL}/uploads/${profileImage}`;
}

const adminService = {

    //Profile

    async getProfile(adminId) {
        const admin = await User.findById(adminId).select('-password');

        if(!admin){
            throw new Error('Admin not found');
        }

        return {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            profileImage: admin.profileImage,
            profileImageURL: buildImageURL(admin.profileImage),
            role: admin.role,
        };
    },

    async updateProfile( adminId, { name,phone }, file){
        const admin = await User.findById(adminId);

        if(!admin){
            throw new Error('Admin not found');
        }

        if(name) admin.name = name.trim();

        if (phone !== undefined) admin.phone = phone.trim() || null;

        if (file) {
            if (admin.profileImage && !admin.profileImage.startsWith('http')) {
                await deleteOldProfileImage(admin.profileImage);
            }
            admin.profileImage = file.filename;
        }

        await admin.save();

        return {
            _id: admin._id,
            name: admin.name,
            email: admin.email,
            phone: admin.phone,
            profileImage: admin.profileImage,
            profileImageURL: buildImageURL(admin.profileImage),
            role: admin.role,
        };
    },

    async requestPasswordChange(adminEmail){
        const otp = await createOTP(adminEmail, 'password_change');
        await sendOTPEmail(adminEmail, otp, 'password_change');

        return `OTP sent to ${adminEmail}`;
    },

    async verifyPasswordChange(adminId, adminEmail, newPassword, otp){
        await verifyOTP(adminEmail, otp, 'password_change');

        const admin = await User.findById(adminId);
        admin.password = newPassword;
        await admin.save();
    },


    //Tutor management

    async getTutors({ status, search, page = 1, limit = 10 } = {}){
        const query = { role: USER_ROLES.TUTOR };

        if(status && Object.values(USER_STATUS).includes(status)){
            query.status = status;
        }

        if(search && search.trim()){
            query.$or = [
                { name: { $regex: search.trim(), $options: 'i' } },
                { email: { $regex: search.trim(), $options: 'i' } },
            ];
        }

        const pageNum = Math.max(1,parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1,parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        const [tutors, totalFiltered, allTutors] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            User.countDocuments(query),
            User.find({ role: USER_ROLES.TUTOR }).select('status'),
        ])

        const summary = {
            total: allTutors.length,
            active: allTutors.filter( a => a.status === USER_STATUS.ACTIVE).length,
            blocked: allTutors.filter( a => a.status === USER_STATUS.BLOCKED).length,
        }

        const pagination = {
            currentPage: pageNum,
            totalPages: Math.ceil(totalFiltered / limitNum),
            totalFiltered,
            limit: limitNum,
        }

        return { tutors, summary, pagination};

    },

    async approveTutor(tutorId){
        const tutor = await User.findById(tutorId);
        if(!tutor || tutor.role !== USER_ROLES.TUTOR) throw new Error('Tutor not found');
        if(tutor.tutorProfile.approvalStatus === TUTOR_APPROVAL_STATUS.APPROVED) throw new Error("Tutor is already approved");

        tutor.tutorProfile.approvalStatus = TUTOR_APPROVAL_STATUS.APPROVED;
        await tutor.save();
        return tutor;
    },

    async rejectTutor(tutorId){
        const tutor = await User.findById(tutorId);
        if(!tutor || tutor.role !== USER_ROLES.TUTOR) throw new Error('tutor not found');

        tutor.tutorProfile.approvalStatus = TUTOR_APPROVAL_STATUS.REJECTED;
        await tutor.save();
        return tutor;
    },


    //Student management

    async getStudents ({ status, search, page = 1, limit = 10 } = {}){
        const query = { role: USER_ROLES.STUDENT };

        if(status && Object.values(USER_STATUS).includes(status)){
            query.status = status;
        }

        if(search && search.trim()){
            query.$or = [
                { name: { $regex: search.trim(), $options:'i'} },
                { email: { $regex: search.trim(), $options:'i'} },
            ];
        }

        const pageNum = Math.max(1,parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1,parseInt(limit)) || 10);
        const skip = (pageNum - 1) * limitNum;

        const [students, totalFiltered, allStudents] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            User.countDocuments(query),
            User.find({ role: USER_ROLES.STUDENT }).select('status'),
        ])

        const summary = {
            total: allStudents.length,
            active: allStudents.filter( a => a.status === USER_STATUS.ACTIVE ).length,
            blocked: allStudents.filter( a => a.status === USER_STATUS.BLOCKED ).length,
        }

        const pagination = {
            currentPage: pageNum,
            totalFiltered,
            totalPages: Math.ceil(totalFiltered / limitNum),
            limit:limitNum,
        }

        return { students, summary, pagination };
    },

    async blockUser(userId) {
        const user = await User.findById(userId).select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        if (user.role === USER_ROLES.ADMIN) {
            throw new Error('Admin accounts cannot be blocked');
        }

        if (user.status === USER_STATUS.BLOCKED) {
            throw new Error('User is already blocked');
        }

        user.status = USER_STATUS.BLOCKED;
        await user.save();

        return user;
    },

    async unblockUser(userId) {
        const user = await User.findById(userId).select('-password');

        if (!user) {
            throw new Error('User not found');
        }

        if (user.status !== USER_STATUS.BLOCKED) {
            throw new Error('User is not blocked');
        }

        user.status = USER_STATUS.ACTIVE;
        await user.save();

        return user;
    },
};

module.exports = adminService;

