interface Props {
  password: string;
}

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Muito fraca", color: "bg-red-500" };
  if (score === 2) return { score, label: "Fraca", color: "bg-orange-500" };
  if (score === 3) return { score, label: "Razoável", color: "bg-yellow-500" };
  if (score === 4) return { score, label: "Boa", color: "bg-blue-500" };
  return { score, label: "Forte", color: "bg-green-500" };
}

export function PasswordStrength({ password }: Props) {
  if (!password) return null;
  const { score, label, color } = getStrength(password);
  return (
    <div className="space-y-1 mt-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i <= score ? color : "bg-muted"}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${
        score <= 1 ? "text-red-500" :
        score === 2 ? "text-orange-500" :
        score === 3 ? "text-yellow-600" :
        score === 4 ? "text-blue-500" : "text-green-600"
      }`}>
        {label}
      </p>
    </div>
  );
}
