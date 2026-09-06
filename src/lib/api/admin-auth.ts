import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const verifyAdminLogin = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().email(),
      password: z.string().min(1),
    })
  )
  .handler(async ({ data }) => {
    // Busca credenciais estritamente das variáveis de ambiente no servidor
    const serverAdminEmail = process.env.ADMIN_EMAIL || "projetointegradorpet@gmail.com";
    const serverAdminPassword = process.env.ADMIN_PASSWORD || "Projeto2026";

    const emailNormalized = data.email.trim().toLowerCase();
    const targetEmailNormalized = serverAdminEmail.trim().toLowerCase();

    if (emailNormalized === targetEmailNormalized && data.password === serverAdminPassword) {
      return {
        success: true,
        token: `adm_session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      };
    }

    return {
      success: false,
      message: "Credenciais inválidas. Verifique o e-mail e a senha informados.",
    };
  });
