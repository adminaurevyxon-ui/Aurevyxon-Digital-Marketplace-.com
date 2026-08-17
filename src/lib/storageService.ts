import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { doc, setDoc, writeBatch } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { storage, db, auth } from "./firebase";
import { toast } from "sonner";

export const MAX_AVATAR_SIZE_MB = 5;
export const MAX_AVATAR_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/jpg"];

export interface ValidateImageResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates file format (PNG, JPG, JPEG only) and file size (max 5MB)
 */
export function validateProfileImage(file: File): ValidateImageResult {
  if (!file) {
    return { valid: false, error: "No file selected." };
  }

  const fileType = file.type?.toLowerCase();
  const fileName = file.name?.toLowerCase();
  const isExtensionValid = fileName.endsWith(".png") || fileName.endsWith(".jpg") || fileName.endsWith(".jpeg");
  const isMimeValid = ALLOWED_IMAGE_TYPES.includes(fileType);

  if (!isExtensionValid && !isMimeValid) {
    return {
      valid: false,
      error: "Invalid file format. Only PNG, JPG, and JPEG images are allowed."
    };
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return {
      valid: false,
      error: `File size exceeds ${MAX_AVATAR_SIZE_MB}MB. Please select a smaller image.`
    };
  }

  return { valid: true };
}

/**
 * Real Firebase Storage Upload function for User, Seller, and Admin avatars.
 */
export async function uploadAvatarToFirebaseStorage(
  uid: string,
  file: File,
  role: "user" | "seller" | "admin" = "user"
): Promise<string> {
  const validation = validateProfileImage(file);
  if (!validation.valid) {
    throw new Error(validation.error || "Invalid file for avatar upload.");
  }

  // File extension extraction
  const extMatch = file.name.match(/\.(png|jpg|jpeg)$/i);
  const ext = extMatch ? extMatch[1].toLowerCase() : "png";

  // Standardized Storage path according to architecture
  // users/{uid}/profile/avatar.ext
  // sellers/{uid}/profile/avatar.ext
  // admins/{uid}/profile/avatar.ext
  const storagePath = `${role}s/${uid}/profile/avatar_${Date.now()}.${ext}`;
  const storageRef = ref(storage, storagePath);

  console.log(`📤 Uploading real profile image to Firebase Storage path: ${storagePath}`);

  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type || `image/${ext}`,
    customMetadata: {
      ownerUid: uid,
      role,
      uploadedAt: new Date().toISOString()
    }
  });

  const downloadURL = await getDownloadURL(snapshot.ref);
  console.log(`✅ Upload complete! Firebase Storage Download URL: ${downloadURL}`);
  return downloadURL;
}

/**
 * Updates full profile across Real Firebase Storage, Cloud Firestore, Firebase Auth, and Backend Database
 */
export async function updateUniversalProfile({
  uid,
  displayName,
  file,
  isRemovePhoto = false,
  role = "user",
  token
}: {
  uid: string;
  displayName?: string;
  file?: File | null;
  isRemovePhoto?: boolean;
  role?: "user" | "seller" | "admin";
  token?: string | null;
}): Promise<{ name: string; photoURL: string }> {
  if (!uid) {
    throw new Error("User ID is required for profile updates.");
  }

  let finalPhotoURL: string | null = null;

  // 1. Storage Upload or Photo Removal
  if (file) {
    const validation = validateProfileImage(file);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    finalPhotoURL = await uploadAvatarToFirebaseStorage(uid, file, role);
  } else if (isRemovePhoto) {
    finalPhotoURL = "";
  }

  const trimmedName = displayName ? displayName.trim() : "";
  if (displayName !== undefined && trimmedName.length === 0) {
    throw new Error("Display Name cannot be empty.");
  }

  const nowISO = new Date().toISOString();

  // 2. Real Cloud Firestore Persistence
  try {
    const batch = writeBatch(db);

    const userRef = doc(db, "users", uid);
    const userProfileRef = doc(db, "user_profiles", uid);

    const userPayload: any = {
      uid,
      updatedAt: nowISO
    };

    if (trimmedName) userPayload.name = trimmedName;
    if (finalPhotoURL !== null) {
      userPayload.photoURL = finalPhotoURL;
      userPayload.photoUpdatedAt = nowISO;
    }

    batch.set(userRef, userPayload, { merge: true });
    batch.set(userProfileRef, userPayload, { merge: true });

    if (role === "seller") {
      const sellerRef = doc(db, "sellers", uid);
      const sellerProfileRef = doc(db, "seller_profiles", uid);
      const sellerPayload: any = {
        id: uid,
        user_id: uid,
        updated_at: nowISO
      };
      if (trimmedName) sellerPayload.store_name = trimmedName;
      if (finalPhotoURL !== null) sellerPayload.photoURL = finalPhotoURL;

      batch.set(sellerRef, sellerPayload, { merge: true });
      batch.set(sellerProfileRef, sellerPayload, { merge: true });
    }

    if (role === "admin") {
      const adminRoleRef = doc(db, "admin_roles", uid);
      const adminPayload: any = {
        id: uid,
        updated_at: nowISO
      };
      if (trimmedName) adminPayload.name = trimmedName;
      if (finalPhotoURL !== null) adminPayload.photoURL = finalPhotoURL;

      batch.set(adminRoleRef, adminPayload, { merge: true });
    }

    await batch.commit();
    console.log(`🔥 [Firestore] Successfully persisted ${role} profile for UID ${uid}`);
  } catch (err: any) {
    console.error("❌ [Firestore Error] Failed to update profile document:", err);
    throw new Error(`Firestore update failed: ${err.message || "Permission or network error"}`);
  }

  // 3. Synchronize Firebase Authentication Profile if currentUser matches
  if (auth.currentUser && auth.currentUser.uid === uid) {
    try {
      const authUpdate: { displayName?: string; photoURL?: string } = {};
      if (trimmedName) authUpdate.displayName = trimmedName;
      if (finalPhotoURL !== null) authUpdate.photoURL = finalPhotoURL;

      await updateProfile(auth.currentUser, authUpdate);
      console.log("✅ Synchronized Firebase Auth profile!");
    } catch (authErr: any) {
      console.warn("⚠️ Firebase Auth profile sync notice:", authErr?.message);
    }
  }

  // 4. Backend Database Sync (SQLite + API)
  if (token) {
    try {
      const apiEndpoint = role === "seller" ? "/api/seller/settings" : "/api/user/profile";
      const payload: any = {};
      if (trimmedName) payload.name = trimmedName;
      if (trimmedName && role === "seller") payload.storeName = trimmedName;
      if (finalPhotoURL !== null) payload.avatar_url = finalPhotoURL;

      await fetch(apiEndpoint, {
        method: role === "seller" ? "POST" : "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
    } catch (apiErr) {
      console.warn("⚠️ Backend SQLite profile sync notice:", apiErr);
    }
  }

  return {
    name: trimmedName,
    photoURL: finalPhotoURL !== null ? finalPhotoURL : ""
  };
}
