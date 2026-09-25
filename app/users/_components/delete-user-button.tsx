"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export function DeleteUserButton({ userId, username }: { userId: string; username: string }) {
  const router = useRouter();

  const deleteUser = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/users/${userId}`, { method: "DELETE" });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to delete user");
      }
    },
    onSuccess: () => {
      toast.success("User deleted");
      router.refresh();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function handleClick() {
    if (window.confirm(`Delete user "${username}"? This cannot be undone.`)) {
      deleteUser.mutate();
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={deleteUser.isPending}
      className="text-sm text-red-600 hover:underline disabled:opacity-60"
    >
      {deleteUser.isPending ? "Deleting…" : "Delete"}
    </button>
  );
}
