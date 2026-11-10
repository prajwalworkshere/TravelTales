
import api from "./api";

// ==========================================
// API 1: GET ALL CONTACT MESSAGES
// ==========================================

export const getContactMessages = async (params = {}) => {
    const response = await api.get("/admin/contact-messages", {
        params
    });

    return response.data;
};

// ==========================================
// API 2: GET CONTACT MESSAGE STATISTICS
// ==========================================

export const getContactMessageStats = async () => {
    const response = await api.get("/admin/contact-messages/stats");

    return response.data;
};

// ==========================================
// API 3: GET CONTACT MESSAGE BY ID
// ==========================================

export const getContactMessageById = async (messageId) => {
    const response = await api.get(
        `/admin/contact-messages/${messageId}`
    );

    return response.data;
};

// ==========================================
// API 4: UPDATE CONTACT MESSAGE STATUS
// ==========================================

export const updateContactMessageStatus = async (
    messageId,
    status
) => {
    const response = await api.patch(
        `/admin/contact-messages/${messageId}/status`,
        { status }
    );

    return response.data;
};
