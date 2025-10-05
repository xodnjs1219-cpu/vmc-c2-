"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSignup } from "@/features/auth/hooks/useSignup";
import {
  SignupRequestSchema,
  type SignupRequest,
} from "@/features/auth/lib/dto";
import { USER_ROLES, ROLE_LABELS } from "@/constants/auth";
import { TermsDialog } from "@/features/auth/components/terms-dialog";

export const SignupForm = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { mutate: signup, isPending } = useSignup();

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<SignupRequest>({
    resolver: zodResolver(SignupRequestSchema),
    defaultValues: {
      email: "",
      password: "",
      role: USER_ROLES.LEARNER,
      name: "",
      phone: "",
      termsAgreed: false,
    },
  });

  const selectedRole = watch("role");

  const onSubmit = (data: SignupRequest) => {
    signup(data, {
      onSuccess: (response) => {
        toast({
          title: "회원가입 성공",
          description: `${ROLE_LABELS[response.role]}으로 가입되었습니다. 로그인해주세요.`,
        });

        // Redirect to login page
        router.push("/login");
      },
      onError: (error) => {
        toast({
          title: "회원가입 실패",
          description: error.message ?? "회원가입에 실패했습니다",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">이메일</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      {/* Role Selection */}
      <div className="space-y-2">
        <Label htmlFor="role">역할</Label>
        <Select
          value={selectedRole}
          onValueChange={(value) =>
            setValue("role", value as "learner" | "instructor")
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={USER_ROLES.LEARNER}>
              {ROLE_LABELS[USER_ROLES.LEARNER]}
            </SelectItem>
            <SelectItem value={USER_ROLES.INSTRUCTOR}>
              {ROLE_LABELS[USER_ROLES.INSTRUCTOR]}
            </SelectItem>
          </SelectContent>
        </Select>
        {errors.role && (
          <p className="text-sm text-red-500">{errors.role.message}</p>
        )}
      </div>

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="name">이름</Label>
        <Input id="name" type="text" autoComplete="name" {...register("name")} />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      {/* Phone */}
      <div className="space-y-2">
        <Label htmlFor="phone">휴대폰번호</Label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          placeholder="010-1234-5678"
          {...register("phone")}
        />
        {errors.phone && (
          <p className="text-sm text-red-500">{errors.phone.message}</p>
        )}
      </div>

      {/* Terms Agreement */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="termsAgreed"
            onCheckedChange={(checked) => setValue("termsAgreed", !!checked)}
          />
          <Label htmlFor="termsAgreed" className="text-sm font-normal">
            <TermsDialog>
              <button
                type="button"
                className="underline hover:text-slate-900"
              >
                서비스 이용약관 및 개인정보 처리방침
              </button>
            </TermsDialog>
            에 동의합니다 (필수)
          </Label>
        </div>
        {errors.termsAgreed && (
          <p className="text-sm text-red-500">{errors.termsAgreed.message}</p>
        )}
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "등록 중..." : "회원가입"}
      </Button>
    </form>
  );
};
