import { format, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatDate = (date: string | Date, pattern = 'yyyy-MM-dd') => {
  return format(new Date(date), pattern, { locale: ko });
};

export const formatDateTime = (date: string | Date) => {
  return format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: ko });
};

export const formatRelativeTime = (date: string | Date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ko });
};

export const getDaysRemaining = (date: string | Date) => {
  return differenceInDays(new Date(date), new Date());
};
