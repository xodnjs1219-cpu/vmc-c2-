"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTerms } from "@/features/auth/hooks/useTerms";

type TermsDialogProps = {
  children: React.ReactNode;
};

export const TermsDialog = ({ children }: TermsDialogProps) => {
  const [open, setOpen] = useState(false);
  const { data: terms, isLoading, error } = useTerms();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>서비스 이용약관 및 개인정보 처리방침</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {isLoading && (
            <p className="text-center text-sm text-slate-500">
              약관을 불러오는 중...
            </p>
          )}
          {error && (
            <p className="text-center text-sm text-red-500">
              약관을 불러오는데 실패했습니다.
            </p>
          )}
          {terms &&
            terms.map((term) => (
              <div key={term.id} className="space-y-2">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm text-slate-700">
                    {term.content}
                  </div>
                </div>
              </div>
            ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>닫기</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
