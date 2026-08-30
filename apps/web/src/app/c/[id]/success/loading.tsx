export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
        <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 animate-pulse" />
        <div className="mt-5 h-6 w-3/4 mx-auto rounded bg-gray-100 animate-pulse" />
        <div className="mt-3 h-4 w-full rounded bg-gray-100 animate-pulse" />
      </div>
    </div>
  );
}
