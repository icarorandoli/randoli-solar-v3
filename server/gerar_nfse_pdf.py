import sys, json, re
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.graphics.barcode import qr as qr_module
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF

def ex(xml, tag):
    m = re.search(f'<{tag}[^>]*>([^<]+)</{tag}>', xml or '')
    return m.group(1).strip() if m else ''

def wrap_text(c, text, x, y, max_width, font='Helvetica', size=6.5, line_height=3.5*mm):
    """Quebra texto em múltiplas linhas"""
    c.setFont(font, size)
    words = text.split()
    lines = []
    current = ''
    for w in words:
        test = (current + ' ' + w).strip()
        if c.stringWidth(test, font, size) <= max_width:
            current = test
        else:
            if current: lines.append(current)
            current = w
    if current: lines.append(current)
    for i, line in enumerate(lines):
        c.drawString(x, y - i * line_height, line)
    return len(lines)

def gerar_pdf(nota, output_path):
    c = canvas.Canvas(output_path, pagesize=A4)
    W, H = A4
    M = 6*mm
    CW = W - 2*M  # content width

    xml = nota.get('xmlContent', '') or ''
    toma_m = re.search(r'<toma>(.*?)</toma>', xml, re.DOTALL)
    toma = toma_m.group(1) if toma_m else ''

    # Extrair dados
    nNFSe = nota.get('numeroNota') or ex(xml, 'nNFSe') or ''
    nDFSe = ex(xml, 'nDFSe')
    nDPS = ex(xml, 'nDPS')
    dhProc = ex(xml, 'dhProc')
    if dhProc:
        try:
            from datetime import datetime
            dhProc = datetime.fromisoformat(dhProc[:19]).strftime('%d/%m/%Y %H:%M')
        except: pass

    cnpj = ex(xml, 'CNPJ')
    if len(cnpj) == 14:
        cnpj = f'{cnpj[:2]}.{cnpj[2:5]}.{cnpj[5:8]}/{cnpj[8:12]}-{cnpj[12:]}'
    im = ex(xml, 'IM')
    xNome = ex(xml, 'xNome') or 'ICARO RANDOLI E SILVA LTDA'
    xFant = ex(xml, 'xFant') or 'RANDOLI SOLAR'
    xLgr = ex(xml, 'xLgr'); nro2 = ex(xml, 'nro'); xBairro = ex(xml, 'xBairro')
    uf = ex(xml, 'UF') or 'MT'
    cep = ex(xml, 'CEP')
    if len(cep)==8: cep = f'{cep[:5]}-{cep[5:]}'
    email = ex(xml, 'email')

    # Inscrição estadual do emit (pegar diferente do toma)
    emit_m = re.search(r'<emit>(.*?)</emit>', xml, re.DOTALL)
    emit_xml = emit_m.group(1) if emit_m else ''
    insc_est = '138924384'  # fixo conforme nota real

    tomNome = nota.get('tomadorNome') or ex(toma, 'xNome') or ''
    tomDoc = nota.get('tomadorCpfCnpj') or ex(toma, 'CPF') or ex(toma, 'CNPJ') or ''
    tomEnd = ex(toma, 'xLgr'); tomNro = ex(toma, 'nro'); tomBairro = ex(toma, 'xBairro')
    tomCep = ex(toma, 'CEP')
    if len(tomCep)==8: tomCep = f'{tomCep[:5]}-{tomCep[5:]}'

    xDescServ = ex(xml, 'xDescServ').upper()
    xTribNac = ex(xml, 'xTribNac')
    cNBS = ex(xml, 'cNBS')
    cVerif = nota.get('codigoVerificacao') or ''
    chave = ''
    m2 = re.search(r'Id="NFS([^"]+)"', xml)
    if m2: chave = m2.group(1)
    else: chave = f'51079091243201226000163{nNFSe}'

    vServ = nota.get('valor') or ex(xml, 'vServ') or '0'
    try: vf = f'{float(vServ):.2f}'.replace('.', ',')
    except: vf = vServ

    # Cores
    borda = colors.HexColor('#888888')
    cinza_cab = colors.HexColor('#f0f0f0')
    preto = colors.black

    def hline(y, x1=M, x2=W-M, sw=0.3):
        c.setStrokeColor(borda); c.setLineWidth(sw)
        c.line(x1, y, x2, y)

    def vline(x, y1, y2, sw=0.3):
        c.setStrokeColor(borda); c.setLineWidth(sw)
        c.line(x, y1, x, y2)

    def box(x, y, w, h, fill=None, sw=0.3):
        c.setLineWidth(sw); c.setStrokeColor(borda)
        if fill:
            c.setFillColor(fill); c.rect(x, y-h, w, h, fill=1, stroke=1)
        else:
            c.rect(x, y-h, w, h, fill=0, stroke=1)
        c.setFillColor(preto)

    def t(s, x, y, size=6.5, bold=False, align='left', color=preto):
        c.setFillColor(color)
        c.setFont('Helvetica-Bold' if bold else 'Helvetica', size)
        s = str(s)
        if align == 'right': c.drawRightString(x, y, s)
        elif align == 'center': c.drawCentredString(x, y, s)
        else: c.drawString(x, y, s)
        c.setFillColor(preto)

    def label(lbl, val, x, y, lsize=5.5, vsize=6.5, bold_val=False):
        t(lbl, x, y, size=lsize)
        t(val, x, y-3.5*mm, size=vsize, bold=bold_val)

    def secao(titulo, x, y, w, h=4.5*mm):
        box(x, y, w, h, fill=cinza_cab)
        t(titulo, x+2*mm, y-h+1.3*mm, size=6.5, bold=True)
        return y-h

    # ── CABEÇALHO ──────────────────────────────────────────────────────────────
    # Borda geral
    c.setStrokeColor(borda); c.setLineWidth(0.5)
    
    cab_h = 23*mm
    # Box cabeçalho com borda
    box(M, H-M, CW, cab_h, sw=0.5)

    # Logo real Randoli Solar
    logo_size = 19*mm
    box(M+1*mm, H-M-1*mm, logo_size, logo_size, fill=colors.white)
    try:
        import os
        logo_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'randoli_logo.png')
        if os.path.exists(logo_path):
            c.drawImage(logo_path, M+1*mm, H-M-logo_size-1*mm, width=logo_size, height=logo_size, preserveAspectRatio=True, mask='auto')
    except: pass

    # Texto central prefeitura
    t('PREFEITURA MUNICIPAL DE SINOP MT', M+22*mm, H-M-4.5*mm, size=9, bold=True)
    t('SECRETARIA DE FINANÇAS', M+22*mm, H-M-8.5*mm, size=7)
    t('AVENIDA DAS EMBAÚBAS, 1386, TÉRREO, SETOR COMERCIAL', M+22*mm, H-M-12*mm, size=6.5)
    t(f'Telefones: (66) 3520-7200', M+22*mm, H-M-15.5*mm, size=6.5)
    t(f'CNPJ: 15.024.003/0001-32', M+22*mm, H-M-18.5*mm, size=6.5)

    # Número nota (canto direito)
    t('Número da Nota Fiscal de Serviço', W-M-2*mm, H-M-4.5*mm, size=6, align='right')
    t('Série Eletrônica', W-M-2*mm, H-M-8*mm, size=6, align='right')
    t(nNFSe, W-M-2*mm, H-M-18*mm, size=13, bold=True, align='right')

    y = H-M-cab_h

    # ── DADOS DO PRESTADOR ─────────────────────────────────────────────────────
    y = secao('Dados do Prestador', M, y, CW)

    rh = 7*mm
    box(M, y, CW, rh)
    t(xNome, M+22*mm, y-2.5*mm, size=8, bold=True)
    t(xFant, M+22*mm, y-6*mm, size=7)
    # Logo menor na seção prestador
    box(M+1*mm, y-0.5*mm, 18*mm, rh-1*mm, fill=colors.white)
    try:
        import os
        logo_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'randoli_logo.png')
        if os.path.exists(logo_path):
            c.drawImage(logo_path, M+1*mm, y-rh+0.5*mm, width=18*mm, height=rh-1*mm, preserveAspectRatio=True, mask='auto')
    except: pass
    y -= rh

    rh = 5*mm
    box(M, y, CW, rh)
    t('CPF/CNPJ:', M+2*mm, y-1.5*mm, size=5.5, bold=True)
    t(cnpj, M+2*mm, y-4.5*mm, size=6.5)
    vline(M+65*mm, y, y-rh)
    t('Inscrição Municipal:', M+67*mm, y-1.5*mm, size=5.5, bold=True)
    t(im, M+67*mm, y-4.5*mm, size=7)
    vline(M+100*mm, y, y-rh)
    t('Inscrição Estadual:', M+102*mm, y-1.5*mm, size=5.5, bold=True)
    t(insc_est, M+102*mm, y-4.5*mm, size=7)
    y -= rh

    rh = 5*mm
    box(M, y, CW, rh)
    t('End.:', M+2*mm, y-1.5*mm, size=5.5, bold=True)
    t(f'HATSUE SAKAGUSCHI, Nº {nro2}, {xBairro}', M+14*mm, y-1.5*mm, size=6.5)
    t('Complemento:', M+2*mm, y-4.5*mm, size=5.5, bold=True)
    vline(M+100*mm, y, y-rh)
    t('Cidade:', M+102*mm, y-1.5*mm, size=5.5, bold=True)
    t(f'SINOP - {uf}', M+102*mm, y-4.5*mm, size=6.5)
    y -= rh

    rh = 5*mm
    box(M, y, CW, rh)
    t('Telefone:', M+2*mm, y-1.5*mm, size=5.5, bold=True)
    vline(M+50*mm, y, y-rh)
    t('Email:', M+52*mm, y-1.5*mm, size=5.5, bold=True)
    t(email, M+52*mm, y-4.5*mm, size=6.5)
    y -= rh

    # ── IDENTIFICAÇÃO ──────────────────────────────────────────────────────────
    y = secao('Identificação da Nota Fiscal Eletrônica', M, y, CW)

    rh = 5*mm
    box(M, y, CW, rh)
    t('Chave da NFSe:', M+2*mm, y-1.5*mm, size=5.5, bold=True)
    t(chave, M+28*mm, y-1.5*mm, size=6)
    t('Código de Autenticidade', W-M-40*mm, y-1.5*mm, size=5.5, bold=True)
    t(cVerif or '—', W-M-40*mm, y-4.5*mm, size=7, bold=True)
    y -= rh

    # QR Code (canto direito desta seção)
    qr_size = 22*mm
    qr_y_start = y  # posição atual

    rh = 5*mm
    box(M, y, CW - qr_size - 2*mm, rh)
    t('Natureza da Operação', M+2*mm, y-1.5*mm, size=5.5, bold=True)
    t('EXIGIVEL', M+2*mm, y-4.5*mm, size=7, bold=True)
    vline(M+60*mm, y, y-rh)
    t('Data e Hora de Emissão da NFS-e', M+62*mm, y-1.5*mm, size=5.5, bold=True)
    t(dhProc, M+62*mm, y-4.5*mm, size=7)
    y -= rh

    rh = 5*mm
    box(M, y, CW - qr_size - 2*mm, rh)
    t('Número do DPS', M+2*mm, y-1.5*mm, size=5.5, bold=True)
    t(nDPS, M+2*mm, y-4.5*mm, size=7)
    vline(M+60*mm, y, y-rh)
    t('Data de Emissão da Nota Fiscal', M+62*mm, y-1.5*mm, size=5.5, bold=True)
    t(dhProc[:10] if dhProc else '', M+62*mm, y-4.5*mm, size=7)
    vline(CW - qr_size, y, y-rh)
    t('Série da Nota Fiscal', M+CW-qr_size-35*mm, y-1.5*mm, size=5.5, bold=True)
    t('1', M+CW-qr_size-35*mm, y-4.5*mm, size=7)
    y -= rh

    # QR Code
    try:
        qr_widget = qr_module.QrCodeWidget(chave)
        bounds = qr_widget.getBounds()
        qw = bounds[2]-bounds[0]; qh = bounds[3]-bounds[1]
        d = Drawing(qr_size, qr_size, transform=[qr_size/qw, 0, 0, qr_size/qh, 0, 0])
        d.add(qr_widget)
        renderPDF.draw(d, c, W-M-qr_size-1*mm, y)
        box(W-M-qr_size-1*mm, qr_y_start-5*mm, qr_size+1*mm, qr_y_start-5*mm-y+qr_size)
    except: pass

    # ── DADOS DO TOMADOR ───────────────────────────────────────────────────────
    y = secao('Dados do Tomador de Serviço', M, y, CW)

    rh = 5*mm
    box(M, y, CW, rh)
    cw4 = CW/4
    t('CNPJ/CPF', M+2*mm, y-1.5*mm, size=5.5, bold=True)
    t(tomDoc, M+2*mm, y-4.5*mm, size=6.5)
    vline(M+cw4, y, y-rh)
    t('Inscrição Estadual', M+cw4+2*mm, y-1.5*mm, size=5.5, bold=True)
    vline(M+cw4*2, y, y-rh)
    t('Inscrição Municipal', M+cw4*2+2*mm, y-1.5*mm, size=5.5, bold=True)
    vline(M+cw4*3, y, y-rh)
    t('Razão Social', M+cw4*3+2*mm, y-1.5*mm, size=5.5, bold=True)
    t(tomNome, M+cw4*3+2*mm, y-4.5*mm, size=6.5)
    y -= rh

    rh = 5*mm
    box(M, y, CW, rh)
    cw3 = CW/3
    t('Endereço', M+2*mm, y-1.5*mm, size=5.5, bold=True)
    t(tomEnd, M+2*mm, y-4.5*mm, size=6.5)
    vline(M+cw3*1.5, y, y-rh)
    t('Número', M+cw3*1.5+2*mm, y-1.5*mm, size=5.5, bold=True)
    t(tomNro, M+cw3*1.5+2*mm, y-4.5*mm, size=7)
    vline(M+cw3*2, y, y-rh)
    t('Complemento', M+cw3*2+2*mm, y-1.5*mm, size=5.5, bold=True)
    vline(M+cw3*2.7, y, y-rh)
    t('Bairro', M+cw3*2.7+2*mm, y-1.5*mm, size=5.5, bold=True)
    t(tomBairro, M+cw3*2.7+2*mm, y-4.5*mm, size=6.5)
    y -= rh

    rh = 5*mm
    box(M, y, CW, rh)
    cw5 = CW/5
    t('CEP', M+2*mm, y-1.5*mm, size=5.5, bold=True)
    t(tomCep, M+2*mm, y-4.5*mm, size=6.5)
    vline(M+cw5, y, y-rh)
    t('Cidade', M+cw5+2*mm, y-1.5*mm, size=5.5, bold=True)
    t('SINOP', M+cw5+2*mm, y-4.5*mm, size=7)
    vline(M+cw5*2.5, y, y-rh)
    t('UF', M+cw5*2.5+2*mm, y-1.5*mm, size=5.5, bold=True)
    t('MT', M+cw5*2.5+2*mm, y-4.5*mm, size=7)
    vline(M+cw5*3, y, y-rh)
    t('Telefone', M+cw5*3+2*mm, y-1.5*mm, size=5.5, bold=True)
    vline(M+cw5*4, y, y-rh)
    t('Email', M+cw5*4+2*mm, y-1.5*mm, size=5.5, bold=True)
    y -= rh

    # ── DESCRIÇÃO DOS SERVIÇOS ────────────────────────────────────────────────
    y = secao('Descrição dos Serviços', M, y, CW)

    rh = 32*mm
    box(M, y, CW, rh)
    c.setFont('Helvetica', 7); c.setFillColor(preto)
    c.drawString(M+2*mm, y-4*mm, xDescServ)
    # Valor total (rodapé desta caixa)
    hline(y-28*mm, M, W-M)
    t('VALOR TOTAL DA NFS-e:  R$', W-M-45*mm, y-31.5*mm, size=7, bold=True)
    t(vf, W-M-2*mm, y-31.5*mm, size=8, bold=True, align='right')
    y -= rh

    # ── ISSQN ─────────────────────────────────────────────────────────────────
    y = secao('Imposto Sobre Serviços de Qualquer Natureza - ISSQN', M, y, CW)

    # Atividade do Município
    rh = 4*mm
    box(M, y, CW, rh)
    t('Atividade do Município', M+2*mm, y-3*mm, size=5.5, bold=True)
    y -= rh

    rh = 5*mm
    box(M, y, CW, rh)
    ativ = f'14.06 - {xTribNac}' if xTribNac else '14.06 - Instalação e montagem de aparelhos, máquinas e equipamentos, inclusive montagem industrial, prestados ao usuário final, exclusivamente com material por ele fornecido.'
    c.setFont('Helvetica', 5.5); c.setFillColor(preto)
    c.drawString(M+2*mm, y-2*mm, ativ[:165])
    c.drawString(M+2*mm, y-4.5*mm, ativ[165:330])
    y -= rh

    # NBS + Alíquota/Item/CNAE
    rh = 9*mm
    nbs_w = CW - 50*mm
    box(M, y, nbs_w, rh)
    t('NBS', M+2*mm, y-1.5*mm, size=5.5, bold=True)
    c.setFont('Helvetica', 5.5); c.setFillColor(preto)
    c.drawString(M+2*mm, y-5*mm, f'{cNBS} - SERVIÇOS DE INSTALAÇÃO ELÉTRICA NÃO CLASSIFICADOS EM SUBPOSIÇÕES ANTERIORES')
    # Aliquota/Item/CNAE (3 colunas)
    aw = 50*mm/3
    for i,(lb,vl) in enumerate([('Alíquota','0,00'),('Item 116/2003','14'),('CNAE','0000-0/00')]):
        bx = M+nbs_w+i*aw
        box(bx, y, aw, rh)
        t(lb, bx+1.5*mm, y-1.5*mm, size=5)
        t(vl, bx+1.5*mm, y-6*mm, size=7)
    y -= rh

    # Tabela de valores (lista)
    campos = [
        ('Valor Total dos Serviços', f'R$\n{vf}'),
        ('Base de Cálculo', f'R$\n{vf}'),
        ('Desconto Incondicionado', 'R$\n0,00'),
        ('Desconto Condicionado', 'R$\n0,00'),
        ('Deduções (Material)', 'R$\n0,00'),
        ('Deduções Base de Cálculo', 'R$\n0,00'),
        ('ISSQN Devido', 'R$\n0,00'),
        ('ISSQN Retido', 'NÃO'),
    ]
    for lb, vl in campos:
        rh = 4*mm
        box(M, y, CW*0.7, rh)
        t(lb, M+2*mm, y-3*mm, size=6)
        box(M+CW*0.7, y, CW*0.3, rh)
        parts = vl.split('\n')
        if len(parts)==2:
            t(parts[0], M+CW*0.7+2*mm, y-3*mm, size=5.5)
            t(parts[1], W-M-2*mm, y-3*mm, size=6.5, align='right')
        else:
            t(vl, W-M-2*mm, y-3*mm, size=6.5, align='right')
        y -= rh

    # ── TRIBUTAÇÃO FEDERAL ────────────────────────────────────────────────────
    y = secao('Tributação Federal', M, y, CW)

    rh = 8*mm
    box(M, y, CW, rh)
    feds = [('PIS Devido','0,00'),('COFINS Devido','0,00'),('INSS','0,00'),('IRRF','0,00'),('PIS/COFINS/CSLL Retido','0,00'),('Outras Retenções','0,00'),('ISSQN','0,00')]
    fw = CW/len(feds)
    for i,(lb,vl) in enumerate(feds):
        bx = M+i*fw
        if i>0: vline(bx, y, y-rh)
        t(lb, bx+1.5*mm, y-1.5*mm, size=4.8, bold=True)
        t(vl, bx+1.5*mm, y-6*mm, size=7)
    y -= rh

    # Valor líquido
    rh = 4*mm
    box(M, y, CW, rh)
    t('Valor líquido da Nota Fiscal', M+2*mm, y-3*mm, size=6)
    t(vf, W-M-2*mm, y-3*mm, size=6.5, align='right')
    y -= rh

    # ── IBS CBS ───────────────────────────────────────────────────────────────
    y = secao('IBS CBS', M, y, CW)

    rh = 8*mm
    box(M, y, CW, rh)
    ibs = [('Base de Cálculo','0,00'),('Aliq. IBS %','0,10'),('Aliq CBS %','0,90'),('Valor IBS','0,00'),('Valor CBS','0,00')]
    iw = CW/len(ibs)
    for i,(lb,vl) in enumerate(ibs):
        bx = M+i*iw
        if i>0: vline(bx, y, y-rh)
        t(lb, bx+2*mm, y-1.5*mm, size=5.5, bold=True)
        t(vl, bx+2*mm, y-6*mm, size=7)
    y -= rh

    # ── INFORMAÇÕES COMPLEMENTARES ────────────────────────────────────────────
    y = secao('Informações Complementares', M, y, CW)

    rh = 12*mm
    box(M, y, CW, rh)
    info = '/ ESTA NOTA PODE SER CANCELADA EM 24 HORAS APÓS A GERAÇÃO. / PROCON/MT: Rua BALTAZAR NAVARROS, nº 567 - Bairro BANDEIRANTES - CUIABÁ/MT FONE: 151 E (65)3613 8500 / ESTA NFSE FOI EMITIDA VIA WEBSERVICES.'
    c.setFont('Helvetica', 6); c.setFillColor(preto)
    c.drawString(M+2*mm, y-3.5*mm, info[:135])
    c.drawString(M+2*mm, y-6.5*mm, info[135:270])
    if len(info)>270: c.drawString(M+2*mm, y-9.5*mm, info[270:])

    c.save()

if __name__ == '__main__':
    nota = json.loads(sys.argv[1])
    gerar_pdf(nota, sys.argv[2])
