
# HabitLocal - Your AI-Powered Habit Companion (Static Version)

HabitLocal is a Next.js application (exported as a static site) designed to help you track your habits, gain insights into your progress, and stay motivated with AI-powered features running entirely in your browser.

## Features

*   **Core Habit Tracking:**
    *   Create, edit, and delete habits.
    *   Mark habits as complete for the day.
    *   View current streaks for each habit.
    *   Archive habits you're not currently focusing on.
    *   Visually distinct habit cards using generated colors.
*   **AI-Powered Enhancements (Powered by Google Gemini via `@google/genai` SDK, running client-side):**
    *   **Natural Language Habit Creation:** Simply type a sentence like "Read for 20 minutes every evening" and let AI structure it into a habit.
    *   **Daily Micro-Summary:** Get a concise AI-generated summary of your previous day's habit performance.
    *   **Gamified Challenges:** Generate fun, themed challenges based on your active habits to spice up your routine. You can add these challenges as new habits!
    *   **Personalized Habit Strategies:** Receive AI-driven recommendations and insights on how to improve specific habits, accessible directly from each habit card.
    *   **Stats Insights:** Get an AI-powered textual analysis of your overall habit statistics, providing encouragement and highlighting areas of focus.
*   **Comprehensive Statistics:**
    *   View overall completion trends with an area chart (last 30 days).
    *   Analyze individual habit success rates with a pie chart.
    *   See a quick "Yesterday's Snapshot" of your key metrics.
*   **User Experience:**
    *   **API Key Management:** Securely store your Gemini API key locally in your browser to enable AI features.
    *   **Light & Dark Mode:** Toggle between light and dark themes for comfortable viewing.
    *   **Responsive Design:** Works across various screen sizes.
    *   **Modern UI:** Built with ShadCN UI components and Tailwind CSS for a clean and aesthetically pleasing interface, featuring "glass card" effects.
    *   **Toasts/Notifications:** User-friendly feedback for actions.

## Tech Stack

*   **Frontend:** Next.js (App Router, static export), React, TypeScript
*   **UI Components:** ShadCN UI
*   **Styling:** Tailwind CSS
*   **AI Integration:** Google Gemini (via `@google/genai` JavaScript SDK, client-side)
*   **State Management:** React Context API, `useLocalStorage` hook
*   **Charting:** Recharts
*   **Date Handling:** date-fns
*   **Form Handling:** react-hook-form with Zod for validation

## Getting Started

1.  **Clone the repository (if applicable).**
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```
3.  **Set up your Gemini API Key:**
    *   Obtain a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Run the application (see next step).
    *   Click the **Key icon** in the header to open the API Key modal.
    *   Enter your API key and save. The key is stored locally in your browser's local storage using the key `habitlocal_gemini_api_key`. Without this key, AI features will be disabled.
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This usually starts the app on `http://localhost:9002`. (Note: Due to `basePath: "/habitlocal"`, you'll access it at `http://localhost:9002/habitlocal` during development).

## Building for Static Deployment (e.g., GitHub Pages)

1.  **Build the Next.js app:**
    ```bash
    npm run build
    ```
2.  **Export to static HTML/CSS/JS:**
    ```bash
    npm run export
    ```
    This will generate the static site in the `/out` directory. Your app files will be under `/out/habitlocal/` due to the `basePath` setting.

3.  **`basePath` and Repository Name Considerations:**
    *   Your `next.config.ts` has `basePath: "/habitlocal"`.
    *   If your GitHub repository is named `habitlocal` (e.g., `https://github.com/<username>/habitlocal`), you'll access your site at `https://<username>.github.io/habitlocal/`. This configuration is likely correct.
    *   If your GitHub repository has a different name (e.g., `my-awesome-habits`), you **must** change `basePath` in `next.config.ts` to match that repository name (e.g., `basePath: "/my-awesome-habits"`) **before** running `npm run build` and `npm run export`. Then, you would access it at `https://<username>.github.io/my-awesome-habits/`.

