import { Link } from 'react-router-dom';
import { UserPlus, Stethoscope } from 'lucide-react';
import PageShell from '../ui/PageShell';
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
    <PageShell title="Administrator" description="Manage system accounts">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        {cards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group bg-surface border border-line rounded-lg p-6 hover:border-brand-600 transition-colors"
          >
            <card.icon size={20} className="text-ink-muted group-hover:text-ink transition-colors mb-4" />
            <h3 className="text-sm font-semibold tracking-[-0.01em] text-ink mb-1">{card.title}</h3>
            <p className="text-xs leading-relaxed text-ink-muted">{card.description}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  );
};

export default Administrator;
