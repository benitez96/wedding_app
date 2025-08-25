import { FC, PropsWithChildren } from "react";

type SectionDescriptionProps = {
  isDecorative?: boolean;  
  className?: string;
}

export const SectionDescription: FC<PropsWithChildren<SectionDescriptionProps>> = ({ children, isDecorative = false, className }) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${isDecorative ? 'font-decorative text-2xl' : ''} ${className}`}>
      {children}
    </div>
  );
};