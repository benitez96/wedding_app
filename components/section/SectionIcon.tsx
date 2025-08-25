import { FC, PropsWithChildren } from "react";


export const SectionIcon: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {children}
    </div>
  );
};