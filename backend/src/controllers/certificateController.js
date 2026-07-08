const { HTTP_STATUS } = require("../config/constants");
const asyncHandler = require("../middleware/asyncHandler");
const certificateService = require('../services/certificateService')

exports.getCertificateById = asyncHandler( async(req, res)=> {
    const result = await certificateService.getCertificateById(req.params.id, req.user.id);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result})
});

exports.getUserCertificates = asyncHandler( async(req, res)=> {
    const { page, limit, search, sort } = req.query;
    const result = await certificateService.getUserCertificates(req.user.id, page, limit, search, sort);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result})
});

exports.downloadCertificate = asyncHandler( async(req, res)=> {
    const pdfBuffer = await certificateService.generateCertificatePdf(req.params.id, req.user.id);

    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="certificate-${req.params.id}.pdf"`,
        'Content-Length': pdfBuffer.length,
    });

    res.status(HTTP_STATUS.OK).end(pdfBuffer);
});

// Public 
exports.verifyCertificate = asyncHandler( async(req, res)=> {
    const result = await certificateService.verifyCertificate(req.params.certificateNumber);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
});




