const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function fixAdmin() {
  try {
    // Create new password hash with salt rounds 12 (matching auth controller)
    const hashedPassword = await bcrypt.hash('Password123!', 12);
    
    // Update existing admin user's password
    const admin = await prisma.user.update({
      where: { email: 'admin@snappclone.com' },
      data: {
        passwordHash: hashedPassword
      }
    });
    
    console.log('✅ Updated admin user password:', {
      email: admin.email,
      userType: admin.userType,
      name: admin.name
    });
    
    // Test password
    const isValid = await bcrypt.compare('Password123!', admin.passwordHash);
    console.log('Password test result:', isValid);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdmin();