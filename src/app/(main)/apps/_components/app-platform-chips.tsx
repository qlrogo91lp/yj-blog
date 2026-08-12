import { Globe, LucideIcon, Smartphone, Watch } from 'lucide-react';
import type { AppPlatform } from '../_utils/apps-data';

const platformMeta: Record<AppPlatform, { label: string; Icon: LucideIcon }> = {
  ios: { label: 'iPhone', Icon: Smartphone },
  watch: { label: 'Watch', Icon: Watch },
  web: { label: 'Web', Icon: Globe },
};

type Props = {
  platforms: AppPlatform[];
};

export function AppPlatformChips({ platforms }: Props) {
  return (
    <ul className="flex flex-wrap gap-1.5">
      {platforms.map((platform) => {
        const { label, Icon } = platformMeta[platform];
        return (
          <li
            key={platform}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
          >
            <Icon size={12} />
            {label}
          </li>
        );
      })}
    </ul>
  );
}
