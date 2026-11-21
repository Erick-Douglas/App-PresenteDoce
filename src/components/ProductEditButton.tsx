import { SquarePen } from "lucide-react";
import type { Product } from "../config/types";

export function ProductEditButton({
  product,
  onEdit,
  overlay = false,
}: {
  product: Pick<Product, "id" | "name">;
  onEdit?: (id: string) => void;
  overlay?: boolean;
}) {
  if (!onEdit) return null;

  return (
    <button
      type="button"
      aria-label={"Editar produto " + product.name}
      onClick={(event) => {
        event.stopPropagation();
        onEdit(product.id);
      }}
      className={overlay ? "catalog-edit-overlay" : "ui-edit-action"}
    >
      <SquarePen size={21} strokeWidth={1.65} aria-hidden="true" />{" "}
      {!overlay && "Editar"}
    </button>
  );
}
