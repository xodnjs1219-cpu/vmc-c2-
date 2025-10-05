export const calculateProgress = (completed: number, total: number): number => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100 * 100) / 100;
};

export const formatProgress = (progress: number): string => {
  return `${progress.toFixed(0)}%`;
};

export const getProgressColor = (progress: number): string => {
  if (progress === 0) return 'bg-slate-200';
  if (progress < 30) return 'bg-red-500';
  if (progress < 70) return 'bg-yellow-500';
  return 'bg-green-500';
};
