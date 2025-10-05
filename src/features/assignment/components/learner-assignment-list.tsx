'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { LearnerAssignmentListItem } from '../lib/dto';

interface LearnerAssignmentListProps {
  courseId: string;
  assignments: LearnerAssignmentListItem[];
}

export function LearnerAssignmentList({ courseId, assignments }: LearnerAssignmentListProps) {
  const getStatusIcon = (assignment: LearnerAssignmentListItem) => {
    if (assignment.submissionStatus === 'graded') {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (assignment.submissionStatus === 'submitted') {
      return <Clock className="h-5 w-5 text-blue-500" />;
    }
    if (assignment.submissionStatus === 'resubmission_required') {
      return <XCircle className="h-5 w-5 text-orange-500" />;
    }
    if (assignment.isLate && !assignment.allowLate) {
      return <XCircle className="h-5 w-5 text-red-500" />;
    }
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  };

  const getStatusLabel = (assignment: LearnerAssignmentListItem) => {
    if (assignment.submissionStatus === 'graded') {
      return { text: '채점 완료', variant: 'default' as const };
    }
    if (assignment.submissionStatus === 'submitted') {
      return { text: '제출 완료', variant: 'secondary' as const };
    }
    if (assignment.submissionStatus === 'resubmission_required') {
      return { text: '재제출 필요', variant: 'destructive' as const };
    }
    if (assignment.isLate && !assignment.allowLate) {
      return { text: '마감', variant: 'destructive' as const };
    }
    if (assignment.isLate && assignment.allowLate) {
      return { text: '지각 제출 가능', variant: 'outline' as const };
    }
    return { text: '제출 가능', variant: 'outline' as const };
  };

  if (assignments.length === 0) {
    return (
      <Card>
        <CardContent className="flex min-h-[400px] items-center justify-center">
          <div className="text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">과제가 없습니다</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              아직 공개된 과제가 없습니다
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => {
        const statusLabel = getStatusLabel(assignment);
        
        return (
          <Card key={assignment.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(assignment)}
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{assignment.title}</CardTitle>
                      <Badge variant={statusLabel.variant}>{statusLabel.text}</Badge>
                    </div>
                    <CardDescription className="flex items-center gap-4 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        마감: {format(new Date(assignment.dueDate), 'PPP', { locale: ko })}
                      </span>
                      <span>비중: {assignment.weight}%</span>
                      {assignment.score !== null && (
                        <span className="font-semibold text-foreground">
                          점수: {assignment.score}점
                        </span>
                      )}
                    </CardDescription>
                  </div>
                </div>
                <Button asChild>
                  <Link href={`/courses/${courseId}/assignments/${assignment.id}`}>
                    {assignment.hasSubmitted ? '상세보기' : '제출하기'}
                  </Link>
                </Button>
              </div>
            </CardHeader>
          </Card>
        );
      })}
    </div>
  );
}
