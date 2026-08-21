type Props = {
  name: string;
};

export function CommentAvatar({ name }: Props) {
  const initial = name.trim() ? name.trim()[0].toUpperCase() : '?';

  return (
    <span
      aria-hidden="true"
      className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-medium"
    >
      {initial}
    </span>
  );
}
