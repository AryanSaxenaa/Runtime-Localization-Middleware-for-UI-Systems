# Runtime Localization Middleware for UI Systems

**Production-safe localization middleware for UI systems. Prevents broken interfaces, preserves UX integrity, and integrates into CI/CD pipelines.**

---

## What This Actor Does

Runtime Localization Middleware for UI Systems is **not** a generic translation tool. It's a **localization middleware** specifically engineered for **UI string safety**.

A mistranslated UI error can break onboarding, compliance, or conversions — this Actor prevents that.

### Core Capabilities

| Feature | What It Means |
|---------|---------------|
| **UX Integrity Lock** | Error messages remain errors. Warnings stay warnings. Confirmation prompts stay cautious. No tone softening that breaks UX. |
| **Placeholder Preservation** | Variables like `{{name}}`, `{count}`, `%s` are **never** mistranslated or corrupted |
| **Structured Localization** | Handles JSON/YAML i18n bundles, not just raw text |
| **Tone Enforcement** | Apply `friendly`, `formal`, or `neutral` tones consistently across all languages |
| **Batch Processing** | Translate entire locale files into 10+ languages in a single run |

---

## Why This Exists

This Actor is intentionally **not designed** for documentation, blogs, or long-form text.

It solves a specific, high-stakes problem:

> **UI text is code.** A broken translation = a broken app.

Generic translators don't understand:
- That `{{username}}` must stay exactly as `{{username}}`
- That "Cancel" in a destructive action context must remain cautious
- That error messages need severity preservation

This Actor does.

---

## Built for Automation

Designed to run inside **CI/CD pipelines**, **MCP servers**, and **agent workflows**.

### Integration Examples

```bash
# CI/CD Pipeline (GitHub Actions)
- name: Localize UI strings
  run: |
    apify call your-username/runtime-ui-text-translator \
      -i '{"uiStrings": ${{ steps.extract.outputs.strings }}, "targetLanguages": ["fr","de","ja"]}'
```

```javascript
// MCP Server Integration
const localizedStrings = await apifyClient.call('runtime-ui-text-translator', {
    uiStrings: appStrings,
    targetLanguages: ['es', 'pt', 'zh'],
    tone: 'professional'
});
```

---

## Input Configuration

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `uiStrings` | Object | Yes | Key-value pairs of UI strings to localize |
| `targetLanguages` | Array | Yes | ISO 639-1 codes (e.g., `["fr", "de", "ja"]`) |
| `lingoApiKey` | String | Yes | Your Lingo.dev API key (stored securely) |
| `sourceLanguage` | String | No | Source language code (default: `en`) |
| `tone` | String | No | `friendly` | `professional` | `neutral` | `formal` | `casual` |
| `placeholders` | Array | No | Patterns to preserve (e.g., `["{{name}}", "{count}"]`) |

### Example Input

```json
{
  "uiStrings": {
    "auth.login.title": "Welcome back",
    "auth.login.button": "Sign in",
    "auth.login.error": "Invalid email or password",
    "profile.greeting": "Hello, {{username}}",
    "checkout.confirm": "Are you sure you want to proceed?"
  },
  "sourceLanguage": "en",
  "targetLanguages": ["fr", "de", "es"],
  "tone": "professional",
  "placeholders": ["{{username}}"],
  "lingoApiKey": "YOUR_LINGO_API_KEY"
}
```

---

## Output

Localized strings are returned in the **same structure** as input, grouped by language:

```json
{
  "fr": {
    "auth.login.title": "Bon retour",
    "auth.login.button": "Se connecter",
    "auth.login.error": "Adresse e-mail ou mot de passe incorrect",
    "profile.greeting": "Bonjour, {{username}}",
    "checkout.confirm": "Êtes-vous sûr de vouloir continuer ?"
  },
  "de": {
    "auth.login.title": "Willkommen zurück",
    "auth.login.button": "Anmelden",
    "auth.login.error": "Ungültige E-Mail-Adresse oder Passwort",
    "profile.greeting": "Hallo, {{username}}",
    "checkout.confirm": "Sind Sie sicher, dass Sie fortfahren möchten?"
  }
}
```

### Output Locations

- **Key-Value Store**: `OUTPUT` record contains the full localized JSON
- **Dataset**: Translation status summary for each language

---

## Architecture

```
+-------------------------------------------------------------+
|                    YOUR CI/CD / MCP / AGENT                 |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|           Runtime Localization Middleware for UI Systems    |
|  +--------------+  +--------------+  +-------------------+  |
|  |    Input     |--|   Lingo.dev  |--|  UX Integrity     |  |
|  |   Validator  |  |    Engine    |  |  Lock (Tone +     |  |
|  |              |  |              |  |  Severity)        |  |
|  +--------------+  +--------------+  +-------------------+  |
+-------------------------------------------------------------+
                              |
                              v
+-------------------------------------------------------------+
|              PRODUCTION-READY LOCALE FILES                  |
|         (fr.json, de.json, ja.json, es.json, ...)           |
+-------------------------------------------------------------+
```

---

## FAQ

### Is this for translating documentation or READMEs?

**No.** This Actor is strictly for **UI strings** — short, context-heavy labels, buttons, error messages, and prompts. For long-form content, use a different tool.

### How is this different from a generic translator?

Generic translators treat text as text. This Actor treats **UI text as code** — preserving placeholders, maintaining severity context, and enforcing tone consistency.

### Can I use this in my CI/CD pipeline?

**Yes.** This is the primary use case. Run it on every build to generate fresh locale files automatically.

### Is my API key safe?

Yes. The `lingoApiKey` field is marked as `isSecret` and is never exposed in logs or dataset output.

### What happens if translation fails for a language?

The Actor logs the error and continues with other languages. The dataset output includes status for each language so you can handle failures gracefully.

---

## Resources

- [Lingo.dev Documentation](https://lingo.dev)
- [Apify Platform](https://apify.com)
- [i18next](https://www.i18next.com/) — Compatible i18n library
- [react-intl](https://formatjs.io/docs/react-intl/) — Compatible i18n library

---

## Support

For Actor issues, use the **Issues** tab on Apify.
For translation quality or Lingo.dev questions, refer to [Lingo.dev Documentation](https://lingo.dev).
