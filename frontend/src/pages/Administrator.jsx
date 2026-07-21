import { Link } from 'react-router-dom';
import { UserPlus, Stethoscope } from 'lucide-react';
import PageShell from '../components/PageShell';
import { PATHS } from '../lib/routes';

const cards = [
  {
    title: 'Register Student',
    description: 'Create a new student account for the mental health support system.',
    icon: UserPlus,
    to: PATHS.ADMIN_REGISTER_STUDENT,
  },
  {
    title: 'Register Counselor',
    description: 'Create a new counselor account to provide mental health services.',
    icon: Stethoscope,
    to: PATHS.ADMIN_REGISTER_COUNSELOR,
  },
];

const Administrator = () => {
  return (
    <PageShell title="Administrator" subtitle="Manage system accounts">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group bg-white border border-neutral-200 rounded-sm p-6 hover:border-neutral-900 transition-colors"
          >
            <card.icon size={20} className="text-neutral-400 group-hover:text-neutral-900 transition-colors mb-4" />
            <h3 className="text-sm font-semibold tracking-[-0.01em] text-neutral-900 mb-1">{card.title}</h3>
            <p className="text-xs leading-relaxed text-neutral-400">{card.description}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
};

export default Administrator;
