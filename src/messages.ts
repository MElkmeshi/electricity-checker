function formatTime(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Tripoli",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function formatStatus(isOn: boolean, checkedAt: Date): string {
  const icon = isOn ? "🟢" : "🔴";
  return `${icon} Electricity is ${isOn ? "ON" : "OFF"}.\nChecked: ${formatTime(checkedAt)}`;
}

export function formatTransition(isOn: boolean, observedAt: Date): string {
  const icon = isOn ? "🟢" : "🔴";
  return `${icon} Electricity switched ${isOn ? "ON" : "OFF"}.\nDetected: ${formatTime(observedAt)}`;
}
