import React from 'react';

const ServicesPage = () => {
    return (
        <section >
            <div className="mb-12">
                <span className="text-xs font-semibold text-ink-soft">
                    University Services
                </span>
                <h2 className="mt-3 text-2xl font-light tracking-[-0.02em] text-ink">
                    Guidance &amp; Counseling
                </h2>
                <p className="mt-2 max-w-[520px] text-sm leading-[1.7] text-ink-soft">
                    The University of Santo Tomas–Legazpi is committed to fostering a supportive campus environment. Explore
                    the services available to help you thrive academically, personally, and emotionally.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-line overflow-hidden rounded-lg">
                {SERVICE_CARDS.map((card) => (
                    <article
                        key={card.number}
                        className="group relative bg-surface p-8 cursor-default"
                    >
                        <span className="text-[13px] font-mono font-semibold text-ink-muted">
                            {card.number}
                        </span>
                        <h3 className="mt-4 text-sm font-semibold tracking-[-0.01em] text-ink-muted ">{card.title}</h3>
                        <p className="mt-3 text-xs leading-[1.8] text-ink-muted ">{card.description}</p>
                        <div className="mt-6 h-px w-8 bg-ink-muted group-hover:w-full group-hover:bg-ink-muted transition-all duration-300" />
                    </article>
                ))}
            </div>
        </section>
    );
};

export default ServicesPage;