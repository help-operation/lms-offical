export default function PaymentManagementLoading() {
  return (
    <div className="space-y-6 p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-64" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-9 bg-gray-200 rounded-lg w-24" />
        ))}
      </div>
      <div className="h-10 bg-gray-200 rounded-lg" />
      <div className="h-96 bg-gray-200 rounded-xl" />
    </div>
  );
}
