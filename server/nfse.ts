import https from "https";
import { URL } from "url";
import forge from "node-forge";
import { SignedXml } from "xml-crypto";

export interface NfseConfig {
  enabled: boolean;
  ambiente: "producao" | "homologacao";
  webserviceUrl: string;
  municipioNome: string;
  cnpjPrestador: string;
  inscricaoMunicipal: string;
  municipioCodigo: string;
  razaoSocial: string;
  nomeFantasia: string;
  emailPrestador: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cep: string;
  uf: string;
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
  tomadorComplemento?: string;
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
  return `${y}-${mo}-${d}T${h}:${mi}:${s}-03:00`;
}

function formatDateOnly(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function cleanDoc(doc: string): string {
  return doc.replace(/\D/g, "");
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildGerarNfseEnvioXml(params: EmitirNfseParams): string {
  const cfg = params.config;
  const now = params.dataEmissao ?? new Date();
  const dhEmi = formatDateTimeBR(now);
  const dCompet = formatDateOnly(now);
  const tpAmb = cfg.ambiente === "producao" ? "1" : "2";
  const descricao = params.descricaoServico || cfg.descricaoServico ||
    "Prestacao de servicos de engenharia e homologacao de sistemas fotovoltaicos";
  const nDPS = params.numeroDps;
  const cnpjPrestador = cleanDoc(cfg.cnpjPrestador);
  const imPrestador = cfg.inscricaoMunicipal.replace(/\D/g, "");
  const cLocEmi = cfg.municipioCodigo || "5107909";

  const tpInsc = cnpjPrestador.length <= 11 ? "1" : "2";
  const docPad = cnpjPrestador.padStart(14, "0");
  const dpsId = `DPS${cLocEmi}${tpInsc}${docPad}${String(cfg.serie).padStart(5, "0")}${String(nDPS).padStart(15, "0")}`;

  const tomadorDoc = cleanDoc(params.tomadorCpfCnpj || "");
  const tomadorDocTag = tomadorDoc.length === 11
    ? `<CPF>${tomadorDoc}</CPF>`
    : `<CNPJ>${tomadorDoc.padStart(14, "0")}</CNPJ>`;

  const valorServico = parseFloat(params.valor.replace(",", ".")).toFixed(2);
  const isSimplesNacional = cfg.opSimpNac === "2" || cfg.opSimpNac === "3";
  const aliquota = isSimplesNacional ? "0.00" : parseFloat(cfg.aliquotaIss || "0.00").toFixed(2);

  let tomaEnd = "";
  if (params.tomadorCodigoMunicipio && params.tomadorCep) {
    tomaEnd = `<end><endNac><cMun>${params.tomadorCodigoMunicipio}</cMun><CEP>${cleanDoc(params.tomadorCep)}</CEP></endNac>${params.tomadorLogradouro ? `<xLgr>${escapeXml(params.tomadorLogradouro)}</xLgr>` : ""}${params.tomadorNumero ? `<nro>${escapeXml(params.tomadorNumero)}</nro>` : ""}${params.tomadorComplemento ? `<xCpl>${escapeXml(params.tomadorComplemento)}</xCpl>` : ""}${params.tomadorBairro ? `<xBairro>${escapeXml(params.tomadorBairro)}</xBairro>` : ""}</end>`;
  }

  if (!cfg.cTribMun) {
    throw new Error("cTribMun (Código de Tributação Municipal) é obrigatório para emissão via COPLAN.");
  }
  const cTribMunTag = `<cTribMun>${cfg.cTribMun}</cTribMun>`;

  const dpsXml = `<GerarNfseEnvio xmlns="http://www.sped.fazenda.gov.br/nfse" xmlns:dsig="http://www.w3.org/2000/09/xmldsig#" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><DPS versao="1.01"><infDPS Id="${dpsId}"><tpAmb>${tpAmb}</tpAmb><dhEmi>${dhEmi}</dhEmi><verAplic>1.01</verAplic><serie>${cfg.serie || "1"}</serie><nDPS>${nDPS}</nDPS><dCompet>${dCompet}</dCompet><tpEmit>1</tpEmit><cLocEmi>${cLocEmi}</cLocEmi><prest><CNPJ>${cnpjPrestador}</CNPJ><IM>${imPrestador}</IM><xNome>${escapeXml(cfg.razaoSocial)}</xNome><regTrib><opSimpNac>${cfg.opSimpNac || "3"}</opSimpNac><regEspTrib>${cfg.regEspTrib || "0"}</regEspTrib></regTrib></prest><toma>${tomadorDocTag}<xNome>${escapeXml(params.tomadorNome)}</xNome>${tomaEnd}</toma><serv><locPrest><cLocPrestacao>${cLocEmi}</cLocPrestacao></locPrest><cServ><cTribNac>${cfg.cTribNac || "140601"}</cTribNac>${cTribMunTag}<xDescServ>${escapeXml(descricao)}</xDescServ><cNBS>${cfg.cNBS || "101061900"}</cNBS></cServ></serv><valores><vServPrest><vReceb>${valorServico}</vReceb><vServ>${valorServico}</vServ></vServPrest><trib><tribMun><tribISSQN>1</tribISSQN><tpRetISSQN>2</tpRetISSQN><pAliq>${aliquota}</pAliq></tribMun><totTrib><indTotTrib>0</indTotTrib></totTrib></trib></valores></infDPS></DPS></GerarNfseEnvio>`;

  return dpsXml;
}

function signDpsInGerarNfseEnvio(gerarNfseXml: string, certPem: string, keyPem: string): string {
  const idMatch = gerarNfseXml.match(/Id="([^"]+)"/);
  if (!idMatch) throw new Error("Id attribute not found in DPS XML");
  const refId = idMatch[1];

  const sig = new SignedXml({
    privateKey: keyPem,
    publicCert: certPem,
    canonicalizationAlgorithm: "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    signatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
  });

  sig.addReference({
    xpath: "//*[local-name(.)='infDPS']",
    digestAlgorithm: "http://www.w3.org/2000/09/xmldsig#sha1",
    transforms: [
      "http://www.w3.org/2000/09/xmldsig#enveloped-signature",
      "http://www.w3.org/TR/2001/REC-xml-c14n-20010315",
    ],
    uri: `#${refId}`,
  });

  sig.computeSignature(gerarNfseXml, {
    location: { reference: "//*[local-name(.)='DPS']", action: "append" },
  });

  return sig.getSignedXml();
}

function wrapInSoapEnvelope(signedGerarNfseXml: string): string {
  const cabecalho = `<cabecalho versao="2.01"><versaoDados>2.01</versaoDados></cabecalho>`;

  return `<?xml version="1.0" encoding="UTF-8"?><soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:trib="Tributario"><soapenv:Header/><soapenv:Body><trib:nfse_web_service.GERARNFSE><trib:Gerarnfserequest><trib:nfseCabecMsg><![CDATA[${cabecalho}]]></trib:nfseCabecMsg><trib:nfseDadosMsg><![CDATA[${signedGerarNfseXml}]]></trib:nfseDadosMsg></trib:Gerarnfserequest></trib:nfse_web_service.GERARNFSE></soapenv:Body></soapenv:Envelope>`;
}

function extractCertAndKeyFromPfx(pfxBuffer: Buffer, passphrase: string): { certPem: string; keyPem: string; certDerB64: string } {
  const pfxAsn1 = forge.asn1.fromDer(pfxBuffer.toString("binary"));
  const pfxObj = forge.pkcs12.pkcs12FromAsn1(pfxAsn1, passphrase);

  let certPem = "";
  let keyPem = "";
  let certDerB64 = "";

  const certBags = pfxObj.getBags({ bagType: forge.pki.oids.certBag });
  const certBagList = certBags[forge.pki.oids.certBag] || [];
  for (const bag of certBagList) {
    if (bag.cert) {
      certPem += forge.pki.certificateToPem(bag.cert);
      if (!certDerB64) {
        const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(bag.cert)).getBytes();
        certDerB64 = Buffer.from(derBytes, "binary").toString("base64");
      }
    }
  }

  const keyBags = pfxObj.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBagList = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag] || [];
  if (keyBagList.length > 0 && keyBagList[0].key) {
    keyPem = forge.pki.privateKeyToPem(keyBagList[0].key);
  }

  if (!keyPem) {
    const keyBags2 = pfxObj.getBags({ bagType: forge.pki.oids.keyBag });
    const keyBagList2 = keyBags2[forge.pki.oids.keyBag] || [];
    if (keyBagList2.length > 0 && keyBagList2[0].key) {
      keyPem = forge.pki.privateKeyToPem(keyBagList2[0].key);
    }
  }

  if (!certPem) throw new Error("Certificado não encontrado no arquivo PFX.");
  if (!keyPem) throw new Error("Chave privada não encontrada no arquivo PFX.");

  return { certPem, keyPem, certDerB64 };
}

