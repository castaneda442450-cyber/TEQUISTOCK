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

// ─── Colores exactos del Cloud Design ────────────────────────────────────────
const C = {
  terracota:     "#BA3026",
  terracotaDark: "#8F221A",
  navy:          "#0B4455",
  darkGreen:     "#0D4B43",
  surface:       "#FFFFFF",
  border:        "#E8E2DA",
  textMain:      "#1C1714",
  textSub:       "#7A7068",
  textMuted:     "#B0A89E",
};

// ─── Input reutilizable ───────────────────────────────────────────────────────
function Field({
  id, label, type, placeholder, icon: Icon, error, reg, right,
}: {
  id: string; label: string; type: string; placeholder: string;
  icon: React.ElementType; error?: string; reg: object; right?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? "#EF4444" : focused ? C.terracota : C.border;
  const shadow = focused && !error ? `0 0 0 3px ${C.terracota}22` : "none";

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.textSub, marginBottom: 5 }}>
        {label}
      </div>
      <div style={{ position: "relative" }}>
        <Icon
          size={15}
          style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: C.textMuted, pointerEvents: "none" }}
        />
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          {...reg}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            boxSizing: "border-box",
            height: 42,
            paddingLeft: 36,
            paddingRight: right ? 40 : 12,
            borderRadius: 8,
            border: `1.5px solid ${borderColor}`,
            boxShadow: shadow,
            outline: "none",
            fontSize: 14,
            color: C.textMain,
            background: C.surface,
            transition: "border-color 0.15s, box-shadow 0.15s",
            fontFamily: "inherit",
          }}
        />
        {right && (
          <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)" }}>
            {right}
          </span>
        )}
      </div>
      {error && <div style={{ fontSize: 11, color: "#EF4444", marginTop: 4 }}>{error}</div>}
    </div>
  );
}

// ─── Formulario Login ─────────────────────────────────────────────────────────
function LoginForm() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hover, setHover] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
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
      <Field id="username" label="Usuario" type="text"
        placeholder="Tu usuario" icon={User}
        error={errors.username?.message} reg={register("username")} />

      <Field id="password" label="Contraseña" type={showPass ? "text" : "password"}
        placeholder="••••••••" icon={Lock}
        error={errors.password?.message} reg={register("password")}
        right={
          <button type="button" onClick={() => setShowPass(p => !p)}
            style={{ background: "none", border: "none", cursor: "pointer", color: C.textMuted, display: "flex", padding: 0 }}>
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        }
      />

      <div style={{ marginTop: 8 }}>
        <button
          type="submit"
          disabled={loading}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{
            width: "100%", height: 46, borderRadius: 8, border: "none",
            background: hover && !loading ? C.terracotaDark : C.terracota,
            color: "#fff", fontSize: 14, fontWeight: 700,
            cursor: loading ? "wait" : "pointer", fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            transition: "background 0.15s",
          }}
        >
          {loading ? (
            <>
              <span style={{
                width: 16, height: 16, border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff", borderRadius: "50%",
                animation: "spin 0.7s linear infinite", display: "inline-block",
              }} />
              Iniciando sesión...
            </>
          ) : "Iniciar Sesión"}
        </button>
      </div>
    </form>
  );
}

// ─── Página ───────────────────────────────────────────────────────────────────
export default function LoginPage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundImage: "url('/imagenLogin.png')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Capa oscura sutil para mejorar contraste del card */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "linear-gradient(135deg, rgba(11,68,85,0.55) 0%, rgba(13,75,67,0.45) 50%, rgba(0,0,0,0.45) 100%)",
        zIndex: 0,
      }} />

      {/* Card */}
      <div style={{
        background: C.surface,
        borderRadius: 16,
        padding: "44px 40px",
        width: "100%",
        maxWidth: 420,
        margin: "0 16px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.28)",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <Image
            src="/logo.png"
            alt="TequiStock"
            width={80}
            height={80}
            style={{ borderRadius: 12, margin: "0 auto 12px", display: "block", objectFit: "cover" }}
          />
          <div style={{ fontSize: 22, fontWeight: 800, color: C.textMain, letterSpacing: 1 }}>
            TEQUISTOCK
          </div>
          <div style={{ fontSize: 13, color: C.textSub, marginTop: 4 }}>
            Control de Inventarios
          </div>
        </div>

        {/* Formulario de Login (acceso restringido a un único usuario) */}
        <LoginForm />
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
