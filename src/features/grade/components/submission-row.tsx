"use client";

import { Badge } from "@/components/ui/badge";
import type { SubmissionGrade } from "@/features/grade/lib/dto";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";

type SubmissionRowProps = {
  submission: SubmissionGrade;
};

export const SubmissionRow = ({ submission }: SubmissionRowProps) => {
  const statusBadge = () => {
    if (submission.status === 'graded') {
      return <Badge variant="default">채점 완료</Badge>;
    }
    if (submission.status === 'resubmission_required') {
      return <Badge variant="destructive">재제출 필요</Badge>;
    }
    return <Badge variant="secondary">채점 대기 중</Badge>;
  };

  return (
    <tr className="border-b">
      <td className="px-4 py-3">{submission.assignmentTitle}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {statusBadge()}
          {submission.isLate && <Badge variant="outline">지각</Badge>}
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        {submission.status === 'graded' ? (
          <span className="font-semibold">{submission.score}</span>
        ) : (
          <span className="text-slate-400">-</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">{submission.assignmentWeight}%</td>
      <td className="px-4 py-3 text-sm text-slate-500">
        {formatDistanceToNow(new Date(submission.submittedAt), {
          addSuffix: true,
          locale: ko,
        })}
      </td>
      <td className="px-4 py-3">
        {submission.feedback ? (
          <p className="text-sm text-slate-600">{submission.feedback}</p>
        ) : (
          <span className="text-sm text-slate-400">피드백 없음</span>
        )}
      </td>
    </tr>
  );
};
