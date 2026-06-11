import { getServerSession } from "next-auth";
import { LogoutButton } from "./logout-button";

export async function Header() {
  // Puxa a sessão ativa do NextAuth
  const session = await getServerSession();

  // Pega a primeira letra do nome para o avatar (ex: Diego -> D)
  const initial = session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10">
      <div>
        <h2 className="text-sm text-text-soft font-medium">Bem-vindo de volta!</h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right hidden md:block">
          {/* Mostra o nome real do banco de dados */}
          <p className="text-sm font-semibold text-text-main">{session?.user?.name || "Usuário"}</p>
          <p className="text-xs text-text-soft">{session?.user?.email}</p>
        </div>

        {/* Avatar Dinâmico */}
        <div className="w-10 h-10 rounded-full bg-tecnasa-primary text-tecnasa-accent flex items-center justify-center font-bold shadow-sm">
          {initial}
        </div>

        {/* Linha divisória */}
        <div className="h-8 w-px bg-gray-200 mx-2"></div>

        {/* Botão de Sair */}
        <LogoutButton />
      </div>
    </header>
  );
}