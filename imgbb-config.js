/**
 * ImgBB Upload Config
 * -------------------
 * SECURITY IMPROVEMENTS:
 * - API key is loaded from a separate config file that should be gitignored
 * - For production, use a Cloud Function proxy to hide the key completely
 * - The key below only grants image-upload capability (no account access, no deletes)
 * 
 * To secure further:
 * 1. Create a Firebase Cloud Function that proxies uploads
 * 2. Store the ImgBB key in Firebase Functions environment variables
 * 3. Call the function from admin.html instead of ImgBB directly
 * 
 * For now, this client-side approach is acceptable for a small store.
 * ImgBB free tier allows 32 uploads/day per IP with the public API.
 */
export const IMGBB_API_KEY = "639aa842e060c291cb227393f895ff9e";
export const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";

// Upload constraints
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'];