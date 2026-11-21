import { AvatarButton } from "../features/account/AccountProvider";
import { Menu } from "lucide-react";
import { BUSINESS_INFO } from "../config/constants";
import { useStore } from "../features/platform/StoreProvider";
import { imageUrl } from "../features/products/catalogApi";

interface HeaderProps {
  onOpenMenu: () => void;
  showShare?: boolean;
}

export function Header({ onOpenMenu, showShare = true }: HeaderProps) {
  const { store } = useStore();
  return (
    <header className="relative text-on-strong">
      <div
        className={
          "page-width grid grid-cols-[2.75rem_1fr_2.75rem] items-center " +
          (showShare ? "min-h-24 pt-3 sm:min-h-28" : "min-h-18")
        }
      >
        <AvatarButton />
        <img
          src={imageUrl(store.logo_url)}
          alt={BUSINESS_INFO.name}
          width={1176}
          height={521}
          className={"mx-auto h-auto " + (showShare ? "w-36 sm:w-40" : "w-28")}
        />
        <button
          type="button"
          aria-label="Abrir menu"
          onClick={onOpenMenu}
          className="store-icon-action masthead-menu"
        >
          <Menu size={21} strokeWidth={1.6} aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
