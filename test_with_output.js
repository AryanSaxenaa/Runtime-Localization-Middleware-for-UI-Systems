import { ApifyClient } from 'apify-client';
import fs from 'fs/promises';

const client = new ApifyClient({
    token: process.env.APIFY_TOKEN || 'YOUR_APIFY_TOKEN',
});

const input = {
    lingoApiKey: process.env.LINGO_API_KEY || "YOUR_LINGO_API_KEY",
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
    sourceLanguage: "en",
    targetLanguages: ["fr", "de", "es"],
    tone: "professional",
    placeholders: ["{{username}}", "{count}"]
};

console.log('Starting Actor test...');

(async () => {
    try {
        const run = await client.actor("RyzqJFgd8GV0HwFah").call(input);
        console.log('Actor run completed:', run.status);

        const { value: output } = await client.keyValueStore(run.defaultKeyValueStoreId).getRecord('OUTPUT');

        // Write output to file for inspection
        await fs.writeFile('test_output.json', JSON.stringify(output, null, 2), 'utf-8');
        console.log('Output saved to test_output.json');

        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        console.log('Dataset items:', items.length);

        // Validate placeholders
        let success = true;
        for (const lang of input.targetLanguages) {
            if (output[lang]) {
                const greeting = output[lang]['profile.greeting'] || '';
                const message = output[lang]['notification.new_message'] || '';
                console.log(`[${lang}] greeting: ${greeting}`);
                console.log(`[${lang}] message: ${message}`);
                if (!greeting.includes('{{username}}') || !message.includes('{count}')) {
                    success = false;
                }
            }
        }
        console.log(success ? 'SUCCESS: All placeholders preserved!' : 'FAILED: Some placeholders missing');

    } catch (error) {
        console.error('Error:', error.message);
    }
})();
