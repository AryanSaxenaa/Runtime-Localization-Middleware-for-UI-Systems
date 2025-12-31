import { ApifyClient } from 'apify-client';

// Initialize the ApifyClient with your API token
const client = new ApifyClient({
    token: process.env.APIFY_TOKEN || 'YOUR_APIFY_TOKEN',
});

// Comprehensive test input with ALL fields including the Lingo API key
const input = {
    // ✅ REQUIRED: Your Lingo.dev API key
    lingoApiKey: process.env.LINGO_API_KEY || "YOUR_LINGO_API_KEY",

    // ✅ REQUIRED: UI strings to localize
    uiStrings: {
        "auth.login.title": "Welcome back",
        "auth.login.button": "Sign in",
        "auth.login.error": "Invalid email or password",
        "profile.greeting": "Hello, {{username}}",
        "checkout.confirm": "Are you sure you want to proceed?",
        "notification.new_message": "You have {count} new messages",
        "settings.save": "Save changes",
        "error.generic": "Something went wrong. Please try again."
    },

    // Optional: Source language (defaults to 'en')
    sourceLanguage: "en",

    // ✅ REQUIRED: Target languages to translate into
    targetLanguages: ["fr", "de", "es"],

    // Optional: Tone enforcement
    tone: "professional",

    // Optional: Placeholder patterns to preserve
    placeholders: ["{{username}}", "{count}"]
};

console.log('🚀 Starting Actor with comprehensive test input...');
console.log('📦 Input configuration:');
console.log(`   - UI Strings: ${Object.keys(input.uiStrings).length} keys`);
console.log(`   - Source Language: ${input.sourceLanguage}`);
console.log(`   - Target Languages: ${input.targetLanguages.join(', ')}`);
console.log(`   - Tone: ${input.tone}`);
console.log(`   - Placeholders: ${input.placeholders.join(', ')}`);
console.log('');

(async () => {
    try {
        // Run the Actor and wait for it to finish
        console.log('⏳ Running Actor (this may take 1-2 minutes)...');
        const run = await client.actor("RyzqJFgd8GV0HwFah").call(input);

        console.log(`✅ Actor run completed with status: ${run.status}`);
        console.log(`   Run ID: ${run.id}`);
        console.log('');

        // Fetch the primary OUTPUT from Key-Value Store
        console.log('📥 Fetching OUTPUT from Key-Value Store...');
        const { value: output } = await client.keyValueStore(run.defaultKeyValueStoreId).getRecord('OUTPUT');

        if (output) {
            console.log('');
            console.log('═══════════════════════════════════════════════════════════');
            console.log('                    LOCALIZATION OUTPUT');
            console.log('═══════════════════════════════════════════════════════════');
            console.log(JSON.stringify(output, null, 2));
            console.log('═══════════════════════════════════════════════════════════');
        } else {
            console.log('⚠️ No OUTPUT found in Key-Value Store');
        }

        // Also fetch dataset items for summary
        console.log('');
        console.log('📊 Dataset Summary:');
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        items.forEach((item) => {
            const statusIcon = item.status === 'Success' ? '✅' : '❌';
            console.log(`   ${statusIcon} [${item.language}] ${item.key}: ${item.message}`);
        });

        // Validate placeholder preservation
        console.log('');
        console.log('🔍 Placeholder Preservation Check:');
        if (output) {
            let allPlaceholdersPreserved = true;
            for (const lang of input.targetLanguages) {
                if (output[lang]) {
                    const greetingValue = output[lang]['profile.greeting'] || '';
                    const messageValue = output[lang]['notification.new_message'] || '';

                    const hasUsername = greetingValue.includes('{{username}}');
                    const hasCount = messageValue.includes('{count}');

                    console.log(`   [${lang}] {{username}}: ${hasUsername ? '✅ Preserved' : '❌ Missing'}`);
                    console.log(`   [${lang}] {count}: ${hasCount ? '✅ Preserved' : '❌ Missing'}`);

                    if (!hasUsername || !hasCount) allPlaceholdersPreserved = false;
                } else {
                    console.log(`   [${lang}] ❌ Translation missing`);
                    allPlaceholdersPreserved = false;
                }
            }
            console.log('');
            console.log(allPlaceholdersPreserved
                ? '✅ All placeholders preserved correctly!'
                : '⚠️ Some placeholders may be missing');
        }

    } catch (error) {
        console.error('❌ Actor run failed:', error.message);
        if (error.data) {
            console.error('   Error data:', JSON.stringify(error.data, null, 2));
        }
    }
})();
