// تشخيص شامل لمشكلة قائمة الملاك في صفحة الفواتير
// تاريخ: 2025-07-02

console.log("=== تشخيص مشكلة قائمة الملاك ===");

// 1. تجربة اختبار API endpoint مباشرة
async function testOwnersAPI() {
    try {
        console.log("1. اختبار API endpoint الملاك...");
        const response = await fetch("/api/fast-handler?id=owners");
        console.log("Response status:", response.status);
        
        const data = await response.json();
        console.log("Response data:", data);
        console.log("Is array:", Array.isArray(data));
        console.log("Data length:", data.length);
        
        if (data.length > 0) {
            console.log("أول مالك:", data[0]);
            console.log("خصائص أول مالك:", Object.keys(data[0]));
        }
        
        return data;
    } catch (error) {
        console.error("خطأ في اختبار API:", error);
        return [];
    }
}

// 2. اختبار تحويل البيانات وفلترة العقارات
async function testOwnersDataProcessing() {
    const owners = await testOwnersAPI();
    
    console.log("\n2. اختبار معالجة بيانات الملاك...");
    
    // اختبار معالجة الأسماء
    owners.forEach((owner, index) => {
        console.log(`المالك ${index + 1}:`);
        console.log("  - ID:", owner.id);
        console.log("  - الاسم الأصلي:", owner.name);
        console.log("  - الاسم المنسق:", owner.name?.replace(/\t/g, ' ').trim());
        console.log("  - الهاتف:", owner.phone);
        console.log("  - البريد:", owner.email);
    });
}

// 3. اختبار فلترة العقارات بناءً على المالك
async function testPropertyFiltering() {
    console.log("\n3. اختبار فلترة العقارات...");
    
    try {
        const propertiesResponse = await fetch("/api/fast-handler?id=properties");
        const properties = await propertiesResponse.json();
        console.log("إجمالي العقارات:", properties.length);
        
        if (properties.length > 0) {
            console.log("أول عقار:", properties[0]);
            console.log("طرق ربط المالك في العقار:");
            console.log("  - client?.id:", properties[0].client?.id);
            console.log("  - clientId:", properties[0].clientId);
            console.log("  - ownerId:", properties[0].ownerId);
            console.log("  - owner?.id:", properties[0].owner?.id);
        }
        
        const owners = await testOwnersAPI();
        
        // اختبار فلترة العقارات لكل مالك
        owners.forEach(owner => {
            const filteredProperties = properties.filter(property => {
                const ownerIdMethods = [
                    property.client?.id,
                    property.clientId,
                    property.ownerId,
                    property.owner?.id
                ];
                
                const propertyOwnerId = ownerIdMethods.find(id => id != null);
                return propertyOwnerId == owner.id;
            });
            
            console.log(`المالك ${owner.name?.replace(/\t/g, ' ').trim()} (ID: ${owner.id}):`);
            console.log(`  - عدد العقارات: ${filteredProperties.length}`);
            
            if (filteredProperties.length > 0) {
                console.log("  - أسماء العقارات:", filteredProperties.map(p => p.name));
            }
        });
        
    } catch (error) {
        console.error("خطأ في اختبار فلترة العقارات:", error);
    }
}

// 4. اختبار تشغيل كامل للمكونات
async function runCompleteTest() {
    console.log("\n=== بدء الاختبار الشامل ===");
    
    await testOwnersDataProcessing();
    await testPropertyFiltering();
    
    console.log("\n=== انتهاء الاختبار الشامل ===");
}

// 5. تنفيذ الاختبار
if (typeof window !== 'undefined') {
    // تشغيل في المتصفح
    console.log("تشغيل اختبار قائمة الملاك في المتصفح...");
    runCompleteTest();
} else {
    // تصدير للاستخدام
    module.exports = {
        testOwnersAPI,
        testOwnersDataProcessing,
        testPropertyFiltering,
        runCompleteTest
    };
}

// 6. ملاحظات للإصلاح:
console.log(`
=== ملاحظات لحل مشكلة قائمة الملاك ===

1. تأكد من أن API endpoint (/api/fast-handler?id=owners) يعيد البيانات بصيغة صحيحة
2. تحقق من أن معالجة الاستجابة في صفحة الفواتير صحيحة (dataOwners vs dataOwners.value)
3. تأكد من أن أسماء الملاك تُعرض بشكل صحيح بعد معالجة النص العربي
4. اختبر فلترة العقارات بناءً على المالك المختار
5. تحقق من أن قائمة الملاك المنسدلة تظهر العدد الصحيح من الملاك
6. اختبر ترابط فلتر المالك مع فلتر العقار
7. تأكد من أن اختيار مالك يؤثر على فلترة الفواتير بشكل صحيح

=== مشاكل محتملة ===

- مشكلة في session/تسجيل الدخول تمنع الوصول للصفحة
- خطأ في معالجة استجابة API (dataOwners.value vs dataOwners)
- مشكلة في تشفير النص العربي
- خطأ في منطق فلترة العقارات
- مشكلة في ربط المالك بالعقار في قاعدة البيانات
`);