4.  **Deploy to GitHub Pages:**

    You have two main options:

    **Option A: Using the `gh-pages` package (Recommended for simplicity)**
    This method deploys the contents of the `out` directory directly to a `gh-pages` branch.
    *   **Install `gh-pages` (if you haven't):**
        ```bash
        npm install gh-pages --save-dev
        ```
    *   **Create `404.html` Fallback in `out` directory:**
        For client-side routing to work correctly, GitHub Pages needs a `404.html` at the root of what it serves from the `gh-pages` branch. This file should be a copy of your app's main `index.html`.
        After running `npm run export`, execute this command from your project root:
        ```bash
        cp out/habitlocal/index.html out/404.html
        ```
    *   **Run the deploy command:**
        ```bash
        npx gh-pages -d out
        ```
        This pushes the contents of the `out` directory (including your new `out/404.html`) to a `gh-pages` branch and usually enables GitHub Pages for that branch.

    **Option B: Manual commit to `/docs` folder on `main` (or `master`) branch**
    This method involves putting your site's content into a `/docs` folder on your main branch.
    *   **Ensure your `/docs` folder is clean or create it:**
        If you have an existing `/docs` folder with old site content, you might want to remove its contents first (e.g., `rm -rf docs/* && mkdir -p docs` from the project root - **be careful with `rm -rf`**). If it doesn't exist, create it:
        ```bash
        mkdir -p docs
        ```
    *   **Copy exported site to `/docs`:**
        After running `npm run export` (which creates the site in `/out`), copy the *contents* of the `/out` directory into your `/docs` directory.
        ```bash
        cp -r out/. docs/
        ```
        This command copies all files and folders (including hidden ones if any) from `out` into `docs`. You should now have `docs/habitlocal/index.html`, etc.
    *   **Create `404.html` Fallback in `docs` directory:**
        Similar to Option A, you need a `404.html` at the root of what GitHub Pages serves (which will be the `docs` folder). This should be a copy of your app's main `index.html`.
        ```bash
        cp docs/habitlocal/index.html docs/404.html
        ```
    *   **Commit and push the `/docs` folder:**
        Add the `docs` folder to git, commit, and push to your `main` (or `master`) branch.
        ```bash
        git add docs
        git commit -m "Deploy site to /docs folder"
        git push
        ```
    *   **Configure GitHub Pages Settings:**
        In your repository's GitHub settings, under "Pages":
        *   Set the "Source" to "Deploy from a branch".
        *   Set the "Branch" to `main` (or `master`, or whichever branch you committed `/docs` to) and the folder to `/docs`.
        *   Save the changes. GitHub will then build and deploy your site from the `/docs` folder.

## How AI Features Work (Client-Side)

The application leverages Google's Gemini models directly in the user's browser:

1.  **`@google/genai` SDK:** The official Google Generative AI SDK for JavaScript is used to make calls to the Gemini API.
2.  **Client-Side Wrapper (`src/lib/genai.ts`):** A simple wrapper function `runGemini(prompt)` is created. This function:
    *   Retrieves the user's Gemini API key from `localStorage` (set via the UI modal using the key `habitlocal_gemini_api_key`).
    *   Initializes the `GoogleGenerativeAI` client.
    *   Sends the constructed prompt to the "gemini-1.5-flash-latest" model.
    *   Returns the text response from the AI.
3.  **React Components:**
    *   AI-feature components (e.g., in `src/components/ai/`, `src/components/habits/`) construct specific prompts as strings.
    *   They call the `runGemini` function with these prompts.
    *   If the AI is expected to return JSON, the component's prompt instructs the AI to output JSON, and the component then parses the text response into a JavaScript object (with error handling and Zod validation).
    *   Components manage loading states, display results, and handle potential errors.
4.  **API Key Requirement:**
    *   AI features require a valid Gemini API key, stored by the user in their browser's local storage. If the key is missing or invalid, AI features will not work, and error messages will guide the user.

## Caveats of Static/Client-Side AI

*   **API Key Exposure:** The API key is stored in the user's browser and used directly in client-side requests. This is generally acceptable for personal use but not recommended for a public SaaS application where you would typically proxy API calls through a backend to protect your key.
*   **No Server-Side Logic:** All Next.js server features (SSR, API routes, server components that perform server-side tasks) are unavailable in a static export. The application is pure HTML, CSS, and JavaScript.
*   **CORS:** The Google Gemini API endpoint must remain configured to allow Cross-Origin Resource Sharing (CORS) for requests from browsers. This is typically handled by Google.

Enjoy your one-click GitHub Pages deploy! 🚀
```