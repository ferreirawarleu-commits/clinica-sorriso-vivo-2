type FeatureCardProps = {
  icon: string;
  title: string;
  description: string;
};

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <article className="rounded-xl border border-gray-200 bg-white p-6 text-center transition-shadow hover:shadow-md">
      <div className="text-4xl" aria-hidden="true">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </article>
  );
}
