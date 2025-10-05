'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useCreateAssignment } from '../hooks/useInstructorAssignment';
import { Loader2, Plus } from 'lucide-react';

interface AssignmentCreateDialogProps {
  courseId: string;
}

export function AssignmentCreateDialog({ courseId }: AssignmentCreateDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [weight, setWeight] = useState(10);
  const [allowLate, setAllowLate] = useState(false);
  const [allowResubmission, setAllowResubmission] = useState(false);

  const { toast } = useToast();
  const createMutation = useCreateAssignment(courseId);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDueDate('');
    setWeight(10);
    setAllowLate(false);
    setAllowResubmission(false);
  };

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
        description: '설명을 입력하세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!dueDate) {
      toast({
        title: '오류',
        description: '마감일을 입력하세요.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        dueDate: new Date(dueDate).toISOString(),
        weight,
        allowLate,
        allowResubmission,
      });

      toast({
        title: '성공',
        description: '과제가 생성되었습니다.',
      });

      resetForm();
      setOpen(false);
    } catch (error) {
      toast({
        title: '오류',
        description: error instanceof Error ? error.message : '과제 생성에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          새 과제 추가
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>새 과제 추가</DialogTitle>
            <DialogDescription>
              과제 정보를 입력하세요. 임시저장 상태로 생성됩니다.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">제목 *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="과제 제목을 입력하세요"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">설명 *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="과제 설명을 입력하세요"
                rows={4}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dueDate">마감일 *</Label>
                <Input
                  id="dueDate"
                  type="datetime-local"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight">점수 비중 (%) *</Label>
                <Input
                  id="weight"
                  type="number"
                  min={0}
                  max={100}
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowLate"
                  checked={allowLate}
                  onCheckedChange={(checked) => setAllowLate(checked === true)}
                />
                <Label htmlFor="allowLate" className="cursor-pointer">
                  지각 제출 허용
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allowResubmission"
                  checked={allowResubmission}
                  onCheckedChange={(checked) => setAllowResubmission(checked === true)}
                />
                <Label htmlFor="allowResubmission" className="cursor-pointer">
                  재제출 허용
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              disabled={createMutation.isPending}
            >
              취소
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              생성
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