function buildWebserviceUrl(config: NfseConfig): string {
  if (config.webserviceUrl) {
    let url = config.webserviceUrl.replace(/\/+$/, "");
    if (!url.includes("anfse_ws")) {
      if (!url.endsWith("/")) url += "/";
      url += "anfse_ws";
    }
    return url;
  }

  const municipio = (config.municipioNome || "sinop").toLowerCase().replace(/\s+/g, "");
  if (config.ambiente === "producao") {
    return `https://gp.srv.br/tributario/${municipio}/anfse_ws`;
  }
  return `https://coplan.inf.br/tributario/${municipio}/anfse_ws`;
}

function makeHttpsRequest(
  urlStr: string,
  body: string,
  pfxBuffer: Buffer,
  passphrase: string
): Promise<{ statusCode: number; body: string }> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);

    let tlsOptions: Record<string, any>;
    try {
      const { certPem, keyPem } = extractCertAndKeyFromPfx(pfxBuffer, passphrase);
      console.log(`[nfse-coplan] Certificado extraído do PFX (cert: ${certPem.length}B, key: ${keyPem.length}B)`);
      tlsOptions = { cert: certPem, key: keyPem };
    } catch (forgeErr: any) {
      console.log(`[nfse-coplan] node-forge falhou (${forgeErr?.message}), usando pfx nativo...`);
      tlsOptions = { pfx: pfxBuffer, passphrase };
    }

    const headers: Record<string, string | number> = {
      "Content-Type": "text/xml; charset=utf-8",
      "Content-Length": Buffer.byteLength(body, "utf-8"),
      "SOAPAction": "nfse_web_service.GERARNFSE",
    };

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port ? parseInt(url.port) : 443,
      path: url.pathname + url.search,
      method: "POST",
      headers,
      ...tlsOptions,
      rejectUnauthorized: false,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        console.log(`[nfse-coplan] HTTP ${res.statusCode} from ${url.hostname}`);
        resolve({ statusCode: res.statusCode || 0, body: data });
      });
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

