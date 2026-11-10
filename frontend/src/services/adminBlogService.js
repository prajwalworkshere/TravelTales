
import api from "./api";

// API 1: Get all blogs with optional filters and pagination.
export const getBlogs = async (params = {}) => {
    const response = await api.get("/admin/blogs", {
        params,
    });

    return response.data;
};

// API 2: Get complete details of a particular blog.
export const getBlogById = async (blogId) => {
    const response = await api.get(`/admin/blogs/${blogId}`);

    return response.data;
};

// API 3: Publish or hide a blog.
export const updateBlogStatus = async (blogId, status) => {
    const response = await api.patch(
        `/admin/blogs/${blogId}/status`,
        { status }
    );

    return response.data;
};

// API 4: Permanently delete a blog.
export const deleteBlog = async (blogId) => {
    const response = await api.delete(`/admin/blogs/${blogId}`);

    return response.data;
};
