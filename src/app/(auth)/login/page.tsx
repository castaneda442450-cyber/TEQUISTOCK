"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, UserPlus } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { signIn, signUp } from "@/lib/actions/auth.actions";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "@/lib/schemas/auth.schema";

// ── Componente reutilizable para campos de input ──────────────────────────────
function InputField({
  id,
  label,
  type,
  placeholder,
  icon: Icon,
  error,
  registration,
  rightElement,
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  icon: React.ElementType;
  error?: string;
  registration: object;
  rightElement?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <label
        htmlFor={id}
        className="block text-[12px] font-semibold mb-1.5"
        style={{ color: "hsl(var(--text-sub))" }}
      >
        {label}
      </label>
      <div className="relative">
        <Icon
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: "hsl(var(--text-muted))" }}
        />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          {...registration}
          className="w-full rounded-lg border text-sm h-11 pl-9 pr-10 outline-none transition-all duration-150"
          style={{
            background: "hsl(var(--surface))",
            color: "hsl(var(--text-main))",
            borderColor: error ? "#EF4444" : "hsl(var(--border))",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "hsl(var(--terracota))";
            e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--terracota) / 0.15)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = error ? "#EF4444" : "hsl(var(--border))";
            e.currentTarget.style.boxShadow = "";
          }}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  );
}

// ── Botón de submit reutilizable ──────────────────────────────────────────────
function SubmitButton({ loading, label, loadingLabel }: { loading: boolean; label: string; loadingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full h-12 rounded-lg text-white text-[14px] font-bold flex items-center justify-center gap-2 transition-all duration-150 mt-2"
      style={{ background: "hsl(var(--terracota))", cursor: loading ? "wait" : "pointer", opacity: loading ? 0.85 : 1 }}
      onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "hsl(var(--terracota-dark))"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "hsl(var(--terracota))"; }}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" style={{ animationDuration: "0.7s" }} />
          {loadingLabel}
        </>
      ) : label}
    </button>
  );
}

// ── Formulario de Login ───────────────────────────────────────────────────────
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setLoading(true);
    try {
      const result = await signIn(data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast.error("Error inesperado. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <InputField
        id="login-email"
        label="Correo Electrónico"
        type="email"
        placeholder="correo@restaurante.mx"
        icon={Mail}
        error={errors.email?.message}
        registration={register("email")}
      />
      <InputField
        id="login-password"
        label="Contraseña"
        type={showPass ? "text" : "password"}
        placeholder="••••••••"
        icon={Lock}
        error={errors.password?.message}
        registration={register("password")}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPass((p) => !p)}
            className="hover:opacity-70 transition-opacity"
            style={{ color: "hsl(var(--text-muted))" }}
            aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
      />
      <SubmitButton loading={loading} label="Iniciar Sesión" loadingLabel="Iniciando sesión..." />
    </form>
  );
}

// ── Formulario de Registro ────────────────────────────────────────────────────
function RegisterForm({ onSuccess }: { onSuccess: () => void }) {
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const result = await signUp(data);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("¡Cuenta creada! Ya puedes iniciar sesión.");
        onSuccess();
      }
    } catch {
      toast.error("Error inesperado. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <InputField
        id="reg-email"
        label="Correo Electrónico"
        type="email"
        placeholder="correo@restaurante.mx"
        icon={Mail}
        error={errors.email?.message}
        registration={register("email")}
      />
      <InputField
        id="reg-password"
        label="Contraseña"
        type={showPass ? "text" : "password"}
        placeholder="Mínimo 6 caracteres"
        icon={Lock}
        error={errors.password?.message}
        registration={register("password")}
        rightElement={
          <button type="button" onClick={() => setShowPass((p) => !p)} className="hover:opacity-70 transition-opacity" style={{ color: "hsl(var(--text-muted))" }}>
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
      />
      <InputField
        id="reg-confirm"
        label="Confirmar Contraseña"
        type={showConfirm ? "text" : "password"}
        placeholder="Repite tu contraseña"
        icon={Lock}
        error={errors.confirmPassword?.message}
        registration={register("confirmPassword")}
        rightElement={
          <button type="button" onClick={() => setShowConfirm((p) => !p)} className="hover:opacity-70 transition-opacity" style={{ color: "hsl(var(--text-muted))" }}>
            {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
      />
      <SubmitButton loading={loading} label="Crear cuenta" loadingLabel="Creando cuenta..." />
    </form>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Foto del restaurante como fondo */}
      <Image
        src="/imagenLogin.png"
        alt="Tequila Mexican Restaurant"
        fill
        priority
        className="object-cover object-center"
        style={{ zIndex: 0 }}
      />

      {/* Overlay oscuro para legibilidad */}
      <div
        className="absolute inset-0"
        style={{ background: "rgba(0,0,0,0.58)", zIndex: 1 }}
      />

      {/* Card */}
      <div
        className="relative w-full mx-4"
        style={{
          zIndex: 2,
          maxWidth: 440,
          background: "hsl(var(--surface))",
          borderRadius: 16,
          padding: "40px 40px 36px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.40)",
        }}
      >
        {/* Logo + título */}
        <div className="text-center mb-6">
          <Image
            src="/logo.png"
            alt="TequiStock"
            width={72}
            height={72}
            className="rounded-xl mx-auto mb-3 object-cover"
          />
          <div
            className="text-[21px] font-extrabold tracking-widest uppercase"
            style={{ color: "hsl(var(--text-main))" }}
          >
            TEQUISTOCK
          </div>
          <div className="text-[12px] mt-0.5" style={{ color: "hsl(var(--text-sub))" }}>
            Control de Inventarios
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 rounded-lg" style={{ background: "hsl(var(--surface-alt))" }}>
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-[13px] font-semibold transition-all duration-200"
              style={{
                background: mode === m ? "hsl(var(--terracota))" : "transparent",
                color: mode === m ? "#fff" : "hsl(var(--text-sub))",
                boxShadow: mode === m ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
              }}
            >
              {m === "register" && <UserPlus size={13} />}
              {m === "login" ? "Iniciar Sesión" : "Registrarse"}
            </button>
          ))}
        </div>

        {/* Forms */}
        {mode === "login" ? (
          <LoginForm onSuccess={() => {}} />
        ) : (
          <RegisterForm onSuccess={() => setMode("login")} />
        )}
      </div>
    </div>
  );
}