function extractCdataContent(xml: string, tag: string): string | undefined {
  const re = new RegExp(`<(?:[^:>]+:)?${tag}[^>]*>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*</(?:[^:>]+:)?${tag}>`, "i");
  const m = xml.match(re);
  return m?.[1]?.trim() || undefined;
}

function parseSoapResponse(responseBody: string): NfseResult {
  const returnContent = extractCdataContent(responseBody, "Gerarnfseresponse") ||
    extractCdataContent(responseBody, "GerarNfseResponse") ||
    extractCdataContent(responseBody, "nfseDadosMsg") ||
    extractCdataContent(responseBody, "return") ||
    responseBody;

  const faultString = extractFromXml(responseBody, "faultstring");
  if (faultString) {
    return {
      success: false,
      error: `SOAP Fault: ${faultString}`,
      xmlContent: responseBody,
    };
  }

  const listaMensagem = responseBody.match(/<(?:[^:>]+:)?MensagemRetorno[^>]*>([\s\S]*?)<\/(?:[^:>]+:)?MensagemRetorno>/gi);
  if (listaMensagem && listaMensagem.length > 0) {
    const errors: string[] = [];
    for (const msg of listaMensagem) {
      const codigo = extractFromXml(msg, "Codigo") || extractFromXml(msg, "codigo");
      const mensagem = extractFromXml(msg, "Mensagem") || extractFromXml(msg, "mensagem");
      const correcao = extractFromXml(msg, "Correcao") || extractFromXml(msg, "correcao");
      if (codigo || mensagem) {
        errors.push(`${codigo || "?"}: ${mensagem || "Erro desconhecido"}${correcao ? ` (Correção: ${correcao})` : ""}`);
      }
    }

    const hasNfse = responseBody.includes("<nNFSe>") || responseBody.includes("<Numero>");
    if (errors.length > 0 && !hasNfse) {
      return {
        success: false,
        error: errors.join("; "),
        xmlContent: responseBody,
      };
    }
  }

  const numeroNota = extractFromXml(returnContent, "nNFSe") ||
    extractFromXml(returnContent, "Numero") ||
    extractFromXml(responseBody, "nNFSe") ||
    extractFromXml(responseBody, "Numero");

  const codigoVerificacao = extractFromXml(returnContent, "CodigoVerificacao") ||
    extractFromXml(returnContent, "cVerifNFSe") ||
    extractFromXml(responseBody, "CodigoVerificacao") ||
    extractFromXml(responseBody, "cVerifNFSe");

  const linkNota = extractFromXml(returnContent, "linkNFSe") ||
    extractFromXml(responseBody, "linkNFSe");

  if (numeroNota) {
    return {
      success: true,
      numeroNota,
      codigoVerificacao,
      linkNota,
      xmlContent: responseBody,
    };
  }

  if (responseBody.includes("<CompNfse>") || responseBody.includes("<NFSe>") || responseBody.includes("<Nfse>")) {
    return {
      success: true,
      numeroNota: numeroNota || "Gerada",
      codigoVerificacao,
      linkNota,
      xmlContent: responseBody,
    };
  }

  return {
    success: false,
    error: `Resposta inesperada do webservice COPLAN. Verifique o XML de retorno.`,
    xmlContent: responseBody,
  };
}

