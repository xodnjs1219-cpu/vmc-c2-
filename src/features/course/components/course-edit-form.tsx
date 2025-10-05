'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useUpdateCourse } from '../hooks/useInstructorCourse';
import { useCourseMetadata } from '../hooks/useCourseMetadata';
import { Loader2, Save } from 'lucide-react';
import type { Course } from '../lib/dto';

interface CourseEditFormProps {
  course: Course;
}

export function CourseEditForm({ course }: CourseEditFormProps) {
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description);
  const [categoryId, setCategoryId] = useState(course.category.id);
  const [difficultyId, setDifficultyId] = useState(course.difficulty.id);
  const [curriculum, setCurriculum] = useState(course.curriculum || '');

  const { toast } = useToast();
  const updateMutation = useUpdateCourse();
  const { data: metadata, isLoading: metadataLoading } = useCourseMetadata();

  const hasChanges =
    title !== course.title ||
    description !== course.description ||
    categoryId !== course.category.id ||
    difficultyId !== course.difficulty.id ||
    curriculum !== (course.curriculum || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: '오류',
        description: '제목을 입력하세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: '오류',
        description: '소개를 입력하세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        courseId: course.id,
        request: {
          title: title.trim(),
          description: description.trim(),
          categoryId,
          difficultyId,
          curriculum: curriculum.trim() || undefined,
        },
      });
      toast({
        title: '성공',
        description: '코스 정보가 수정되었습니다.',
      });
    } catch (error) {
      toast({
        title: '오류',
        description:
          error instanceof Error ? error.message : '코스 수정에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>코스 정보 수정</CardTitle>
        <CardDescription>코스의 기본 정보를 수정합니다</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">제목 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="코스 제목을 입력하세요"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">소개 *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="코스 소개를 입력하세요"
              rows={4}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">카테고리 *</Label>
              <Select value={categoryId} onValueChange={setCategoryId} disabled={metadataLoading}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="카테고리 선택" />
                </SelectTrigger>
                <SelectContent>
                  {metadata?.categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">난이도 *</Label>
              <Select value={difficultyId} onValueChange={setDifficultyId} disabled={metadataLoading}>
                <SelectTrigger id="difficulty">
                  <SelectValue placeholder="난이도 선택" />
                </SelectTrigger>
                <SelectContent>
                  {metadata?.difficulties.map((difficulty) => (
                    <SelectItem key={difficulty.id} value={difficulty.id}>
                      {difficulty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="curriculum">커리큘럼</Label>
            <Textarea
              id="curriculum"
              value={curriculum}
              onChange={(e) => setCurriculum(e.target.value)}
              placeholder="커리큘럼을 입력하세요 (선택사항)"
              rows={6}
            />
          </div>

          <Button
            type="submit"
            disabled={!hasChanges || updateMutation.isPending}
            className="w-full"
          >
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            변경사항 저장
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
