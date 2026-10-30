import type { SoftwareProject } from '@/features/projects/data/projects-page-content';

type ProjectDetailsProps = {
  project: SoftwareProject;
  isExpanded: boolean;
};

export function ProjectDetails({ project, isExpanded }: ProjectDetailsProps) {
  const labels = {
    summary: 'Project Overview',
    details: 'Key Details',
    technologies: 'Capability Areas',
    subject: 'Client',
    methods: 'Delivery Signals',
    ...project.labels,
  };

  return (
    <div className="grid gap-4 sm:gap-6">
      <section className="rounded-(--np-radius-lg) border border-white/10 bg-background/35 p-4 sm:p-8">
        <h3 className="text-lg font-medium text-foreground">
          {labels.summary}
        </h3>
        <p className="mt-3 text-sm leading-7 text-muted-foreground sm:mt-4 sm:text-base">
          {project.summary}
        </p>
        {isExpanded ? (
          <>
            <h4 className="mt-5 text-base font-medium text-foreground sm:mt-7">
              {labels.details}
            </h4>
            <ul className="mt-3 grid gap-1.5 text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-base">
              {project.details.map((item) => (
                <li
                  key={item}
                  className="before:mr-2 before:text-foreground before:content-['•']"
                >
                  {item}
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      {isExpanded ? (
        <>
          {/* gap-px + bg-white/10 on the parent draws the divider lines — avoids per-item border logic across column counts */}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-(--np-radius-lg) border border-white/10 bg-white/10 lg:grid-cols-4">
            {project.meta.map((item) => (
              <div
                key={item.label}
                className="bg-(--np-surface) p-4 sm:p-5"
              >
                <dt className="text-sm text-(--np-subtle)">{item.label}</dt>
                <dd className="mt-2 text-base font-medium text-foreground">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>

          <section className="flex flex-col gap-4 rounded-(--np-radius-lg) border border-white/10 bg-background/35 p-4 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
            <h3 className="shrink-0 text-base font-medium text-foreground">
              {labels.technologies}
            </h3>
            <div className="flex flex-wrap gap-3">
              {project.technologies.map((technology) => {
                const Icon = technology.icon;

                return (
                  <span
                    key={technology.label}
                    className="np-focus inline-flex size-11 items-center justify-center rounded-full border border-white/10 bg-white/4 text-foreground"
                    title={technology.label}
                    aria-label={technology.label}
                  >
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                );
              })}
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-(--np-radius-lg) border border-white/20 bg-background/35 p-4 sm:flex-row sm:items-center sm:gap-4 sm:p-8">
            <h3 className="shrink-0 text-base font-medium text-foreground">
              {labels.subject}
            </h3>
            <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-white/20 bg-(--np-blue-soft) text-sm font-semibold text-foreground">
              {project.subjectInitials}
            </span>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              {project.subject}
            </p>
          </section>

          <section className="rounded-(--np-radius-lg) border border-white/10 bg-background/35 p-4 sm:p-8">
            <h3 className="text-lg font-medium text-foreground">
              {labels.methods}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-(--np-radius-md) border border-white/10 p-2.5 sm:mt-6 sm:grid-cols-3 sm:gap-4 sm:p-4">
              {project.methods.map((method) => (
                <span
                  key={method}
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-white/2.5 px-3 text-center text-xs font-medium leading-5 text-foreground sm:min-h-11 sm:px-5 sm:text-sm"
                >
                  {method}
                </span>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}
