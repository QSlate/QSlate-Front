export function EmptyState({ message }: { message: string }) {
  return (
    <div className="lab-empty" role="status">
      {message}
    </div>
  );
}
