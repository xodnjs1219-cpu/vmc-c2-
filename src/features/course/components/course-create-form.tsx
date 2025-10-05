'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateCourse } from '@/features/course/hooks/useInstructorCourse';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { CreateCourseRequestSchema } from '@/features/course/lib/dto';

type CreateCourseFormValues = z.infer<typeof CreateCourseRequestSchema>;

type CategoryOption = {
  id: string;
  name: string;
};

type DifficultyOption = {
  id: string;
  name: string;
};

type CourseCreateFormProps = {
  categories: CategoryOption[];
  difficulties: DifficultyOption[];
};

export const CourseCreateForm = ({
  categories,
  difficulties,
}: CourseCreateFormProps) => {
  const { toast } = useToast();
  const router = useRouter();
  const createCourseMutation = useCreateCourse();

  const form = useForm<CreateCourseFormValues>({
    resolver: zodResolver(CreateCourseRequestSchema),
    defaultValues: {
      title: '',
      description: '',
      categoryId: '',
      difficultyId: '',
      curriculum: '',
    },
  });

  const onSubmit = async (values: CreateCourseFormValues) => {
    try {
      const result = await createCourseMutation.mutateAsync(values);

      toast({
        title: '코스 생성 성공',
        description: `"${result.title}" 코스가 생성되었습니다.`,
      });

      router.push(`/courses/${result.id}`);
    } catch (error) {
      toast({
        title: '코스 생성 실패',
        description: error instanceof Error ? error.message : '오류가 발생했습니다',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>코스 제목 *</FormLabel>
              <FormControl>
                <Input
                  placeholder="코스 제목을 입력하세요"
                  {...field}
                  maxLength={200}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>코스 소개 *</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="코스 소개를 입력하세요"
                  {...field}
                  rows={5}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>카테고리 *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="카테고리를 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="difficultyId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>난이도 *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="난이도를 선택하세요" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {difficulties.map((difficulty) => (
                    <SelectItem key={difficulty.id} value={difficulty.id}>
                      {difficulty.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="curriculum"
          render={({ field }) => (
            <FormItem>
              <FormLabel>커리큘럼 (선택)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="커리큘럼을 입력하세요"
                  {...field}
                  rows={8}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={createCourseMutation.isPending}
          >
            취소
          </Button>
          <Button type="submit" disabled={createCourseMutation.isPending}>
            {createCourseMutation.isPending ? '생성 중...' : '코스 생성'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
