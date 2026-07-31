export const metadata = {
  title: "AV Workflow Admin",
  description: "Admin Editor",
  manifest: "/manifest-admin.json",
  appleWebApp: {
    capable: true,
    title: "AV Admin",
    statusBarStyle: "default",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}