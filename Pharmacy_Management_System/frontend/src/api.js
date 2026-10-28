const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API}${path}`, {
      ...options,
      headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...(options.headers || {}) },
    });
  } catch {
    throw new Error("Cannot reach the MediStock API. Make sure the backend is running on port 5000.");
  }
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : {};
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

export const getMedicines = (search = "") => request(`/medicines${search ? `?search=${encodeURIComponent(search)}` : ""}`);
export const getDashboard = () => request("/dashboard");
export const createMedicine = (data) => request("/medicines", { method: "POST", body: JSON.stringify(data) });
export const updateMedicine = (id, data) => request(`/medicines/${id}`, { method: "PUT", body: JSON.stringify(data) });
export const updateStock = (id, action, quantity) => request(`/medicines/${id}/stock`, { method: "PATCH", body: JSON.stringify({ action, quantity: Number(quantity) }) });
export const deleteMedicine = (id) => request(`/medicines/${id}`, { method: "DELETE" });
