import {
  request,
  prepareProductImage,
  avatarImageUrl,
} from "../products/catalogApi";
export type AccountProfile = {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
};
export function ownedAvatar(user: AccountProfile | null) {
  const value = user?.user_metadata?.avatar_path;
  return typeof value === "string" &&
    /^[a-f0-9-]{36}\/[a-f0-9-]{36}\.(jpg|webp)$/.test(value) &&
    value.split("/")[0] === user?.id
    ? value
    : "";
}
export function profileName(user: AccountProfile | null) {
  const n = user?.user_metadata?.display_name;
  return typeof n === "string" ? n.slice(0, 60) : "";
}
export function profileImage(user: AccountProfile | null) {
  const path = ownedAvatar(user);
  return path ? avatarImageUrl(path) : "";
}
export const getProfile = (token: string, signal?: AbortSignal) =>
  request<AccountProfile>("/auth/v1/user", { signal }, token);
async function removeFile(path: string, token: string) {
  await request(
    "/storage/v1/object/account-avatars/" + path,
    { method: "DELETE" },
    token,
  );
}
export async function saveProfile(
  user: AccountProfile,
  name: string,
  file: File | null,
  remove: boolean,
  token: string,
) {
  if (name.trim().length > 60) throw Error("Use até 60 caracteres no nome.");
  const old = ownedAvatar(user);
  let path = remove ? "" : old,
    newPath = "";
  if (file) {
    const blob = await prepareProductImage(file, 512);
    newPath =
      user.id +
      "/" +
      crypto.randomUUID() +
      (blob.type === "image/webp" ? ".webp" : ".jpg");
    await request(
      "/storage/v1/object/account-avatars/" + newPath,
      { method: "POST", headers: { "Content-Type": blob.type }, body: blob },
      token,
    );
    path = newPath;
  }
  let saved: AccountProfile;
  try {
    saved = await request<AccountProfile>(
      "/auth/v1/user",
      {
        method: "PUT",
        body: JSON.stringify({
          data: { display_name: name.trim(), avatar_path: path || null },
        }),
      },
      token,
    );
  } catch (e) {
    if (newPath) await removeFile(newPath, token).catch(() => {});
    throw e;
  }
  if (old && old !== path) await removeFile(old, token).catch(() => {});
  return saved;
}
