import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: Props) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1600px] px-4 pb-20 pt-5 md:px-6 md:pb-20 md:pt-6",
        className,
      )}
    >
      {children}
    </div>
  );
}
