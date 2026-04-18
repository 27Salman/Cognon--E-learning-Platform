const Offer = require('../models/Offer');
const Course = require('../models/Course');
const Category = require('../models/Category');

const offerService = {

    async createOffer(adminId, offerData) {
        const {
            title,
            description,
            offerType,
            targetIds,
            discountPercentage,
            validFrom,
            validUntil
        } = offerData;

        //validate
        if (offerType === 'course') {
            if (!targetIds || targetIds.length === 0) {
                throw new Error('Course IDs are required for course offers');
            }
            const courses = await Course.find({ _id: { $in: targetIds } });
            if (courses.length !== targetIds.length) {
                throw new Error('One or more course IDs are invalid');
            }
        } else if (offerType === 'category') {
            if (!targetIds || targetIds.length === 0) {
                throw new Error('Category IDs are required for category offers');
            }
            const categories = await Category.find({ _id: { $in: targetIds } });
            if (categories.length !== targetIds.length) {
                throw new Error('One or more category IDs are invalid');
            }
        }

        const offer = new Offer({
            title,
            description,
            offerType,
            targetIds: offerType === 'platform' ? [] : targetIds,
            targetModel: offerType === 'category' ? 'Category' : offerType === 'course' ? 'Course' : undefined,
            discountPercentage,
            validFrom: new Date(validFrom),
            validUntil: new Date(validUntil),
            createdBy: adminId
        });

        await offer.save();
        return offer;

    },

    async getOffers({ offerType, isActive,  page = 1, limit = 5 } = {}){
        const query = {};

        if (offerType && ['course', 'category', 'platform'].includes(offerType)) {
            query.offerType = offerType;
        }

        if (isActive !== undefined) {
            query.isActive = isActive === 'true';
        }

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        const skip = (pageNum - 1) * limitNum;

        const [offers, totalFiltered] = await Promise.all([
            Offer.find(query)
                .populate('targetIds')
                .populate('createdBy', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum),
            Offer.countDocuments(query)
        ]);

        const pagination = {
            currentPage: pageNum,
            totalPages: Math.ceil(totalFiltered / limitNum),
            totalFiltered,
            limit: limitNum
        };

        return { offers, pagination };
    },

    async getOffersById(offerId){
        const offer = await Offer.findById(offerId)
                .populate('targetIds')
                .populate('createdBy', 'name email');
        
        if (!offer) {
            throw new Error('Offer not found');
        }
        
        return offer;
    },

     async updateOffer(offerId, updateData) {
        const offer = await Offer.findById(offerId);

        if (!offer) {
            throw new Error('Offer not found');
        }

        if (updateData.title) offer.title = updateData.title;
        if (updateData.description !== undefined) offer.description = updateData.description;
        if (updateData.offerType) offer.offerType = updateData.offerType;
        if (updateData.targetIds) offer.targetIds = updateData.targetIds;
        if (updateData.discountPercentage !== undefined) offer.discountPercentage = updateData.discountPercentage;
        if (updateData.validFrom) offer.validFrom = new Date(updateData.validFrom);
        if (updateData.validUntil) offer.validUntil = new Date(updateData.validUntil);

        await offer.save();
        return offer;
    },

    async deleteOffer(offerId) {
        const offer = await Offer.findById(offerId);

        if (!offer) {
            throw new Error('Offer not found');
        }

        await Offer.findByIdAndDelete(offerId);
        return { message: 'Offer deleted successfully' };
    },

    async toggleOfferStatus(offerId) {
        const offer = await Offer.findById(offerId);

        if (!offer) {
            throw new Error('Offer not found');
        }

        offer.isActive = !offer.isActive;
        await offer.save();

        return offer;
    },

    //Student offers
    async getActiveOffers() {
        const now = new Date();
        const offers = await Offer.find({
            isActive: true,
            validFrom: { $lte: now },
            validUntil: { $gte: now }
        }).populate('targetIds');

        return offers;
    },

    async getBestOfferForCourse(courseId) {
        const course = await Course.findById(courseId);
        if (!course) return null;

        const now = new Date();
        const query = {
            isActive: true,
            validFrom: { $lte: now },
            validUntil: { $gte: now }
        };

        const [platformOffers, courseOffers, categoryOffers] = await Promise.all([
            Offer.find({ ...query, offerType: 'platform' }),
            Offer.find({ ...query, offerType: 'course', targetIds: courseId }),
            Offer.find({ ...query, offerType: 'category' }).populate('targetIds')
        ]);

        const applicableCategoryOffers = categoryOffers.filter(offer => 
            offer.targetIds.some(cat => cat.name === course.category)
        );

        const allOffers = [...platformOffers, ...courseOffers, ...applicableCategoryOffers];
        
        if (allOffers.length === 0) return null;

        allOffers.sort((a, b) => b.discountPercentage - a.discountPercentage);

        return allOffers[0];
    }

}


