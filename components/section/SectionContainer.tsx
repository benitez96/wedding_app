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
        "flex flex-col items-center justify-center p-4 gap-2",
        styles.container,
        className,
      )}
    >
      {children}
    </div>
  );
};
