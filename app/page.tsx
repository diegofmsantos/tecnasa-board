import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/sidebar";
import { Header } from "@/components/header";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateCompanyModal } from "@/components/create-company-modal";

export default async function Home() {
  const companies = await prisma.company.findMany({
    orderBy: { createdAt: "desc" },
    include: { sectors: true }
  });

  return (
    <div className="min-h-screen bg-neutral-bg text-text-main">
      <Sidebar />
      <Header />

      <main className="pl-72 pt-24 pr-8 pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-dark-primary">Empresas / Clientes</h1>
            <p className="text-text-soft text-sm">Gerencie os clientes e suas estruturas na Tecnasa.</p>
          </div>

          {/* Nosso novo botão de criar empresa */}
          <CreateCompanyModal />
        </div>

        {companies.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl h-[400px] flex flex-col items-center justify-center text-text-soft gap-4">
            <Building2 className="h-12 w-12 opacity-50" />
            <p>Nenhuma empresa cadastrada. Clique em "Nova Empresa" para começar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <Link href={`/company/${company.id}`} key={company.id}>
                <Card className="hover:shadow-lg transition-shadow border-white/50 bg-white cursor-pointer h-full border-2 hover:border-tecnasa-accent">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center bg-gray-400">
                        {company.logoUrl ? (
                          <img
                            src={company.logoUrl}
                            alt={`Logo ${company.name}`}
                            className="w-full h-full object-contain p-0.5"
                          />
                        ) : (
                          <Building2 className="h-5 w-5 text-tecnasa-primary" />
                        )}
                      </div>
                      <CardTitle className="text-lg font-bold text-dark-primary">
                        {company.name}
                      </CardTitle>
                    </div>
                    <p className="text-sm text-text-soft mt-2 font-medium">
                      {company.sectors.length} setor(es) cadastrado(s)
                    </p>
                  </CardHeader>
                  <CardFooter className="pt-2 text-xs text-text-soft border-t border-gray-100 mt-4">
                    Cadastrada em {format(company.createdAt, "dd 'de' MMMM", { locale: ptBR })}
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}