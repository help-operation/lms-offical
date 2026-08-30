// Remove the default p-6 padding and make the editor fill the full available height
export default function EditPostLayout({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col flex-1 min-h-0 -m-6">{children}</div>;
}
