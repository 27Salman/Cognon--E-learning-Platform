import api from "./axios";

export const certificateAPI = {
  getUserCertificates: (page = 1, limit = 10) =>
    api.get(`/certificates?page=${page}&limit=${limit}`),

  getCertificateById: (certificateId) =>
    api.get(`/certificates/${certificateId}`),

  downloadCertificate: (certificateId) =>
    api.get(`/certificates/${certificateId}/download`, {
      responseType: "blob",
    }),

  verifyCertificate: (certificateNumber) =>
    api.get(`/verify/${certificateNumber}`),
};
