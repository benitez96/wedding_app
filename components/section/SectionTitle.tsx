import { FC, PropsWithChildren } from "react";

type SectionTitleProps = {
  isDecorative?: boolean;
  className?: string;
}

export const SectionTitle: FC<PropsWithChildren<SectionTitleProps>> = ({ children, isDecorative = false, className }) => {
  return (
    <h2 className={`text-2xl ${isDecorative ? 'font-decorative' : 'font-bold'} ${className}`}>{children}</h2>
  );
};