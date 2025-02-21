import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, collection } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

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
  if (!firebaseConfig[config]) {
    throw new Error(`Missing required Firebase configuration: ${config}`);
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize the database with required data
export async function initializeDatabase() {
  try {
    // Create master admin user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      "drahn@blueisland.ai",
      "Welcome1"
    );

    // Store user data in Firestore
    await setDoc(doc(db, "users", userCredential.user.uid), {
      email: "drahn@blueisland.ai",
      accessLevel: "MasterAdmin",
      clientId: "0"
    });

    // Create initial client
    await setDoc(doc(db, "clients", "0"), {
      companyName: "BlueIsland",
      url: "blueisland.ai",
      collections: true,
      salesQualifier: false,
      survey: false
    });

    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    if (error.code === 'auth/email-already-in-use') {
      console.log("Initial user already exists, skipping initialization");
      return;
    }
    throw error;
  }
}