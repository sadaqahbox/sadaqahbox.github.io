import { forwardRef } from "react";
import { NavLink } from "react-router-dom";

interface LinkProps {
  href: string;
  className?: string;
  children: React.ReactNode;
}

export const LinkComponent = forwardRef<HTMLAnchorElement, LinkProps>(
  function LinkComponent({ href, ...props }, ref) {
    return <NavLink ref={ref} to={href} {...props} />;
  }
);
