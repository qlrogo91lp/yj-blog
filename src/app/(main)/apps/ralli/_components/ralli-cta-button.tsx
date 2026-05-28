type Props = {
  appStoreUrl: string;
};

export function RalliCtaButton({ appStoreUrl }: Props) {
  if (appStoreUrl.trim().length > 0) {
    return (
      <a
        href={appStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center rounded-full bg-lime-400 px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-lime-300"
      >
        Download on the App Store
      </a>
    );
  }

  return (
    <span className="inline-flex items-center justify-center rounded-full border border-lime-400/40 px-6 py-3 text-sm font-semibold text-lime-400">
      Coming soon to the App Store
    </span>
  );
}
