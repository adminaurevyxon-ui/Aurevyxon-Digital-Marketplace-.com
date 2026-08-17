# Google OAuth Setup Guide

To enable Google Authentication in this application, you need to configure OAuth 2.0 in the Google Cloud Console.

## 1. Create a Google Cloud Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.

## 2. Configure the OAuth Consent Screen
1. In the sidebar, navigate to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (if you want any Google user to be able to sign in) or **Internal** (if restricted to your Google Workspace organization).
3. Fill in the required fields:
   - **App name**: Your preferred application name.
   - **User support email**: Your email address.
   - **Developer contact information**: Your email address.
4. Click **Save and Continue**.
5. You can skip the Scopes and Test Users sections by clicking **Save and Continue**, unless you specifically want to restrict access right now.
6. Publish your app by clicking **Publish App** on the summary screen (External apps start in "Testing" mode and will expire access tokens in 7 days; publish it to production to fix this).

## 3. Create OAuth Credentials
1. Navigate to **APIs & Services** > **Credentials**.
2. Click **Create Credentials** at the top of the page and select **OAuth client ID**.
3. Choose **Web application** as the application type.
4. Set a name for the OAuth client (e.g., "Omniverse Web Auth").

## 4. Configure Authorized Origins and Redirect URIs
Under the same "Create OAuth client ID" page:
1. **Authorized JavaScript origins**: 
   Add the root URL of your application (e.g., `http://localhost:3000` for local development, or your production URL `https://your-app-domain.com`).
2. **Authorized redirect URIs**: 
   Add the exact callback path for the application:
   - `http://localhost:3000/api/auth/google/callback` (for local development)
   - `https://your-app-domain.com/api/auth/google/callback` (for production)
3. Click **Create**.

## 5. Add Keys to Environment Variables
1. After creation, a dialog will appear with your **Client ID** and **Client Secret**.
2. Add them to your environment variables (using your `.env` file or hosting provider's Secrets manager):
   ```env
   GOOGLE_CLIENT_ID="your_client_id_here"
   GOOGLE_CLIENT_SECRET="your_client_secret_here"
   ```

## Restarting the Server
Once the environment variables are applied, restart your application server to make Google Login available.
