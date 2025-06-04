# HabitLocal - Your AI-Powered Habit Companion

HabitLocal is a Next.js application designed to help you track your habits, gain insights into your progress, and stay motivated with AI-powered features. Built with modern web technologies, it offers a seamless and intuitive experience for managing your personal growth.

## Features

*   **Core Habit Tracking:**
    *   Create, edit, and delete habits.
    *   Mark habits as complete for the day.
    *   View current streaks for each habit.
    *   Archive habits you're not currently focusing on.
    *   Visually distinct habit cards using generated colors.
*   **AI-Powered Enhancements (Powered by Gemini & Genkit):**
    *   **Natural Language Habit Creation:** Simply type a sentence like "Read for 20 minutes every evening" and let AI structure it into a habit.
    *   **Daily Micro-Summary:** Get a concise AI-generated summary of your previous day's habit performance.
    *   **Gamified Challenges:** Generate fun, themed challenges based on your active habits to spice up your routine. You can even add these challenges as new habits!
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

*   **Frontend:** Next.js (App Router), React, TypeScript
*   **UI Components:** ShadCN UI
*   **Styling:** Tailwind CSS
*   **AI Integration:** Genkit, Google Gemini (via `googleai/gemini-2.0-flash`)
*   **State Management:** React Context API, `useLocalStorage` hook
*   **Charting:** Recharts
*   **Date Handling:** date-fns
*   **Form Handling:** react-hook-form with Zod for validation
*   **Linting & Formatting:** ESLint, Prettier (implied by Next.js setup)

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
    *   Enter your API key and save. The key is stored locally in your browser's local storage. Without this key, AI features will be disabled.
4.  **Run the development servers:**
    *   **Next.js App (Frontend):** In one terminal, run:
        ```bash
        npm run dev
        ```
        This usually starts the app on `http://localhost:9002`.
    *   **Genkit Flows (AI Backend):** In a separate terminal, run:
        ```bash
        npm run genkit:dev
        ```
        This starts the Genkit development server, typically on `http://localhost:3400`, which hosts your AI flows.

## Project Structure Overview

*   `src/app/`: Next.js App Router pages (e.g., `page.tsx`) and layout (`layout.tsx`).
*   `src/components/`:
    *   `ai/`: React components for AI-driven UI elements (e.g., `DailySummary.tsx`, `GamifiedChallengeGenerator.tsx`, `StatsInsight.tsx`).
    *   `core/`: Main structural components (e.g., `Header.tsx`, `HabitTrackerPage.tsx`).
    *   `habits/`: Components related to habit management (e.g., `HabitCard.tsx`, `HabitForm.tsx`, `HabitList.tsx`, `NaturalLanguageInput.tsx`, `RecommendationsDialog.tsx`).
    *   `stats/`: Components for displaying statistics (e.g., `StatsView.tsx`).
    *   `ui/`: ShadCN UI components (e.g., `button.tsx`, `card.tsx`).
*   `src/ai/`:
    *   `flows/`: Genkit flow definitions that interact with the Gemini API (e.g., `daily-micro-summary.ts`, `natural-language-habit-creation.ts`).
    *   `genkit.ts`: Configuration for the global Genkit `ai` instance.
    *   `dev.ts`: Entry point for the Genkit development server, importing all flows.
*   `src/contexts/`: React context providers for global state management:
    *   `ApiKeyContext.tsx`: Manages the Gemini API key.
    *   `HabitContext.tsx`: Manages the state of habits (CRUD, progress, streaks).
    *   `ThemeProvider.tsx`: Handles light/dark mode.
    *   `AppProviders.tsx`: Wraps all context providers.
*   `src/hooks/`: Custom React hooks (e.g., `useLocalStorage.ts`, `useToast.ts`, `use-mobile.ts`).
*   `src/lib/`: Utility functions (e.g., `utils.ts` for `cn`).
*   `src/types/`: TypeScript type definitions (e.g., `index.ts` for `Habit` type).
*   `public/`: Static assets.
*   `tailwind.config.ts`: Tailwind CSS configuration.
*   `next.config.ts`: Next.js configuration.
*   `components.json`: ShadCN UI configuration.

## How AI Features Work

The application leverages Google's Gemini models through the Genkit framework:

1.  **Genkit Flows (`src/ai/flows/`):** These are TypeScript functions running on a Node.js server (via `genkit start`). They define specific AI tasks:
    *   They use Zod schemas to define expected input and output structures.
    *   They construct prompts (often using Handlebars templating) tailored for the Gemini model.
    *   They call the `ai.generate()` or `prompt()` (if using `ai.definePrompt`) method from the Genkit library to interact with the configured Gemini model.
2.  **Client-Side Interaction:**
    *   React components (e.g., in `src/components/ai/`) make `async` calls to these Genkit flows (which are server actions in Next.js).
    *   These components manage loading states, display results from the AI, and handle potential errors.
3.  **API Key Requirement:**
    *   The Genkit flows, when executed, require a valid Gemini API key to authenticate with Google's services. This key is configured in `src/ai/genkit.ts` implicitly through environment variables if deployed, or handled by the user providing it via the UI for local development (stored in local storage).

Enjoy building and tracking your habits with HabitLocal!
