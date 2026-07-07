import React, { useEffect, useState, useCallback } from 'react';
import { Award, Download, BookOpen, User, Calendar, Hash, Eye, X, Link2, Check } from 'lucide-react';
import { studentAPI } from '../../api/studentAPI';
import toast from 'react-hot-toast';

const Certificates = () => {
    const [certificates, setCertificates] = useState([]);
    const [pagination, setPagination]     = useState(null);
    const [loading, setLoading]           = useState(true);
    const [page, setPage]                 = useState(1);
    const [downloadingId, setDownloadingId] = useState(null);
    const [previewCert, setPreviewCert]   = useState(null); // cert object for modal

    const fetchCertificates = useCallback(async (pageNum = 1) => {
        setLoading(true);
        try {
            const res = await studentAPI.getCertificates(pageNum, 9);
            setCertificates(res.data.certificates);
            setPagination(res.data.pagination);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load certificates');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCertificates(page); }, [page, fetchCertificates]);

    const handleDownload = async (cert) => {
        setDownloadingId(cert._id);
        try {
            const response = await studentAPI.downloadCertificate(cert._id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url  = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href     = url;
            link.download = `certificate-${cert.course?.title || cert._id}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success('Certificate downloaded');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Download failed');
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-gray-500">Loading certificates...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-6xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <div className="p-2 bg-yellow-100 rounded-xl">
                        <Award className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">My Certificates</h1>
                        <p className="text-sm text-gray-500">
                            {pagination?.totalCertificates ?? 0} certificate
                            {pagination?.totalCertificates !== 1 ? 's' : ''} earned
                        </p>
                    </div>
                </div>

                {/* Empty state */}
                {certificates.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-sm p-16 text-center">
                        <Award className="w-20 h-20 text-gray-200 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-600 mb-2">No certificates yet</h2>
                        <p className="text-gray-400 max-w-sm mx-auto">
                            Complete a course and pass the quiz to earn your first certificate.
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Certificate grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                            {certificates.map((cert) => (
                                <CertificateCard
                                    key={cert._id}
                                    cert={cert}
                                    onDownload={handleDownload}
                                    onPreview={() => setPreviewCert(cert)}
                                    isDownloading={downloadingId === cert._id}
                                />
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2">
                                <button
                                    onClick={() => setPage(p => p - 1)}
                                    disabled={!pagination.hasPrev}
                                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Previous
                                </button>
                                <span className="text-sm text-gray-600">
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={!pagination.hasNext}
                                    className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 bg-white text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Preview modal */}
            {previewCert && (
                <CertificatePreviewModal
                    cert={previewCert}
                    onClose={() => setPreviewCert(null)}
                    onDownload={handleDownload}
                    isDownloading={downloadingId === previewCert._id}
                />
            )}
        </div>
    );
};

/*Card */
const CertificateCard = ({ cert, onDownload, onPreview, isDownloading }) => {
    const issuedDate = new Date(cert.issuedAt).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
    });

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
            <div className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-600" />

            <div className="p-5">
                {/* Course title */}
                <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-yellow-50 rounded-lg shrink-0">
                        <BookOpen className="w-4 h-4 text-yellow-600" />
                    </div>
                    <h3 className="font-semibold text-gray-800 text-sm leading-snug line-clamp-2">
                        {cert.course?.title || 'Course'}
                    </h3>
                </div>

                {/* Meta rows */}
                <div className="space-y-2 mb-5">
                    <MetaRow icon={<User className="w-3.5 h-3.5" />}     label="Instructor" value={cert.course?.tutor?.name || '—'} />
                    <MetaRow icon={<Calendar className="w-3.5 h-3.5" />} label="Issued"     value={issuedDate} />
                    <MetaRow icon={<Award className="w-3.5 h-3.5" />}    label="Score"      value={cert.score} />
                    <MetaRow
                        icon={<Hash className="w-3.5 h-3.5" />}
                        label="Cert No."
                        value={
                            <span className="font-mono text-xs truncate max-w-[150px] block" title={cert.certificateNumber}>
                                {cert.certificateNumber}
                            </span>
                        }
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <button
                        onClick={onPreview}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        <Eye className="w-4 h-4" />
                        View
                    </button>
                    <button
                        onClick={() => onDownload(cert)}
                        disabled={isDownloading}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                        {isDownloading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                PDF...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Download
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

/* Preview modal — HTML replica of the PDF design */
const CertificatePreviewModal = ({ cert, onClose, onDownload, isDownloading }) => {
    const studentName = cert.student?.name  || 'Student';
    const courseName  = cert.course?.title  || 'Course';
    const tutorName   = cert.course?.tutor?.name || 'Cognon Instructor';
    const certNumber  = cert.certificateNumber;
    const issuedDate  = new Date(cert.issuedAt).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const score = cert.score;

    const [copied, setCopied] = useState(false);

    const handleCopyLink = () => {
        const verifyUrl = `${window.location.origin}/verify/${cert.certificateNumber}`;
        navigator.clipboard.writeText(verifyUrl).then(() => {
            setCopied(true);
            toast.success('Verification link copied!');
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.75)' }}
            onClick={handleBackdrop}
        >
            <div className="w-full max-w-3xl">

                {/* Toolbar above the certificate */}
                <div className="flex items-center justify-between mb-3 px-1">
                    <span className="text-white text-sm opacity-70">Certificate Preview</span>
                    <div className="flex items-center gap-2">
                        {/* Copy verification link */}
                        <button
                            onClick={handleCopyLink}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
                        >
                            {copied ? (
                                <>
                                    <Check className="w-4 h-4 text-green-400" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Link2 className="w-4 h-4" />
                                    Copy Link
                                </>
                            )}
                        </button>
                        <button
                            onClick={() => onDownload(cert)}
                            disabled={isDownloading}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-gray-900 text-sm font-semibold disabled:opacity-60 transition-colors"
                        >
                            {isDownloading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
                            aria-label="Close preview"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Certificate design */}
                <div
                    className="relative w-full rounded-lg overflow-hidden select-none"
                    style={{
                        background: '#0f172a',
                        aspectRatio: '842 / 595',   // A4 landscape ratio
                        fontFamily: "'Roboto', sans-serif",
                    }}
                >
                    {/* Outer border */}
                    <div className="absolute inset-3 rounded pointer-events-none"
                         style={{ border: '2px solid #f59e0b' }} />
                    {/* Inner border */}
                    <div className="absolute inset-4 rounded pointer-events-none"
                         style={{ border: '0.5px solid #f59e0b' }} />

                    {/* Header band */}
                    <div className="absolute top-3 left-3 right-3 flex flex-col items-center justify-center py-3"
                         style={{ background: '#1e293b', height: '14%' }}>
                        <p className="font-bold tracking-widest" style={{ color: '#f59e0b', fontSize: 'clamp(14px, 3.5vw, 28px)' }}>
                            COGNON
                        </p>
                        <p className="tracking-widest mt-0.5" style={{ color: '#94a3b8', fontSize: 'clamp(6px, 1.2vw, 10px)' }}>
                            E-LEARNING PLATFORM
                        </p>
                    </div>

                    {/* Body */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center"
                         style={{ paddingTop: '18%', paddingBottom: '18%' }}>

                        {/* Subtitle */}
                        <p className="tracking-[0.25em] mb-2"
                           style={{ color: '#94a3b8', fontSize: 'clamp(6px, 1.3vw, 11px)' }}>
                            CERTIFICATE OF COMPLETION
                        </p>

                        {/* Divider */}
                        <div className="mb-3" style={{ width: '28%', height: '1px', background: '#f59e0b' }} />

                        {/* This certifies */}
                        <p className="mb-1" style={{ color: '#cbd5e1', fontSize: 'clamp(7px, 1.3vw, 11px)' }}>
                            This certifies that
                        </p>

                        {/* Student name */}
                        <p className="font-bold mb-1 text-center px-4"
                           style={{ color: '#ffffff', fontSize: 'clamp(16px, 4vw, 32px)', lineHeight: 1.1 }}>
                            {studentName}
                        </p>

                        {/* Name underline */}
                        <div className="mb-2" style={{ width: '40%', height: '1px', background: '#f59e0b' }} />

                        {/* Body copy */}
                        <p className="mb-2" style={{ color: '#cbd5e1', fontSize: 'clamp(7px, 1.3vw, 11px)' }}>
                            has successfully completed the course
                        </p>

                        {/* Course name */}
                        <p className="font-bold text-center px-8 mb-3"
                           style={{ color: '#f59e0b', fontSize: 'clamp(10px, 2.2vw, 18px)', lineHeight: 1.2 }}>
                            {courseName}
                        </p>

                        {/* Score pill */}
                        <div className="px-5 py-1 rounded-full"
                             style={{ background: '#1e293b', border: '1px solid #334155' }}>
                            <span className="font-bold" style={{ color: '#f59e0b', fontSize: 'clamp(7px, 1.2vw, 10px)' }}>
                                Score: {score}
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-3 left-3 right-3"
                         style={{ borderTop: '0.5px solid #334155', paddingTop: '1.5%', height: '18%' }}>
                        <div className="flex items-start justify-between h-full px-6">

                            {/* Instructor */}
                            <div className="flex flex-col items-center" style={{ width: '30%' }}>
                                <div className="w-full mb-1" style={{ height: '0.5px', background: '#475569' }} />
                                <p className="font-semibold text-center" style={{ color: '#ffffff', fontSize: 'clamp(6px, 1.1vw, 10px)' }}>
                                    {tutorName}
                                </p>
                                <p style={{ color: '#94a3b8', fontSize: 'clamp(5px, 0.9vw, 8px)' }}>Course Instructor</p>
                            </div>

                            {/* Seal */}
                            <div className="flex flex-col items-center justify-start">
                                <p className="font-bold" style={{ color: '#f59e0b', fontSize: 'clamp(7px, 1.2vw, 11px)' }}>
                                    COGNON
                                </p>
                                <p style={{ color: '#94a3b8', fontSize: 'clamp(5px, 0.9vw, 8px)' }}>Authorized Seal</p>
                            </div>

                            {/* Date */}
                            <div className="flex flex-col items-center" style={{ width: '30%' }}>
                                <div className="w-full mb-1" style={{ height: '0.5px', background: '#475569' }} />
                                <p className="font-semibold text-center" style={{ color: '#ffffff', fontSize: 'clamp(6px, 1.1vw, 10px)' }}>
                                    {issuedDate}
                                </p>
                                <p style={{ color: '#94a3b8', fontSize: 'clamp(5px, 0.9vw, 8px)' }}>Date of Issue</p>
                            </div>
                        </div>
                    </div>

                    {/* Certificate number */}
                    <div className="absolute bottom-1 left-0 right-0 text-center"
                         style={{ color: '#475569', fontSize: 'clamp(5px, 0.8vw, 7px)' }}>
                        Certificate No: {certNumber}
                    </div>
                </div>
            </div>
        </div>
    );
};

/* Shared helpers */
const MetaRow = ({ icon, label, value }) => (
    <div className="flex items-center gap-2 text-xs text-gray-500">
        <span className="text-gray-400">{icon}</span>
        <span className="w-16 shrink-0">{label}</span>
        <span className="text-gray-700 font-medium">{value}</span>
    </div>
);

export default Certificates;
