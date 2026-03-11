import https from "https";
import { URL } from "url";

export interface NfseConfig {
  enabled: boolean;
  ambiente: "producao" | "homologacao";
  webserviceUrl: string;
  cnpjPrestador: string;
  inscricaoMunicipal: string;
  municipioCodigo: string;
  razaoSocial: string;
  codigoServico: string;
  aliquotaIss: string;
  regimeTributacao: string;
  naturezaOperacao: string;
  serieRps: string;
  proximoRps: number;
  informacoesComplementares: string;
  certificadoPfxBase64: string;
  certificadoSenha: string;
  descricaoServico: string;
}

export interface EmitirNfseParams {
  config: NfseConfig;
  numeroRps: string;
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

function buildRpsXml(params: EmitirNfseParams): string {
  const cfg = params.config;
  const now = params.dataEmissao ?? new Date();
  const dataStr = now.toISOString().replace("Z", "");
  const competencia = now.toISOString().split("T")[0];
  const descricao = params.descricaoServico || cfg.descricaoServico || "Prestação de serviços de engenharia solar fotovoltaica";
  const complementares = cfg.informacoesComplementares || "EMITIDO POR ME OU EPP OPTANTE PELO Simples Nacional";

  const tomadorPF = !params.tomadorCpfCnpj?.includes("/");
  const cpfCnpjTag = tomadorPF
    ? `<Cpf>${params.tomadorCpfCnpj?.replace(/\D/g, "")}</Cpf>`
    : `<Cnpj>${params.tomadorCpfCnpj?.replace(/\D/g, "")}</Cnpj>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<EnviarLoteRpsEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
  <LoteRps Id="lote1" versao="2.02">
    <NumeroLote>1</NumeroLote>
    <CpfCnpj>
      <Cnpj>${cfg.cnpjPrestador.replace(/\D/g, "")}</Cnpj>
    </CpfCnpj>
    <InscricaoMunicipal>${cfg.inscricaoMunicipal}</InscricaoMunicipal>
    <QuantidadeRps>1</QuantidadeRps>
    <ListaRps>
      <Rps>
        <InfDeclaracaoPrestacaoServico Id="rps${params.numeroRps}">
          <Rps>
            <IdentificacaoRps>
              <Numero>${params.numeroRps}</Numero>
              <Serie>${cfg.serieRps}</Serie>
              <Tipo>1</Tipo>
            </IdentificacaoRps>
            <DataEmissao>${dataStr}</DataEmissao>
            <Status>1</Status>
          </Rps>
          <Competencia>${competencia}</Competencia>
          <Servico>
            <Valores>
              <ValorServicos>${parseFloat(params.valor.replace(",", ".")).toFixed(2)}</ValorServicos>
              <Aliquota>${parseFloat(cfg.aliquotaIss).toFixed(4)}</Aliquota>
            </Valores>
            <IssRetido>2</IssRetido>
            <ItemListaServico>${cfg.codigoServico}</ItemListaServico>
            <Discriminacao>${descricao}. ${complementares}</Discriminacao>
            <CodigoMunicipio>${cfg.municipioCodigo}</CodigoMunicipio>
            <ExigibilidadeISS>1</ExigibilidadeISS>
          </Servico>
          <Prestador>
            <CpfCnpj>
              <Cnpj>${cfg.cnpjPrestador.replace(/\D/g, "")}</Cnpj>
            </CpfCnpj>
            <InscricaoMunicipal>${cfg.inscricaoMunicipal}</InscricaoMunicipal>
          </Prestador>
          <Tomador>
            <IdentificacaoTomador>
              <CpfCnpj>
                ${cpfCnpjTag}
              </CpfCnpj>
            </IdentificacaoTomador>
            <RazaoSocial>${params.tomadorNome}</RazaoSocial>
            ${params.tomadorEmail ? `<Contato><Email>${params.tomadorEmail}</Email></Contato>` : ""}
            ${params.tomadorLogradouro ? `
            <Endereco>
              <Endereco>${params.tomadorLogradouro}</Endereco>
              ${params.tomadorNumero ? `<Numero>${params.tomadorNumero}</Numero>` : ""}
              ${params.tomadorBairro ? `<Bairro>${params.tomadorBairro}</Bairro>` : ""}
              ${params.tomadorCodigoMunicipio ? `<CodigoMunicipio>${params.tomadorCodigoMunicipio}</CodigoMunicipio>` : ""}
              ${params.tomadorUf ? `<Uf>${params.tomadorUf}</Uf>` : ""}
              ${params.tomadorCep ? `<Cep>${params.tomadorCep?.replace(/\D/g, "")}</Cep>` : ""}
            </Endereco>` : ""}
          </Tomador>
          <RegimeEspecialTributacao>${cfg.regimeTributacao}</RegimeEspecialTributacao>
          <OptanteSimplesNacional>1</OptanteSimplesNacional>
          <IncentivoFiscal>2</IncentivoFiscal>
        </InfDeclaracaoPrestacaoServico>
      </Rps>
    </ListaRps>
  </LoteRps>
</EnviarLoteRpsEnvio>`;
}

function buildSoapEnvelope(xml: string, method: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:e="http://www.abrasf.org.br/nfse.xsd">
  <soapenv:Header/>
  <soapenv:Body>
    <e:${method}>
      <nfseCabecMsg><![CDATA[<?xml version="1.0" encoding="UTF-8"?><cabecalho xmlns="http://www.abrasf.org.br/nfse.xsd" versao="2.02"><versaoDados>2.02</versaoDados></cabecalho>]]></nfseCabecMsg>
      <nfseDadosMsg><![CDATA[${xml}]]></nfseDadosMsg>
    </e:${method}>
  </soapenv:Body>
</soapenv:Envelope>`;
}

function makeHttpsRequest(urlStr: string, body: string, pfxBuffer: Buffer, passphrase: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: url.port ? parseInt(url.port) : 443,
      path: url.pathname + url.search,
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "SOAPAction": "",
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
    extractFromXml(xml, "MensagemErro") ||
    extractFromXml(xml, "Mensagem") ||
    extractFromXml(xml, "faultstring") ||
    extractFromXml(xml, "Correcao");
  return msg || "Erro desconhecido ao emitir NFS-e. Verifique as configurações.";
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
    const rpsXml = buildRpsXml(params);
    const soapBody = buildSoapEnvelope(rpsXml, "RecepcionarLoteRpsSincrono");

    console.log(`[nfse] Emitindo RPS ${params.numeroRps} para ${config.webserviceUrl}`);

    const response = await makeHttpsRequest(
      config.webserviceUrl,
      soapBody,
      pfxBuffer,
      config.certificadoSenha
    );

    console.log("[nfse] Resposta recebida:", response.slice(0, 500));

    if (response.includes("ListaNfse") || response.includes("Numero") && !response.includes("MensagemErro")) {
      const numeroNota = extractFromXml(response, "Numero");
      const codigoVerificacao = extractFromXml(response, "CodigoVerificacao");
      const linkNota = extractFromXml(response, "OutrasInformacoes") || extractFromXml(response, "LinkNota");

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
    console.error("[nfse] Erro ao emitir:", err);
    return { success: false, error: err?.message || "Erro de conexão ao webservice NFS-e." };
  }
}

export function getNfseConfig(settingsMap: Record<string, string>): NfseConfig | null {
  if (settingsMap["nfse_enabled"] !== "true") return null;
  return {
    enabled: true,
    ambiente: (settingsMap["nfse_ambiente"] as "producao" | "homologacao") || "producao",
    webserviceUrl: settingsMap["nfse_webservice_url"] || "",
    cnpjPrestador: settingsMap["nfse_cnpj_prestador"] || "",
    inscricaoMunicipal: settingsMap["nfse_inscricao_municipal"] || "",
    municipioCodigo: settingsMap["nfse_municipio_codigo"] || "5107909",
    razaoSocial: settingsMap["nfse_razao_social"] || "",
    codigoServico: settingsMap["nfse_codigo_servico"] || "",
    aliquotaIss: settingsMap["nfse_aliquota_iss"] || "2.00",
    regimeTributacao: settingsMap["nfse_regime_tributacao"] || "6",
    naturezaOperacao: settingsMap["nfse_natureza_operacao"] || "1",
    serieRps: settingsMap["nfse_serie_rps"] || "1",
    proximoRps: parseInt(settingsMap["nfse_proximo_rps"] || "1"),
    informacoesComplementares: settingsMap["nfse_informacoes_complementares"] || "",
    certificadoPfxBase64: settingsMap["nfse_certificado_pfx"] || "",
    certificadoSenha: settingsMap["nfse_certificado_senha"] || "",
    descricaoServico: settingsMap["nfse_descricao_servico"] || "Prestação de serviços de engenharia e homologação de sistemas fotovoltaicos",
  };
}
