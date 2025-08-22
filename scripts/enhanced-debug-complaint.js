const { PrismaClient } = require('@prisma/client');

// Add enhanced logging to the createComplaint function
async function enhancedDebugCreateComplaint() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Enhanced Debug for createComplaint Function\n');
    
    // Simulate the exact scenario from WhatsApp
    const phoneNumber = '0507333373';
    const description = 'Test complaint from WhatsApp debug';
    const language = 'ARABIC';
    
    console.log('📱 Simulating WhatsApp complaint creation:');
    console.log(`   Phone: ${phoneNumber}`);
    console.log(`   Description: ${description}`);
    console.log(`   Language: ${language}\n`);
    
    // Step 1: Find client (same as webhook does)
    console.log('1️⃣ Finding client...');
    
    const client = await prisma.client.findFirst({
      where: {
        phone: {
          contains: phoneNumber.replace(/\D/g, '').substring(phoneNumber.replace(/\D/g, '').length - 9)
        }
      }
    });
    
    if (!client) {
      console.log('❌ Client not found');
      return;
    }
    
    console.log(`✅ Found client: ${client.name} (ID: ${client.id})`);
    console.log(`   Current language: ${client.language}`);
    console.log(`   Last action: ${client.lastAction}`);
    
    // Step 2: Update language preference
    console.log('\n2️⃣ Updating language preference...');
    
    if (client.language !== language) {
      try {
        await prisma.client.update({
          where: { id: client.id },
          data: { language }
        });
        console.log(`✅ Language updated to: ${language}`);
      } catch (langError) {
        console.log(`❌ Language update failed: ${langError.message}`);
      }
    } else {
      console.log(`✅ Language already set to: ${language}`);
    }
    
    // Step 3: Check recent complaints
    console.log('\n3️⃣ Checking recent complaints...');
    
    const recentComplaint = await prisma.complaint.findFirst({
      where: {
        clientId: client.id,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      }
    });
    
    if (recentComplaint) {
      console.log(`❌ Recent complaint exists: #${recentComplaint.id}`);
      console.log('   This would block the new complaint');
      return;
    }
    
    console.log('✅ No recent complaints found');
    
    // Step 4: Get properties and units
    console.log('\n4️⃣ Getting client properties and units...');
    
    const clientProperties = await prisma.property.findMany({
      where: { clientId: client.id }
    });
    
    const clientUnits = await prisma.unit.findMany({
      where: { clientId: client.id }
    });
    
    console.log(`   Properties: ${clientProperties.length}`);
    console.log(`   Units: ${clientUnits.length}`);
    
    // Step 5: Prepare complaint data
    console.log('\n5️⃣ Preparing complaint data...');
    
    const title = description.length > 50 ? description.substring(0, 50) + "..." : description;
    
    const complaintData = {
      clientId: client.id,
      propertyId: clientProperties.length > 0 ? clientProperties[0].id : null,
      unitId: clientUnits.length > 0 ? clientUnits[0].id : null,
      title: title,
      description: description,
      category: 'OTHER',
      status: 'PENDING',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('   Complaint data to be created:');
    console.log(`   - clientId: ${complaintData.clientId}`);
    console.log(`   - propertyId: ${complaintData.propertyId}`);
    console.log(`   - unitId: ${complaintData.unitId}`);
    console.log(`   - title: "${complaintData.title}"`);
    console.log(`   - description: "${complaintData.description}"`);
    console.log(`   - category: ${complaintData.category}`);
    console.log(`   - status: ${complaintData.status}`);
    
    // Step 6: Create complaint
    console.log('\n6️⃣ Creating complaint...');
    
    try {
      const complaint = await prisma.complaint.create({
        data: complaintData
      });
      
      console.log(`✅ Complaint created successfully: #${complaint.id}`);
      
      // Step 7: Reset client lastAction
      console.log('\n7️⃣ Resetting client lastAction...');
      
      await prisma.client.update({
        where: { id: client.id },
        data: { lastAction: null }
      });
      
      console.log('✅ Client lastAction reset');
      
      // Step 8: Test notification to management
      console.log('\n8️⃣ Testing management notification...');
      
      const managementPhone = process.env.MANAGEMENT_PHONE_NUMBER;
      
      if (managementPhone) {
        console.log(`📞 Management phone configured: ${managementPhone}`);
        console.log('   (Would send notification in real scenario)');
      } else {
        console.log('⚠️  Management phone not configured in environment');
      }
      
      // Clean up test complaint
      await prisma.complaint.delete({
        where: { id: complaint.id }
      });
      console.log(`🗑️  Cleaned up test complaint #${complaint.id}`);
      
      console.log('\n🎉 SUCCESS: All steps completed without errors!');
      
    } catch (createError) {
      console.log('❌ FAILED to create complaint:');
      console.log(`   Error name: ${createError.name}`);
      console.log(`   Error message: ${createError.message}`);
      console.log(`   Error code: ${createError.code}`);
      
      if (createError.meta) {
        console.log(`   Error meta: ${JSON.stringify(createError.meta, null, 2)}`);
      }
      
      if (createError.stack) {
        console.log(`   Stack trace:`);
        console.log(createError.stack);
      }
      
      // Try to identify the specific issue
      if (createError.code === 'P2002') {
        console.log('\n🔍 Analysis: Unique constraint violation');
        console.log('   This means a complaint with the same data already exists');
      } else if (createError.code === 'P2003') {
        console.log('\n🔍 Analysis: Foreign key constraint violation');
        console.log('   Check if clientId, propertyId, or unitId references exist');
      } else if (createError.message.includes('required')) {
        console.log('\n🔍 Analysis: Missing required field');
        console.log('   Check if all required fields are provided');
      } else {
        console.log('\n🔍 Analysis: Unknown database error');
        console.log('   Check database connection and schema');
      }
    }
    
  } catch (error) {
    console.error('❌ General error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

enhancedDebugCreateComplaint();
