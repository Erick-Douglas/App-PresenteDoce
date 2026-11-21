import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type FormEvent,
} from "react";
import { UserRound, Camera, Moon, Sun, Monitor, RefreshCw } from "lucide-react";
import { StoreDialog } from "../../components/StoreDialog";
import { useAppearance } from "../appearance/AppearanceProvider";
import {
  getProfile,
  saveProfile,
  profileImage,
  profileName,
  type AccountProfile,
} from "./profile";
import { validateProductImage } from "../products/productImage";
const Context = createContext<{
  user: AccountProfile | null;
  openAccount: () => void;
} | null>(null);
export function AvatarButton() {
  const account = useContext(Context);
  const [broken, setBroken] = useState("");
  const src = profileImage(account?.user ?? null);
  return (
    <button
      type="button"
      className="account-avatar"
      aria-label={account?.user ? "O meu perfil" : "Perfil e aparência"}
      onClick={account?.openAccount}
    >
      {src && src !== broken ? (
        <img
          src={src}
          alt="Foto do seu perfil"
          referrerPolicy="no-referrer"
          onError={() => setBroken(src)}
        />
      ) : (
        <UserRound size={22} strokeWidth={1.5} aria-hidden="true" />
      )}
    </button>
  );
}
export function useAccount() {
  return useContext(Context);
}
function AppearanceChoices() {
  const { choice, setChoice } = useAppearance();
  return (
    <section className="ui-glass-panel space-y-3">
      <div>
        <h3 className="type-item">Aparência</h3>
        <p className="text-xs text-muted mt-1">
          Escolha o tema ou acompanhe o seu dispositivo.
        </p>
      </div>
      <div
        role="group"
        aria-label="Tema do aplicativo"
        className="appearance-choices"
      >
        {(
          [
            { value: "light", label: "Claro", icon: Sun },
            { value: "dark", label: "Escuro", icon: Moon },
            { value: "system", label: "Sistema", icon: Monitor },
          ] as const
        ).map(({ value, label, icon: Icon }) => (
          <button
            type="button"
            key={value}
            aria-pressed={choice === value}
            className="ui-secondary"
            onClick={() => setChoice(value)}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
function ProfileEditor({
  user,
  token,
  onSaved,
}: {
  user: AccountProfile;
  token: string;
  onSaved: (user: AccountProfile) => void;
}) {
  const [name, setName] = useState(() => profileName(user)),
    [file, setFile] = useState<File | null>(null),
    [remove, setRemove] = useState(false),
    [preview, setPreview] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  useEffect(() => {
    if (!file) {
      setPreview("");
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      onSaved(await saveProfile(user, name, file, remove, token));
      setFile(null);
      setRemove(false);
      setNotice("Perfil atualizado.");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível guardar o perfil.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="ui-glass-panel space-y-4" onSubmit={submit}>
      <fieldset disabled={busy} className="space-y-4">
        <div className="profile-photo-preview">
          {preview || (!remove && profileImage(user)) ? (
            <img
              src={preview || profileImage(user)}
              alt="Fotografia do perfil"
            />
          ) : (
            <UserRound size={40} strokeWidth={1.4} />
          )}
        </div>
        <label className="module-field">
          <span>Fotografia de perfil</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="ui-field"
            onChange={(e) => {
              const selected = e.target.files?.[0];
              if (!selected) return;
              try {
                validateProductImage(selected);
                setFile(selected);
                setRemove(false);
                setError("");
                setNotice("");
              } catch (err) {
                setError(
                  err instanceof Error ? err.message : "Imagem inválida.",
                );
                e.target.value = "";
              }
            }}
          />
        </label>
        <p className="text-xs text-muted">
          A foto fica vinculada à sua conta. JPG, PNG, WebP ou HEIC; otimização
          automática antes do envio.
        </p>
        <label className="module-field">
          <span>Nome do perfil</span>
          <input
            className="ui-field"
            maxLength={60}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <div className="form-actions">
          {(file || profileImage(user)) && (
            <button
              type="button"
              className="ui-secondary"
              onClick={() => {
                setFile(null);
                setRemove(true);
                setNotice("");
              }}
            >
              Remover fotografia
            </button>
          )}
          <button type="submit" className="ui-primary">
            <Camera size={16} />
            {busy ? "A guardar…" : "Guardar perfil"}
          </button>
        </div>
      </fieldset>
      {error && (
        <p role="alert" className="module-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="form-notice">
          {notice}
        </p>
      )}
    </form>
  );
}
export function AccountProvider({
  token,
  open,
  onOpenChange,
  onLogin,
  children,
}: {
  token?: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onLogin: () => void;
  children: ReactNode;
}) {
  const [loaded, setLoaded] = useState<{
      token: string;
      user: AccountProfile;
    } | null>(null),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!token) {
      setLoaded(null);
      setError("");
      return;
    }
    const c = new AbortController();
    getProfile(token, c.signal)
      .then((user) => {
        if (!c.signal.aborted) {
          setLoaded({ token, user });
          setError("");
        }
      })
      .catch(() => {
        if (!c.signal.aborted)
          setError("Não foi possível carregar o perfil. Tente novamente.");
      });
    return () => c.abort();
  }, [token, attempt]);
  const user = token && loaded?.token === token ? loaded.user : null;
  return (
    <Context.Provider value={{ user, openAccount: () => onOpenChange(true) }}>
      {children}
      {open && (
        <StoreDialog
          title={token ? "O meu perfil" : "Perfil e aparência"}
          onClose={() => onOpenChange(false)}
        >
          <div className="space-y-4">
            {token ? (
              user ? (
                <ProfileEditor
                  user={user}
                  token={token}
                  onSaved={(value) => setLoaded({ token, user: value })}
                />
              ) : (
                <div className="ui-glass-panel">
                  <p role={error ? "alert" : "status"}>
                    {error || "A carregar o perfil…"}
                  </p>
                  {error && (
                    <button
                      type="button"
                      className="ui-secondary mt-3"
                      onClick={() => setAttempt((n) => n + 1)}
                    >
                      <RefreshCw size={15} />
                      Tentar novamente
                    </button>
                  )}
                </div>
              )
            ) : (
              <section className="ui-glass-panel space-y-3">
                <UserRound size={32} strokeWidth={1.4} />
                <div>
                  <h3 className="type-item">O seu espaço na Presente Doce</h3>
                  <p className="text-sm text-muted mt-1">
                    Entre com a sua conta para escolher a fotografia do perfil.
                  </p>
                </div>
                <div className="form-actions">
                  <button
                    className="ui-primary"
                    type="button"
                    onClick={() => {
                      onOpenChange(false);
                      onLogin();
                    }}
                  >
                    Entrar na conta
                  </button>
                </div>
              </section>
            )}
            <AppearanceChoices />
          </div>
        </StoreDialog>
      )}
    </Context.Provider>
  );
}
