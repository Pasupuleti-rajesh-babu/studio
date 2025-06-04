
"use client"

import React, { useMemo } from 'react';
import { useHabits } from '@/contexts/HabitContext';
import type { Habit, ProgressDataPoint, HabitCompletionStat } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, LineChart, AreaChart, PieChart } from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import {
  Bar,
  Line,
  Area,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  BarChart as RechartsBarChart,
  LineChart as RechartsLineChart,
  AreaChart as RechartsAreaChart,
} from "recharts"
import { format, subDays, eachDayOfInterval, parseISO } from 'date-fns';
import { StatsInsight } from '@/components/ai/StatsInsight'; // Added import

const CHART_COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

export function StatsView() {
  const { habits, getStreak } = useHabits(); // Added getStreak

  const activeHabits = useMemo(() => habits.filter(h => !h.archived), [habits]);

  const overallCompletionData = useMemo(() => {
    if (activeHabits.length === 0) return [];
    const days = 30; // Show last 30 days
    const endDate = new Date();
    const startDate = subDays(endDate, days - 1);
    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });

    return dateInterval.map(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      let completedCount = 0;
      activeHabits.forEach(habit => {
        if (habit.progress[dateString]) {
          completedCount++;
        }
      });
      return {
        date: format(date, 'MMM d'),
        "Completion Rate": activeHabits.length > 0 ? (completedCount / activeHabits.length) * 100 : 0,
        "Completed": completedCount,
      };
    });
  }, [activeHabits]);

  const habitSpecificCompletion: HabitCompletionStat[] = useMemo(() => {
     return activeHabits.map((habit, index) => {
      // Calculate completion rate based on tracked days for this habit
      const progressDates = Object.keys(habit.progress).map(dateStr => parseISO(dateStr));
      if (progressDates.length === 0) return { name: habit.name, value: 0, fill: habit.color || CHART_COLORS[index % CHART_COLORS.length] };

      const minDate = new Date(Math.min(...progressDates.map(d => d.getTime())));
      const maxDate = new Date(Math.max(...progressDates.map(d => d.getTime()), new Date().getTime())); // include today even if no entry
      
      const totalTrackedDaysPossible = eachDayOfInterval({start: minDate, end: maxDate}).length;
      const completedEntries = Object.values(habit.progress).filter(Boolean).length;
      
      return {
        name: habit.name,
        value: totalTrackedDaysPossible > 0 ? parseFloat(((completedEntries / totalTrackedDaysPossible) * 100).toFixed(1)) : 0,
        fill: habit.color || CHART_COLORS[index % CHART_COLORS.length],
      };
    }).sort((a, b) => b.value - a.value); // Sort by completion rate
  }, [activeHabits]);

  const dailySummaryData = useMemo(() => {
     if (activeHabits.length === 0) return null;
     const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
     
     const habitsCompletedYesterday = activeHabits.filter(h => h.progress[yesterdayStr]).length;
     const totalHabitsTracked = activeHabits.length;
     const completionRateYesterday = totalHabitsTracked > 0 ? (habitsCompletedYesterday / totalHabitsTracked) * 100 : 0;
     
     const longestOverallStreak = Math.max(0, ...activeHabits.map(h => getStreak(h.id)));

     return {
         completionRate: completionRateYesterday,
         totalHabits: totalHabitsTracked,
         habitsCompleted: habitsCompletedYesterday,
         longestStreak: longestOverallStreak
     };
  }, [activeHabits, getStreak]);


  if (activeHabits.length === 0) {
    return (
      <Card className="glass-card mt-8">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center"><BarChart className="mr-2 h-5 w-5 text-primary" />Your Statistics</CardTitle>
          <CardDescription>Track some habits to see your progress here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No data to display yet. Add some habits and mark their progress!</p>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    "Completion Rate": { label: "Completion Rate (%)", color: "hsl(var(--chart-1))" },
    "Completed": { label: "Habits Completed", color: "hsl(var(--chart-2))" },
    ...habitSpecificCompletion.reduce((acc, cur) => ({...acc, [cur.name]: {label: cur.name, color: cur.fill}}), {})
  }

  return (
    <div className="grid gap-6 mt-8 md:grid-cols-1 lg:grid-cols-2">
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center"><LineChart className="mr-2 h-5 w-5 text-primary" />Overall Completion (Last 30 Days)</CardTitle>
          <CardDescription>Your daily habit completion rate.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <RechartsAreaChart data={overallCompletionData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
              <YAxis unit="%" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} domain={[0, 100]}/>
              <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
              <Area type="monotone" dataKey="Completion Rate" stroke="var(--color-Completion Rate)" fill="var(--color-Completion Rate)" fillOpacity={0.3}  dot={false} />
            </RechartsAreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center"><PieChart className="mr-2 h-5 w-5 text-primary" />Habit Success Rates</CardTitle>
          <CardDescription>Overall success rate for each active habit since tracking began or last 30 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <RechartsPieChart>
              <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" />} />
              <Pie data={habitSpecificCompletion} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false}
                label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  if (percent === 0) return null; // Don't render label for 0%
                  return (
                    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                      {`${(percent * 100).toFixed(0)}%`}
                    </text>
                  );
                }}
              >
                {habitSpecificCompletion.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </RechartsPieChart>
          </ChartContainer>
        </CardContent>
      </Card>
      
      {dailySummaryData && (
         <Card className="glass-card"> {/* Removed lg:col-span-2 */}
            <CardHeader>
                <CardTitle className="font-headline text-xl">Yesterday's Snapshot</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                    <p className="text-2xl font-bold">{dailySummaryData.completionRate.toFixed(0)}%</p>
                    <p className="text-sm text-muted-foreground">Completion</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">{dailySummaryData.habitsCompleted}</p>
                    <p className="text-sm text-muted-foreground">Habits Done</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">{dailySummaryData.totalHabits}</p>
                    <p className="text-sm text-muted-foreground">Total Habits</p>
                </div>
                <div>
                    <p className="text-2xl font-bold">{dailySummaryData.longestStreak}</p>
                    <p className="text-sm text-muted-foreground">Longest Streak</p>
                </div>
            </CardContent>
         </Card>
      )}
      <StatsInsight /> {/* Added AI Stats Insight card */}
    </div>
  );
}
