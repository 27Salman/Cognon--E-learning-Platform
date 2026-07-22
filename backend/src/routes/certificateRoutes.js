const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const certificateController = require('../controllers/certificateController');
const { studentOnly } = require('../middleware/roleMiddleware');



router.use(protect);

router.get('/', studentOnly, certificateController.getUserCertificates);
router.get('/:id/download', studentOnly, certificateController.downloadCertificate);
router.get('/:id', studentOnly, certificateController.getCertificateById);

const publicRouter = express.Router();
publicRouter.get('/:certificateNumber', certificateController.verifyCertificate);

module.exports = { certificateRoutes: router, publicCertificateRoutes: publicRouter };










