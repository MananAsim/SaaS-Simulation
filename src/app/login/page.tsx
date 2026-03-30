"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090b] text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-lg border border-zinc-800 bg-[#121214] p-6 shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-2 text-center text-white tracking-tight">SupportOS Login</h2>
        <p className="text-[13px] text-zinc-400 text-center mb-6 leading-relaxed px-2">
          Welcome to the SupportOS Beta! We are currently in active testing. 
          Please use the designated credentials below to log in and explore the platform.
        </p>

        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg p-3.5 mb-6 text-sm flex flex-col items-center gap-1">
          <span className="text-indigo-200 font-medium">agent@supportos.demo</span>
          <span className="text-indigo-300 font-mono text-xs">password123</span>
        </div>
        {error && (
          <div className="mb-4 text-sm text-red-500 text-center">{error}</div>
        )}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded bg-zinc-900 px-3 py-2 text-sm border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-1" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded bg-zinc-900 px-3 py-2 text-sm border border-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full rounded bg-blue-600 px-4 py-2 font-medium hover:bg-blue-700 transition"
        >
          Sign In
        </button>
      </form>
    </div>
  );
}
