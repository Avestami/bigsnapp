import { PrismaClient, UserType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create a test rider user
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  
  // Check if users already exist
  const existingRider = await prisma.user.findUnique({
    where: { email: 'john.rider@example.com' }
  });
  
  const existingDriver = await prisma.user.findUnique({
    where: { email: 'jane.driver@example.com' }
  });

  let testUser;
  if (!existingRider) {
    testUser = await prisma.user.create({
      data: {
        name: 'John Rider',
        email: 'john.rider@example.com',
        phoneNumber: '+98912345678', // Iranian format
        passwordHash: hashedPassword,
        userType: UserType.RIDER,
        wallet: {
          create: {
            balanceRial: 100000 // 100,000 Rial = 10 Toman
          }
        }
      },
      include: {
        wallet: true
      }
    });
    console.log('✅ Created test rider:', testUser);
  } else {
    console.log('ℹ️ Test rider already exists');
    testUser = existingRider;
  }

  // Create a test driver user (initially as RIDER, to be promoted later)
  let testDriver;
  if (!existingDriver) {
    testDriver = await prisma.user.create({
      data: {
        name: 'Jane Driver',
        email: 'jane.driver@example.com',
        phoneNumber: '+98912345679', // Iranian format, different number
        passwordHash: hashedPassword,
        userType: UserType.RIDER, // Will be promoted to DRIVER via admin
        wallet: {
          create: {
            balanceRial: 50000 // 50,000 Rial = 5 Toman
          }
        }
      },
      include: {
        wallet: true
      }
    });
    console.log('✅ Created test user (to be promoted to driver):', testDriver);
  } else {
    console.log('ℹ️ Test driver candidate already exists');
    testDriver = existingDriver;
  }

  // Create admin user if it doesn't exist
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@snappclone.com' }
  });

  let adminUser;
  if (!existingAdmin) {
    adminUser = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'admin@snappclone.com',
        phoneNumber: '+989123456789',
        passwordHash: hashedPassword, // Same password for testing
        userType: UserType.ADMIN,
        wallet: {
          create: {
            balanceRial: 1000000 // 1,000,000 Rial = 100 Toman
          }
        }
      },
      include: {
        wallet: true
      }
    });
    console.log('✅ Created admin user:', adminUser);
  } else {
    console.log('ℹ️ Admin user already exists');
    adminUser = existingAdmin;
  }

  console.log('🎉 Database seeding completed!');
  console.log('📋 Test accounts created:');
  console.log('   👤 Rider: john.rider@example.com / Password123!');
  console.log('   🚗 Driver candidate: jane.driver@example.com / Password123!');
  console.log('   👑 Admin: admin@snappclone.com / Password123!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });