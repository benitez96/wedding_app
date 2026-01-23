import { FC, PropsWithChildren } from "react";
import clsx from "clsx";
import { getAlternateBgClasses } from "@/lib/section-styles";

type SectionContainerProps = PropsWithChildren & {
  className?: string;
  id?: string;
  hasAlternateBg?: boolean;
};

export const SectionContainer: FC<SectionContainerProps> = ({
  children,
  className,
  id,
  hasAlternateBg = false,
}) => {
  const styles = getAlternateBgClasses(hasAlternateBg);

  return (
    <div
      id={id}
      className={clsx(
        "relative flex flex-col items-center justify-center p-4 gap-2",
        styles.text, // Color de texto según hasAlternateBg
        className,
      )}
    >
      {/* Background layer (-z-10) */}
      {hasAlternateBg && (
        <div className={clsx("absolute inset-0 -z-10", styles.container)} />
      )}
      {/* Content layer (z-10) */}
      <div className="relative z-10 flex flex-col items-center justify-center gap-2 w-full">
        {children}
      </div>
    </div>
  );
};
