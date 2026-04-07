// Auth pages (signin-school, signin-teacher, signup) render their own
// full-page layouts with background gradients. This layout is a transparent
// passthrough to avoid double-wrapping.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
