import { storage } from "./storage";
import { hashPassword } from "./auth";

export async function seedDatabase() {
  try {
    // Create admin user if not exists
    const adminExists = await storage.getUserByUsername("admin");
    if (!adminExists) {
      await storage.createUser({
        username: "admin",
        password: await hashPassword("admin123"),
        role: "admin",
        name: "Randoli Engenharia",
        email: "admin@randoli.eng.br",
        clientType: "PJ",
      });
      console.log("[seed] Admin criado: admin / admin123");
    }

    const clients = await storage.getClients();
    if (clients.length > 0) return;

    // Create demo integrador accounts
    const intUser1 = await storage.createUser({
      username: "joao.integrador",
      password: await hashPassword("senha123"),
      role: "integrador",
      name: "João Carlos Silva",
      email: "joao.silva@solarjoao.com",
      phone: "(11) 98765-4321",
      cpfCnpj: "123.456.789-00",
      clientType: "PF",
      address: "Rua das Flores, 123 - São Paulo, SP",
    });

    const intUser2 = await storage.createUser({
      username: "solartech",
      password: await hashPassword("senha123"),
      role: "integrador",
      name: "Solar Tech Ltda",
      email: "contato@solartech.com.br",
      phone: "(21) 3456-7890",
      cpfCnpj: "12.345.678/0001-90",
      clientType: "PJ",
      company: "Solar Tech Ltda",
      address: "Av. Paulista, 1000 - São Paulo, SP",
    });

    const c1 = await storage.createClient({
      name: "João Carlos Silva",
      email: "joao.silva@solarjoao.com",
      phone: "(11) 98765-4321",
      cpfCnpj: "123.456.789-00",
      type: "PF",
      address: "Rua das Flores, 123 - São Paulo, SP",
      userId: intUser1.id,
    });

    const c2 = await storage.createClient({
      name: "Solar Tech Ltda",
      email: "contato@solartech.com.br",
      phone: "(21) 3456-7890",
      cpfCnpj: "12.345.678/0001-90",
      type: "PJ",
      company: "Solar Tech Ltda",
      address: "Av. Paulista, 1000 - São Paulo, SP",
      userId: intUser2.id,
    });

    const c3 = await storage.createClient({
      name: "Maria Aparecida Souza",
      email: "maria.souza@gmail.com",
      phone: "(31) 99876-5432",
      cpfCnpj: "987.654.321-00",
      type: "PF",
      address: "Rua Belo Horizonte, 456 - Belo Horizonte, MG",
    });

    const p1 = await storage.createProject({
      clientId: c1.id,
      title: "Sistema Fotovoltaico 5kWp Residencial",
      description: "Instalação de 12 painéis de 425W com inversor trifásico. Homologação concluída.",
      status: "homologado",
      potencia: "5.1",
      valor: "28.500,00",
      endereco: "Rua das Flores, 123 - São Paulo, SP",
      concessionaria: "ENEL SP",
      numeroProtocolo: "ENEL-2025-089234",
      numeroInstalacao: "3001234567",
      tipoConexao: "trifasico",
    });

    await storage.addTimelineEntry({ projectId: p1.id, event: "Projeto solicitado", details: "Integrador enviou solicitação com documentação inicial.", createdByRole: "integrador" });
    await storage.addTimelineEntry({ projectId: p1.id, event: "Status atualizado: Projeto Técnico", details: "Equipe Randoli iniciou elaboração do projeto técnico.", createdByRole: "admin" });
    await storage.addTimelineEntry({ projectId: p1.id, event: "Status atualizado: Protocolado na Concessionária", details: "Documentação protocolada na ENEL SP. Protocolo: ENEL-2025-089234", createdByRole: "admin" });
    await storage.addTimelineEntry({ projectId: p1.id, event: "Status atualizado: Parecer de Acesso Emitido", details: "Concessionária emitiu parecer favorável.", createdByRole: "admin" });
    await storage.addTimelineEntry({ projectId: p1.id, event: "Status atualizado: Homologado — Conexão Aprovada", details: "Sistema homologado e conectado à rede. Processo concluído com sucesso!", createdByRole: "admin" });

    const p2 = await storage.createProject({
      clientId: c2.id,
      title: "Usina Solar 100kWp Comercial",
      description: "Projeto para cobertura de galpão industrial com 235 painéis bifaciais.",
      status: "vistoria",
      potencia: "100",
      valor: "380.000,00",
      endereco: "Av. Paulista, 1000 - São Paulo, SP",
      concessionaria: "ENEL SP",
      numeroProtocolo: "ENEL-2025-102567",
      numeroInstalacao: "4005678901",
      tipoConexao: "trifasico",
    });

    await storage.addTimelineEntry({ projectId: p2.id, event: "Projeto solicitado", details: "Solar Tech Ltda enviou documentação para projeto de 100kWp.", createdByRole: "integrador" });
    await storage.addTimelineEntry({ projectId: p2.id, event: "Status atualizado: Projeto Técnico", details: "Projeto técnico em elaboração.", createdByRole: "admin" });
    await storage.addTimelineEntry({ projectId: p2.id, event: "Status atualizado: Protocolado na Concessionária", details: "Protocolo enviado à ENEL SP.", createdByRole: "admin" });
    await storage.addTimelineEntry({ projectId: p2.id, event: "Status atualizado: Parecer de Acesso Emitido", details: "Parecer de acesso favorável emitido.", createdByRole: "admin" });
    await storage.addTimelineEntry({ projectId: p2.id, event: "Status atualizado: Em Instalação", details: "Instalação em andamento no local.", createdByRole: "admin" });
    await storage.addTimelineEntry({ projectId: p2.id, event: "Status atualizado: Aguardando Vistoria", details: "Instalação concluída. Aguardando vistoria da ENEL SP.", createdByRole: "admin" });

    const p3 = await storage.createProject({
      clientId: c1.id,
      title: "Carport Solar 15kWp",
      description: "Cobertura solar para estacionamento residencial.",
      status: "projeto_tecnico",
      potencia: "15",
      valor: "65.000,00",
      endereco: "Rua das Flores, 123 - São Paulo, SP",
      concessionaria: "ENEL SP",
      numeroProtocolo: "",
      numeroInstalacao: "3001234567",
      tipoConexao: "trifasico",
    });

    await storage.addTimelineEntry({ projectId: p3.id, event: "Projeto solicitado", details: "Documentação recebida para Carport Solar.", createdByRole: "integrador" });
    await storage.addTimelineEntry({ projectId: p3.id, event: "Status atualizado: Projeto Técnico", details: "Elaboração do projeto técnico iniciada.", createdByRole: "admin" });

    const p4 = await storage.createProject({
      clientId: c3.id,
      title: "Sistema Residencial 3.5kWp",
      description: "Kit solar residencial com 8 módulos e inversor on-grid.",
      status: "orcamento",
      potencia: "3.5",
      valor: "18.200,00",
      endereco: "Rua Belo Horizonte, 456 - BH, MG",
      concessionaria: "CEMIG",
      tipoConexao: "monofasico",
    });

    await storage.addTimelineEntry({ projectId: p4.id, event: "Projeto solicitado", details: "Proposta enviada para análise.", createdByRole: "integrador" });

    // Partners
    await storage.createPartner({ name: "Canadian Solar", logoUrl: "", website: "https://www.canadiansolar.com", sortOrder: 1 });
    await storage.createPartner({ name: "Growatt", logoUrl: "", website: "https://www.ginverter.com", sortOrder: 2 });
    await storage.createPartner({ name: "Intelbras", logoUrl: "", website: "https://www.intelbras.com.br", sortOrder: 3 });
    await storage.createPartner({ name: "Fronius", logoUrl: "", website: "https://www.fronius.com", sortOrder: 4 });

    // Settings
    await storage.setSiteSetting("company_name", "Randoli Engenharia Solar");
    await storage.setSiteSetting("logo_url", "");

    // AI — Solar Irradiation (cidades brasileiras principais)
    const irradiationData = [
      { city: "São Paulo", state: "SP", irradiationKwhM2Day: "4.50" },
      { city: "Campinas", state: "SP", irradiationKwhM2Day: "4.60" },
      { city: "Ribeirão Preto", state: "SP", irradiationKwhM2Day: "4.80" },
      { city: "Rio de Janeiro", state: "RJ", irradiationKwhM2Day: "4.80" },
      { city: "Niterói", state: "RJ", irradiationKwhM2Day: "4.75" },
      { city: "Belo Horizonte", state: "MG", irradiationKwhM2Day: "5.00" },
      { city: "Uberlândia", state: "MG", irradiationKwhM2Day: "5.10" },
      { city: "Brasília", state: "DF", irradiationKwhM2Day: "5.50" },
      { city: "Curitiba", state: "PR", irradiationKwhM2Day: "4.20" },
      { city: "Londrina", state: "PR", irradiationKwhM2Day: "4.50" },
      { city: "Porto Alegre", state: "RS", irradiationKwhM2Day: "4.00" },
      { city: "Caxias do Sul", state: "RS", irradiationKwhM2Day: "3.90" },
      { city: "Florianópolis", state: "SC", irradiationKwhM2Day: "4.30" },
      { city: "Joinville", state: "SC", irradiationKwhM2Day: "4.20" },
      { city: "Salvador", state: "BA", irradiationKwhM2Day: "5.50" },
      { city: "Feira de Santana", state: "BA", irradiationKwhM2Day: "5.60" },
      { city: "Fortaleza", state: "CE", irradiationKwhM2Day: "5.80" },
      { city: "Recife", state: "PE", irradiationKwhM2Day: "5.60" },
      { city: "Natal", state: "RN", irradiationKwhM2Day: "5.90" },
      { city: "João Pessoa", state: "PB", irradiationKwhM2Day: "5.80" },
      { city: "Maceió", state: "AL", irradiationKwhM2Day: "5.70" },
      { city: "Aracaju", state: "SE", irradiationKwhM2Day: "5.60" },
      { city: "Manaus", state: "AM", irradiationKwhM2Day: "4.50" },
      { city: "Belém", state: "PA", irradiationKwhM2Day: "4.60" },
      { city: "Goiânia", state: "GO", irradiationKwhM2Day: "5.40" },
      { city: "Cuiabá", state: "MT", irradiationKwhM2Day: "5.20" },
      { city: "Campo Grande", state: "MS", irradiationKwhM2Day: "5.00" },
      { city: "Teresina", state: "PI", irradiationKwhM2Day: "5.70" },
      { city: "São Luís", state: "MA", irradiationKwhM2Day: "5.30" },
      { city: "Porto Velho", state: "RO", irradiationKwhM2Day: "4.40" },
    ];
    const existingIrr = await storage.getSolarIrradiation();
    if (existingIrr.length === 0) {
      for (const d of irradiationData) await storage.createSolarIrradiation(d);
      console.log("[seed] Irradiação solar: 30 cidades inseridas.");
    }

    // AI — Solar Panels
    const panelData = [
      { brand: "Canadian Solar", model: "CS6L-455MS", powerW: 455, efficiencyPct: "20.50", voltageVoc: "49.40", currentIsc: "11.58" },
      { brand: "Canadian Solar", model: "CS3W-400P", powerW: 400, efficiencyPct: "19.80", voltageVoc: "48.00", currentIsc: "10.50" },
      { brand: "JA Solar", model: "JAM72S30-540/MR", powerW: 540, efficiencyPct: "21.00", voltageVoc: "51.70", currentIsc: "13.18" },
      { brand: "LONGi", model: "LR5-72HIH-545M", powerW: 545, efficiencyPct: "21.30", voltageVoc: "51.40", currentIsc: "13.30" },
      { brand: "BYD", model: "P3HB-144-550W", powerW: 550, efficiencyPct: "21.30", voltageVoc: "50.80", currentIsc: "13.60" },
      { brand: "Risen Energy", model: "RSM144-7-550M", powerW: 550, efficiencyPct: "21.00", voltageVoc: "51.10", currentIsc: "13.44" },
      { brand: "Trina Solar", model: "TSM-DE17M(II)-410", powerW: 410, efficiencyPct: "21.00", voltageVoc: "49.20", currentIsc: "10.54" },
      { brand: "Jinko Solar", model: "JKM455M-60HL4-V", powerW: 455, efficiencyPct: "21.00", voltageVoc: "49.60", currentIsc: "11.62" },
      { brand: "Astronergy", model: "CHSM72M-540", powerW: 540, efficiencyPct: "20.80", voltageVoc: "50.40", currentIsc: "13.50" },
      { brand: "Intelbras", model: "IFP108N-440", powerW: 440, efficiencyPct: "20.40", voltageVoc: "49.80", currentIsc: "11.20" },
    ];
    const existingPanels = await storage.getSolarPanels();
    if (existingPanels.length === 0) {
      for (const p of panelData) await storage.createSolarPanel(p);
      console.log("[seed] Painéis solares: 10 modelos inseridos.");
    }

    // AI — Solar Inverters
    const inverterData = [
      { brand: "Growatt", model: "MIN 3000TL-X", powerKw: "3.00", phases: 1, mpptCount: 2, minMpptVoltage: 80, maxMpptVoltage: 500 },
      { brand: "Growatt", model: "MID 5000TL3-X", powerKw: "5.00", phases: 3, mpptCount: 2, minMpptVoltage: 90, maxMpptVoltage: 560 },
      { brand: "Growatt", model: "MAX 15000TL3-X", powerKw: "15.00", phases: 3, mpptCount: 3, minMpptVoltage: 90, maxMpptVoltage: 800 },
      { brand: "Fronius", model: "Primo 3.6-1", powerKw: "3.60", phases: 1, mpptCount: 2, minMpptVoltage: 80, maxMpptVoltage: 600 },
      { brand: "Fronius", model: "Symo 6.0-3-M", powerKw: "6.00", phases: 3, mpptCount: 2, minMpptVoltage: 150, maxMpptVoltage: 800 },
      { brand: "SMA", model: "Sunny Boy 5.0", powerKw: "5.00", phases: 1, mpptCount: 2, minMpptVoltage: 125, maxMpptVoltage: 600 },
      { brand: "SMA", model: "Sunny Tripower 10.0", powerKw: "10.00", phases: 3, mpptCount: 2, minMpptVoltage: 150, maxMpptVoltage: 800 },
      { brand: "Huawei", model: "SUN2000-5KTL-L1", powerKw: "5.00", phases: 1, mpptCount: 2, minMpptVoltage: 80, maxMpptVoltage: 560 },
      { brand: "Huawei", model: "SUN2000-20KTL-M3", powerKw: "20.00", phases: 3, mpptCount: 4, minMpptVoltage: 160, maxMpptVoltage: 1000 },
      { brand: "WEG", model: "SIW300H M020", powerKw: "20.00", phases: 3, mpptCount: 2, minMpptVoltage: 200, maxMpptVoltage: 800 },
    ];
    const existingInverters = await storage.getSolarInverters();
    if (existingInverters.length === 0) {
      for (const inv of inverterData) await storage.createSolarInverter(inv);
      console.log("[seed] Inversores solares: 10 modelos inseridos.");
    }

    console.log("[seed] Dados de exemplo inseridos com sucesso!");
    console.log("[seed] Logins de teste:");
    console.log("[seed]   Admin: admin / admin123");
    console.log("[seed]   Integrador 1: joao.integrador / senha123");
    console.log("[seed]   Integrador 2: solartech / senha123");
  } catch (err) {
    console.error("[seed] Erro:", err);
  }
}
