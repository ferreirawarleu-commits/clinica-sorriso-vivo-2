import { FeatureCard } from "@/components/ui/featureCard";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          Clínica Sorriso Vivo
        </h1>
        <p className="mt-3 text-center text-gray-500">
          Cuidado odontológico com conforto e confiança.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="🦷"
            title="Odontologia geral"
            description="Consultas, limpeza e tratamentos para manter seu sorriso saudável."
          />
          <FeatureCard
            icon="✨"
            title="Estética dental"
            description="Clareamento e restaurações para um sorriso mais bonito e natural."
          />
          <FeatureCard
            icon="📅"
            title="Agendamento fácil"
            description="Marque horários com praticidade e acompanhe seus atendimentos."
          />
        </div>
      </div>
    </main>
  );
}
