/**
 * Deep Diagnostic Script for WhatsApp Dashboard Issue
 * Comprehensive analysis of the current state and problems
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DEEP DIAGNOSTIC - WHATSAPP DASHBOARD ISSUE');
console.log('=' .repeat(60));

// 1. Check current component in main page
console.log('\n1️⃣ CHECKING MAIN PAGE COMPONENT:');
console.log('-'.repeat(40));

try {
    const mainPagePath = 'src/app/admin/whatsapp/dashboard/page.js';
    if (fs.existsSync(mainPagePath)) {
        const content = fs.readFileSync(mainPagePath, 'utf8');
        console.log('✅ Main page exists');
        console.log('📄 Current content:');
        console.log(content);
        
        // Check which component is being used
        if (content.includes('FixedWhatsAppDashboard')) {
            console.log('✅ Using FixedWhatsAppDashboard component');
        } else if (content.includes('ProtectedWhatsAppDashboard')) {
            console.log('❌ Still using ProtectedWhatsAppDashboard component');
        } else if (content.includes('SimpleTestDashboard')) {
            console.log('⚠️ Using SimpleTestDashboard component');
        } else {
            console.log('❓ Unknown component being used');
        }
    } else {
        console.log('❌ Main page does not exist');
    }
} catch (error) {
    console.log('❌ Error reading main page:', error.message);
}

// 2. Check if components exist
console.log('\n2️⃣ CHECKING COMPONENT FILES:');
console.log('-'.repeat(40));

const components = [
    'src/components/FixedWhatsAppDashboard.js',
    'src/components/ProtectedWhatsAppDashboard.js',
    'src/components/SimpleTestDashboard.js',
    'src/components/WhatsAppDashboard.js'
];

components.forEach(comp => {
    if (fs.existsSync(comp)) {
        console.log(`✅ ${comp} - EXISTS`);
        
        // Check for syntax errors or imports
        try {
            const content = fs.readFileSync(comp, 'utf8');
            
            // Check for common issues
            if (content.includes('useAuth') && !content.includes("from '@/app/context/AuthProvider/AuthProvider'")) {
                console.log(`   ⚠️ Potential import issue with useAuth`);
            }
            
            if (content.includes('useRouter') && !content.includes("from 'next/navigation'")) {
                console.log(`   ⚠️ Potential import issue with useRouter`);
            }
            
            console.log(`   📝 Size: ${content.length} characters`);
        } catch (error) {
            console.log(`   ❌ Error reading: ${error.message}`);
        }
    } else {
        console.log(`❌ ${comp} - MISSING`);
    }
});

// 3. Check UI components
console.log('\n3️⃣ CHECKING UI COMPONENTS:');
console.log('-'.repeat(40));

const uiComponents = [
    'src/components/ui/alert.js',
    'src/components/ui/tabs.js',
    'src/components/ui/card.js',
    'src/components/ui/badge.js',
    'src/components/ui/button.js',
    'src/components/ui/icons.js'
];

let missingUI = [];
uiComponents.forEach(comp => {
    if (fs.existsSync(comp)) {
        console.log(`✅ ${comp.split('/').pop()}`);
    } else {
        console.log(`❌ ${comp.split('/').pop()} - MISSING`);
        missingUI.push(comp);
    }
});

// 4. Check API endpoints
console.log('\n4️⃣ CHECKING API ENDPOINTS:');
console.log('-'.repeat(40));

const apiEndpoints = [
    'src/app/api/admin/whatsapp/dashboard-basic/route.js',
    'src/app/api/admin/whatsapp/dashboard-simple/route.js',
    'src/app/api/admin/whatsapp/dashboard-enhanced/route.js',
    'src/app/api/admin/whatsapp/dashboard-test/route.js'
];

apiEndpoints.forEach(endpoint => {
    if (fs.existsSync(endpoint)) {
        console.log(`✅ ${endpoint.split('/').slice(-2).join('/')}`);
    } else {
        console.log(`❌ ${endpoint.split('/').slice(-2).join('/')} - MISSING`);
    }
});

// 5. Check for Next.js configuration issues
console.log('\n5️⃣ CHECKING NEXT.JS CONFIGURATION:');
console.log('-'.repeat(40));

const nextConfig = 'next.config.js';
if (fs.existsSync(nextConfig)) {
    console.log('✅ next.config.js exists');
    try {
        const content = fs.readFileSync(nextConfig, 'utf8');
        console.log('📄 Configuration preview:');
        console.log(content.substring(0, 300) + '...');
    } catch (error) {
        console.log('❌ Error reading next.config.js:', error.message);
    }
} else {
    console.log('❌ next.config.js missing');
}

// 6. Generate recommendations
console.log('\n6️⃣ DIAGNOSTIC SUMMARY & RECOMMENDATIONS:');
console.log('-'.repeat(40));

if (missingUI.length > 0) {
    console.log('❌ ISSUE: Missing UI components detected');
    console.log('💡 SOLUTION: Re-create missing UI components');
}

console.log('\n🔧 RECOMMENDED ACTIONS:');
console.log('1. Verify the main component is correctly imported');
console.log('2. Check browser console for specific error messages');
console.log('3. Test API endpoints individually');
console.log('4. Check for TypeScript/JavaScript syntax errors');
console.log('5. Verify all dependencies are installed');

console.log('\n📋 NEXT STEPS FOR USER:');
console.log('1. Run: npm install (to ensure all dependencies)');
console.log('2. Run: npm run dev (start development server)');
console.log('3. Open browser console and check for errors');
console.log('4. Share the exact error message from browser console');

console.log('\n🎯 END OF DIAGNOSTIC REPORT');
console.log('=' .repeat(60));
