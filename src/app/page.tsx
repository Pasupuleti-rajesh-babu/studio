
import { HabitTrackerPage } from '@/components/core/HabitTrackerPage';
import { Header } from '@/components/core/Header';

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <HabitTrackerPage />
      </main>
      <footer className="py-6 text-center text-xs text-muted-foreground">
        HabitLocal - Your AI Powered Habit Companion
      </footer>
    </>
  );
}
