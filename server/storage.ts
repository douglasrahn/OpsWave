import { type User, type InsertUser, type Client, type InsertClient } from "@shared/schema";

export interface IStorage {
  // Add interfaces here if needed for future database integration
}

export class MemStorage implements IStorage {
  // Add implementation if needed
}

export const storage = new MemStorage();