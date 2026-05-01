import { useState } from "react";
import { supabase } from "../lib/supabase";

type AuthScreenProps = {
  onAuthSuccess: () => void;
};

export function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async () => {
    setLoading(true);
    setMessage("");

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    setLoading(false);

    if (result.error) {
      setMessage(result.error.message);
      return;
    }

    onAuthSuccess();
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4 text-white">
      <div className="w-full max-w-sm rounded-3xl border border-neutral-800 bg-[#0b0f14] p-5 shadow-2xl">
        <div className="mb-5">
          <div className="text-sm font-bold tracking-wide">Aplicación de póker Nico</div>
          <div className="text-[10px] uppercase tracking-[0.24em] text-amber-300/80">
            Acceso privado
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
            <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
              Correo electrónico
            </div>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1 w-full border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
              placeholder="tu@email.com"
              type="email"
            />
          </div>

          <div className="rounded-xl border border-neutral-700 bg-black/25 p-2">
            <div className="text-[10px] uppercase tracking-[0.22em] text-neutral-400">
              Contraseña
            </div>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1 w-full border-neutral-700 bg-neutral-900 px-2 py-1 text-white"
              placeholder="Contraseña"
              type="password"
            />
          </div>

          {message && (
            <div className="rounded-xl border border-red-700 bg-red-950/40 p-2 text-sm text-red-300">
              {message}
            </div>
          )}

          <button
            onClick={submit}
            disabled={loading}
            className="w-full rounded-xl border border-emerald-500 bg-emerald-700 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-60"
          >
            {loading ? "Procesando..." : mode === "login" ? "Ingresar" : "Crear cuenta"}
          </button>

          <button
            onClick={() => {
              setMode((current) => (current === "login" ? "signup" : "login"));
              setMessage("");
            }}
            className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-semibold text-neutral-200 transition hover:bg-neutral-800"
          >
            {mode === "login" ? "Crear una cuenta nueva" : "Ya tengo cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}
