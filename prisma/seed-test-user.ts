/**
 * @file Seeds the database with a dedicated test user.
 * @description This script creates a user with known credentials for automated
 * testing purposes. It hashes the user's password with bcrypt to match the
 * application's authentication logic. Using `upsert` makes the script safe
 * to run multiple times.
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Initialize Prisma Client
const prisma = new PrismaClient();

// Define the test user's credentials
const TEST_USERNAME = 'testuser';
const TEST_PASSWORD = 'password123';

async function main() {
  console.log('Starting to seed the test user...');

  // Hash the password
  const hashedPassword = await bcrypt.hash(TEST_PASSWORD, 10);

  // Create or update the test user
  const user = await prisma.user.upsert({
    where: { username: TEST_USERNAME },
    update: {
      password: hashedPassword,
    },
    create: {
      username: TEST_USERNAME,
      email: 'testuser@example.com', // A dummy email is required by the schema
      password: hashedPassword,
      isAdmin: true, // Make the test user an admin to access all features
    },
  });

  console.log(`Successfully seeded test user: ${user.username}`);
}

main()
  .catch((e) => {
    console.error('Error seeding test user:', e);
    process.exit(1);
  })
  .finally(async () => {
    // Ensure the Prisma Client disconnects
    await prisma.$disconnect();
  });
