import fs from 'fs';

try {
  const response = await fetch('http://localhost:3000/api/admin/create-user');
  const text = await response.text();
  console.log("Response status:", response.status);
  console.log("Response body:", text);
} catch (e) {
  console.error("Fetch failed:", e.message);
}
