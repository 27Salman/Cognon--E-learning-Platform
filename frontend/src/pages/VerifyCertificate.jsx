import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle, XCircle, Award, BookOpen, User, Calendar, Hash, Loader } from 'lucide-react';
import { studentAPI } from '../api/studentAPI';

const VerifyCertificate = () => {
    const { certificateNumber } = useParams();
    const [status, setStatus]   = useState('loading'); // 'loading' | 'valid' | 'invalid'
    const [cert, setCert]       = useState(null);

    useEffect(() => {
        if (!certificateNumber) { setStatus('invalid'); return; }

        studentAPI.verifyCertificate(certificateNumber)
            .then(res => { setCert(res.data); setStatus('valid'); })
            .catch(() => setStatus('invalid'));
    }, [certificateNumber]);

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">

            {/* Branding */}
            <Link to="/" className="flex items-center gap-2 mb-10">
                <div className="p-2 bg-yellow-400 rounded-lg">
                    <Award className="w-5 h-5 text-gray-900" />
                </div>
                <span className="text-xl font-bold text-gray-900 tracking-wide">COGNON</span>
            </Link>

            {/* Loading */}
            {status === 'loading' && (
                <div className="flex flex-col items-center gap-3 text-gray-500">
                    <Loader className="w-8 h-8 animate-spin text-yellow-500" />
                    <p className="text-sm">Verifying certificate...</p>
                </div>
            )}

            {/* Invalid */}
            {status === 'invalid' && (
                <div className="bg-white rounded-2xl shadow-sm border border-red-100 p-10 max-w-md w-full text-center">
                    <XCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-gray-800 mb-2">Certificate Not Found</h1>
                    <p className="text-gray-500 text-sm mb-6">
                        The certificate number <span className="font-mono font-semibold text-gray-700 break-all">{certificateNumber}</span> does not match any record in our system.
                        It may be invalid, expired, or entered incorrectly.
                    </p>
                    <Link
                        to="/"
                        className="inline-block px-5 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-medium hover:bg-gray-700 transition-colors"
                    >
                        Go to Cognon
                    </Link>
                </div>
            )}

            {/* Valid */}
            {status === 'valid' && cert && (
                <div className="max-w-lg w-full">
                    {/* Status badge */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                        <CheckCircle className="w-6 h-6 text-green-500" />
                        <span className="text-green-700 font-semibold text-lg">Certificate Verified</span>
                    </div>

                    {/* Certificate preview card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
                        <div className="h-2 bg-gradient-to-r from-yellow-400 to-yellow-600" />

                        {/* Mini certificate design */}
                        <div
                            className="w-full"
                            style={{
                                background: '#0f172a',
                                padding: '32px 40px',
                                fontFamily: 'sans-serif',
                            }}
                        >
                            <p className="text-center font-bold tracking-widest mb-1"
                               style={{ color: '#f59e0b', fontSize: 22 }}>
                                COGNON
                            </p>
                            <p className="text-center tracking-widest mb-6"
                               style={{ color: '#94a3b8', fontSize: 9 }}>
                                E-LEARNING PLATFORM
                            </p>

                            <p className="text-center mb-1"
                               style={{ color: '#94a3b8', fontSize: 10, letterSpacing: '0.2em' }}>
                                CERTIFICATE OF COMPLETION
                            </p>
                            <div className="mx-auto mb-4"
                                 style={{ width: 120, height: 1, background: '#f59e0b' }} />

                            <p className="text-center mb-1"
                               style={{ color: '#cbd5e1', fontSize: 11 }}>
                                This certifies that
                            </p>
                            <p className="text-center font-bold mb-1"
                               style={{ color: '#ffffff', fontSize: 26 }}>
                                {cert.studentName}
                            </p>
                            <div className="mx-auto mb-3"
                                 style={{ width: '60%', height: 1, background: '#f59e0b' }} />
                            <p className="text-center mb-2"
                               style={{ color: '#cbd5e1', fontSize: 11 }}>
                                has successfully completed the course
                            </p>
                            <p className="text-center font-bold mb-4"
                               style={{ color: '#f59e0b', fontSize: 16 }}>
                                {cert.courseName}
                            </p>
                            <div className="flex justify-center">
                                <span className="px-4 py-1 rounded-full font-bold"
                                      style={{ background: '#1e293b', color: '#f59e0b', fontSize: 11 }}>
                                    Score: {cert.score}
                                </span>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="p-6 space-y-3">
                            <DetailRow icon={<User className="w-4 h-4" />}     label="Instructor"   value={cert.instructorName || '—'} />
                            <DetailRow icon={<BookOpen className="w-4 h-4" />} label="Course"       value={cert.courseName} />
                            <DetailRow icon={<Calendar className="w-4 h-4" />} label="Issued on"    value={new Date(cert.issuedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} />
                            <DetailRow icon={<Award className="w-4 h-4" />}    label="Score"        value={cert.score} />
                            <DetailRow
                                icon={<Hash className="w-4 h-4" />}
                                label="Certificate No."
                                value={
                                    <span className="font-mono text-xs break-all">{cert.certificateNumber}</span>
                                }
                            />
                        </div>
                    </div>

                    {/* Footer note */}
                    <p className="text-center text-xs text-gray-400">
                        This certificate was issued by Cognon and has been verified as authentic.
                    </p>
                </div>
            )}
        </div>
    );
};

const DetailRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-3 text-sm">
        <span className="text-yellow-500 mt-0.5 shrink-0">{icon}</span>
        <span className="text-gray-500 w-28 shrink-0">{label}</span>
        <span className="text-gray-800 font-medium">{value}</span>
    </div>
);

export default VerifyCertificate;
