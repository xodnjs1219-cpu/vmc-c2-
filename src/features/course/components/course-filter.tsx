'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { COURSE_SORT_BY, COURSE_SORT_ORDER } from '../constants';
import { useDebounce } from 'react-use';

interface CourseFilterProps {
  categories?: Array<{ id: string; name: string }>;
  difficulties?: Array<{ id: string; name: string }>;
}

export function CourseFilter({
  categories = [],
  difficulties = [],
}: CourseFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [categoryId, setCategoryId] = useState(
    searchParams.get('categoryId') || ''
  );
  const [difficultyId, setDifficultyId] = useState(
    searchParams.get('difficultyId') || ''
  );
  const [sortBy, setSortBy] = useState(
    searchParams.get('sortBy') || COURSE_SORT_BY.LATEST
  );
  const [sortOrder, setSortOrder] = useState(
    searchParams.get('sortOrder') || COURSE_SORT_ORDER.DESC
  );

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useDebounce(
    () => {
      setDebouncedSearch(search);
    },
    500,
    [search]
  );

  useEffect(() => {
    const params = new URLSearchParams();

    if (debouncedSearch) params.set('search', debouncedSearch);
    if (categoryId) params.set('categoryId', categoryId);
    if (difficultyId) params.set('difficultyId', difficultyId);
    if (sortBy) params.set('sortBy', sortBy);
    if (sortOrder) params.set('sortOrder', sortOrder);

    router.push(`?${params.toString()}`);
  }, [debouncedSearch, categoryId, difficultyId, sortBy, sortOrder, router]);

  const handleReset = () => {
    setSearch('');
    setCategoryId('');
    setDifficultyId('');
    setSortBy(COURSE_SORT_BY.LATEST);
    setSortOrder(COURSE_SORT_ORDER.DESC);
  };

  return (
    <div className="mb-6 space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Input
          placeholder="코스 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Select value={categoryId} onValueChange={setCategoryId}>
          <SelectTrigger>
            <SelectValue placeholder="카테고리 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={difficultyId} onValueChange={setDifficultyId}>
          <SelectTrigger>
            <SelectValue placeholder="난이도 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">전체</SelectItem>
            {difficulties.map((difficulty) => (
              <SelectItem key={difficulty.id} value={difficulty.id}>
                {difficulty.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={COURSE_SORT_BY.LATEST}>최신순</SelectItem>
              <SelectItem value={COURSE_SORT_BY.POPULAR}>인기순</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={COURSE_SORT_ORDER.DESC}>내림차순</SelectItem>
              <SelectItem value={COURSE_SORT_ORDER.ASC}>오름차순</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-end">
        <Button variant="outline" onClick={handleReset}>
          필터 초기화
        </Button>
      </div>
    </div>
  );
}
