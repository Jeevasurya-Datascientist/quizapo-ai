import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAHVTUv4mRz8jTRfIqL5JmdyZhkyE5Oyq0",
  authDomain: "quizapo-ai.firebaseapp.com",
  projectId: "quizapo-ai",
  storageBucket: "quizapo-ai.firebasestorage.app",
  messagingSenderId: "837481826446",
  appId: "1:837481826446:web:eec0c95b4c90fa490861df",
  measurementId: "G-5V4TY11C27"
};

import { verifyJsCorp } from "../core/js-corp-lock";

// Ensure Core Integrity before Service Export
if (!verifyJsCorp()) {
  throw new Error("Service Initialization Failed: Core Verification Error");
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);
export const db = getFirestore(app);
export const storage = getStorage(app);

import { collection, addDoc, serverTimestamp, doc, getDoc, writeBatch, arrayUnion, arrayRemove } from "firebase/firestore";

// --- NOTIFICATION SERVICES ---
export const createNotification = async (
  recipientId: string,
  title: string,
  message: string,
  type: 'info' | 'success' | 'warning' | 'error' = 'info',
  link?: string
) => {
  try {
    const notifyCollection = collection(db, 'notifications');
    await addDoc(notifyCollection, {
      studentId: recipientId, // Helper field for rules
      recipientId,
      title,
      message,
      type,
      link,
      read: false,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

export const notifyFollowers = async (facultyId: string, testId: string, testTitle: string) => {
  try {
    // 1. Get faculty followers
    const userRef = doc(db, 'users', facultyId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return;

    const followers: string[] = userSnap.data().followers || [];

    // 2. Batch create notifications 
    const promises = followers.map(followerId =>
      createNotification(
        followerId,
        "New Test Available",
        `${userSnap.data().name} has published a new test: "${testTitle}". Check it out now!`,
        'success',
        `/student/test/${testId}`
      )
    );

    await Promise.all(promises);
    console.log(`Notified ${followers.length} followers.`);
  } catch (error) {
    console.error("Error notifying followers:", error);
  }
};

// --- SOCIAL SERVICES ---
export const followUser = async (currentUserId: string, targetUserId: string) => {
  try {
    const batch = writeBatch(db);

    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    // Add target to my 'following'
    batch.update(currentUserRef, {
      following: arrayUnion(targetUserId)
    });

    // Add me to target's 'followers'
    batch.update(targetUserRef, {
      followers: arrayUnion(currentUserId)
    });

    await batch.commit();

    // Notify the target
    const currentUserSnap = await getDoc(currentUserRef);
    const name = currentUserSnap.exists() ? currentUserSnap.data().name : "Someone";
    await createNotification(
      targetUserId,
      "New Follower",
      `${name} started following you.`,
      "info"
    );

  } catch (error) {
    console.error("Error following user:", error);
    throw error;
  }
};

export const unfollowUser = async (currentUserId: string, targetUserId: string) => {
  try {
    const batch = writeBatch(db);

    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    // Remove target from my 'following'
    batch.update(currentUserRef, {
      following: arrayRemove(targetUserId)
    });

    // Remove me to target's 'followers'
    batch.update(targetUserRef, {
      followers: arrayRemove(currentUserId)
    });

    await batch.commit();
  } catch (error) {
    console.error("Error unfollowing user:", error);
    throw error;
  }
};