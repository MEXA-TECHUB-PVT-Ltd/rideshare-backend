exports.updateExpiredVerificationRequests = async () => {
  const currentDate = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
  const query = `
    UPDATE driver_verification_request
    SET is_expire = TRUE
    WHERE expiry_date < $1 AND is_expire = FALSE;
  `;

  try {
    const res = await pool.query(query, [currentDate]);
    console.log(`Updated ${res.rowCount} expired verification requests.`);
  } catch (err) {
    console.error("Error updating expired verification requests:", err);
  }
};
