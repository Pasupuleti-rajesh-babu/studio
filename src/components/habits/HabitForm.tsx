
"use client";

import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useHabits } from '@/contexts/HabitContext';
import type { Habit } from '@/types';
import { useToast } from "@/hooks/use-toast";

const habitFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(500).optional(),
});

type HabitFormData = z.infer<typeof habitFormSchema>;

interface HabitFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  habitToEdit?: Habit | null;
  onFormSubmit?: () => void; // Callback after successful submission
}

export function HabitForm({ isOpen, setIsOpen, habitToEdit, onFormSubmit }: HabitFormProps) {
  const { addHabit, updateHabit } = useHabits();
  const { toast } = useToast();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<HabitFormData>({
    resolver: zodResolver(habitFormSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  useEffect(() => {
    if (habitToEdit) {
      reset({
        name: habitToEdit.name,
        description: habitToEdit.description || '',
      });
    } else {
      reset({
        name: '',
        description: '',
      });
    }
  }, [habitToEdit, reset, isOpen]);

  const onSubmit = (data: HabitFormData) => {
    if (habitToEdit) {
      updateHabit(habitToEdit.id, data);
      toast({ title: "Habit Updated", description: `"${data.name}" has been updated.` });
    } else {
      addHabit(data);
      toast({ title: "Habit Added", description: `"${data.name}" has been added.` });
    }
    if (onFormSubmit) onFormSubmit();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[480px] glass-card">
        <DialogHeader>
          <DialogTitle className="font-headline text-2xl">{habitToEdit ? 'Edit Habit' : 'Add New Habit'}</DialogTitle>
          <DialogDescription>
            {habitToEdit ? 'Update the details of your habit.' : 'Define a new habit you want to track.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Habit Name</Label>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input id="name" placeholder="e.g., Morning Run" {...field} />}
            />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => <Textarea id="description" placeholder="e.g., Run for 30 minutes" {...field} />}
            />
            {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">{habitToEdit ? 'Save Changes' : 'Add Habit'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
