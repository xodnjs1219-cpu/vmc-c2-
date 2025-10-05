"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CourseGrade } from "@/features/grade/lib/dto";
import { SubmissionRow } from "./submission-row";

type CourseGradeCardProps = {
  courseGrade: CourseGrade;
};

export const CourseGradeCard = ({ courseGrade }: CourseGradeCardProps) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{courseGrade.courseTitle}</CardTitle>
          <div className="text-right">
            <p className="text-sm text-slate-500">총점</p>
            <p className="text-2xl font-bold">
              {courseGrade.totalScore.toFixed(2)}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {courseGrade.submissions.length === 0 ? (
          <p className="text-center text-slate-400">제출한 과제가 없습니다</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b text-left text-sm text-slate-500">
                <th className="px-4 py-2">과제명</th>
                <th className="px-4 py-2">상태</th>
                <th className="px-4 py-2 text-center">점수</th>
                <th className="px-4 py-2 text-center">비중</th>
                <th className="px-4 py-2">제출일</th>
                <th className="px-4 py-2">피드백</th>
              </tr>
            </thead>
            <tbody>
              {courseGrade.submissions.map((submission) => (
                <SubmissionRow
                  key={submission.submissionId}
                  submission={submission}
                />
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
};
