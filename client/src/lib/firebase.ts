import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.appspot.com`,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Verify that all required configuration values are present
const requiredConfigs = ['apiKey', 'authDomain', 'projectId', 'appId'];
for (const config of requiredConfigs) {
  if (!firebaseConfig[config as keyof typeof firebaseConfig]) {
    throw new Error(`Missing required Firebase configuration: ${config}`);
  }
}

console.log("Initializing Firebase with project:", firebaseConfig.projectId);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Enable offline persistence
enableIndexedDbPersistence(db)
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.error('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.error('The current browser does not support persistence.');
    }
  });

// Initialize the database with basic configuration only
export async function initializeDatabase() {
  try {
    console.log("Starting Firebase initialization...");
    console.log("Firebase initialized successfully");
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    throw error;
  }
}