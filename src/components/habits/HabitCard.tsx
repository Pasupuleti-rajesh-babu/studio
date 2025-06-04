
"use client";

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { MoreVertical, Edit3, Trash2, Archive, ArchiveRestore, Zap, BarChart3 } from 'lucide-react';
import type { Habit } from '@/types';
import { useHabits } from '@/contexts/HabitContext';
import { format, isToday, parseISO } from 'date-fns';
import { HabitForm } from './HabitForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { RecommendationsDialog } from './RecommendationsDialog';

interface HabitCardProps {
  habit: Habit;
}

export function HabitCard({ habit }: HabitCardProps) {
  const { toggleHabitProgress, deleteHabit, archiveHabit, getStreak } = useHabits();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isRecommendationsDialogOpen, setIsRecommendationsDialogOpen] = useState(false);
  const { toast } = useToast();

  const today = new Date();
  const todayDateString = format(today, 'yyyy-MM-dd');
  const isCompletedToday = habit.progress[todayDateString] || false;

  const streak = useMemo(() => getStreak(habit.id), [habit.progress, habit.id, getStreak]);

  const handleToggleProgress = () => {
    toggleHabitProgress(habit.id, today);
  };

  const handleDelete = () => {
    deleteHabit(habit.id);
    toast({ title: "Habit Deleted", description: `"${habit.name}" has been deleted.`, variant: "destructive" });
    setIsDeleteAlertOpen(false);
  };

  const handleArchive = () => {
    archiveHabit(habit.id, !habit.archived);
    toast({ title: `Habit ${habit.archived ? 'Restored' : 'Archived'}`, description: `"${habit.name}" has been ${habit.archived ? 'restored' : 'archived'}.` });
  };

  const cardStyle = habit.color ? { borderLeft: `5px solid ${habit.color}` } : {};

  return (
    <>
      <Card className={`w-full transition-all duration-300 ease-in-out glass-card ${habit.archived ? 'opacity-60' : ''}`} style={cardStyle}>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-xl flex items-center">
                {habit.name}
                {streak > 0 && (
                  <span className="ml-2 text-sm font-medium text-orange-500 bg-orange-100 dark:bg-orange-900 dark:text-orange-400 px-2 py-0.5 rounded-full flex items-center">
                    <Zap className="h-3 w-3 mr-1" /> {streak} Day{streak > 1 ? 's' : ''}
                  </span>
                )}
              </CardTitle>
              {habit.description && <CardDescription className="mt-1">{habit.description}</CardDescription>}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                  <Edit3 className="mr-2 h-4 w-4" /> Edit
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleArchive}>
                  {habit.archived ? <ArchiveRestore className="mr-2 h-4 w-4" /> : <Archive className="mr-2 h-4 w-4" />}
                  {habit.archived ? 'Restore' : 'Archive'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsRecommendationsDialogOpen(true)}>
                    <BarChart3 className="mr-2 h-4 w-4" /> Get Insights
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsDeleteAlertOpen(true)} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id={`complete-${habit.id}`}
              checked={isCompletedToday}
              onCheckedChange={handleToggleProgress}
              disabled={habit.archived}
              aria-label={`Mark ${habit.name} as ${isCompletedToday ? 'incomplete' : 'complete'} for today`}
            />
            <label
              htmlFor={`complete-${habit.id}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {isCompletedToday ? 'Completed Today!' : 'Mark as complete for today'}
            </label>
          </div>
          {streak > 2 && !isCompletedToday && (
             <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 animate-pulse">
                Streak Saver: Keep your {streak}-day streak going!
             </p>
          )}
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
            Created: {format(parseISO(habit.createdAt), 'MMM d, yyyy')}
        </CardFooter>
      </Card>

      <HabitForm isOpen={isEditModalOpen} setIsOpen={setIsEditModalOpen} habitToEdit={habit} />
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the habit "{habit.name}" and all its progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <RecommendationsDialog 
        isOpen={isRecommendationsDialogOpen} 
        setIsOpen={setIsRecommendationsDialogOpen} 
        habit={habit}
      />
    </>
  );
}
