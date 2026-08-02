"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CircleCheckIcon,
  LogInIcon,
  SendIcon,
  SparklesIcon,
} from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { callAction } from "@/lib/action-client";
import { activateByPhone, lookupActivation } from "@/actions/katil";
import { createLead } from "@/actions/leads";
import { authClient } from "@/lib/auth-client";
import { normalizePhone, phoneToEmail } from "@/lib/phone";
import { leadExamSchema, phoneSchema } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Step = "phone" | "login" | "activate" | "join" | "joined";

/** Telefonla tek giriş: hesabı olan girer, bekleyen PIN belirler, yeni kişi başvurur. */
export function KatilFlow() {
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");

  if (step === "login") {
    return <LoginStep phone={phone} onBack={() => setStep("phone")} />;
  }
  if (step === "activate") {
    return <ActivateStep phone={phone} onBack={() => setStep("phone")} />;
  }
  if (step === "join") {
    return (
      <JoinStep
        phone={phone}
        onBack={() => setStep("phone")}
        onDone={() => setStep("joined")}
      />
    );
  }
  if (step === "joined") {
    return <JoinedScreen />;
  }

  return (
    <PhoneStep
      onResolved={(nextStep, enteredPhone) => {
        setPhone(enteredPhone);
        setStep(nextStep);
      }}
    />
  );
}

/* ------------------------------- Step: phone ------------------------------ */

const phoneStepSchema = z.object({
  phone: phoneSchema,
  website: z.literal("").optional(),
});
type PhoneStepValues = z.infer<typeof phoneStepSchema>;

