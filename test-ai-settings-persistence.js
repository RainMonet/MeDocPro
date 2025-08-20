// Test script to verify AI settings persistence
// Run this in browser console on MeDocPro to test localStorage behavior

console.log('🧪 Testing AI Settings Persistence');

// Function to set GPU mode
function setGPUMode() {
    const settings = {
        computeMode: 'gpu',
        model: 'mistral:latest',
        systemPrompt: 'Default system prompt...',
        selectedPromptId: 'default'
    };
    
    localStorage.setItem('aiAssistantSettings', JSON.stringify(settings));
    console.log('✅ GPU mode set in localStorage:', settings);
}

// Function to set CPU mode
function setCPUMode() {
    const settings = {
        computeMode: 'cpu',
        model: 'mistral:latest',
        systemPrompt: 'Default system prompt...',
        selectedPromptId: 'default'
    };
    
    localStorage.setItem('aiAssistantSettings', JSON.stringify(settings));
    console.log('✅ CPU mode set in localStorage:', settings);
}

// Function to check current settings
function checkSettings() {
    const stored = localStorage.getItem('aiAssistantSettings');
    if (stored) {
        const parsed = JSON.parse(stored);
        console.log('📋 Current stored settings:');
        console.log('   Compute Mode:', parsed.computeMode);
        console.log('   Model:', parsed.model);
        console.log('   Prompt ID:', parsed.selectedPromptId);
        return parsed;
    } else {
        console.log('❌ No settings found in localStorage');
        return null;
    }
}

// Function to clear settings
function clearSettings() {
    localStorage.removeItem('aiAssistantSettings');
    localStorage.removeItem('aiSavedPrompts');
    console.log('🗑️ All AI settings cleared');
}

// Initial check
console.log('\n📊 Initial Settings Check:');
checkSettings();

console.log('\n🎮 Available Test Functions:');
console.log('- setGPUMode()   // Set GPU mode');
console.log('- setCPUMode()   // Set CPU mode'); 
console.log('- checkSettings() // Check current settings');
console.log('- clearSettings() // Clear all settings');

console.log('\n📋 Test Instructions:');
console.log('1. Run setGPUMode() in console');
console.log('2. Open AI Enhancement modal');
console.log('3. Verify GPU mode is selected');
console.log('4. Close modal');  
console.log('5. Reopen modal');
console.log('6. Verify GPU mode persisted');

// Make functions globally available
window.setGPUMode = setGPUMode;
window.setCPUMode = setCPUMode;
window.checkSettings = checkSettings;
window.clearSettings = clearSettings;