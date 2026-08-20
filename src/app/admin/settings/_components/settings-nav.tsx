type Section = {
  id: string;
  label: string;
};

type Props = {
  sections: Section[];
};

export function SettingsNav({ sections }: Props) {
  return (
    <nav className="sticky top-8 hidden h-fit w-40 shrink-0 sm:block">
      <ul className="space-y-1">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              className="text-muted-foreground hover:text-foreground hover:bg-muted block rounded-md px-3 py-1.5 text-sm transition-colors"
            >
              {section.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