function PhoneStep({
  onResolved,
}: {
  onResolved: (step: Exclude<Step, "phone" | "joined">, phone: string) => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<PhoneStepValues>({
    resolver: zodResolver(phoneStepSchema),
    defaultValues: { phone: "", website: "" },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: PhoneStepValues) => {
    setSubmitting(true);
    const res = await callAction(lookupActivation, values);
    setSubmitting(false);
    if (!res.ok) {
      form.setError("phone", { message: res.error });
      return;
    }
    onResolved(res.data.status, normalizePhone(values.phone));
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      <Field data-invalid={errors.phone ? true : undefined}>
        <FieldLabel htmlFor="katil-telefon">Telefon numarası</FieldLabel>
        <Input
          id="katil-telefon"
          inputMode="tel"
          autoComplete="tel"
          placeholder="5XX XXX XX XX"
          aria-invalid={errors.phone ? true : undefined}
          className="h-11"
          {...form.register("phone")}
        />
        <FieldError errors={[errors.phone]} />
        <FieldDescription>
          Koçunla paylaştığın numarayı gir; seni tanıyalım.
        </FieldDescription>
      </Field>
      {/* Bal küpü — botlar doldurur, insanlar görmez. */}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        {...form.register("website")}
      />
      <Button type="submit" size="lg" disabled={submitting} className="h-11 w-full">
        <ArrowRightIcon data-icon="inline-start" />
        {submitting ? "Kontrol ediliyor…" : "Devam et"}
      </Button>
    </form>
  );
}

/* ------------------------------- Step: login ------------------------------ */

const loginStepSchema = z.object({
  pin: z.string().min(4, "PIN en az 4 karakter olmalı."),
});
type LoginStepValues = z.infer<typeof loginStepSchema>;

function LoginStep({ phone, onBack }: { phone: string; onBack: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<LoginStepValues>({
    resolver: zodResolver(loginStepSchema),
    defaultValues: { pin: "" },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: LoginStepValues) => {
    setSubmitting(true);
    const res = await authClient.signIn.email({
      email: phoneToEmail(phone),
      password: values.pin,
    });
    if (res.error) {
      setSubmitting(false);
      form.setError("pin", { message: "Telefon veya PIN hatalı." });
      return;
    }
    let role = (res.data?.user as { role?: string } | undefined)?.role;
    if (!role) {
      const session = await authClient.getSession();
      role = (session.data?.user as { role?: string } | undefined)?.role;
    }
    toast.success("Hoş geldin!");
    window.location.assign(
      role === "coach" || role === "admin" ? "/koc" : "/ogrenci",
    );
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      <Field data-invalid={errors.pin ? true : undefined}>
        <FieldLabel htmlFor="katil-pin-giris">PIN</FieldLabel>
        <Input
          id="katil-pin-giris"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          placeholder="••••"
          aria-invalid={errors.pin ? true : undefined}
          className="h-11"
          {...form.register("pin")}
        />
        <FieldError errors={[errors.pin]} />
        <FieldDescription>
          PIN&apos;ini mi unuttun? Koçuna WhatsApp&apos;tan yaz, sıfırlasın.
        </FieldDescription>
      </Field>
      <Button type="submit" size="lg" disabled={submitting} className="h-11 w-full">
        <LogInIcon data-icon="inline-start" />
        {submitting ? "Giriş yapılıyor…" : "Giriş yap"}
      </Button>
      <BackButton onBack={onBack} />
    </form>
  );
}

/* ------------------------------ Step: activate ---------------------------- */

const activateStepSchema = z
  .object({
    pin: z.string().regex(/^\d{4,6}$/, "PIN 4-6 rakam olmalı."),
    pinConfirm: z.string(),
  })
  .refine((v) => v.pin === v.pinConfirm, {
    message: "PIN'ler eşleşmiyor.",
    path: ["pinConfirm"],
  });
type ActivateStepValues = z.infer<typeof activateStepSchema>;

function ActivateStep({ phone, onBack }: { phone: string; onBack: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<ActivateStepValues>({
    resolver: zodResolver(activateStepSchema),
    defaultValues: { pin: "", pinConfirm: "" },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: ActivateStepValues) => {
    setSubmitting(true);
    const res = await callAction(activateByPhone, {
      phone,
      pin: values.pin,
      pinConfirm: values.pinConfirm,
    });
    if (!res.ok) {
      setSubmitting(false);
      if (res.fieldErrors) {
        for (const [name, message] of Object.entries(res.fieldErrors)) {
          if (name === "pin" || name === "pinConfirm") {
            form.setError(name, { message });
          }
        }
      }
      toast.error(res.error);
      return;
    }
    const signInRes = await authClient.signIn.email({
      email: res.data.email,
      password: values.pin,
    });
    if (signInRes.error) {
      setSubmitting(false);
      toast.error("Hesap oluştu ama giriş başarısız. Giriş sayfasını dene.");
      window.location.assign("/giris");
      return;
    }
    toast.success("Hesabın hazır! Hoş geldin 🎉");
    window.location.assign("/ogrenci");
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      <p className="text-sm text-muted-foreground">
        İlk kez giriyorsun — takibe başlamak için bir PIN belirle.
      </p>
      <Field data-invalid={errors.pin ? true : undefined}>
        <FieldLabel htmlFor="katil-pin">PIN belirle</FieldLabel>
        <Input
          id="katil-pin"
          type="password"
          inputMode="numeric"
          maxLength={6}
          autoComplete="new-password"
          placeholder="4-6 rakam"
          aria-invalid={errors.pin ? true : undefined}
          className="h-11"
          {...form.register("pin")}
        />
        <FieldError errors={[errors.pin]} />
        <FieldDescription>
          Bu PIN ile telefon numaran üzerinden giriş yapacaksın.
        </FieldDescription>
      </Field>
      <Field data-invalid={errors.pinConfirm ? true : undefined}>
        <FieldLabel htmlFor="katil-pin2">PIN tekrar</FieldLabel>
        <Input
          id="katil-pin2"
          type="password"
          inputMode="numeric"
          maxLength={6}
          autoComplete="new-password"
          placeholder="Aynı PIN"
          aria-invalid={errors.pinConfirm ? true : undefined}
          className="h-11"
          {...form.register("pinConfirm")}
        />
        <FieldError errors={[errors.pinConfirm]} />
      </Field>
      <Button type="submit" size="lg" disabled={submitting} className="h-11 w-full">
        <SparklesIcon data-icon="inline-start" />
        {submitting ? "Hesap oluşturuluyor…" : "Başlayalım"}
      </Button>
      <BackButton onBack={onBack} />
    </form>
  );
}

/* -------------------------------- Step: join ------------------------------ */

const EXAMS = [
  { value: "LGS", label: "LGS" },
  { value: "YKS", label: "YKS" },
  { value: "KPSS", label: "KPSS" },
  { value: "Diğer", label: "Diğer / henüz kararsızım" },
] as const;

const joinStepSchema = z.object({
  name: z.string().trim().min(2, "Ad soyad gerekli.").max(120),
  exam: leadExamSchema,
});
type JoinStepValues = z.infer<typeof joinStepSchema>;

function JoinStep({
  phone,
  onBack,
  onDone,
}: {
  phone: string;
  onBack: () => void;
  onDone: () => void;
}) {
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<JoinStepValues>({
    resolver: zodResolver(joinStepSchema),
    defaultValues: { name: "", exam: "KPSS" },
  });
  const { errors } = form.formState;

  const onSubmit = async (values: JoinStepValues) => {
    setSubmitting(true);
    const res = await callAction(createLead, {
      name: values.name,
      phone,
      exam: values.exam,
      source: "katil",
      website: "",
    });
    setSubmitting(false);
    if (!res.ok) {
      if (res.fieldErrors?.name) {
        form.setError("name", { message: res.fieldErrors.name });
      }
      toast.error(res.error);
      return;
    }
    onDone();
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="flex flex-col gap-5"
      noValidate
    >
      <p className="text-sm text-muted-foreground">
        Bu numara sistemde kayıtlı değil. Bilgilerini bırak, koçun seninle
        iletişime geçsin.
      </p>
      <Field data-invalid={errors.name ? true : undefined}>
        <FieldLabel htmlFor="katil-ad">Ad Soyad</FieldLabel>
        <Input
          id="katil-ad"
          placeholder="Örn. Ayşe Yılmaz"
          autoComplete="name"
          aria-invalid={errors.name ? true : undefined}
          className="h-11"
          {...form.register("name")}
        />
        <FieldError errors={[errors.name]} />
      </Field>
      <Field>
        <FieldLabel htmlFor="katil-tel-readonly">Telefon</FieldLabel>
        <Input
          id="katil-tel-readonly"
          readOnly
          value={`0${phone}`}
          className="h-11 bg-muted"
        />
      </Field>
      <Field data-invalid={errors.exam ? true : undefined}>
        <FieldLabel htmlFor="katil-sinav">Hangi sınava hazırlanıyorsun?</FieldLabel>
        <Controller
          control={form.control}
          name="exam"
          render={({ field }) => (
            <Select
              items={[...EXAMS]}
              value={field.value}
              onValueChange={(value) => field.onChange(value)}
            >
              <SelectTrigger id="katil-sinav" className="h-11 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXAMS.map((exam) => (
                  <SelectItem key={exam.value} value={exam.value}>
                    {exam.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <FieldError errors={[errors.exam]} />
      </Field>
      <Button type="submit" size="lg" disabled={submitting} className="h-11 w-full">
        <SendIcon data-icon="inline-start" />
        {submitting ? "Gönderiliyor…" : "Talebi gönder"}
      </Button>
      <BackButton onBack={onBack} />
    </form>
  );
}

function JoinedScreen() {
  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-success/10">
        <CircleCheckIcon className="size-7 text-success" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-heading text-lg font-semibold">
          Talebin bize ulaştı 🎉
        </h3>
        <p className="max-w-sm text-sm text-pretty text-muted-foreground">
          Teşekkürler! Koçun kısa süre içinde WhatsApp&apos;tan dönüş yapacak.
        </p>
      </div>
    </div>
  );
}

function BackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mx-auto inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeftIcon className="size-4" />
      Farklı numara
    </button>
  );
}
