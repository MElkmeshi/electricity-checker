function formatTime(date: Date): string {
  return date.toISOString().replace("T", " ").replace(".000Z", " UTC");
}

export function formatStatus(isOn: boolean, checkedAt: Date): string {
  const icon = isOn ? "🟢" : "🔴";
  return `${icon} Electricity is ${isOn ? "ON" : "OFF"}.\nChecked: ${formatTime(checkedAt)}`;
}

export function formatTransition(isOn: boolean, observedAt: Date): string {
  const icon = isOn ? "🟢" : "🔴";
  return `${icon} Electricity switched ${isOn ? "ON" : "OFF"}.\nDetected: ${formatTime(observedAt)}`;
}
