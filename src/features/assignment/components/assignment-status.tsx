'use client';

import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface AssignmentStatusProps {
  status: 'draft' | 'published' | 'closed';
  dueDate: string;
  canSubmit: boolean;
  isLate: boolean;
  submitDisabledReason?: string;
}

export function AssignmentStatus({
  status,
  dueDate,
  canSubmit,
  isLate,
  submitDisabledReason,
}: AssignmentStatusProps) {
  const now = new Date();
  const dueDateObj = new Date(dueDate);
  const isPast = now > dueDateObj;
  const hoursRemaining = (dueDateObj.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isUrgent = hoursRemaining > 0 && hoursRemaining <= 24;

  // 상태별 배지 렌더링
  const renderStatusBadge = () => {
    if (status === 'closed') {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          마감됨
        </Badge>
      );
    }

    if (isLate && canSubmit) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
          <AlertCircle className="h-3 w-3" />
          지각 제출 가능
        </Badge>
      );
    }

    if (!canSubmit) {
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          제출 불가
        </Badge>
      );
    }

    return (
      <Badge variant="default" className="flex items-center gap-1 bg-green-100 text-green-800">
        <CheckCircle className="h-3 w-3" />
        제출 가능
      </Badge>
    );
  };

  // 남은 시간 표시
  const renderTimeRemaining = () => {
    if (isPast) {
      return (
        <span className="text-sm text-muted-foreground">
          {formatDistanceToNow(dueDateObj, { addSuffix: true, locale: ko })} 마감됨
        </span>
      );
    }

    const timeRemainingText = formatDistanceToNow(dueDateObj, {
      addSuffix: false,
      locale: ko,
    });

    return (
      <div className="flex items-center gap-2">
        <Clock className={`h-4 w-4 ${isUrgent ? 'text-red-500' : 'text-muted-foreground'}`} />
        <span className={`text-sm ${isUrgent ? 'text-red-500 font-semibold' : 'text-muted-foreground'}`}>
          {timeRemainingText} 남음
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {renderStatusBadge()}
        {renderTimeRemaining()}
      </div>

      {/* 경고 메시지 */}
      {isLate && canSubmit && (
        <Alert variant="default" className="bg-yellow-50 border-yellow-200">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            마감일이 지났습니다. 지각 제출 시 점수에 영향이 있을 수 있습니다.
          </AlertDescription>
        </Alert>
      )}

      {!canSubmit && submitDisabledReason && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>{submitDisabledReason}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
