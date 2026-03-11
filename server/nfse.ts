import https from "https";
import { URL } from "url";
import crypto from "crypto";

export interface NfseConfig {
  enabled: boolean;
  ambiente: "producao" | "homologacao";
  webserviceUrl: string;
  cnpjPrestador: string;
  inscricaoMunicipal: string;
  municipioCodigo: string;
  razaoSocial: string;
  cTribNac: string;
  cTribMun: string;
  cNBS: string;
  aliquotaIss: string;
  opSimpNac: string;
  regEspTrib: string;
  serie: string;
  proximoDps: number;
  informacoesComplementares: string;
  certificadoPfxBase64: string;
  certificadoSenha: string;
  descricaoServico: string;
}

export interface EmitirNfseParams {
  config: NfseConfig;
  numeroDps: string;
  valor: string;
  tomadorNome: string;
  tomadorCpfCnpj: string;
  tomadorEmail?: string;
  tomadorLogradouro?: string;
  tomadorNumero?: string;
  tomadorBairro?: string;
  tomadorCep?: string;
  tomadorCidade?: string;
  tomadorUf?: string;
  tomadorCodigoMunicipio?: string;
  descricaoServico?: string;
  dataEmissao?: Date;
}

export interface NfseResult {
  success: boolean;
  numeroNota?: string;
  codigoVerificacao?: string;
  linkNota?: string;
  xmlContent?: string;
  error?: string;
}

