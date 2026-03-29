import { useState, useEffect } from "react";
import { useRoute } from "wouter";
import { CheckCircle2, XCircle, Shield, FileText, User, Calendar, Globe, Hash } from "lucide-react";

export default function VerificarPage() {
  const [, params] = useRoute("/verificar/:hash");
  const hash = params?.hash || "";
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!hash) return;
    fetch(`/api/public/verificar/${hash}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError("Erro ao verificar"))
      .finally(() => setLoading(false));
  }, [hash]);

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-pulse text-gray-400 text-sm">Verificando assinatura...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-[#1e3a5f] text-white px-4 py-5 text-center">
        <div className="flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          <span className="font-bold text-lg">Verificação de Assinatura Digital</span>
        </div>
        <p className="text-blue-200 text-xs mt-1">Randoli Engenharia Solar</p>
      </div>

      <div className="max-w-2xl mx-auto p-6 space-y-4">
        {error ? (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <XCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Assinatura Não Encontrada</h2>
            <p className="text-gray-500 text-sm">{error}</p>
            <p className="text-gray-400 text-xs mt-4">
              Hash: <code className="font-mono bg-gray-100 px-1 rounded">{hash.slice(0, 20)}...</code>
            </p>
          </div>
        ) : data && (
          <>
            {/* Status principal */}
            <div className="bg-white rounded-2xl shadow-md p-6 text-center">
              <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-1">Assinatura Válida</h2>
              <p className="text-gray-500 text-sm">
                Este documento foi assinado eletronicamente com validade jurídica
              </p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-semibold border border-emerald-200">
                  ✓ Verificado
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-200">
                  MP 2.200-2/2001
                </span>
                <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold border border-blue-200">
                  Lei 14.063/2020
                </span>
              </div>
            </div>

            {/* Dados do documento */}
            <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" /> Dados do Documento
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <FileText className="h-4 w-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400 font-semibold uppercase">Documento</p>
                    <p className="font-semibold text-gray-900 text-sm">{data.titulo}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Dados do signatário */}
            <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" /> Dados do Signatário
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Nome Completo", value: data.nome, icon: User },
                  { label: "E-mail", value: data.email, icon: Globe },
                  { label: "CPF", value: data.cpf || "Não informado", icon: User },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">{label}</p>
                      <p className="font-semibold text-gray-900 text-sm">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dados técnicos */}
            <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" /> Registro da Assinatura
              </h3>
              <div className="space-y-2">
                {[
                  { label: "Data e Hora", value: data.signedAt ? new Date(data.signedAt).toLocaleString("pt-BR", { timeZone: "America/Cuiaba", dateStyle: "full", timeStyle: "medium" }) : "-" },
                  { label: "Endereço IP", value: data.signedIp || "-" },
                  { label: "Nível de Segurança", value: "Código único enviado por E-mail" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">{label}</p>
                      <p className="font-semibold text-gray-900 text-sm">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Hash */}
              <div className="p-4 bg-gray-900 rounded-xl">
                <p className="text-xs text-gray-400 font-bold uppercase mb-2 flex items-center gap-1">
                  <Hash className="h-3 w-3" /> Hash SHA-256 (Integridade)
                </p>
                <p className="text-xs font-mono text-emerald-400 break-all leading-relaxed">
                  {data.signHash}
                </p>
              </div>
            </div>

            {/* Rodapé legal */}
            <div className="text-center text-xs text-gray-400 pb-6 space-y-1">
              <p>Assinatura eletrônica com validade jurídica</p>
              <p>MP 2.200-2/2001 e Lei 14.063/2020</p>
              <p className="font-semibold text-gray-500">Randoli Engenharia Solar — Sistema de Assinatura Digital</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
