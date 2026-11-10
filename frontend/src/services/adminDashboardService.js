
import api from "./api";

// Retrieve all data required by the Admin Dashboard.
export const getAdminDashboard = async () => {
    const response = await api.get("/admin/dashboard");
    return response.data;
};
