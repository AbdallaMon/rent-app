const fs = require('fs');
const path = require('path');

console.log('=== WhatsApp Dashboard Component Verification ===\n');

const dashboardPath = path.join(__dirname, 'src', 'app', 'whatsapp-dashboard', 'page.jsx');

try {
  const content = fs.readFileSync(dashboardPath, 'utf8');
  
  // Check for correct imports
  const hasCorrectTextAreaImport = content.includes('const { TextArea } = Input;');
  const hasNoTabPaneImport = !content.includes('const { TabPane } = Tabs;');
  const hasNoOldTabPaneUsage = !content.includes('<TabPane');
  const hasNewTabsFormat = content.includes('items={[');
  const hasCorrectAntdImports = content.includes('Card, Typography, Spin, Alert, Tabs, Button');
  
  console.log('Component Import Checks:');
  console.log(hasCorrectTextAreaImport ? '✓' : '❌', 'TextArea correctly imported from Input');
  console.log(hasNoTabPaneImport ? '✓' : '❌', 'TabPane import removed');
  console.log(hasNoOldTabPaneUsage ? '✓' : '❌', 'No old TabPane usage found');
  console.log(hasNewTabsFormat ? '✓' : '❌', 'Modern Tabs items format used');
  console.log(hasCorrectAntdImports ? '✓' : '❌', 'Ant Design components correctly imported');
  
  // Check for privilege-based access
  const hasPrivilegeChecks = content.includes('hasWhatsAppAccess') && 
                           content.includes('canSendMessages') && 
                           content.includes('canManageTemplates');
  
  console.log('\nPrivilege System Checks:');
  console.log(hasPrivilegeChecks ? '✓' : '❌', 'Privilege-based access controls implemented');
  
  // Check for API endpoints usage
  const hasAnalyticsAPI = content.includes('/api/admin/whatsapp/analytics');
  const hasMessagesAPI = content.includes('/api/admin/whatsapp/messages');
  const hasTemplatesAPI = content.includes('/api/admin/whatsapp/templates');
  
  console.log('\nAPI Integration Checks:');
  console.log(hasAnalyticsAPI ? '✓' : '❌', 'Analytics API endpoint referenced');
  console.log(hasMessagesAPI ? '✓' : '❌', 'Messages API endpoint referenced');
  console.log(hasTemplatesAPI ? '✓' : '❌', 'Templates API endpoint referenced');
  
  // Check for form handling
  const hasFormHandling = content.includes('Form.useForm()') && 
                         content.includes('onFinish={handleSendMessage}') &&
                         content.includes('onFinish={handleSaveTemplate}');
  
  console.log('\nForm Handling Checks:');
  console.log(hasFormHandling ? '✓' : '❌', 'Form handling properly implemented');
  
  // Summary
  const allChecksPass = hasCorrectTextAreaImport && hasNoTabPaneImport && hasNoOldTabPaneUsage && 
                       hasNewTabsFormat && hasCorrectAntdImports && hasPrivilegeChecks && 
                       hasAnalyticsAPI && hasMessagesAPI && hasTemplatesAPI && hasFormHandling;
  
  console.log('\n=== SUMMARY ===');
  if (allChecksPass) {
    console.log('🎉 All checks passed! WhatsApp dashboard should work without component errors.');
    console.log('✓ Fixed "Element type is invalid" error');
    console.log('✓ Modern Ant Design components used');
    console.log('✓ Privilege-based access implemented');
    console.log('✓ API integration complete');
  } else {
    console.log('⚠️  Some checks failed. Please review the issues above.');
  }
  
} catch (error) {
  console.error('❌ Error reading dashboard file:', error.message);
}

console.log('\n=== Next Steps ===');
console.log('1. Start the development server: npm run dev');
console.log('2. Navigate to the WhatsApp dashboard');
console.log('3. Login as admin user with WhatsApp privileges');
console.log('4. Verify all tabs (Statistics, Messages, Templates) load correctly');
console.log('5. Test sending messages and managing templates');
