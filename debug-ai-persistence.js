// Enhanced AI Settings Persistence Debugging Script
// Paste this into the browser console on MeDocPro

console.log('🔧 Enhanced AI Settings Persistence Debug Tool');
console.log('===============================================');

// Enhanced debugging functions
window.debugAI = {
    // Check localStorage directly
    checkLocalStorage() {
        const stored = localStorage.getItem('aiAssistantSettings');
        console.log('📦 Raw localStorage data:', stored);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                console.log('📋 Parsed settings:', parsed);
                console.log('🎮 Compute Mode:', parsed.computeMode);
                return parsed;
            } catch (e) {
                console.error('❌ Failed to parse localStorage:', e);
            }
        } else {
            console.log('❌ No aiAssistantSettings found in localStorage');
        }
        return null;
    },

    // Set GPU mode in localStorage
    setGPUInStorage() {
        const settings = {
            computeMode: 'gpu',
            model: 'mistral:latest',
            systemPrompt: 'Default system prompt...',
            selectedPromptId: 'default'
        };
        
        localStorage.setItem('aiAssistantSettings', JSON.stringify(settings));
        console.log('✅ GPU mode set in localStorage');
        return settings;
    },

    // Set CPU mode in localStorage
    setCPUInStorage() {
        const settings = {
            computeMode: 'cpu',
            model: 'mistral:latest',
            systemPrompt: 'Default system prompt...',
            selectedPromptId: 'default'
        };
        
        localStorage.setItem('aiAssistantSettings', JSON.stringify(settings));
        console.log('✅ CPU mode set in localStorage');
        return settings;
    },

    // Check component state (if available)
    checkComponentState() {
        if (window.aiEnhancementDebug) {
            console.log('🧩 Component Instance ID:', window.aiEnhancementDebug.instanceId);
            console.log('⚛️ Current Component Settings:', window.aiEnhancementDebug.getCurrentSettings());
            console.log('💾 Storage Settings:', window.aiEnhancementDebug.getStorageSettings());
            
            const componentSettings = window.aiEnhancementDebug.getCurrentSettings();
            const storageSettings = window.aiEnhancementDebug.getStorageSettings();
            
            if (componentSettings && storageSettings) {
                const match = componentSettings.computeMode === storageSettings.computeMode;
                console.log(match ? '✅ Component and Storage MATCH' : '❌ Component and Storage MISMATCH');
                
                if (!match) {
                    console.log('📊 Comparison:');
                    console.log('   Component compute mode:', componentSettings.computeMode);
                    console.log('   Storage compute mode:', storageSettings.computeMode);
                }
            }
            
            return {
                component: componentSettings,
                storage: storageSettings
            };
        } else {
            console.log('❌ AI Enhancement component not found (modal might be closed)');
            return null;
        }
    },

    // Force component to refresh from storage
    refreshComponent() {
        if (window.aiEnhancementDebug) {
            console.log('🔄 Forcing component to refresh from localStorage...');
            window.aiEnhancementDebug.refreshSettings();
            return this.checkComponentState();
        } else {
            console.log('❌ Cannot refresh - component not available');
            return null;
        }
    },

    // Set GPU mode in component directly
    setGPUInComponent() {
        if (window.aiEnhancementDebug) {
            console.log('🎮 Setting GPU mode directly in component...');
            window.aiEnhancementDebug.setGPUMode();
            return this.checkComponentState();
        } else {
            console.log('❌ Cannot set GPU mode - component not available');
            return null;
        }
    },

    // Set CPU mode in component directly
    setCPUInComponent() {
        if (window.aiEnhancementDebug) {
            console.log('💻 Setting CPU mode directly in component...');
            window.aiEnhancementDebug.setCPUMode();
            return this.checkComponentState();
        } else {
            console.log('❌ Cannot set CPU mode - component not available');
            return null;
        }
    },

    // Complete diagnostic
    runDiagnostic() {
        console.log('\n🔍 Running Complete Diagnostic...');
        console.log('=====================================');
        
        console.log('\n1. 📦 Checking localStorage:');
        this.checkLocalStorage();
        
        console.log('\n2. ⚛️ Checking component state:');
        this.checkComponentState();
        
        console.log('\n3. 📝 Test Instructions:');
        console.log('   - Open AI Enhancement modal');
        console.log('   - Run: debugAI.setGPUInStorage()');
        console.log('   - Click the 🔧 Debug button in the modal');
        console.log('   - Check if GPU mode appears selected');
        console.log('   - Close and reopen modal');
        console.log('   - Verify persistence');
        
        return {
            localStorage: this.checkLocalStorage(),
            component: this.checkComponentState()
        };
    }
};

// Auto-run initial diagnostic
console.log('\n🚀 Initial diagnostic:');
debugAI.runDiagnostic();

console.log('\n💡 Available commands:');
console.log('debugAI.checkLocalStorage()    // Check what\'s in localStorage');
console.log('debugAI.setGPUInStorage()      // Set GPU mode in localStorage');
console.log('debugAI.setCPUInStorage()      // Set CPU mode in localStorage');
console.log('debugAI.checkComponentState()  // Check component state (modal must be open)');
console.log('debugAI.refreshComponent()     // Force component refresh (modal must be open)');
console.log('debugAI.setGPUInComponent()    // Set GPU directly in component (modal must be open)');
console.log('debugAI.runDiagnostic()        // Run complete diagnostic');

console.log('\n📋 Step-by-Step Test:');
console.log('1. Open AI Enhancement modal');
console.log('2. Run: debugAI.setGPUInStorage()');
console.log('3. Run: debugAI.refreshComponent()');
console.log('4. Check if GPU mode is selected in UI');
console.log('5. Close modal, reopen, check persistence');