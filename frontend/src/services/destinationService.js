
import api from "./api";

export const getDestinations = async () => {
  const response = await api.get("/destinations");
  return response.data;
};
