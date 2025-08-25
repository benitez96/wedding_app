import { FC, PropsWithChildren } from "react";

type SectionContainerProps = PropsWithChildren & {
  className?: string;
}

export const SectionContainer: FC<SectionContainerProps> = ({ children, className }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-4 gap-2 ${className}`}>
      {children}
    </div>
  );
};