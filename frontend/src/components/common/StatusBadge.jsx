const STYLES = {
  active: "bg-green-100 text-green-700",
  blocked: "bg-red-100 text-red-600",
  verified: "bg-blue-100 text-blue-700",
  unverified: "bg-gray-100 text-gray-500",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-600",
  pending: "bg-yellow-100 text-yellow-700",
  inactive: "bg-red-100 text-red-700",
};

const LABELS = {
  active: "Active",
  blocked: "Blocked",
  verified: "Verified",
  unverified: "Unverified",
  approved: "Approved",
  rejected: "Rejected",
  pending: "Pending",
  inactive: "Inactive",
};

export default function StatusBadge({ status }) {
  const key = status?.toLowerCase() || "pending";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full
                      text-xs font-medium ${STYLES[key] ?? "bg-gray-100 text-gray-500"}`}
    >
      {LABELS[key] ?? key}
    </span>
  );
}
