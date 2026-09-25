"use client";

import { useState, type FormEvent } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { STAFF_ROLES, CITIES, type StaffRole, type City } from "@/lib/constants";

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand focus:outline-none dark:border-zinc-700 dark:bg-zinc-900";

interface InitialValues {
  username: string;
  email: string;
  name: string;
  role: StaffRole;
  city: City;
}

export function EditUserForm({ userId, initialValues }: { userId: string; initialValues: InitialValues }) {
  const router = useRouter();
  const [username, setUsername] = useState(initialValues.username);
  const [email, setEmail] = useState(initialValues.email);
  const [password, setPassword] = useState("");
  const [name, setName] = useState(initialValues.name);
  const [role, setRole] = useState<StaffRole>(initialValues.role);
  const [city, setCity] = useState<City>(initialValues.city);

  const updateUser = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          name,
          role,
          city,
          ...(password ? { password } : {}),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update user");
      }
      return response.json();
    },
    onSuccess: () => {
      toast.success("User updated");
      router.push("/users");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    updateUser.mutate();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
      <div>
        <label className="mb-1 block text-sm font-medium">Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Username</label>
        <input value={username} onChange={(e) => setUsername(e.target.value)} required className={inputClass} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">New password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          placeholder="Leave blank to keep current password"
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Role</label>
        <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={inputClass}>
          {STAFF_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">City</label>
        <select value={city} onChange={(e) => setCity(e.target.value as City)} className={inputClass}>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={updateUser.isPending}
        className="rounded-md bg-brand px-6 py-2.5 text-sm font-medium text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {updateUser.isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
