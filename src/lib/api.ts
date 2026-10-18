import { createClient } from "@supabase/supabase-js";
const url = import.meta.env.VITE_SUPABASE_URL,
  key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const configured = Boolean(url && key);
export const supabase = createClient(
  url || "https://unconfigured.supabase.co",
  key || "unconfigured",
  {
    auth: {
      flowType: "pkce",
      storageKey: "norieco-marketplace-auth-v1",
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
export async function rpc<T>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!configured)
    throw new Error(
      "O marketplace ainda não está conectado. Tente novamente mais tarde.",
    );
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    if (error.code === "PGRST202" || error.code === "42P01")
      throw new Error("Estamos preparando o marketplace. Volte em breve.");
    if (["23514", "23502", "22P02"].includes(error.code))
      throw new Error(
        "Confira os dados e os campos obrigatórios antes de continuar.",
      );
    if (error.code === "23505")
      throw new Error(
        "Este cadastro já está vinculado. Consulte seu perfil ou o suporte.",
      );
    throw new Error(
      error.code === "P0001"
        ? error.message
        : "Não foi possível concluir. Confira sua conexão e tente novamente.",
    );
  }
  return data as T;
}
export async function upload(file: File, businessId: string, kind: string) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Entre para enviar arquivos.");
  const privateFile = ["identity", "proof"].includes(kind);
  if (
    file.size > 5 * 1024 * 1024 ||
    !(
      privateFile
        ? ["image/jpeg", "image/png", "application/pdf"]
        : ["image/jpeg", "image/png", "image/webp"]
    ).includes(file.type)
  )
    throw new Error(
      "Use JPG, PNG ou PDF de até 5 MB para documentos; imagens aceitam também WebP.",
    );
  const ext = file.type === "application/pdf" ? "pdf" : file.type.split("/")[1];
  const path = `${user.id}/${businessId}/${kind}-${crypto.randomUUID()}.${ext}`;
  const bucket = privateFile
    ? "marketplace-verifications"
    : "marketplace-images";
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false });
  if (error) throw new Error(error.message);
  return privateFile
    ? path
    : supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
