import { Actor } from 'apify';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { fileURLToPath } from 'url';

const execPromise = util.promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const TEMP_DIR_NAME = 'temp_i18n';

await Actor.init();

try {
    const input = await Actor.getInput();
    if (!input) throw new Error('Input is missing!');

    // destructure
    const {
        uiStrings,
        sourceLanguage = 'en',
        targetLanguages = [],
        tone = 'neutral',
        placeholders = [],
        lingoApiKey
    } = input;

    // validate
    if (!lingoApiKey || lingoApiKey.includes('YOUR_LINGO_API_KEY')) {
        console.warn('Warning: lingoApiKey is missing or invalid. Attempting to use system authentication (local development only).');
    }

    if (!uiStrings || Object.keys(uiStrings).length === 0) {
        throw new Error('uiStrings is empty or missing. Please provide key-value pairs to localize.');
    }
    if (!Array.isArray(targetLanguages) || targetLanguages.length === 0) {
        throw new Error('targetLanguages array is empty. Please provide at least one target language code.');
    }

    console.log(`Starting localization from ${sourceLanguage} to [${targetLanguages.join(', ')}]. Tone: ${tone}`);

    // temporary directory
    const cwd = process.cwd();
    const tempDir = path.join(cwd, TEMP_DIR_NAME);
    const localesDir = path.join(tempDir, 'locales');

    // clean up
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => { });
    await fs.mkdir(localesDir, { recursive: true });

    // write source file

    const sourceFilePath = path.join(localesDir, `${sourceLanguage}.json`);
    await fs.writeFile(sourceFilePath, JSON.stringify(uiStrings, null, 2));

    console.log(`Wrote source strings to ${sourceFilePath}`);

    // create context file for tone enfrmnt
    const contextContent = `
# Localization Context

The following UI strings are part of a product interface.
Please ensure the translation preserves the following guidelines:

- **Tone**: ${tone}
- **Variables**: Preserve all placeholders like ${placeholders.join(', ')}.
- **Terminology**: Use consistent terminology suitable for a software interface.
    `;
    await fs.writeFile(path.join(cwd, 'LINGO_CONTEXT.md'), contextContent);

    const i18nConfig = {
        "$schema": "https://lingo.dev/schema/i18n.json",
        "version": "1.10",
        "locale": {
            "source": sourceLanguage,
            "targets": targetLanguages
        },
        "buckets": {
            "json": {
                "include": [`${TEMP_DIR_NAME}/locales/[locale].json`]
            }
        }
    };

    await fs.writeFile(path.join(cwd, 'i18n.json'), JSON.stringify(i18nConfig, null, 2));
    console.log('Created i18n.json configuration.');

    try {
        await execPromise('git config --global user.email "actor@apify.com"');
        await execPromise('git config --global user.name "Apify Actor"');

        try {
            await execPromise('git status');
        } catch {
            await execPromise('git init');
            console.log('Initialized temporary git repo.');
        }

        await execPromise('git add .');
        try {
            await execPromise('git commit -m "Prepare translation context"');
        } catch (e) {
        }
    } catch (gitErr) {
        console.warn('Git setup warning (lingo might fail):', gitErr.message);
    }

    const env = { ...process.env };
    if (lingoApiKey && !lingoApiKey.includes('YOUR_LINGO_API_KEY')) {
        env.LINGODOTDEV_API_KEY = lingoApiKey;
    }

    console.log('Executing Lingo.dev CLI...');
    const cmd = `npx -y lingo.dev run --force`;

    try {
        const { stdout, stderr } = await execPromise(cmd, { env });
        console.log('Lingo CLI Output:', stdout);
        if (stderr) console.error('Lingo CLI Stderr:', stderr);
    } catch (error) {
        console.error('Lingo CLI Execution Failed!');
        if (error.stdout) console.log('Stdout:', error.stdout);
        if (error.stderr) console.error('Stderr:', error.stderr);
        throw new Error(`Lingo.dev translation failed: ${error.message}`);
    }

    const finalOutput = {};
    const datasetItems = [];

    for (const lang of targetLanguages) {
        const langFilePath = path.join(localesDir, `${lang}.json`);
        try {
            const content = await fs.readFile(langFilePath, 'utf-8');
            const jsonContent = JSON.parse(content);
            finalOutput[lang] = jsonContent;


            datasetItems.push({
                language: lang,
                key: 'FILE_GENERATED',
                status: 'Success',
                message: `Successfully generated ${Object.keys(jsonContent).length} keys.`
            });

        } catch (err) {
            console.warn(`Could not read output for language ${lang}: ${err.message}`);
            finalOutput[lang] = { error: "Translation missing" };
            datasetItems.push({
                language: lang,
                key: 'FILE_ERROR',
                status: 'Error',
                message: err.message
            });
        }
    }

    await Actor.setValue('OUTPUT', finalOutput);
    console.log('Saved localized strings to OUTPUT.');

    await Actor.pushData(datasetItems);

} catch (err) {
    console.error('Actor failed:', err);
    await Actor.fail(err.message);
} finally {
    await Actor.exit();
}
