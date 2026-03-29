import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Shield, AlertTriangle, Send, Pen, Type, RotateCcw, ChevronLeft, Move } from "lucide-react";

type DocData = {
  id: string; assinatura_id: string; nome: string; email: string;
  telefone?: string; canal?: string; cpf?: string; titulo: string;
  file_url: string; mensagem?: string; expires_at: string;
  signed_at?: string; alreadySigned?: boolean; doc_status: string;
};
type SignaturePosition = { page: number; x: number; y: number; width: number; height: number };

function SignaturePad({ onSave, onCancel }: { onSave: (d: string) => void; onCancel: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [mode, setMode] = useState<"draw"|"type">("draw");
  const [typedName, setTypedName] = useState("");
  const [hasDrawing, setHasDrawing] = useState(false);

  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,c.width,c.height);
    ctx.strokeStyle = "#1e3a5f"; ctx.lineWidth = 2.5;
    ctx.lineCap = "round"; ctx.lineJoin = "round";
  }, [mode]);

  const getPos = (e: any, canvas: HTMLCanvasElement) => {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width/r.width, sy = canvas.height/r.height;
    const src = e.touches ? e.touches[0] : e;
    return { x: (src.clientX - r.left)*sx, y: (src.clientY - r.top)*sy };
  };

  const startDraw = (e: any) => {
    e.preventDefault();
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    const p = getPos(e, c); ctx.beginPath(); ctx.moveTo(p.x, p.y);
    setDrawing(true); setHasDrawing(true);
  };
  const draw = (e: any) => {
    e.preventDefault(); if (!drawing) return;
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    const p = getPos(e, c); ctx.lineTo(p.x, p.y); ctx.stroke();
  };
  const stopDraw = () => setDrawing(false);

  const clear = () => {
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,c.width,c.height); setHasDrawing(false);
  };

  const renderTyped = () => {
    if (!typedName.trim()) return;
    const c = canvasRef.current!; const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#fff"; ctx.fillRect(0,0,c.width,c.height);
    ctx.fillStyle = "#1e3a5f";
    ctx.font = "italic 42px 'Brush Script MT', cursive";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(typedName, c.width/2, c.height/2); setHasDrawing(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-bold text-[#1e3a5f] flex items-center gap-2"><Pen className="h-4 w-4" /> Criar Assinatura</h3>
          <div className="flex gap-1">
            {(["draw","type"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${mode===m?"bg-[#1e3a5f] text-white":"bg-gray-100 text-gray-600"}`}>
                {m==="draw" ? <><Pen className="h-3 w-3"/> Desenhar</> : <><Type className="h-3 w-3"/> Digitar</>}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 space-y-3">
          {mode==="type" && (
            <div className="flex gap-2">
              <input className="flex-1 border rounded-lg px-3 py-2 text-sm" placeholder="Digite seu nome..."
                value={typedName} onChange={e => setTypedName(e.target.value)} />
              <button onClick={renderTyped} className="px-3 py-2 bg-[#1e3a5f] text-white rounded-lg text-xs font-semibold">Gerar</button>
            </div>
          )}
          <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden bg-gray-50" style={{touchAction:"none"}}>
            <canvas ref={canvasRef} width={400} height={160} className="w-full cursor-crosshair" style={{display:"block"}}
              onMouseDown={mode==="draw"?startDraw:undefined} onMouseMove={mode==="draw"?draw:undefined}
              onMouseUp={stopDraw} onMouseLeave={stopDraw}
              onTouchStart={mode==="draw"?startDraw:undefined} onTouchMove={mode==="draw"?draw:undefined} onTouchEnd={stopDraw} />
          </div>
          {mode==="draw" && <p className="text-xs text-center text-gray-400">Assine no espaço acima com mouse ou dedo</p>}
          <div className="flex gap-2">
            <button onClick={clear} className="flex items-center gap-1 px-3 py-2 border rounded-lg text-xs text-gray-500 hover:bg-gray-50">
              <RotateCcw className="h-3 w-3"/> Limpar
            </button>
            <button onClick={onCancel} className="flex-1 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
            <button onClick={() => onSave(canvasRef.current!.toDataURL("image/png"))} disabled={!hasDrawing}
              className="flex-1 py-2 bg-[#1e3a5f] text-white rounded-lg text-sm font-bold disabled:opacity-50">
              Usar Assinatura
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PDFWithSignature({ fileUrl, signatureImage, onPositionSet, sigName }:
  { fileUrl: string; signatureImage: string|null; onPositionSet: (p: SignaturePosition)=>void; sigName: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);
  const [pos, setPos] = useState({ x: 10, y: 65, w: 40 });
  const [ds, setDs] = useState({ mx:0,my:0,ox:0,oy:0 });

  useEffect(() => { onPositionSet({page:1, x:pos.x, y:pos.y, width:pos.w, height:15}); }, []);

  const onMD = (e: React.MouseEvent) => {
    if (!signatureImage) return; e.preventDefault();
    setDragging(true); setDs({mx:e.clientX,my:e.clientY,ox:pos.x,oy:pos.y});
  };
  const onMM = (e: React.MouseEvent) => {
    if (!dragging || !containerRef.current) return;
    const r = containerRef.current.getBoundingClientRect();
    const nx = Math.max(0, Math.min(55, ds.ox + ((e.clientX-ds.mx)/r.width)*100));
    const ny = Math.max(0, Math.min(88, ds.oy + ((e.clientY-ds.my)/r.height)*100));
    setPos(p => ({...p, x:nx, y:ny}));
  };
  const onMU = () => {
    if (dragging) { setDragging(false); onPositionSet({page:1,x:pos.x,y:pos.y,width:pos.w,height:15}); }
  };

  return (
    <div ref={containerRef} className="relative w-full border rounded-xl overflow-hidden bg-gray-100 select-none"
      style={{minHeight:"55vh"}} onMouseMove={onMM} onMouseUp={onMU} onMouseLeave={onMU}>
      <iframe src={fileUrl} className="w-full" style={{height:"55vh",border:"none",pointerEvents: dragging ? "none" : "auto"}} title="doc" />
      {signatureImage && (
        <div className={`absolute border-2 border-blue-400 rounded cursor-move bg-white/90 shadow-lg flex flex-col items-center justify-center p-1 ${dragging?"opacity-70":""}`}
          style={{left:`${pos.x}%`,top:`${pos.y}%`,width:`${pos.w}%`}} onMouseDown={onMD}>
          <div className="absolute -top-5 left-0 bg-blue-500 text-white text-[9px] px-1.5 py-0.5 rounded font-semibold flex items-center gap-1 whitespace-nowrap">
            <Move className="h-2.5 w-2.5"/> Arraste para posicionar
          </div>
          <img src={signatureImage} className="w-full" style={{maxHeight:44,objectFit:"contain"}} alt="sig" />
          <span className="text-[9px] text-gray-700 font-bold border-t border-gray-200 w-full text-center pt-0.5 mt-0.5 truncate">{sigName}</span>
        </div>
      )}
    </div>
  );
}

export default function AssinarPage() {
  const [, params] = useRoute("/assinar/:token");
  const token = params?.token || "";
  const { toast } = useToast();
  const [docData, setDocData] = useState<DocData|null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"doc"|"signature"|"codigo"|"done">("doc");
  const [lido, setLido] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [cpfInformado, setCpfInformado] = useState("");
  const [sending, setSending] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [signHash, setSignHash] = useState("");
  const [showPad, setShowPad] = useState(false);
  const [signatureImage, setSignatureImage] = useState<string|null>(null);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition>({page:1,x:10,y:65,width:40,height:15});

  useEffect(() => {
    if (!token) return;
    fetch(`/api/public/assinar/${token}`)
      .then(r => { if (!r.ok) return r.json().then(d=>{throw new Error(d.error||"Erro");}); return r.json(); })
      .then(d => { setDocData(d); if (d.alreadySigned) setStep("done"); })
      .catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [token]);

  const solicitarCodigo = async () => {
    setSending(true);
    try {
      const res = await fetch(`/api/public/assinar/${token}/solicitar-codigo`, {method:"POST"});
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const channels = [];
      if (data.emailSent) channels.push(`e-mail (${data.email})`);
      if (data.whatsappSent) channels.push("WhatsApp");
      toast({ title: `Código enviado por ${channels.join(" e ") || data.email}` });
      setStep("codigo");
    } catch(e: any) { toast({ title: e.message||"Erro", variant:"destructive" }); }
    finally { setSending(false); }
  };

  const confirmarAssinatura = async () => {
    if (codigo.length !== 6) { toast({title:"Digite o código de 6 dígitos",variant:"destructive"}); return; }
    setConfirming(true);
    try {
      const res = await fetch(`/api/public/assinar/${token}/confirmar`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ codigo, cpf: cpfInformado, signatureImage: signatureImage||null, signaturePosition: signatureImage?signaturePosition:null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSignHash(data.signHash); setStep("done");
    } catch(e: any) { toast({title:e.message||"Código inválido",variant:"destructive"}); }
    finally { setConfirming(false); }
  };

  const verifyUrl = signHash ? `${window.location.origin}/verificar/${signHash}` : "";

  const printCert = () => {
    if (!signHash||!docData) return;
    const w = window.open("","_blank"); if (!w) return;
    const signedAt = new Date().toLocaleString("pt-BR",{timeZone:"America/Cuiaba",dateStyle:"full",timeStyle:"medium"});
    w.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Comprovante</title>
    <style>body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a2e}.h{text-align:center;border-bottom:3px solid #1e3a5f;padding-bottom:20px;margin-bottom:30px}h1{color:#1e3a5f;font-size:22px}.badge{display:inline-block;background:#d1fae5;color:#065f46;padding:4px 12px;border-radius:20px;font-weight:bold;font-size:12px;border:1px solid #a7f3d0}.field{display:flex;margin-bottom:8px;font-size:13px}.label{color:#666;width:160px;flex-shrink:0}.value{font-weight:600}.hash{background:#1a1a2e;color:#6ee7b7;font-family:monospace;font-size:10px;padding:14px;border-radius:8px;word-break:break-all;line-height:1.6}.qr{display:flex;align-items:center;gap:20px;margin-top:16px;padding:14px;background:#f8fafc;border-radius:8px;border:1px solid #e2e8f0}.sig{text-align:center;padding:16px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:20px}.footer{margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;font-size:11px;color:#999}h3{color:#1e3a5f;font-size:11px;text-transform:uppercase;letter-spacing:1px;border-left:3px solid #1e3a5f;padding-left:8px;margin:0 0 12px}</style>
    </head><body>
    <div class="h"><div class="badge">✓ Assinatura Verificada</div><h1>Comprovante de Assinatura Digital</h1><p>Randoli Engenharia Solar</p></div>
    <h3>Dados do Documento</h3>
    <div class="field"><span class="label">Documento:</span><span class="value">${docData.titulo}</span></div>
    <div class="field"><span class="label">Data/Hora:</span><span class="value">${signedAt}</span></div>
    ${signatureImage?`<div class="sig"><p style="font-size:11px;color:#666;margin:0 0 8px">Assinatura:</p><img src="${signatureImage}" style="max-height:70px;max-width:280px"/><p style="font-size:12px;font-weight:bold;border-top:1px solid #e2e8f0;margin-top:8px;padding-top:8px">${docData.nome}</p></div>`:""}
    <h3 style="margin-top:20px">Dados do Signatário</h3>
    <div class="field"><span class="label">Nome:</span><span class="value">${docData.nome}</span></div>
    <div class="field"><span class="label">E-mail:</span><span class="value">${docData.email}</span></div>
    <h3 style="margin-top:20px">Registro Técnico</h3>
    <div class="hash">${signHash}</div>
    <div class="qr">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(verifyUrl)}" width="90" height="90"/>
      <div><p style="font-weight:bold;font-size:12px;color:#1e3a5f;margin:0 0 4px">Verificar Autenticidade</p><p style="font-size:10px;color:#1e3a5f;word-break:break-all;font-family:monospace">${verifyUrl}</p></div>
    </div>
    <div class="footer"><p><strong>Randoli Engenharia Solar</strong> — MP 2.200-2/2001 e Lei 14.063/2020</p></div>
    <script>window.onload=()=>window.print();</script></body></html>`);
    w.document.close();
  };

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="animate-pulse text-gray-400 text-sm">Carregando...</div></div>;
  if (error) return <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4"><div className="text-center"><AlertTriangle className="h-16 w-16 text-red-400 mx-auto mb-4"/><h1 className="text-xl font-bold mb-2">Link Inválido</h1><p className="text-gray-600">{error}</p></div></div>;
  if (!docData) return null;

  if (step === "done") return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 flex items-center justify-center p-4">
      <div className="text-center max-w-lg w-full space-y-4">
        <div className="h-20 w-20 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
          <CheckCircle2 className="h-10 w-10 text-emerald-600"/>
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-1">Documento Assinado!</h1>
          <p className="text-gray-600 text-sm">{docData.alreadySigned?"Este documento já foi assinado anteriormente.":`Você assinou "${docData.titulo}" com sucesso.`}</p>
        </div>
        {signHash && (
          <div className="bg-white rounded-2xl shadow-md p-5 text-left space-y-4">
            {signatureImage && (
              <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-xs text-gray-400 font-bold uppercase mb-2">Sua Assinatura</p>
                <img src={signatureImage} className="mx-auto" style={{maxHeight:56,maxWidth:200}} alt="sig"/>
                <p className="text-xs font-bold text-gray-700 border-t border-gray-200 mt-2 pt-2">{docData.nome}</p>
              </div>
            )}
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <img src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(verifyUrl)}`} width={76} height={76} className="rounded-lg shrink-0" alt="QR"/>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Verificar Autenticidade</p>
                <a href={verifyUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline font-mono break-all">{verifyUrl.slice(0,55)}...</a>
              </div>
            </div>
            <div className="bg-gray-900 rounded-xl p-3">
              <p className="text-xs text-gray-400 font-bold uppercase mb-1">Hash SHA-256</p>
              <p className="text-xs font-mono text-emerald-400 break-all">{signHash}</p>
            </div>
            <button onClick={printCert} className="w-full py-3 bg-[#1e3a5f] text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#2d5186] transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Baixar Comprovante (PDF)
            </button>
          </div>
        )}
        <p className="text-xs text-gray-400">MP 2.200-2/2001 e Lei 14.063/2020</p>
      </div>
    </div>
  );

  const stepIdx = ["doc","signature","codigo"].indexOf(step);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-[#1e3a5f] text-white px-4 py-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-0.5"><Shield className="h-4 w-4"/><span className="font-bold">Assinatura Digital</span></div>
        <p className="text-blue-200 text-xs">Randoli Engenharia Solar</p>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-4 pb-10">
        {/* Steps */}
        <div className="flex items-center justify-center gap-2 py-2">
          {["Ler","Assinar","Confirmar"].map((label,i) => {
            const done = i < stepIdx; const active = i === stepIdx;
            return (
              <div key={label} className="flex items-center gap-1.5">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${done?"bg-emerald-500 text-white":active?"bg-[#1e3a5f] text-white":"bg-gray-200 text-gray-400"}`}>
                  {done ? "✓" : i+1}
                </div>
                <span className={`text-xs font-semibold ${active?"text-[#1e3a5f]":"text-gray-400"}`}>{label}</span>
                {i<2 && <div className={`w-6 h-0.5 ${i<stepIdx?"bg-emerald-500":"bg-gray-200"}`}/>}
              </div>
            );
          })}
        </div>

        {/* Info card */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="font-bold text-sm">{docData.titulo}</p>
          <p className="text-xs text-gray-500 mt-0.5">Para: {docData.nome} • Expira: {new Date(docData.expires_at).toLocaleDateString("pt-BR")}</p>
        </div>

        {step === "doc" && (
          <>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <iframe src={docData.file_url} className="w-full" style={{height:"55vh",border:"none"}} title={docData.titulo}/>
            </div>
            {docData.mensagem && <div className="p-3 bg-blue-50 rounded-xl text-sm text-blue-700">{docData.mensagem}</div>}
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={lido} onChange={e => setLido(e.target.checked)} className="mt-0.5 h-4 w-4 shrink-0"/>
                <span className="text-sm font-medium">Li integralmente o documento e concordo com seu conteúdo</span>
              </label>
              <button disabled={!lido} onClick={() => setStep("signature")}
                className="w-full py-3 bg-[#1e3a5f] text-white rounded-xl font-bold text-sm disabled:opacity-50 hover:bg-[#2d5186] transition-colors flex items-center justify-center gap-2">
                <Pen className="h-4 w-4"/> Próximo — Criar Assinatura
              </button>
            </div>
          </>
        )}

        {step === "signature" && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
              <h3 className="font-bold text-sm text-[#1e3a5f] flex items-center gap-2"><Pen className="h-4 w-4"/> Sua Assinatura</h3>
              {signatureImage ? (
                <div className="space-y-2">
                  <div className="p-3 bg-gray-50 rounded-xl border text-center">
                    <img src={signatureImage} className="mx-auto mb-2" style={{maxHeight:60}} alt="sig"/>
                    <p className="text-xs font-bold text-gray-700 border-t border-gray-200 pt-2">{docData.nome}</p>
                  </div>
                  <button onClick={() => setShowPad(true)} className="w-full py-2 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-colors">
                    Refazer assinatura
                  </button>
                </div>
              ) : (
                <button onClick={() => setShowPad(true)} className="w-full py-6 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-[#1e3a5f] hover:text-[#1e3a5f] transition-colors flex flex-col items-center gap-2">
                  <Pen className="h-6 w-6"/> Clique para criar sua assinatura<span className="text-xs">Desenhe ou digite seu nome</span>
                </button>
              )}
            </div>
            {signatureImage && (
              <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                <h3 className="font-bold text-sm text-[#1e3a5f] flex items-center gap-2"><Move className="h-4 w-4"/> Posicionar no Documento</h3>
                <p className="text-xs text-gray-500">Arraste sua assinatura para o local desejado</p>
                <PDFWithSignature fileUrl={docData.file_url} signatureImage={signatureImage} onPositionSet={setSignaturePosition} sigName={docData.nome}/>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={() => setStep("doc")} className="flex items-center gap-1 px-4 py-3 border rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                <ChevronLeft className="h-4 w-4"/> Voltar
              </button>
              <button onClick={solicitarCodigo} disabled={sending}
                className="flex-1 py-3 bg-[#1e3a5f] text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
                <Send className="h-4 w-4"/> {sending?"Enviando...":"Receber Código e Confirmar"}
              </button>
            </div>
            <p className="text-xs text-center text-gray-400 flex items-center justify-center gap-1">
              <Shield className="h-3 w-3 text-emerald-500"/> Registro de IP, data/hora e hash SHA-256
            </p>
          </div>
        )}

        {step === "codigo" && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
            <div className="text-center">
              <div className="h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3"><Send className="h-6 w-6 text-[#1e3a5f]"/></div>
              <p className="font-bold">Código enviado!</p>
              <p className="text-sm text-gray-500 mt-1">Para <strong>{docData.email}</strong>{docData.telefone?" e WhatsApp":""}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Código de 6 dígitos *</label>
              <input value={codigo} onChange={e => setCodigo(e.target.value.replace(/\D/g,"").slice(0,6))}
                placeholder="000000" maxLength={6} className="w-full text-center text-3xl font-bold tracking-widest border-2 rounded-xl py-3 focus:outline-none focus:border-[#1e3a5f]"/>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">CPF (confirmação)</label>
              <input value={cpfInformado} onChange={e => setCpfInformado(e.target.value)}
                placeholder="000.000.000-00" className="w-full border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:border-[#1e3a5f]"/>
            </div>
            <button disabled={codigo.length!==6||confirming} onClick={confirmarAssinatura}
              className="w-full py-3 bg-[#1e3a5f] text-white rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5"/> {confirming?"Confirmando...":"Confirmar Assinatura"}
            </button>
            <button className="w-full text-xs text-gray-400 hover:text-gray-600" onClick={solicitarCodigo} disabled={sending}>Reenviar código</button>
            <p className="text-xs text-center text-gray-400">Código válido por 10 minutos. Verifique o spam.</p>
          </div>
        )}
      </div>

      {showPad && <SignaturePad onSave={img => { setSignatureImage(img); setShowPad(false); }} onCancel={() => setShowPad(false)}/>}
    </div>
  );
}
