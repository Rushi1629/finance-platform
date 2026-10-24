# Welth

Welth is a personal finance app for tracking spending, organizing accounts, and keeping budgets in view. It is built with Expo and React Native for Android, iOS, and web.

## Features

- Sign up and sign in with Clerk
- Create and manage bank, cash, credit card, and savings accounts
- Track income and expenses with categories
- Review transactions and spending summaries
- Set and monitor a monthly budget
- Scan receipts to help enter transaction details
- Ask an AI assistant questions about recent transactions and budgets
- Choose a preferred currency

## Tech stack

- Expo SDK 57, React Native, and TypeScript
- Expo Router for file-based navigation
- Clerk for authentication
- Supabase for persistent data and row-level security
- TanStack Query for server state
- NativeWind for styling
- Gemini API for AI-assisted features

## Prerequisites

- Node.js and npm
- An Android or iOS device, emulator, or simulator
- Clerk and Supabase projects configured for the app
- A Gemini API key to use AI assistant and receipt-scanning features
- An Expo account and EAS CLI access to create cloud builds

## Getting started

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/Rushi1629/finance-platform.git
   cd finance-platform
   npm install
   ```

2. Create a `.env` file in the project root:

   ```env
   EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_replace_with_your_key
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_KEY=your_supabase_publishable_or_anon_key
   EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

   The Clerk and Supabase values are required to start the app. The Gemini key is required for the AI assistant and receipt scanning.

3. Configure Supabase:

   - Create a Supabase project.
   - Configure Clerk as a third-party authentication provider in the Supabase dashboard.
   - Run [`scripts/schema.sql`](./scripts/schema.sql) against the project to create the tables and row-level security policies.
   - Use the Supabase project URL and publishable/anon key in `.env`.

4. Start the development server:

   ```bash
   npx expo start
   ```

   Follow the Expo CLI instructions to open the app in a development build, emulator, simulator, or web browser.

## Android builds

Build an internal preview APK for direct testing:

```bash
npx eas-cli@latest build -p android --profile preview
```

Build an Android App Bundle for Play Store distribution:

```bash
npx eas-cli@latest build -p android --profile production
```

The preview profile creates an APK. The production profile creates an AAB, which Google Play can use to deliver optimized app downloads to devices.

Set the required environment variables in the matching EAS environment (`preview` or `production`) before building. EAS cloud builds do not automatically read your local `.env` file.

## Available scripts

| Command | Description |
| --- | --- |
| `npm run start` | Start the Expo development server |
| `npm run android` | Start Expo and open Android |
| `npm run ios` | Start Expo and open iOS |
| `npm run web` | Start Expo for web |
| `npm run lint` | Run Expo's lint checks |

## Environment variable safety

This app reads Expo variables prefixed with `EXPO_PUBLIC_` in the client bundle. Treat them as values visible to app users; do not put service-role keys, private credentials, or other server secrets in these variables. Keep Supabase row-level security enabled, and restrict API keys such as Gemini keys according to the provider's guidance. The local `.env` file is ignored by Git; never commit real credentials.

## License

See [`LICENSE`](./LICENSE).
