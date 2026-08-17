import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

try {
  initializeApp({
    credential: applicationDefault()
  });
  console.log("Firebase admin initialized.");
} catch (e) {
  console.error("Error:", e);
}
