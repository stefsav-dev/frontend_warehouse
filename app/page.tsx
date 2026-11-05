"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Package2, Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLoginMutation } from "@/hooks/use-auth-query";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginMutation = useLoginMutation();
  const isSubmitting = loginMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      setErrorMessage("Username dan password wajib diisi.");
      return;
    }

    loginMutation.mutate(
      { username: cleanUsername, password },
      {
        onSuccess: (res) => {
          if (res.success && res.data) {
            if (res.data.user.role === "ADMIN") {
              router.push("/admin");
            } else {
              router.push("/operator");
            }
          } else {
            setErrorMessage(res.message || "Username atau password salah.");
          }
        },
        onError: (err: Error) => {
          setErrorMessage(
            err.message || "Gagal menghubungi server. Pastikan backend aktif."
          );
        },
      }
    );
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm space-y-6">
        {/* Brand / Logo Sederhana */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-10 w-10 rounded-lg bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shadow-xs">
            <Package2 className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Warehouse App
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sistem Manajemen Pergudangan & Barang Masuk
          </p>
        </div>

        {/* Card Login Shadcn */}
        <Card className="border-zinc-200 shadow-xs dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
              Masuk
            </CardTitle>
            <CardDescription className="text-xs text-zinc-500 dark:text-zinc-400">
              Masukkan akun untuk mengakses modul gudang.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Pesan Error */}
            {errorMessage && (
              <Alert variant="destructive" className="py-2.5 text-xs">
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            {/* Form Login Sederhana */}
            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="username" className="text-xs font-normal">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isSubmitting}
                  className="h-9 text-sm"
                  autoComplete="username"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-xs font-normal">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting}
                    className="h-9 text-sm pr-9"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    tabIndex={-1}
                    title={showPassword ? "Sembunyikan password" : "Lihat password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full h-9 text-xs font-medium mt-1 cursor-pointer"
                disabled={isSubmitting}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    <span>Memproses...</span>
                  </>
                ) : (
                  <span>Masuk</span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
