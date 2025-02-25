import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase";

export async function createTestCampaignEntry() {
  try {
    const clientId = "0";
    const campaignId = "VxC45m8tOpfYRh7uhQOJ";

    console.log(`Creating test campaign entry for client ${clientId} and campaign ${campaignId}`);
    console.log(`Using Firestore path: /${clientId}/campaigns/${campaignId}/entries`);

    const entryData = {
      campaignId,
      clientId,
      status: "pending",
      contactFirstName: "John",
      contactLastName: "Doe",
      contactPhone: "+1-555-123-4567",
      companyName: "Acme Corp",
      companyAddress1: "123 Business Street",
      companyAddress2: "Suite 456",
      companyCity: "San Francisco",
      companyState: "CA",
      companyZip: "94105",
      companyPhone: "+1-555-987-6543",
      pastDueAmount: 1500.00,
      previousNotes: "Previous contact attempt on Jan 15th",
      log: "Initial entry created",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const entryRef = await addDoc(
      collection(db, clientId, "campaigns", campaignId, "entries"),
      entryData
    );

    console.log("Created test campaign entry with ID:", entryRef.id);
    return entryRef.id;
  } catch (error) {
    console.error("Error creating test campaign entry:", error);
    throw error;
  }
}