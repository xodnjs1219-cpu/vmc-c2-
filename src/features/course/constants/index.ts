export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const COURSE_SORT_BY = {
  LATEST: 'latest',
  POPULAR: 'popular',
} as const;

export const COURSE_SORT_ORDER = {
  ASC: 'asc',
  DESC: 'desc',
} as const;

export const DEFAULT_PAGE_SIZE = 12;
