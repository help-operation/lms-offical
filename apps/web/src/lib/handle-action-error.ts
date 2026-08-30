import { FieldValues, Path, UseFormSetError } from "react-hook-form";
import { toast } from "@repo/ui/sonner";
import { FieldError } from "@/lib/api-client";

export function handleActionError<T extends FieldValues>(
  result: { message: string; errors: FieldError[] | null },
  setError: UseFormSetError<T>,
): void {
  if (result.errors && result.errors.length > 0) {
    result.errors.forEach(({ field, message }) => {
      setError(field as Path<T>, { message });
    });
    return;
  }

  toast.error(result.message);
}
