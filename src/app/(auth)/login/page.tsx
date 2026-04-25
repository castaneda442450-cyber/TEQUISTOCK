"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { signIn } from "@/lib/actions/auth.actions";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth.schema";

export default function LoginPage() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
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
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0B4455 0%, #0D4B43 60%, #BA302688 100%)",
      }}
    >
      {/* SVG Geometric Pattern */}
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ opacity: 0.05 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="geo" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <polygon
              points="30,0 60,30 30,60 0,30"
              fill="none"
              stroke="white"
              strokeWidth="1"
            />
            <circle cx="30" cy="30" r="8" fill="none" stroke="white" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#geo)" />
      </svg>

      {/* Card */}
      <div
        className="relative z-10 w-full mx-4"
        style={{
          maxWidth: 420,
          background: "hsl(var(--surface))",
          borderRadius: 16,
          padding: "44px 40px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="TequiStock"
            width={80}
            height={80}
            className="rounded-xl mx-auto mb-3 object-cover"
          />
          <div
            className="text-[22px] font-extrabold tracking-widest uppercase"
            style={{ color: "hsl(var(--text-main))" }}
          >
            TEQUISTOCK
          </div>
          <div
            className="text-[13px] mt-1"
            style={{ color: "hsl(var(--text-sub))" }}
          >
            Control de Inventarios
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-[12px] font-semibold mb-1.5"
              style={{ color: "hsl(var(--text-sub))" }}
            >
              Correo Electrónico
            </label>
            <div className="relative">
              <User
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "hsl(var(--text-muted))" }}
              />
              <input
                id="email"
                type="email"
                placeholder="correo@restaurante.mx"
                {...register("email")}
                className="w-full rounded-lg border text-sm h-11 pl-9 pr-3 outline-none transition-all duration-150"
                style={{
                  background: "hsl(var(--surface))",
                  color: "hsl(var(--text-main))",
                  borderColor: errors.email
                    ? "#EF4444"
                    : "hsl(var(--border))",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--terracota))";
                  e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--terracota) / 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.email
                    ? "#EF4444"
                    : "hsl(var(--border))";
                  e.currentTarget.style.boxShadow = "";
                }}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password */}
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-[12px] font-semibold mb-1.5"
              style={{ color: "hsl(var(--text-sub))" }}
            >
              Contraseña
            </label>
            <div className="relative">
              <Lock
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                style={{ color: "hsl(var(--text-muted))" }}
              />
              <input
                id="password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                {...register("password")}
                className="w-full rounded-lg border text-sm h-11 pl-9 pr-10 outline-none transition-all duration-150"
                style={{
                  background: "hsl(var(--surface))",
                  color: "hsl(var(--text-main))",
                  borderColor: errors.password
                    ? "#EF4444"
                    : "hsl(var(--border))",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "hsl(var(--terracota))";
                  e.currentTarget.style.boxShadow = "0 0 0 3px hsl(var(--terracota) / 0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.password
                    ? "#EF4444"
                    : "hsl(var(--border))";
                  e.currentTarget.style.boxShadow = "";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPass((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
                style={{ color: "hsl(var(--text-muted))" }}
                aria-label={showPass ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] text-red-500">{errors.password.message}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 rounded-lg text-white text-[14px] font-bold flex items-center justify-center gap-2 transition-all duration-150"
            style={{
              background: "hsl(var(--terracota))",
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.85 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading)
                e.currentTarget.style.background = "hsl(var(--terracota-dark))";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "hsl(var(--terracota))";
            }}
          >
            {loading ? (
              <>
                <span
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin"
                  style={{ animationDuration: "0.7s" }}
                />
                Iniciando sesión...
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
