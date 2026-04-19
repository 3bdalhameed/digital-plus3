export default function TicketDetailPage({ params }: { params: { ticketId: string } }) {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-black text-brand-800">تذكرة #{params.ticketId}</h1>
      <div className="brand-card mt-4 py-12 text-center">
        <p className="text-gray-500">قيد التطوير — المرحلة الثانية</p>
      </div>
    </div>
  );
}
