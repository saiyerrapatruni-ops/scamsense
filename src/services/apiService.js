const API_URL = '/api';

async function apiRequest(path, options = {}) {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options
    });
    return await res.json();
  } catch (err) {
    console.error(`API request error on ${path}:`, err);
    return null;
  }
}

// Scans
export async function saveScanRecord(scanData) {
  const data = await apiRequest('/scans', {
    method: 'POST',
    body: JSON.stringify(scanData)
  });
  return data || { success: false };
}

export async function fetchScanHistory(type = null, email = null) {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (email) params.append('email', email);
  const query = params.toString() ? `?${params.toString()}` : '';
  const data = await apiRequest(`/scans${query}`);
  return data?.scans || [];
}

export async function deleteScanRecord(scanId) {
  const data = await apiRequest(`/scans/${scanId}`, { method: 'DELETE' });
  return data || { success: false };
}

// Visitors
export async function logVisitorEnter(visitor) {
  const data = await apiRequest('/visitors/enter', {
    method: 'POST',
    body: JSON.stringify(visitor)
  });
  return data || { success: false };
}

export async function updateVisitorName(payload) {
  const data = await apiRequest('/visitors/name', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return data || { success: false };
}

export async function fetchVisitors() {
  const data = await apiRequest('/visitors');
  return data?.visitors || [];
}
