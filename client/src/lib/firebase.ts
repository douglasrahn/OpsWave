import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, setDoc, collection, enableIndexedDbPersistence, getDoc } from "firebase/firestore";
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

async function initializeScenarioData() {
  console.log("Initializing scenario data...");
  const scenarioRef = doc(db, "scenarios", "0");

  try {
    // Check if scenario document exists
    const scenarioDoc = await getDoc(scenarioRef);
    if (!scenarioDoc.exists()) {
      console.log("Creating new scenario document...");
      await setDoc(scenarioRef, {
        clientId: "0",
        serviceId: "CollectionReminders",
        scenarioId: "3684649",
        status: "active"
      });
      console.log("Scenario document created successfully");
    } else {
      console.log("Scenario document already exists:", scenarioDoc.data());
      // Update the document to ensure it has the correct data
      await setDoc(scenarioRef, {
        clientId: "0",
        serviceId: "CollectionReminders",
        scenarioId: "3684649",
        status: "active"
      }, { merge: true });
      console.log("Scenario document updated successfully");
    }
  } catch (error) {
    console.error("Error initializing scenario data:", error);
    throw error;
  }
}

// Initialize the database with required data
export async function initializeDatabase() {
  try {
    console.log("Starting database initialization...");

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
      email: "drahn@blueisland.ai"  // Add email field here
    });

    await initializeScenarioData();
    console.log("Database initialized successfully");
  } catch (error) {
    console.error("Error initializing database:", error);
    if (error instanceof Error && error.message.includes('auth/email-already-in-use')) {
      console.log("User already exists, ensuring client data is initialized...");
      try {
        // Update client data to ensure email field exists
        await setDoc(doc(db, "clients", "0"), {
          companyName: "BlueIsland",
          url: "blueisland.ai",
          email: "drahn@blueisland.ai"
        }, { merge: true });
        await initializeScenarioData();
        console.log("Data initialized/updated successfully");
      } catch (updateError) {
        console.error("Error updating data:", updateError);
        throw updateError;
      }
      return;
    }
    throw error;
  }
}