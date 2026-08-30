"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { useRegister } from "@/hooks/useAuth";
import { useValidateAgentCode } from "@/hooks/useAgent";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useForm, type Resolver } from "react-hook-form";
import { z } from "zod";

import { Eye, EyeOff, Loader2 } from "lucide-react";

import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const registerSchema = z
  .object({
    fullName: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .refine(
        (val) => {
          const digitsOnly = val.replace(/\D/g, "");
          // Must be exactly 11 digits
          if (digitsOnly.length !== 11) return false;
          // Must start with valid Nigerian prefixes
          const validPrefixes = /^0(70[1-9]|80[1-9]|81[0-8]|90[1-9]|91[0-6])/;
          return validPrefixes.test(digitsOnly);
        },
        {
          message:
            "Please enter a valid Nigerian phone number (e.g., 08012345678)",
        }
      ),
    agentCode: z.string().optional(),
    password: z.preprocess(
      (val) => (typeof val === "string" ? val.trim() : val),
      z
        .string()
        .min(8, { message: "Password must be at least 8 characters long" })
    ),
    confirmPassword: z.preprocess(
      (val) => (typeof val === "string" ? val.trim() : val),
      z.string()
    ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const searchParams = useSearchParams();
  const urlCode =
    searchParams.get("agentCode") ||
    searchParams.get("code") ||
    searchParams.get("ref");

  const registerMutation = useRegister();
  const { mutateAsync: validateCode, isPending: isValidating } =
    useValidateAgentCode();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(
      registerSchema
    ) as unknown as Resolver<RegisterFormValues>,
    mode: "onChange",
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      agentCode: urlCode?.toUpperCase() || "",
      password: "",
      confirmPassword: "",
    },
  });

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { isValid, errors },
  } = form;

  // Update agent code if URL changes
  useEffect(() => {
    if (urlCode) {
      setValue("agentCode", urlCode.toUpperCase());
    }
  }, [urlCode, setValue]);

  const onSubmit = async (data: RegisterFormValues) => {
    const { confirmPassword: _confirmPassword, ...rest } = data;

    const normalizedAgentCode = rest.agentCode?.trim().toUpperCase();
    if (normalizedAgentCode) {
      try {
        const result = await validateCode(normalizedAgentCode);
        const isValid =
          result.data?.isValid ?? (result.data as any)?.valid ?? false;
        if (!isValid) {
          setError("agentCode", { message: "Invalid agent code" });
          return;
        }
      } catch (error: any) {
        setError("agentCode", {
          message:
            error.response?.data?.message ||
            "Could not validate this agent code. Please try again.",
        });
        return;
      }
    }

    // Normalize phone number (strip non-digits)
    const normalizedPhone = rest.phoneNumber.replace(/\D/g, "");

    const dataToSend = {
      email: rest.email,
      password: rest.password,
      phoneNumber: normalizedPhone,
      fullName: rest.fullName,
      agentCode: normalizedAgentCode || undefined,
    };

    // Store password in sessionStorage temporarily for auto-fill on login page
    sessionStorage.setItem("registrationPassword", rest.password);
    sessionStorage.setItem("registrationEmail", rest.email);

    try {
      await registerMutation.mutateAsync(dataToSend);
    } catch (err: any) {
      const error = err as AxiosError<any>;
      const errorData = error.response?.data;

      console.error("[RegisterForm] Registration error", errorData || error);

      if (errorData?.details && typeof errorData.details === "object") {
        Object.entries(errorData.details).forEach(([field, msg]) => {
          try {
            if (field === "password" || field === "confirmPassword") {
              form.setError("password", { message: String(msg) });
            } else if (field === "email") {
              form.setError("email", { message: String(msg) });
            } else if (field === "phoneNumber") {
              form.setError("phoneNumber", { message: String(msg) });
            } else if (field === "fullName") {
              form.setError("fullName", { message: String(msg) });
            } else {
              toast.error(`${field}: ${msg}`);
            }
          } catch (e) {
            // ignore
          }
        });
        try {
          if (typeof window !== "undefined") {
            sessionStorage.setItem(
              "registrationLastError",
              JSON.stringify(errorData)
            );
          }
        } catch {}
        return;
      }

      if (Array.isArray(errorData?.errors) && errorData.errors.length > 0) {
        errorData.errors.forEach((e: any) => {
          const msg = typeof e === "string" ? e : e.message || e.msg || e;
          if (/(password)/i.test(msg)) {
            form.setError("password", { message: String(msg) });
          } else if (/(email)/i.test(msg)) {
            form.setError("email", { message: String(msg) });
          } else if (/(phone|phoneNumber)/i.test(msg)) {
            form.setError("phoneNumber", { message: String(msg) });
          } else {
            toast.error(String(msg));
          }
        });
        return;
      }

      const singleMessage =
        errorData?.message ||
        errorData?.error ||
        (typeof errorData === "string" ? errorData : null);
      if (singleMessage) {
        if (/(password)/i.test(String(singleMessage))) {
          form.setError("password", { message: String(singleMessage) });
        } else {
          toast.error(String(singleMessage));
        }
        return;
      }

      try {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(
            "registrationLastError",
            JSON.stringify(errorData || { message: String(error?.message) })
          );
        }
      } catch (e) {}

      toast.error("Registration failed. Please try again.");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("registrationLastError");
    if (!raw) return;

    try {
      const errorData = JSON.parse(raw);

      if (errorData?.details && typeof errorData.details === "object") {
        Object.entries(errorData.details).forEach(([field, msg]) => {
          try {
            if (field === "password" || field === "confirmPassword") {
              form.setError("password", { message: String(msg) });
            } else if (field === "email") {
              form.setError("email", { message: String(msg) });
            } else if (field === "phoneNumber") {
              form.setError("phoneNumber", { message: String(msg) });
            } else if (field === "fullName") {
              form.setError("fullName", { message: String(msg) });
            } else {
              toast.error(`${field}: ${msg}`);
            }
          } catch (e) {}
        });
      } else if (
        Array.isArray(errorData?.errors) &&
        errorData.errors.length > 0
      ) {
        errorData.errors.forEach((e: any) => {
          const msg = typeof e === "string" ? e : e.message || e.msg || e;
          if (/(password)/i.test(msg)) {
            form.setError("password", { message: String(msg) });
          } else if (/(email)/i.test(msg)) {
            form.setError("email", { message: String(msg) });
          } else if (/(phone|phoneNumber)/i.test(msg)) {
            form.setError("phoneNumber", { message: String(msg) });
          } else {
            toast.error(String(msg));
          }
        });
      } else if (errorData?.message || errorData?.error) {
        const singleMessage = errorData.message || errorData.error;
        if (/(password)/i.test(String(singleMessage))) {
          form.setError("password", { message: String(singleMessage) });
        } else {
          toast.error(String(singleMessage));
        }
      }
    } catch (e) {
      console.error(
        "[RegisterForm] Failed to parse persisted registration error",
        e
      );
    }
  }, [form]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => {
      try {
        if (sessionStorage.getItem("registrationLastError")) {
          sessionStorage.removeItem("registrationLastError");
        }
      } catch {}
    };

    document.addEventListener("input", handler);
    return () => document.removeEventListener("input", handler);
  }, []);

  return (
    <Card className="mx-auto w-full max-w-sm sm:max-w-md md:max-w-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Sign Up</CardTitle>
        <CardDescription>
          Enter your information to create an account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="John Doe" {...register("fullName")} />
            {errors.fullName && (
              <p className="text-sm text-red-500">{errors.fullName.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              placeholder="08012345678"
              maxLength={11}
              {...register("phoneNumber")}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-red-500">
                {errors.phoneNumber.message}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="agentCode">Agent Code (Optional)</Label>
            <Input
              id="agentCode"
              placeholder="e.g. AG123ABC"
              {...register("agentCode", {
                onChange: (event) => {
                  event.target.value = event.target.value.toUpperCase();
                },
              })}
            />
            {urlCode && !errors.agentCode && (
              <p className="text-muted-foreground text-sm">
                Agent code applied from your invite link.
              </p>
            )}
            {errors.agentCode && (
              <p className="text-sm text-red-500">{errors.agentCode.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                {...register("password")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                {...register("confirmPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute top-1/2 right-1 -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff /> : <Eye />}
              </Button>
            </div>
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={!isValid || registerMutation.isPending || isValidating}
          >
            {registerMutation.isPending ? (
              <div className="flex items-center gap-x-2">
                <Spinner />
                <span>Creating account...</span>
              </div>
            ) : isValidating ? (
              <div className="flex items-center gap-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Validating code...</span>
              </div>
            ) : (
              "Create an account"
            )}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <a href="/login" className="underline">
            Login
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
