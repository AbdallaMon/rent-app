const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function restoreBasicData() {
  try {
    console.log('🔄 إعادة إنشاء البيانات الأساسية...\n');

    // إعادة إنشاء المستخدمين الأساسيين
    console.log('👥 إنشاء المستخدمين الأساسيين...');
    
    const users = [
      {
        name: 'admin',
        email: '6111139@gmail.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'ADMIN'
      },
      {
        name: 'البدوي عبدالله',
        email: '6111139s@gmail.com',
        password: await bcrypt.hash('123456', 10),
        role: 'USER'
      },
      {
        name: 'عقارات أبوظبي',
        email: 'alain77@gmail.com',
        password: await bcrypt.hash('123456', 10),
        role: 'USER'
      },
      {
        name: 'محمد سيف الخييلي',
        email: '4477719@gmail.com',
        password: await bcrypt.hash('123456', 10),
        role: 'USER'
      },
      {
        name: 'سيف سهيل الخييلي',
        email: '4477718@gmail.com',
        password: await bcrypt.hash('123456', 10),
        role: 'USER'
      },
      {
        name: 'جمعة سيف الخييلي',
        email: 'uae4393@gmail.com',
        password: await bcrypt.hash('123456', 10),
        role: 'ADMIN'
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      try {
        const user = await prisma.user.create({
          data: userData
        });
        createdUsers.push(user);
        console.log(`✅ تم إنشاء المستخدم: ${user.name} (${user.email})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️ المستخدم موجود مسبقاً: ${userData.email}`);
          const existingUser = await prisma.user.findUnique({
            where: { email: userData.email }
          });
          createdUsers.push(existingUser);
        } else {
          console.error(`❌ خطأ في إنشاء المستخدم ${userData.email}:`, error.message);
        }
      }
    }

    // إنشاء الصلاحيات للمستخدمين
    console.log('\n🔐 إعطاء الصلاحيات للمستخدمين...');
    
    const areas = ['HOME', 'FOLLOW_UP', 'PROPERTY', 'UNIT', 'RENT', 'INVOICE', 'MAINTENANCE', 'REQUEST', 'REPORT', 'OWNER', 'RENTER', 'SETTING'];

    for (const user of createdUsers) {
      if (user.role === 'ADMIN') {
        // إعطاء كل الصلاحيات للإداريين
        for (const area of areas) {
          const privilege = await prisma.privilege.findFirst({
            where: { name: area }
          });

          if (privilege) {
            try {
              await prisma.userPrivilege.create({
                data: {
                  userId: user.id,
                  privilegeId: privilege.id,
                  area: area
                }
              });
            } catch (error) {
              // تجاهل إذا كانت موجودة
            }
          }
        }

        // إعطاء صلاحية واتساب
        const whatsappPrivilege = await prisma.privilege.findFirst({
          where: { name: 'WHATSAPP_ADMIN' }
        });

        if (whatsappPrivilege) {
          try {
            await prisma.userPrivilege.create({
              data: {
                userId: user.id,
                privilegeId: whatsappPrivilege.id,
                area: 'WHATSAPP'
              }
            });
            console.log(`✅ تم إعطاء صلاحية واتساب للإداري: ${user.name}`);
          } catch (error) {
            // تجاهل إذا كانت موجودة
          }
        }

        console.log(`✅ تم إعطاء كل الصلاحيات للإداري: ${user.name}`);
      } else {
        // إعطاء صلاحيات محدودة للمستخدمين العاديين
        const basicAreas = ['HOME', 'FOLLOW_UP', 'PROPERTY', 'UNIT', 'RENT', 'INVOICE'];
        
        for (const area of basicAreas) {
          const privilege = await prisma.privilege.findFirst({
            where: { name: area }
          });

          if (privilege) {
            try {
              await prisma.userPrivilege.create({
                data: {
                  userId: user.id,
                  privilegeId: privilege.id,
                  area: area
                }
              });
            } catch (error) {
              // تجاهل إذا كانت موجودة
            }
          }
        }

        console.log(`✅ تم إعطاء الصلاحيات الأساسية للمستخدم: ${user.name}`);
      }
    }

    // إنشاء بعض البيانات الأساسية للولايات والمدن
    console.log('\n🌍 إنشاء البيانات الجغرافية الأساسية...');
    
    const states = [
      { name: 'أبوظبي' },
      { name: 'دبي' },
      { name: 'الشارقة' },
      { name: 'عجمان' },
      { name: 'الفجيرة' },
      { name: 'رأس الخيمة' },
      { name: 'أم القيوين' }
    ];

    for (const stateData of states) {
      try {
        const state = await prisma.state.create({
          data: stateData
        });
        console.log(`✅ تم إنشاء الولاية: ${state.name}`);

        // إضافة مدن أساسية
        if (state.name === 'أبوظبي') {
          await prisma.city.create({
            data: {
              name: 'أبوظبي',
              stateId: state.id
            }
          });
          await prisma.city.create({
            data: {
              name: 'العين',
              stateId: state.id
            }
          });
        } else if (state.name === 'دبي') {
          await prisma.city.create({
            data: {
              name: 'دبي',
              stateId: state.id
            }
          });
        }
      } catch (error) {
        if (error.code !== 'P2002') {
          console.error(`❌ خطأ في إنشاء الولاية ${stateData.name}:`, error.message);
        }
      }
    }

    console.log('\n🎉 تم إعادة إنشاء البيانات الأساسية بنجاح!');
    console.log('\n📋 ملخص المستخدمين:');
    console.log('=====================================');
    
    const allUsers = await prisma.user.findMany({
      include: {
        privileges: {
          include: {
            privilege: true
          }
        }
      }
    });

    allUsers.forEach(user => {
      const whatsappAccess = user.privileges.some(p => p.area === 'WHATSAPP');
      console.log(`👤 ${user.name} (${user.email})`);
      console.log(`   الدور: ${user.role}`);
      console.log(`   واتساب: ${whatsappAccess ? '✅' : '❌'}`);
      console.log('   ---');
    });

  } catch (error) {
    console.error('❌ خطأ في إعادة إنشاء البيانات:', error);
  } finally {
    await prisma.$disconnect();
  }
}

restoreBasicData();