function formatDateTimeBR(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = date.getFullYear();
  const mo = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const mi = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${mo}-${d}T${h}:${mi}:${s}-04:00`;
}

function formatDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function cleanDoc(doc: string): string {
  return doc.replace(/\D/g, "");
}

function buildDpsXml(params: EmitirNfseParams): string {
  const cfg = params.config;
  const now = params.dataEmissao ?? new Date();
  const dhEmi = formatDateTimeBR(now);
  const dCompet = formatDateOnly(now);
  const tpAmb = cfg.ambiente === "producao" ? "1" : "2";
  const descricao = params.descricaoServico || cfg.descricaoServico ||
    "Prestação de serviços de engenharia solar fotovoltaica";
  const nDPS = params.numeroDps;
  const dpsId = `DPS${String(nDPS).padStart(15, "0")}`;
  const cnpjPrestador = cleanDoc(cfg.cnpjPrestador);
  const imPrestador = cfg.inscricaoMunicipal.replace(/\D/g, "");
  const cLocEmi = cfg.municipioCodigo || "5107909";

  const tomadorDoc = cleanDoc(params.tomadorCpfCnpj || "");
  const tomadorDocTag = tomadorDoc.length === 11
    ? `<CPF>${tomadorDoc}</CPF>`
    : `<CNPJ>${tomadorDoc}</CNPJ>`;

  const valorServico = parseFloat(params.valor.replace(",", ".")).toFixed(2);
  const pAliq = parseFloat(cfg.aliquotaIss).toFixed(2);

  const enderecoPrestador = `<end>
        <endNac>
          <cMun>${cLocEmi}</cMun>
          <CEP>78555000</CEP>
        </endNac>
        <xLgr>Av. dos Ingás</xLgr>
        <nro>SN</nro>
        <xBairro>Centro</xBairro>
      </end>`;

  let tomaEnd = "";
  if (params.tomadorCodigoMunicipio && params.tomadorCep) {
    tomaEnd = `<end>
        <endNac>
          <cMun>${params.tomadorCodigoMunicipio}</cMun>
          <CEP>${cleanDoc(params.tomadorCep)}</CEP>
        </endNac>
        ${params.tomadorLogradouro ? `<xLgr>${params.tomadorLogradouro}</xLgr>` : ""}
        ${params.tomadorNumero ? `<nro>${params.tomadorNumero}</nro>` : ""}
        ${params.tomadorBairro ? `<xBairro>${params.tomadorBairro}</xBairro>` : ""}
      </end>`;
  }

  return `<DPS versao="1.01" xmlns="http://www.sped.fazenda.gov.br/nfse">
  <infDPS Id="${dpsId}">
    <tpAmb>${tpAmb}</tpAmb>
    <dhEmi>${dhEmi}</dhEmi>
    <verAplic>RandoliSolar1.00</verAplic>
    <serie>${cfg.serie || "1"}</serie>
    <nDPS>${nDPS}</nDPS>
    <dCompet>${dCompet}</dCompet>
    <tpEmit>1</tpEmit>
    <cLocEmi>${cLocEmi}</cLocEmi>
    <prest>
      <CNPJ>${cnpjPrestador}</CNPJ>
      <IM>${imPrestador}</IM>
    </prest>
    <toma>
      ${tomadorDocTag}
      <xNome>${params.tomadorNome}</xNome>
      ${params.tomadorEmail ? `<email>${params.tomadorEmail}</email>` : ""}
      ${tomaEnd}
    </toma>
    <serv>
      <locPrest>
        <cLocPrestacao>${cLocEmi}</cLocPrestacao>
      </locPrest>
      <cServ>
        <cTribNac>${cfg.cTribNac || "010102"}</cTribNac>
        <cTribMun>${cfg.cTribMun || "0101010001"}</cTribMun>
        <xDescServ>${descricao}</xDescServ>
        <cNBS>${cfg.cNBS || "100000000"}</cNBS>
      </cServ>
    </serv>
    <valores>
      <vServPrest>
        <vServ>${valorServico}</vServ>
      </vServPrest>
      <trib>
        <tribMun>
          <tribISSQN>1</tribISSQN>
          <tpRetISSQN>1</tpRetISSQN>
          <pAliq>${pAliq}</pAliq>
        </tribMun>
        <totTrib>
          <indTotTrib>0</indTotTrib>
        </totTrib>
      </trib>
    </valores>
    <regTrib>
      <opSimpNac>${cfg.opSimpNac || "3"}</opSimpNac>
      <regEspTrib>${cfg.regEspTrib || "0"}</regEspTrib>
    </regTrib>
  </infDPS>
</DPS>`;
}

function buildLoteDpsXml(dpsXml: string, cfg: NfseConfig, loteNum: number): string {
  const cnpjPrestador = cleanDoc(cfg.cnpjPrestador);
  const imPrestador = cfg.inscricaoMunicipal.replace(/\D/g, "");

  return `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteDpsSincronoEnvio versao="1.01" xmlns="http://www.sped.fazenda.gov.br/nfse">
  <NumeroLote>${loteNum}</NumeroLote>
  <Prestador>
    <CNPJ>${cnpjPrestador}</CNPJ>
    <IM>${imPrestador}</IM>
  </Prestador>
  <QuantidadeDPS>1</QuantidadeDPS>
  <ListaDps>
    <Dps>
${dpsXml}
    </Dps>
  </ListaDps>
</EnviarLoteDpsSincronoEnvio>`;
}

function buildSoapEnvelope(xml: string): string {
  const cabecalho = `<?xml version="1.0" encoding="UTF-8"?><cabecalho xmlns="http://www.sped.fazenda.gov.br/nfse" versao="1.01"><versaoDados>1.01</versaoDados></cabecalho>`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:e="http://www.sped.fazenda.gov.br/nfse">
  <soapenv:Header/>
  <soapenv:Body>
    <e:RecepcionarLoteDpsSincrono>
      <nfseCabecMsg><![CDATA[${cabecalho}]]></nfseCabecMsg>
      <nfseDadosMsg><![CDATA[${xml}]]></nfseDadosMsg>
    </e:RecepcionarLoteDpsSincrono>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function makeHttpsRequest(
  urlStr: string,
  body: string,
  pfxBuffer: Buffer,
  passphrase: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port ? parseInt(url.port) : 443,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "http://www.sped.fazenda.gov.br/nfse/RecepcionarLoteDpsSincrono",
        "Content-Length": Buffer.byteLength(body, "utf-8"),
      },
      pfx: pfxBuffer,
      passphrase,
      rejectUnauthorized: false,
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => resolve(data));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

function extractFromXml(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<(?:[^:>]+:)?${tag}[^>]*>([^<]*)<`, "i");
  const m = xml.match(re);
  return m?.[1]?.trim() || undefined;
}

function extractError(xml: string): string {
  const msg =
    extractFromXml(xml, "Mensagem") ||
    extractFromXml(xml, "MensagemErro") ||
    extractFromXml(xml, "faultstring") ||
    extractFromXml(xml, "Correcao");
  return msg || "Erro desconhecido ao emitir NFS-e. Verifique as configurações e logs.";
}

