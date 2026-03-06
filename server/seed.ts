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

    console.log("[seed] Dados de exemplo inseridos com sucesso!");
    console.log("[seed] Logins de teste:");
    console.log("[seed]   Admin: admin / admin123");
    console.log("[seed]   Integrador 1: joao.integrador / senha123");
    console.log("[seed]   Integrador 2: solartech / senha123");
  } catch (err) {
    console.error("[seed] Erro:", err);
  }
}
