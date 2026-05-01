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
          <div className="text-[10px] uppercase tracking-[0