export async function emitirNfse(params: EmitirNfseParams): Promise<NfseResult> {
  const { config } = params;

  if (!config.webserviceUrl) {
    return { success: false, error: "URL do webservice NFS-e não configurada." };
  }
  if (!config.certificadoPfxBase64) {
    return { success: false, error: "Certificado digital (A1) não configurado." };
  }

  try {
    const pfxBuffer = Buffer.from(config.certificadoPfxBase64, "base64");
    const loteNum = Date.now();
    const dpsXml = buildDpsXml(params);
    const loteXml = buildLoteDpsXml(dpsXml, config, loteNum);
    const soapBody = buildSoapEnvelope(loteXml);

    console.log(`[nfse-sped] Emitindo DPS ${params.numeroDps} ambiente=${config.ambiente} url=${config.webserviceUrl}`);
    console.log(`[nfse-sped] DPS XML preview:\n${dpsXml.slice(0, 800)}`);

    const response = await makeHttpsRequest(
      config.webserviceUrl,
      soapBody,
      pfxBuffer,
      config.certificadoSenha
    );

    console.log("[nfse-sped] Resposta recebida:", response.slice(0, 800));

    const hasNfse =
      response.includes("nNFSe") ||
      response.includes("CompNfse") ||
      response.includes("InfNfse");
    const hasError =
      response.includes("ListaMensagemRetorno") ||
      response.includes("Mensagem") ||
      response.includes("faultstring");

    if (hasNfse && !response.includes("<Mensagem>")) {
      const numeroNota =
        extractFromXml(response, "nNFSe") ||
        extractFromXml(response, "Numero");
      const codigoVerificacao = extractFromXml(response, "cVerifNFSe") ||
        extractFromXml(response, "CodigoVerificacao");
      const linkNota = extractFromXml(response, "linkNFSe") ||
        extractFromXml(response, "OutrasInformacoes");

      return {
        success: true,
        numeroNota,
        codigoVerificacao,
        linkNota,
        xmlContent: response,
      };
    } else {
      return {
        success: false,
        error: extractError(response),
        xmlContent: response,
      };
    }
  } catch (err: any) {
    console.error("[nfse-sped] Erro ao emitir:", err);
    return {
      success: false,
      error: err?.message || "Erro de conexão ao webservice NFS-e SPED.",
    };
  }
}

export function getNfseConfig(settingsMap: Record<string, string>): NfseConfig | null {
  if (settingsMap["nfse_enabled"] !== "true") return null;
  return {
    enabled: true,
    ambiente: (settingsMap["nfse_ambiente"] as "producao" | "homologacao") || "homologacao",
    webserviceUrl: settingsMap["nfse_webservice_url"] || "",
    cnpjPrestador: settingsMap["nfse_cnpj_prestador"] || "",
    inscricaoMunicipal: settingsMap["nfse_inscricao_municipal"] || "",
    municipioCodigo: settingsMap["nfse_municipio_codigo"] || "5107909",
    razaoSocial: settingsMap["nfse_razao_social"] || "",
    cTribNac: settingsMap["nfse_ctrib_nac"] || "010102",
    cTribMun: settingsMap["nfse_ctrib_mun"] || "0101010001",
    cNBS: settingsMap["nfse_cnbs"] || "100000000",
    aliquotaIss: settingsMap["nfse_aliquota_iss"] || "2.00",
    opSimpNac: settingsMap["nfse_op_simples_nac"] || "3",
    regEspTrib: settingsMap["nfse_reg_esp_trib"] || "0",
    serie: settingsMap["nfse_serie_dps"] || settingsMap["nfse_serie_rps"] || "1",
    proximoDps: parseInt(settingsMap["nfse_proximo_dps"] || settingsMap["nfse_proximo_rps"] || "1"),
    informacoesComplementares: settingsMap["nfse_informacoes_complementares"] || "",
    certificadoPfxBase64: settingsMap["nfse_certificado_pfx"] || "",
    certificadoSenha: settingsMap["nfse_certificado_senha"] || "",
    descricaoServico:
      settingsMap["nfse_descricao_servico"] ||
      "Prestação de serviços de engenharia e homologação de sistemas fotovoltaicos",
  };
}