export async function emitirNfse(params: EmitirNfseParams): Promise<NfseResult> {
  const { config } = params;

  if (!config.certificadoPfxBase64) {
    return { success: false, error: "Certificado digital (A1) não configurado." };
  }

  try {
    const pfxBuffer = Buffer.from(config.certificadoPfxBase64, "base64");
    const { certPem, keyPem } = extractCertAndKeyFromPfx(pfxBuffer, config.certificadoSenha);

    const gerarNfseXml = buildGerarNfseEnvioXml(params);
    const signedXml = signDpsInGerarNfseEnvio(gerarNfseXml, certPem, keyPem);
    const soapEnvelope = wrapInSoapEnvelope(signedXml);

    const wsUrl = buildWebserviceUrl(config);

    console.log(`[nfse-coplan] Emitindo DPS ${params.numeroDps} ambiente=${config.ambiente} url=${wsUrl}`);
    console.log(`[nfse-coplan] GerarNfseEnvio XML (assinado) preview:\n${signedXml.slice(0, 2000)}`);
    console.log(`[nfse-coplan] SOAP envelope size: ${soapEnvelope.length}B`);

    const response = await makeHttpsRequest(
      wsUrl,
      soapEnvelope,
      pfxBuffer,
      config.certificadoSenha
    );

    console.log(`[nfse-coplan] HTTP ${response.statusCode} - Resposta: ${response.body.slice(0, 2000)}`);

    if (response.statusCode === 0 || response.statusCode >= 500) {
      return {
        success: false,
        error: `Erro HTTP ${response.statusCode} do webservice COPLAN: ${response.body.slice(0, 500)}`,
        xmlContent: response.body,
      };
    }

    return parseSoapResponse(response.body);
  } catch (err: any) {
    console.error("[nfse-coplan] Erro ao emitir:", err);
    return {
      success: false,
      error: err?.message || "Erro de conexão ao webservice NFS-e COPLAN.",
    };
  }
}

export function getNfseConfig(settingsMap: Record<string, string>): NfseConfig | null {
  if (settingsMap["nfse_enabled"] !== "true") return null;
  return {
    enabled: true,
    ambiente: (settingsMap["nfse_ambiente"] as "producao" | "homologacao") || "homologacao",
    webserviceUrl: settingsMap["nfse_webservice_url"] || "",
    municipioNome: settingsMap["nfse_municipio_nome"] || "sinop",
    cnpjPrestador: settingsMap["nfse_cnpj_prestador"] || "",
    inscricaoMunicipal: settingsMap["nfse_inscricao_municipal"] || "",
    municipioCodigo: settingsMap["nfse_municipio_codigo"] || "5107909",
    razaoSocial: settingsMap["nfse_razao_social"] || "",
    nomeFantasia: settingsMap["nfse_nome_fantasia"] || "",
    emailPrestador: settingsMap["nfse_email_prestador"] || "",
    logradouro: settingsMap["nfse_logradouro"] || "",
    numero: settingsMap["nfse_numero"] || "",
    bairro: settingsMap["nfse_bairro"] || "",
    cep: settingsMap["nfse_cep"] || "",
    uf: settingsMap["nfse_uf"] || "",
    cTribNac: settingsMap["nfse_ctrib_nac"] || "140601",
    cTribMun: settingsMap["nfse_ctrib_mun"] || "",
    cNBS: settingsMap["nfse_cnbs"] || "101061900",
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
      "Prestacao de servicos de engenharia e homologacao de sistemas fotovoltaicos",
  };
}
