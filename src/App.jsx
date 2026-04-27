import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Building2,
  Users,
  FileText,
  Wallet,
  AlertTriangle,
  Plus,
  Search,
  Home,
  TrendingUp,
  Wrench,
  CheckCircle2,
  XCircle,
  Clock,
  Menu,
  BarChart3,
  Loader2,
  Trash2,
  PieChart,
  UserCog,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "./lib/supabase";
import jsPDF from "jspdf";

function generateLeaseContractPDF(contract, profile) {
  const doc = new jsPDF();
  const tenant = contract.inquilinos || {};
  const property = contract.propriedades || {};

  const hasMulta = Number(contract.multa_atraso || 0) > 0;
  const hasJuros = Number(contract.juros_atraso || 0) > 0;
  const hasCaucao = Number(contract.caucao || 0) > 0;

  const landlordAddress = [profile?.endereco, profile?.cidade, profile?.estado, profile?.cep]
    .filter(Boolean)
    .join(", ");
  const tenantAddress = [tenant?.endereco, tenant?.cidade, tenant?.estado, tenant?.cep]
    .filter(Boolean)
    .join(", ");
  const propertyAddress = [property?.endereco, property?.bairro, property?.cidade, property?.estado, property?.cep]
    .filter(Boolean)
    .join(", ");

  let y = 22;
  const marginX = 20;
  const pageWidth = 170;
  const lineHeight = 6;

  function addPageIfNeeded(extraSpace = 24) {
    if (y + extraSpace > 275) {
      doc.addPage();
      y = 22;
    }
  }

  function title(text) {
    addPageIfNeeded(16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(text, marginX, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
  }

  function paragraph(text) {
    const lines = doc.splitTextToSize(text, pageWidth);
    addPageIfNeeded(lines.length * lineHeight + 8);
    doc.text(lines, marginX, y);
    y += lines.length * lineHeight + 5;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text("CONTRATO PARTICULAR DE LOCAÇÃO DE IMÓVEL", 105, y, { align: "center" });
  y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);

  paragraph(
    `Pelo presente instrumento particular, de um lado, como LOCADOR(A), ${profile?.nome_completo || "não informado"}, ${profile?.nacionalidade || ""}, ${profile?.estado_civil || ""}, ${profile?.profissao || ""}, portador(a) do ${getDocumentLabel(profile?.documento)} nº ${profile?.documento || "não informado"}${profile?.rg ? `, RG nº ${profile.rg}` : ""}, residente e domiciliado(a) em ${landlordAddress || "endereço não informado"}; e, de outro lado, como LOCATÁRIO(A), ${tenant?.nome || "não informado"}, ${tenant?.nacionalidade || ""}, ${tenant?.estado_civil || ""}, ${tenant?.profissao || ""}, portador(a) do ${getDocumentLabel(tenant?.documento)} nº ${tenant?.documento || "não informado"}${tenant?.rg ? `, RG nº ${tenant.rg}` : ""}, residente e domiciliado(a) em ${tenantAddress || "endereço não informado"}, resolvem celebrar o presente contrato de locação de imóvel, mediante as cláusulas e condições seguintes:`
  );

  title("CLÁUSULA 1ª - DO IMÓVEL");
  paragraph(
    `O LOCADOR dá em locação ao LOCATÁRIO o imóvel denominado ${property?.nome || "não informado"}, localizado em ${propertyAddress || property?.endereco || "endereço não informado"}${property?.tipo ? `, do tipo ${property.tipo}` : ""}. O imóvel deverá ser utilizado exclusivamente para a finalidade ajustada entre as partes, sendo vedada a alteração de sua destinação sem autorização expressa do LOCADOR.`
  );

  title("CLÁUSULA 2ª - DO PRAZO");
  paragraph(
    `O prazo da locação inicia-se em ${formatDateBR(contract.data_inicio)}${contract.data_fim ? ` e encerra-se em ${formatDateBR(contract.data_fim)}` : ", vigorando por prazo indeterminado"}. A continuidade da ocupação após o término do prazo dependerá de acordo entre as partes, observadas as condições legais aplicáveis.`
  );

  title("CLÁUSULA 3ª - DO ALUGUEL E FORMA DE PAGAMENTO");
  paragraph(
    `O aluguel mensal será de ${currency(contract.valor_aluguel)}, com vencimento todo dia ${contract.dia_vencimento} de cada mês. O pagamento deverá ser realizado pelo LOCATÁRIO ao LOCADOR na forma combinada entre as partes, ficando o LOCATÁRIO responsável pela comprovação do pagamento quando solicitado.`
  );

  if (hasMulta || hasJuros) {
    title("CLÁUSULA 4ª - DO ATRASO NO PAGAMENTO");
    const parts = [];
    if (hasMulta) parts.push(`multa de ${currency(contract.multa_atraso)}`);
    if (hasJuros) parts.push(`juros de ${contract.juros_atraso}% ao mês`);
    paragraph(
      `Em caso de atraso no pagamento do aluguel, incidirá ${parts.join(" e ")} sobre os valores em aberto, sem prejuízo da cobrança de demais encargos, despesas e medidas cabíveis para regularização do débito.`
    );
  }

  if (hasCaucao) {
    title("CLÁUSULA 5ª - DA CAUÇÃO");
    paragraph(
      `O LOCATÁRIO entregará ao LOCADOR a quantia de ${currency(contract.caucao)} a título de caução/garantia contratual. A devolução da caução, quando cabível, ocorrerá após a entrega do imóvel, desde que inexistam débitos pendentes, danos ao imóvel ou descumprimento das obrigações assumidas neste contrato.`
    );
  }

  title("CLÁUSULA 6ª - DOS ENCARGOS E DESPESAS");
  paragraph(
    "Salvo disposição em contrário, serão de responsabilidade do LOCATÁRIO as despesas decorrentes do uso do imóvel, incluindo consumo de água, energia elétrica, gás, internet, condomínio ordinário e demais encargos que estejam relacionados à ocupação e utilização do imóvel durante a vigência da locação."
  );

  title("CLÁUSULA 7ª - DA CONSERVAÇÃO DO IMÓVEL");
  paragraph(
    "O LOCATÁRIO declara receber o imóvel em condições de uso e obriga-se a conservá-lo, mantendo instalações, paredes, pisos, portas, janelas, equipamentos e demais componentes em bom estado. Qualquer dano causado por mau uso, negligência ou intervenção não autorizada deverá ser reparado pelo LOCATÁRIO."
  );

  title("CLÁUSULA 8ª - DAS BENFEITORIAS E ALTERAÇÕES");
  paragraph(
    "O LOCATÁRIO não poderá realizar reformas, modificações estruturais, ampliações, pinturas especiais, instalações fixas ou qualquer alteração relevante no imóvel sem autorização prévia e expressa do LOCADOR. Benfeitorias não autorizadas não gerarão direito de retenção, indenização ou compensação, salvo acordo escrito entre as partes."
  );

  title("CLÁUSULA 9ª - DA SUBLOCAÇÃO E CESSÃO");
  paragraph(
    "É vedado ao LOCATÁRIO sublocar, ceder, emprestar ou transferir a terceiros, total ou parcialmente, o imóvel objeto deste contrato, sem autorização prévia e expressa do LOCADOR."
  );

  title("CLÁUSULA 10ª - DA RESCISÃO");
  paragraph(
    "O descumprimento de qualquer cláusula deste contrato poderá ensejar sua rescisão, independentemente de notificação judicial, sem prejuízo da cobrança de aluguéis, encargos, multas, perdas e danos eventualmente devidos. A rescisão também poderá ocorrer por acordo entre as partes, preferencialmente formalizado por escrito."
  );

  title("CLÁUSULA 11ª - DA DEVOLUÇÃO DO IMÓVEL");
  paragraph(
    "Ao término da locação, o LOCATÁRIO deverá devolver o imóvel livre de pessoas e bens, em boas condições de conservação e uso, ressalvado o desgaste natural decorrente do uso regular, bem como quitar todos os débitos relacionados ao período de ocupação."
  );

  if (contract.observacoes) {
    title("CLÁUSULA 12ª - DISPOSIÇÕES ADICIONAIS");
    paragraph(contract.observacoes);
  }

  title("CLÁUSULA FINAL - DO FORO");
  paragraph(
    `Fica eleito o foro da comarca de ${profile?.cidade || tenant?.cidade || "cidade não informada"}/${profile?.estado || tenant?.estado || "UF"}, para dirimir quaisquer dúvidas oriundas deste contrato, salvo disposição legal em contrário.`
  );

  addPageIfNeeded(80);
  y += 8;
  paragraph(
    "E por estarem justas e contratadas, as partes assinam o presente instrumento em duas vias de igual teor e forma, juntamente com testemunhas, quando houver."
  );

  doc.text(`${profile?.cidade || "Cidade"}/${profile?.estado || "UF"}, ${formatDateBR(new Date().toISOString().slice(0, 10))}.`, marginX, y);
  y += 30;

  doc.line(25, y, 90, y);
  doc.line(120, y, 185, y);
  y += 6;
  doc.setFontSize(10);
  doc.text("LOCADOR(A)", 57, y, { align: "center" });
  doc.text("LOCATÁRIO(A)", 152, y, { align: "center" });
  y += 6;
  doc.text(profile?.nome_completo || "", 57, y, { align: "center" });
  doc.text(tenant?.nome || "", 152, y, { align: "center" });

  y += 28;
  doc.line(25, y, 90, y);
  doc.line(120, y, 185, y);
  y += 6;
  doc.text("TESTEMUNHA 1", 57, y, { align: "center" });
  doc.text("TESTEMUNHA 2", 152, y, { align: "center" });

  doc.setFontSize(8);
  doc.text("Documento gerado pelo sistema Controle de Imóveis. Recomenda-se revisão jurídica antes da assinatura.", 105, 288, { align: "center" });

  const fileTenant = String(tenant?.nome || "inquilino").split(" ").filter(Boolean).join("-").toLowerCase();
  const fileProperty = String(property?.nome || "imovel").split(" ").filter(Boolean).join("-").toLowerCase();
  doc.save(`contrato-${fileTenant}-${fileProperty}.pdf`);
}

function generateReceiptPDF(payment, profile) {
  const doc = new jsPDF();

  const tenant = payment.contratos?.inquilinos || {};
  const property = payment.contratos?.propriedades || {};

  const valorPago = Number(payment.valor_pago || payment.valor || 0);
  const dataPagamento = payment.data_pagamento || new Date().toISOString().slice(0, 10);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("RECIBO DE PAGAMENTO DE ALUGUEL", 105, 25, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  const texto = `
Recebi de ${tenant.nome || "inquilino não informado"}, referente ao imóvel ${property.nome || "imóvel não informado"}, a quantia de ${currency(valorPago)}, correspondente ao aluguel do período ${payment.referencia_mes || "não informado"}.

Data de vencimento: ${formatDateBR(payment.data_vencimento)}
Data de pagamento: ${formatDateBR(dataPagamento)}

Para maior clareza, firmo o presente recibo.
`;

  const lines = doc.splitTextToSize(texto.trim(), 170);
  doc.text(lines, 20, 45);

  doc.text(`${profile?.cidade || "Cidade"}/${profile?.estado || "UF"}, ${formatDateBR(dataPagamento)}.`, 20, 120);

  doc.line(45, 160, 165, 160);
  doc.text(profile?.nome_completo || "LOCADOR(A)", 105, 168, { align: "center" });
  doc.text("LOCADOR(A)", 105, 175, { align: "center" });

  const fileTenant = String(tenant.nome || "inquilino").split(" ").filter(Boolean).join("-").toLowerCase();
  const fileProperty = String(property.nome || "imovel").split(" ").filter(Boolean).join("-").toLowerCase();

  doc.save(`recibo-${fileTenant}-${fileProperty}-${payment.referencia_mes || "pagamento"}.pdf`);
}


function currency(value) {
  const number = Number(value || 0);
  return number.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function onlyNumbers(value) {
  return String(value || "")
    .split("")
    .filter((char) => char >= "0" && char <= "9")
    .join("");
}

function formatPhone(value) {
  const numbers = onlyNumbers(value).slice(0, 11);
  const ddd = numbers.slice(0, 2);
  const firstPart = numbers.length > 10 ? numbers.slice(2, 7) : numbers.slice(2, 6);
  const secondPart = numbers.length > 10 ? numbers.slice(7, 11) : numbers.slice(6, 10);

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 6) return `(${ddd}) ${numbers.slice(2)}`;
  return `(${ddd}) ${firstPart}-${secondPart}`;
}

function formatDocument(value) {
  const numbers = onlyNumbers(value).slice(0, 14);

  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 6) return `${numbers.slice(0, 3)}.${numbers.slice(3)}`;
  if (numbers.length <= 9) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6)}`;
  if (numbers.length <= 11) return `${numbers.slice(0, 3)}.${numbers.slice(3, 6)}.${numbers.slice(6, 9)}-${numbers.slice(9)}`;

  if (numbers.length <= 2) return numbers;
  if (numbers.length <= 5) return `${numbers.slice(0, 2)}.${numbers.slice(2)}`;
  if (numbers.length <= 8) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5)}`;
  if (numbers.length <= 12) return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8)}`;
  return `${numbers.slice(0, 2)}.${numbers.slice(2, 5)}.${numbers.slice(5, 8)}/${numbers.slice(8, 12)}-${numbers.slice(12)}`;
}

function getPhoneStatus(phone) {
  const numbers = onlyNumbers(phone);
  if (!numbers) return "Informe DDD + número. Exemplo: (86) 99999-9999";
  if (numbers.length < 10) return "Número incompleto. Digite o DDD e o telefone.";
  if (numbers.length === 10) return `DDD ${numbers.slice(0, 2)} identificado. Número com 8 dígitos.`;
  return `DDD ${numbers.slice(0, 2)} identificado. Celular com 9 dígitos.`;
}

function getDocumentLabel(document) {
  return onlyNumbers(document).length > 11 ? "CNPJ" : "CPF";
}

function formatDateBR(date) {
  if (!date) return "Não informado";
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}

function getWhatsAppChargeLink(payment) {
  const tenantPhone = payment.contratos?.inquilinos?.telefone || "";
  const tenantName = payment.contratos?.inquilinos?.nome || "";
  const propertyName = payment.contratos?.propriedades?.nome || "";
  const phone = onlyNumbers(tenantPhone);

  const message = `Olá${tenantName ? `, ${tenantName}` : ""}. Tudo bem? Estou entrando em contato para lembrar sobre o aluguel referente a ${payment.referencia_mes}${propertyName ? ` do imóvel ${propertyName}` : ""}, com vencimento em ${formatDateBR(payment.data_vencimento)}, no valor de ${currency(payment.valor)}. Poderia verificar, por favor?`;

  return `https://wa.me/55${phone}?text=${encodeURIComponent(message)}`;
}

function sortPayments(paymentsList) {
  const priority = {
    Atrasado: 1,
    Pendente: 2,
    Pago: 3,
    Cancelado: 4,
  };

  return [...paymentsList].sort((a, b) => {
    const priorityA = priority[a.status] || 99;
    const priorityB = priority[b.status] || 99;

    if (priorityA !== priorityB) return priorityA - priorityB;

    const dateA = new Date(`${a.data_vencimento || "2999-12-31"}T00:00:00`).getTime();
    const dateB = new Date(`${b.data_vencimento || "2999-12-31"}T00:00:00`).getTime();

    return dateA - dateB;
  });
}

function sortContracts(contractsList) {
  const priority = {
    Ativo: 1,
    Suspenso: 2,
    Encerrado: 3,
  };

  return [...contractsList].sort((a, b) => {
    const priorityA = priority[a.status] || 99;
    const priorityB = priority[b.status] || 99;

    if (priorityA !== priorityB) return priorityA - priorityB;

    const dateA = new Date(`${a.data_inicio || "2999-12-31"}T00:00:00`).getTime();
    const dateB = new Date(`${b.data_inicio || "2999-12-31"}T00:00:00`).getTime();

    return dateB - dateA;
  });
}

function getMonthName(monthIndex) {
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return months[monthIndex];
}

function generateMonthlyPayments({ userId, contractId, startDate, endDate, dueDay, amount }) {
  const start = new Date(`${startDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = endDate
    ? new Date(`${endDate}T00:00:00`)
    : new Date(today.getFullYear(), today.getMonth() + 11, today.getDate());

  const payments = [];
  let current = new Date(Math.max(new Date(start.getFullYear(), start.getMonth(), 1), new Date(today.getFullYear(), today.getMonth(), 1)));
  const lastMonth = new Date(end.getFullYear(), end.getMonth(), 1);

  while (current <= lastMonth) {
    const year = current.getFullYear();
    const month = current.getMonth();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const safeDueDay = Math.min(Number(dueDay || 10), lastDayOfMonth);
    const dueDate = new Date(year, month, safeDueDay);

    if (dueDate >= today) {
      payments.push({
        user_id: userId,
        contrato_id: contractId,
        referencia_mes: `${getMonthName(month)}/${year}`,
        data_vencimento: dueDate.toISOString().slice(0, 10),
        valor: Number(amount || 0),
        valor_pago: 0,
        status: "Pendente",
      });
    }

    current = new Date(year, month + 1, 1);
  }

  return payments;
}

function statusClass(status) {
  const map = {
    Alugado: "bg-emerald-100 text-emerald-700",
    Vago: "bg-slate-100 text-slate-700",
    Manutenção: "bg-amber-100 text-amber-700",
    Pago: "bg-emerald-100 text-emerald-700",
    Atrasado: "bg-red-100 text-red-700",
    Pendente: "bg-amber-100 text-amber-700",
    Ativo: "bg-blue-100 text-blue-700",
  };
  return map[status] || "bg-slate-100 text-slate-700";
}

function Badge({ children }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(children)}`}>
      {children}
    </span>
  );
}

function StatCard({ icon: Icon, title, value, subtitle }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-2xl shadow-sm border-slate-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">{title}</p>
              <h3 className="mt-2 text-2xl font-bold text-slate-900">{value}</h3>
              <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <Icon size={22} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SectionHeader({ title, description, action }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-xl font-bold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <Card className="rounded-3xl border-dashed shadow-sm">
      <CardContent className="flex flex-col items-center justify-center p-10 text-center">
        <Building2 className="mb-3 text-slate-400" size={34} />
        <h3 className="font-bold text-slate-900">{title}</h3>
        <p className="mt-1 max-w-md text-sm text-slate-500">{description}</p>
      </CardContent>
    </Card>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState("login");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [message, setMessage] = useState("");

  async function handleAuth(e) {
    e.preventDefault();
    setLoadingAuth(true);
    setMessage("");

    const action = mode === "login"
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { error } = await action;

    if (error) {
      setMessage(error.message);
    } else if (mode === "register") {
      setMessage("Cadastro realizado. Verifique seu e-mail se a confirmação estiver ativada no Supabase.");
    }

    setLoadingAuth(false);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.28),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.18),_transparent_35%)]" />
      <div className="relative mx-auto grid min-h-screen max-w-7xl grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 backdrop-blur">
            <Building2 size={16} /> Sistema online para gestão de aluguéis
          </div>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Controle de Imóveis com gestão completa de contratos, pagamentos e despesas.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">
            Organize imóveis, inquilinos, contratos, cobranças mensais, recibos e relatórios financeiros em um único painel profissional.
          </p>

          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-300 sm:flex-row sm:flex-wrap">
            <a href="https://wa.me/5586995574654" target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
              WhatsApp: (86) 99557-4654
            </a>
            <a href="https://instagram.com/b0rgix" target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
              Instagram: @b0rgix
            </a>
            <a href="mailto:Williamjrw3@gmail.com" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 hover:bg-white/10">
              E-mail: Williamjrw3@gmail.com
            </a>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <Wallet className="mb-3 text-emerald-300" size={26} />
              <h3 className="font-bold">Pagamentos</h3>
              <p className="mt-1 text-sm text-slate-300">Controle de recebidos, pendentes e atrasados.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <FileText className="mb-3 text-blue-300" size={26} />
              <h3 className="font-bold">Contratos</h3>
              <p className="mt-1 text-sm text-slate-300">Vínculo entre imóvel, inquilino e vencimentos.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
              <TrendingUp className="mb-3 text-amber-300" size={26} />
              <h3 className="font-bold">Relatórios</h3>
              <p className="mt-1 text-sm text-slate-300">Lucro real, despesas e inadimplência.</p>
            </div>
          </div>
        </section>

        <Card className="rounded-[2rem] border-white/10 bg-white text-slate-900 shadow-2xl">
          <CardContent className="p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white">
                <Home size={28} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Controle de Imóveis</h2>
              <p className="mt-1 text-sm text-slate-500">
                {mode === "login" ? "Entre para acessar sua gestão." : "Crie sua conta para começar."}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-3">
              <input
                type="email"
                placeholder="E-mail"
                className="w-full rounded-2xl border p-3 text-sm outline-none focus:border-slate-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Senha"
                  className="w-full rounded-2xl border p-3 pr-12 text-sm outline-none focus:border-slate-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>

              {message && (
                <div className="rounded-2xl bg-slate-100 p-3 text-sm text-slate-700">{message}</div>
              )}

              <Button disabled={loadingAuth} className="w-full rounded-2xl bg-slate-900 hover:bg-slate-800">
                {loadingAuth ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
                {mode === "login" ? "Entrar" : "Criar conta"}
              </Button>
            </form>

            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
              className="mt-4 w-full text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              {mode === "login" ? "Ainda não tenho conta" : "Já tenho conta"}
            </button>

            <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">Suporte e implantação</p>
              <div className="mt-2 space-y-1">
                <p>WhatsApp: <a className="font-medium text-slate-900" href="https://wa.me/5586995574654" target="_blank" rel="noreferrer">(86) 99557-4654</a></p>
                <p>Instagram: <a className="font-medium text-slate-900" href="https://instagram.com/b0rgix" target="_blank" rel="noreferrer">@b0rgix</a></p>
                <p>E-mail: <a className="font-medium text-slate-900" href="mailto:Williamjrw3@gmail.com">Williamjrw3@gmail.com</a></p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [active, setActive] = useState("dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [paymentFilters, setPaymentFilters] = useState({
    status: "Todos",
    property: "Todos",
    tenant: "Todos",
    search: "",
  });
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [previewContract, setPreviewContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [editingPropertyId, setEditingPropertyId] = useState(null);
  const [propertyForm, setPropertyForm] = useState({
    nome: "",
    endereco: "",
    tipo: "Casa",
    status: "Vago",
    valor_aluguel: "",
    observacoes: "",
  });

  const [showTenantForm, setShowTenantForm] = useState(false);
  const [editingTenantId, setEditingTenantId] = useState(null);
  const [tenantForm, setTenantForm] = useState({
    nome: "",
    telefone: "",
    documento: "",
    email: "",
    rg: "",
    data_nascimento: "",
    nacionalidade: "Brasileiro(a)",
    estado_civil: "",
    profissao: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
  });

  const [showContractForm, setShowContractForm] = useState(false);
  const [editingContractId, setEditingContractId] = useState(null);
  const [contractForm, setContractForm] = useState({
    propriedade_id: "",
    inquilino_id: "",
    data_inicio: "",
    data_fim: "",
    dia_vencimento: "10",
    valor_aluguel: "",
    multa_atraso: "0",
    juros_atraso: "0",
    caucao: "0",
    observacoes: "",
    status: "Ativo",
  });

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    propriedade_id: "",
    categoria: "Manutenção",
    descricao: "",
    data_despesa: new Date().toISOString().slice(0, 10),
    valor: "",
  });

  const [profileForm, setProfileForm] = useState({
    nome_completo: "",
    documento: "",
    rg: "",
    data_nascimento: "",
    nacionalidade: "Brasileiro(a)",
    estado_civil: "",
    profissao: "",
    telefone: "",
    email: "",
    endereco: "",
    cidade: "",
    estado: "",
    cep: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      loadData();
    }
  }, [session?.user?.id]);

  async function loadData() {
    if (!session?.user?.id) return;
    setLoading(true);
    setError("");

    try {
      const profileRes = await supabase
        .from("perfis")
        .select("*")
        .eq("user_id", session.user.id)
        .maybeSingle();

      const propertiesRes = await supabase
        .from("propriedades")
        .select("*")
        .eq("user_id", session.user.id)
        .order("criado_em", { ascending: false });

      const tenantsRes = await supabase
        .from("inquilinos")
        .select("*")
        .eq("user_id", session.user.id)
        .order("criado_em", { ascending: false });

      const contractsRes = await supabase
        .from("contratos")
        .select("*, propriedades(*), inquilinos(*)")
        .eq("user_id", session.user.id)
        .order("criado_em", { ascending: false });

      const paymentsRes = await supabase
        .from("pagamentos")
        .select("*, contratos(id, propriedades(*), inquilinos(*))")
        .eq("user_id", session.user.id)
        .order("criado_em", { ascending: false });

      const expensesRes = await supabase
        .from("despesas")
        .select("*, propriedades(nome)")
        .eq("user_id", session.user.id)
        .order("criado_em", { ascending: false });

      const firstError =
        profileRes.error ||
        propertiesRes.error ||
        tenantsRes.error ||
        contractsRes.error ||
        paymentsRes.error ||
        expensesRes.error;

      if (firstError) {
        setError(firstError.message);
      }

      setProfile(profileRes.data || null);
      if (profileRes.data) {
        setProfileForm({
          nome_completo: profileRes.data.nome_completo || "",
          documento: profileRes.data.documento || "",
          rg: profileRes.data.rg || "",
          data_nascimento: profileRes.data.data_nascimento || "",
          nacionalidade: profileRes.data.nacionalidade || "Brasileiro(a)",
          estado_civil: profileRes.data.estado_civil || "",
          profissao: profileRes.data.profissao || "",
          telefone: profileRes.data.telefone || "",
          email: profileRes.data.email || session.user.email || "",
          endereco: profileRes.data.endereco || "",
          cidade: profileRes.data.cidade || "",
          estado: profileRes.data.estado || "",
          cep: profileRes.data.cep || "",
        });
      } else {
        setProfileForm((prev) => ({ ...prev, email: session.user.email || "" }));
      }

      setProperties(propertiesRes.data || []);
      setTenants(tenantsRes.data || []);
      setContracts(sortContracts(contractsRes.data || []));
      const loadedPayments = paymentsRes.data || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const expiredPendingPayments = loadedPayments.filter((payment) => {
        const dueDate = new Date(`${payment.data_vencimento}T00:00:00`);
        return payment.status === "Pendente" && dueDate < today;
      });

      if (expiredPendingPayments.length > 0) {
        await supabase
          .from("pagamentos")
          .update({ status: "Atrasado" })
          .in("id", expiredPendingPayments.map((payment) => payment.id));

        expiredPendingPayments.forEach((expired) => {
          expired.status = "Atrasado";
        });
      }

      setPayments(sortPayments(loadedPayments));
      setExpenses(expensesRes.data || []);
    } catch (err) {
      setError(err?.message || "Erro inesperado ao carregar os dados do Supabase.");
    } finally {
      setLoading(false);
    }
  }

  const dashboard = useMemo(() => {
    const [filterYear, filterMonth] = selectedMonth.split("-").map(Number);

    const paymentsInMonth = payments.filter((payment) => {
      if (payment.status === "Cancelado") return false;
      if (!payment.data_vencimento) return false;
      const date = new Date(`${payment.data_vencimento}T00:00:00`);
      return date.getFullYear() === filterYear && date.getMonth() + 1 === filterMonth;
    });

    const expensesInMonth = expenses.filter((expense) => {
      if (!expense.data_despesa) return false;
      const date = new Date(`${expense.data_despesa}T00:00:00`);
      return date.getFullYear() === filterYear && date.getMonth() + 1 === filterMonth;
    });

    const rented = properties.filter((p) => p.status === "Alugado").length;
    const vacant = properties.filter((p) => p.status === "Vago").length;
    const maintenance = properties.filter((p) => p.status === "Manutenção").length;
    const expected = paymentsInMonth.reduce((sum, p) => sum + Number(p.valor || 0), 0);
    const received = paymentsInMonth.reduce((sum, p) => sum + Number(p.valor_pago || 0), 0);
    const overdue = paymentsInMonth
      .filter((p) => p.status === "Atrasado")
      .reduce((sum, p) => sum + (Number(p.valor || 0) - Number(p.valor_pago || 0)), 0);
    const expenseTotal = expensesInMonth.reduce((sum, e) => sum + Number(e.valor || 0), 0);
    const totalRent = properties.reduce((sum, p) => sum + Number(p.valor_aluguel || 0), 0);
    const netProfit = received - expenseTotal;
    return { rented, vacant, maintenance, expected, received, overdue, expenseTotal, totalRent, netProfit };
  }, [properties, payments, expenses, selectedMonth]);

  const propertyReports = useMemo(() => {
    return properties.map((property) => {
      const propertyContracts = contracts.filter((contract) => contract.propriedade_id === property.id);
      const contractIds = propertyContracts.map((contract) => contract.id);
      const propertyPayments = payments.filter((payment) => contractIds.includes(payment.contrato_id));
      const propertyExpenses = expenses.filter((expense) => expense.propriedade_id === property.id);
      const received = propertyPayments.reduce((sum, payment) => sum + Number(payment.valor_pago || 0), 0);
      const pending = propertyPayments
        .filter((payment) => payment.status !== "Pago")
        .reduce((sum, payment) => sum + (Number(payment.valor || 0) - Number(payment.valor_pago || 0)), 0);
      const expenseTotal = propertyExpenses.reduce((sum, expense) => sum + Number(expense.valor || 0), 0);
      const netProfit = received - expenseTotal;

      return {
        id: property.id,
        nome: property.nome,
        status: property.status,
        valor_aluguel: property.valor_aluguel,
        received,
        pending,
        expenseTotal,
        netProfit,
      };
    });
  }, [properties, contracts, payments, expenses]);

  const filteredProperties = properties.filter((item) =>
    `${item.nome} ${item.endereco} ${item.tipo} ${item.status}`.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPayments = payments.filter((payment) => {
    const propertyName = payment.contratos?.propriedades?.nome || "";
    const tenantName = payment.contratos?.inquilinos?.nome || "";
    const reference = payment.referencia_mes || "";

    const matchesStatus = paymentFilters.status === "Todos" || payment.status === paymentFilters.status;
    const matchesProperty = paymentFilters.property === "Todos" || propertyName === paymentFilters.property;
    const matchesTenant = paymentFilters.tenant === "Todos" || tenantName === paymentFilters.tenant;
    const matchesSearch = `${propertyName} ${tenantName} ${reference}`
      .toLowerCase()
      .includes(paymentFilters.search.toLowerCase());

    return matchesStatus && matchesProperty && matchesTenant && matchesSearch;
  });

  async function saveProfile(e) {
    e.preventDefault();

    if (!session?.user?.id) {
      setError("Usuário não autenticado. Saia e entre novamente.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        user_id: session.user.id,
        nome_completo: profileForm.nome_completo.trim(),
        documento: formatDocument(profileForm.documento),
        rg: profileForm.rg.trim(),
        data_nascimento: profileForm.data_nascimento || null,
        nacionalidade: profileForm.nacionalidade.trim(),
        estado_civil: profileForm.estado_civil.trim(),
        profissao: profileForm.profissao.trim(),
        telefone: formatPhone(profileForm.telefone),
        email: profileForm.email.trim(),
        endereco: profileForm.endereco.trim(),
        cidade: profileForm.cidade.trim(),
        estado: profileForm.estado.trim().toUpperCase(),
        cep: profileForm.cep.trim(),
      };

      const { data, error: profileError } = await supabase
        .from("perfis")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();

      if (profileError) {
        setError(profileError.message);
        return;
      }

      setProfile(data);
      setSuccess("Perfil salvo com sucesso.");
    } catch (err) {
      setError(err?.message || "Erro inesperado ao salvar perfil.");
    } finally {
      setSaving(false);
    }
  }

  function startEditProperty(property) {
    setEditingPropertyId(property.id);
    setPropertyForm({
      nome: property.nome || "",
      endereco: property.endereco || "",
      tipo: property.tipo || "Casa",
      status: property.status || "Vago",
      valor_aluguel: property.valor_aluguel || "",
      observacoes: property.observacoes || "",
    });
    setShowPropertyForm(true);
    setError("");
    setSuccess("");
  }

  function cancelPropertyEdit() {
    setEditingPropertyId(null);
    setPropertyForm({
      nome: "",
      endereco: "",
      tipo: "Casa",
      status: "Vago",
      valor_aluguel: "",
      observacoes: "",
    });
    setShowPropertyForm(false);
  }

  async function addProperty(e) {
    e.preventDefault();

    if (!session?.user?.id) {
      setError("Usuário não autenticado. Saia e entre novamente.");
      return;
    }

    if (!propertyForm.nome.trim()) {
      setError("Informe o nome do imóvel.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        user_id: session.user.id,
        nome: propertyForm.nome.trim(),
        endereco: propertyForm.endereco.trim(),
        tipo: propertyForm.tipo,
        status: propertyForm.status,
        valor_aluguel: Number(propertyForm.valor_aluguel || 0),
        observacoes: propertyForm.observacoes.trim(),
      };

      if (editingPropertyId) {
        const { data, error: updateError } = await supabase
          .from("propriedades")
          .update(payload)
          .eq("id", editingPropertyId)
          .eq("user_id", session.user.id)
          .select()
          .single();

        if (updateError) {
          setError(updateError.message);
          return;
        }

        setProperties((prev) => prev.map((property) => (property.id === editingPropertyId ? data : property)));
        setSuccess("Imóvel atualizado com sucesso.");
      } else {
        const { data, error: insertError } = await supabase
          .from("propriedades")
          .insert(payload)
          .select()
          .single();

        if (insertError) {
          setError(insertError.message);
          return;
        }

        setProperties((prev) => [data, ...prev]);
        setSuccess("Imóvel cadastrado com sucesso.");
      }

      setPropertyForm({ nome: "", endereco: "", tipo: "Casa", status: "Vago", valor_aluguel: "", observacoes: "" });
      setEditingPropertyId(null);
      setShowPropertyForm(false);
    } catch (err) {
      setError(err?.message || "Erro inesperado ao salvar imóvel.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProperty(id) {
    const confirmation = window.confirm("Deseja realmente excluir este imóvel? Essa ação também pode afetar contratos e despesas vinculadas.");
    if (!confirmation) return;

    setError("");
    const { error: deleteError } = await supabase.from("propriedades").delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setProperties((prev) => prev.filter((property) => property.id !== id));
  }

  function startEditTenant(tenant) {
    setEditingTenantId(tenant.id);
    setTenantForm({
      nome: tenant.nome || "",
      telefone: tenant.telefone || "",
      documento: tenant.documento || "",
      email: tenant.email || "",
      rg: tenant.rg || "",
      data_nascimento: tenant.data_nascimento || "",
      nacionalidade: tenant.nacionalidade || "Brasileiro(a)",
      estado_civil: tenant.estado_civil || "",
      profissao: tenant.profissao || "",
      endereco: tenant.endereco || "",
      cidade: tenant.cidade || "",
      estado: tenant.estado || "",
      cep: tenant.cep || "",
    });
    setShowTenantForm(true);
    setError("");
    setSuccess("");
  }

  function cancelTenantEdit() {
    setEditingTenantId(null);
    setTenantForm({
      nome: "",
      telefone: "",
      documento: "",
      email: "",
      rg: "",
      data_nascimento: "",
      nacionalidade: "Brasileiro(a)",
      estado_civil: "",
      profissao: "",
      endereco: "",
      cidade: "",
      estado: "",
      cep: "",
    });
    setShowTenantForm(false);
  }

  async function addTenant(e) {
    e.preventDefault();
    if (!tenantForm.nome.trim()) {
      setError("Informe o nome do inquilino.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        user_id: session.user.id,
        nome: tenantForm.nome.trim(),
        telefone: formatPhone(tenantForm.telefone),
        documento: formatDocument(tenantForm.documento),
        email: tenantForm.email.trim(),
        rg: tenantForm.rg.trim(),
        data_nascimento: tenantForm.data_nascimento || null,
        nacionalidade: tenantForm.nacionalidade.trim(),
        estado_civil: tenantForm.estado_civil.trim(),
        profissao: tenantForm.profissao.trim(),
        endereco: tenantForm.endereco.trim(),
        cidade: tenantForm.cidade.trim(),
        estado: tenantForm.estado.trim().toUpperCase(),
        cep: tenantForm.cep.trim(),
      };

      if (editingTenantId) {
        const { data, error: updateError } = await supabase
          .from("inquilinos")
          .update(payload)
          .eq("id", editingTenantId)
          .eq("user_id", session.user.id)
          .select()
          .single();

        if (updateError) {
          setError(updateError.message);
          return;
        }

        setTenants((prev) => prev.map((tenant) => (tenant.id === editingTenantId ? data : tenant)));
        setSuccess("Inquilino atualizado com sucesso.");
      } else {
        const { data, error: insertError } = await supabase
          .from("inquilinos")
          .insert(payload)
          .select()
          .single();

        if (insertError) {
          setError(insertError.message);
          return;
        }

        setTenants((prev) => [data, ...prev]);
        setSuccess("Inquilino cadastrado com sucesso.");
      }

      setTenantForm({
        nome: "",
        telefone: "",
        documento: "",
        email: "",
        rg: "",
        data_nascimento: "",
        nacionalidade: "Brasileiro(a)",
        estado_civil: "",
        profissao: "",
        endereco: "",
        cidade: "",
        estado: "",
        cep: "",
      });
      setEditingTenantId(null);
      setShowTenantForm(false);
    } catch (err) {
      setError(err?.message || "Erro inesperado ao salvar inquilino.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteTenant(id) {
    const confirmation = window.confirm("Deseja realmente excluir este inquilino? Contratos vinculados também poderão ser afetados.");
    if (!confirmation) return;

    setError("");
    const { error: deleteError } = await supabase.from("inquilinos").delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setTenants((prev) => prev.filter((tenant) => tenant.id !== id));
  }

  function resetContractForm() {
    setContractForm({
      propriedade_id: "",
      inquilino_id: "",
      data_inicio: "",
      data_fim: "",
      dia_vencimento: "10",
      valor_aluguel: "",
      multa_atraso: "0",
      juros_atraso: "0",
      caucao: "0",
      observacoes: "",
      status: "Ativo",
    });
    setEditingContractId(null);
  }

  function startEditContract(contract) {
    setEditingContractId(contract.id);
    setContractForm({
      propriedade_id: contract.propriedade_id || "",
      inquilino_id: contract.inquilino_id || "",
      data_inicio: contract.data_inicio || "",
      data_fim: contract.data_fim || "",
      dia_vencimento: String(contract.dia_vencimento || 10),
      valor_aluguel: contract.valor_aluguel || "",
      multa_atraso: contract.multa_atraso || "0",
      juros_atraso: contract.juros_atraso || "0",
      caucao: contract.caucao || "0",
      observacoes: contract.observacoes || "",
      status: contract.status || "Ativo",
    });
    setShowContractForm(true);
    setError("");
    setSuccess("");
  }

  async function addContract(e) {
    e.preventDefault();

    if (!session?.user?.id) {
      setError("Usuário não autenticado. Saia e entre novamente.");
      return;
    }

    if (!contractForm.propriedade_id || !contractForm.inquilino_id || !contractForm.data_inicio) {
      setError("Selecione o imóvel, o inquilino e informe a data de início do contrato.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const selectedProperty = properties.find((property) => property.id === contractForm.propriedade_id);
      const alreadyHasActiveContract = contracts.some(
        (contract) =>
          contract.propriedade_id === contractForm.propriedade_id &&
          contract.status === "Ativo" &&
          contract.id !== editingContractId
      );

      if (!editingContractId && (selectedProperty?.status === "Alugado" || alreadyHasActiveContract)) {
        setError("Este imóvel já está alugado. Encerre ou exclua o contrato ativo antes de criar outro contrato para ele.");
        return;
      }

      const rentValue = Number(contractForm.valor_aluguel || selectedProperty?.valor_aluguel || 0);
      const payload = {
        user_id: session.user.id,
        propriedade_id: contractForm.propriedade_id,
        inquilino_id: contractForm.inquilino_id,
        data_inicio: contractForm.data_inicio,
        data_fim: contractForm.data_fim || null,
        dia_vencimento: Number(contractForm.dia_vencimento || 10),
        valor_aluguel: rentValue,
        multa_atraso: Number(contractForm.multa_atraso || 0),
        juros_atraso: Number(contractForm.juros_atraso || 0),
        caucao: Number(contractForm.caucao || 0),
        observacoes: contractForm.observacoes.trim(),
        status: contractForm.status,
      };

      if (editingContractId) {
        const { data, error: updateError } = await supabase
          .from("contratos")
          .update(payload)
          .eq("id", editingContractId)
          .eq("user_id", session.user.id)
          .select("*, propriedades(*), inquilinos(*)")
          .single();

        if (updateError) {
          setError(updateError.message);
          return;
        }

        setContracts((prev) => sortContracts(prev.map((contract) => (contract.id === editingContractId ? data : contract))));
        setSuccess("Contrato atualizado com sucesso.");
      } else {
        const { data, error: insertError } = await supabase
          .from("contratos")
          .insert(payload)
          .select("*, propriedades(*), inquilinos(*)")
          .single();

        if (insertError) {
          setError(insertError.message);
          return;
        }

        const generatedPayments = generateMonthlyPayments({
          userId: session.user.id,
          contractId: data.id,
          startDate: contractForm.data_inicio,
          endDate: contractForm.data_fim,
          dueDay: contractForm.dia_vencimento,
          amount: rentValue,
        });

        if (generatedPayments.length > 0) {
          const { data: insertedPayments, error: paymentError } = await supabase
            .from("pagamentos")
            .insert(generatedPayments)
            .select("*, contratos(id, propriedades(*), inquilinos(*))");

          if (paymentError) {
            setError(`Contrato salvo, mas houve erro ao gerar pagamentos: ${paymentError.message}`);
          } else {
            setPayments((prev) => sortPayments([...(insertedPayments || []), ...prev]));
          }
        }

        await supabase
          .from("propriedades")
          .update({ status: "Alugado" })
          .eq("id", contractForm.propriedade_id)
          .eq("user_id", session.user.id);

        setProperties((prev) =>
          prev.map((property) =>
            property.id === contractForm.propriedade_id ? { ...property, status: "Alugado" } : property
          )
        );

        setContracts((prev) => sortContracts([data, ...prev]));
        setSuccess("Contrato cadastrado com sucesso.");
      }

      resetContractForm();
      setShowContractForm(false);
    } catch (err) {
      setError(err?.message || "Erro inesperado ao cadastrar contrato.");
    } finally {
      setSaving(false);
    }
  }

  async function generatePaymentsForContract(contract) {
    if (!session?.user?.id) {
      setError("Usuário não autenticado. Saia e entre novamente.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const generatedPayments = generateMonthlyPayments({
        userId: session.user.id,
        contractId: contract.id,
        startDate: contract.data_inicio,
        endDate: contract.data_fim,
        dueDay: contract.dia_vencimento,
        amount: contract.valor_aluguel,
      });

      const existingPayments = payments.filter((payment) => payment.contrato_id === contract.id);
      const existingKeys = existingPayments.map((payment) => `${payment.contrato_id}-${payment.referencia_mes}`);

      const missingPayments = generatedPayments.filter(
        (payment) => !existingKeys.includes(`${payment.contrato_id}-${payment.referencia_mes}`)
      );

      if (missingPayments.length === 0) {
        setError("Este contrato já possui as cobranças geradas.");
        return;
      }

      const { data: insertedPayments, error: paymentError } = await supabase
        .from("pagamentos")
        .insert(missingPayments)
        .select("*, contratos(id, propriedades(*), inquilinos(*))");

      if (paymentError) {
        setError(paymentError.message);
        return;
      }

      setPayments((prev) => sortPayments([...(insertedPayments || []), ...prev]));
    } catch (err) {
      setError(err?.message || "Erro inesperado ao gerar cobranças.");
    } finally {
      setSaving(false);
    }
  }

  async function endContract(contract) {
    const confirmation = window.confirm("Deseja encerrar este contrato? O imóvel voltará para Vago e o histórico será mantido.");
    if (!confirmation) return;

    setError("");
    setSuccess("");

    const { data, error: updateError } = await supabase
      .from("contratos")
      .update({ status: "Encerrado", data_fim: contract.data_fim || new Date().toISOString().slice(0, 10) })
      .eq("id", contract.id)
      .eq("user_id", session.user.id)
      .select("*, propriedades(*), inquilinos(*)")
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await supabase
      .from("propriedades")
      .update({ status: "Vago" })
      .eq("id", contract.propriedade_id)
      .eq("user_id", session.user.id);

    const { data: canceledPayments, error: paymentCancelError } = await supabase
      .from("pagamentos")
      .update({ status: "Cancelado" })
      .eq("contrato_id", contract.id)
      .eq("user_id", session.user.id)
      .in("status", ["Pendente", "Atrasado"])
      .select("*, contratos(id, propriedades(*), inquilinos(*))");

    if (paymentCancelError) {
      setError(paymentCancelError.message);
      return;
    }

    setContracts((prev) => sortContracts(prev.map((item) => (item.id === contract.id ? data : item))));
    setProperties((prev) => prev.map((property) => property.id === contract.propriedade_id ? { ...property, status: "Vago" } : property));
    if (canceledPayments?.length) {
      setPayments((prev) =>
        sortPayments(
          prev.map((payment) => {
            const canceled = canceledPayments.find((item) => item.id === payment.id);
            return canceled || payment;
          })
        )
      );
    }
    setSuccess("Contrato encerrado com sucesso. O histórico foi mantido.");
  }

  async function deleteContract(id) {
    const confirmation = window.confirm("Deseja realmente excluir este contrato? Use Encerrar contrato se quiser manter o histórico.");
    if (!confirmation) return;

    setError("");

    const contractToDelete = contracts.find((contract) => contract.id === id);
    const propertyId = contractToDelete?.propriedade_id;

    const { error: deleteError } = await supabase.from("contratos").delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setContracts((prev) => prev.filter((contract) => contract.id !== id));

    if (propertyId) {
      const { data: remainingContracts, error: remainingError } = await supabase
        .from("contratos")
        .select("id")
        .eq("propriedade_id", propertyId)
        .eq("status", "Ativo");

      if (remainingError) {
        setError(remainingError.message);
        return;
      }

      if (!remainingContracts || remainingContracts.length === 0) {
        const { error: propertyError } = await supabase
          .from("propriedades")
          .update({ status: "Vago" })
          .eq("id", propertyId);

        if (propertyError) {
          setError(propertyError.message);
          return;
        }

        setProperties((prev) =>
          prev.map((property) =>
            property.id === propertyId ? { ...property, status: "Vago" } : property
          )
        );
      }
    }
  }

  async function addExpense(e) {
    e.preventDefault();

    if (!expenseForm.propriedade_id || !expenseForm.categoria || !expenseForm.valor) {
      setError("Selecione o imóvel, a categoria e informe o valor da despesa.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    const { data, error: insertError } = await supabase
      .from("despesas")
      .insert({
        user_id: session.user.id,
        propriedade_id: expenseForm.propriedade_id,
        categoria: expenseForm.categoria,
        descricao: expenseForm.descricao.trim(),
        data_despesa: expenseForm.data_despesa,
        valor: Number(expenseForm.valor || 0),
      })
      .select("*, propriedades(nome)")
      .single();

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setExpenses((prev) => [data, ...prev]);
    setExpenseForm({
      propriedade_id: "",
      categoria: "Manutenção",
      descricao: "",
      data_despesa: new Date().toISOString().slice(0, 10),
      valor: "",
    });
    setShowExpenseForm(false);
    setSaving(false);
  }

  async function deleteExpense(id) {
    const confirmation = window.confirm("Deseja realmente excluir esta despesa?");
    if (!confirmation) return;

    setError("");
    const { error: deleteError } = await supabase.from("despesas").delete().eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setExpenses((prev) => prev.filter((expense) => expense.id !== id));
  }

  async function markPaymentAsPaid(payment) {
    const { data, error: updateError } = await supabase
      .from("pagamentos")
      .update({
        valor_pago: payment.valor,
        data_pagamento: new Date().toISOString().slice(0, 10),
        status: "Pago",
      })
      .eq("id", payment.id)
      .select("*, contratos(id, propriedades(*), inquilinos(*))")
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPayments((prev) => sortPayments(prev.map((item) => (item.id === payment.id ? data : item))));
  }

  async function unmarkPaymentAsPaid(payment) {
    const confirmation = window.confirm("Deseja desmarcar este pagamento e voltar para pendente?");
    if (!confirmation) return;

    const { data, error: updateError } = await supabase
      .from("pagamentos")
      .update({
        valor_pago: 0,
        data_pagamento: null,
        forma_pagamento: null,
        status: "Pendente",
      })
      .eq("id", payment.id)
      .select("*, contratos(id, propriedades(*), inquilinos(*))")
      .single();

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPayments((prev) => sortPayments(prev.map((item) => (item.id === payment.id ? data : item))));
  }

  async function signOut() {
    await supabase.auth.signOut();
    setProperties([]);
    setTenants([]);
    setContracts([]);
    setPayments([]);
    setExpenses([]);
  }

  if (!authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
        <Loader2 className="mr-2 animate-spin" size={22} /> Carregando acesso...
      </div>
    );
  }

  if (!session) {
    return <LoginScreen />;
  }

  const nav = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "profile", label: "Perfil", icon: UserCog },
    { id: "properties", label: "Imóveis", icon: Building2 },
    { id: "tenants", label: "Inquilinos", icon: Users },
    { id: "contracts", label: "Contratos", icon: FileText },
    { id: "payments", label: "Pagamentos", icon: Wallet },
    { id: "expenses", label: "Despesas", icon: Wrench },
    { id: "reports", label: "Relatórios", icon: PieChart },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-sm">
              <Home size={23} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Controle de Imóveis</h1>
              <p className="text-xs text-slate-500">Gestão profissional de aluguéis, contratos e recebimentos</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Button onClick={loadData} variant="outline" className="rounded-2xl">
              Atualizar dados
            </Button>
            <Button onClick={signOut} variant="outline" className="rounded-2xl text-red-600 hover:text-red-700">
              Sair
            </Button>
          </div>
          <Button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} variant="outline" className="rounded-2xl sm:hidden">
            <Menu size={18} />
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 lg:grid-cols-[260px_1fr]">
        <aside className={`${mobileMenuOpen ? "block" : "hidden"} rounded-3xl border border-slate-200 bg-white p-3 shadow-sm sm:block lg:sticky lg:top-24 lg:h-fit`}>
          <nav className="grid gap-1 sm:grid-cols-3 lg:grid-cols-1">
            {nav.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActive(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${active === item.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                    }`}
                >
                  <Icon size={18} />
                  {item.label}
                </button>
              );
            })}
          </nav>
          <div className="mt-3 border-t border-slate-100 pt-3 sm:hidden lg:block">
            <Button onClick={signOut} variant="outline" className="w-full rounded-2xl text-red-600 hover:text-red-700">
              Sair da conta
            </Button>
          </div>
        </aside>

        <main>
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
              Erro: {error}
            </div>
          )}

          {success && (
            <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
              {success}
            </div>
          )}

          {loading ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-3xl bg-white shadow-sm">
              <div className="flex items-center gap-3 text-slate-600">
                <Loader2 className="animate-spin" size={22} />
                Carregando dados do Supabase...
              </div>
            </div>
          ) : (
            <>
              {active === "profile" && (
                <section>
                  <SectionHeader
                    title="Perfil do locador"
                    description="Dados usados para gerar contratos, recibos e documentos formais."
                  />

                  <Card className="rounded-3xl shadow-sm">
                    <CardContent className="p-5">
                      <form onSubmit={saveProfile} className="grid gap-3 md:grid-cols-6">
                        <input placeholder="Nome completo" className="rounded-2xl border p-3 text-sm md:col-span-3" value={profileForm.nome_completo} onChange={(e) => setProfileForm({ ...profileForm, nome_completo: e.target.value })} />
                        <input placeholder="CPF ou CNPJ" inputMode="numeric" maxLength={18} className="rounded-2xl border p-3 text-sm" value={profileForm.documento} onChange={(e) => setProfileForm({ ...profileForm, documento: formatDocument(e.target.value) })} />
                        <input placeholder="RG" className="rounded-2xl border p-3 text-sm" value={profileForm.rg} onChange={(e) => setProfileForm({ ...profileForm, rg: e.target.value })} />
                        <input type="date" className="rounded-2xl border p-3 text-sm" value={profileForm.data_nascimento} onChange={(e) => setProfileForm({ ...profileForm, data_nascimento: e.target.value })} />

                        <input placeholder="Nacionalidade" className="rounded-2xl border p-3 text-sm" value={profileForm.nacionalidade} onChange={(e) => setProfileForm({ ...profileForm, nacionalidade: e.target.value })} />
                        <select className="rounded-2xl border p-3 text-sm" value={profileForm.estado_civil} onChange={(e) => setProfileForm({ ...profileForm, estado_civil: e.target.value })}>
                          <option value="">Estado civil</option>
                          <option>Solteiro(a)</option>
                          <option>Casado(a)</option>
                          <option>Divorciado(a)</option>
                          <option>Viúvo(a)</option>
                          <option>União estável</option>
                        </select>
                        <input placeholder="Profissão" className="rounded-2xl border p-3 text-sm" value={profileForm.profissao} onChange={(e) => setProfileForm({ ...profileForm, profissao: e.target.value })} />
                        <input placeholder="Telefone com DDD" inputMode="numeric" maxLength={15} className="rounded-2xl border p-3 text-sm" value={profileForm.telefone} onChange={(e) => setProfileForm({ ...profileForm, telefone: formatPhone(e.target.value) })} />
                        <input placeholder="E-mail" type="email" className="rounded-2xl border p-3 text-sm md:col-span-2" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />

                        <input placeholder="Endereço completo" className="rounded-2xl border p-3 text-sm md:col-span-3" value={profileForm.endereco} onChange={(e) => setProfileForm({ ...profileForm, endereco: e.target.value })} />
                        <input placeholder="Cidade" className="rounded-2xl border p-3 text-sm" value={profileForm.cidade} onChange={(e) => setProfileForm({ ...profileForm, cidade: e.target.value })} />
                        <input placeholder="UF" maxLength={2} className="rounded-2xl border p-3 text-sm" value={profileForm.estado} onChange={(e) => setProfileForm({ ...profileForm, estado: e.target.value.toUpperCase() })} />
                        <input placeholder="CEP" className="rounded-2xl border p-3 text-sm" value={profileForm.cep} onChange={(e) => setProfileForm({ ...profileForm, cep: e.target.value })} />

                        <Button disabled={saving} className="rounded-2xl md:col-span-6">
                          {saving ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
                          Salvar perfil
                        </Button>
                      </form>
                    </CardContent>
                  </Card>

                  {profile && (
                    <Card className="mt-5 rounded-3xl bg-slate-900 text-white shadow-sm">
                      <CardContent className="p-5">
                        <h3 className="font-bold">Perfil pronto para contratos</h3>
                        <p className="mt-1 text-sm text-slate-300">Os dados salvos aqui serão usados automaticamente como dados do locador nos contratos em PDF.</p>
                      </CardContent>
                    </Card>
                  )}
                </section>
              )}

              {active === "dashboard" && (
                <section>
                  <SectionHeader
                    title="Visão geral"
                    description={`Resumo financeiro e operacional filtrado por ${selectedMonth}.`}
                    action={
                      <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                        <input
                          type="month"
                          value={selectedMonth}
                          onChange={(e) => setSelectedMonth(e.target.value)}
                          className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400"
                        />
                        <div className="relative w-full sm:w-72">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                          <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar imóvel..."
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-slate-400"
                          />
                        </div>
                      </div>
                    }
                  />

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={Building2} title="Imóveis cadastrados" value={properties.length} subtitle={`${dashboard.rented} alugados, ${dashboard.vacant} vagos, ${dashboard.maintenance} em manutenção`} />
                    <StatCard icon={TrendingUp} title="Potencial mensal" value={currency(dashboard.totalRent)} subtitle="Soma do aluguel dos imóveis" />
                    <StatCard icon={Wallet} title="Recebido" value={currency(dashboard.received)} subtitle={`Previsto em cobranças: ${currency(dashboard.expected)}`} />
                    <StatCard icon={AlertTriangle} title="Em atraso" value={currency(dashboard.overdue)} subtitle="Valores pendentes vencidos" />
                  </div>

                  <div className="mt-6 grid gap-6 xl:grid-cols-2">
                    <Card className="rounded-3xl shadow-sm">
                      <CardContent className="p-5">
                        <h3 className="mb-4 font-bold">Pagamentos recentes</h3>
                        {payments.length === 0 ? (
                          <p className="text-sm text-slate-500">Nenhum pagamento cadastrado ainda.</p>
                        ) : (
                          <div className="space-y-3">
                            {payments.slice(0, 5).map((payment) => (
                              <div key={payment.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 p-4">
                                <div>
                                  <p className="font-semibold">{payment.contratos?.propriedades?.nome || "Imóvel não vinculado"}</p>
                                  <p className="text-sm text-slate-500">{payment.contratos?.inquilinos?.nome || "Inquilino não vinculado"} • {payment.referencia_mes}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold">{currency(payment.valor)}</p>
                                  <Badge>{payment.status}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="rounded-3xl shadow-sm">
                      <CardContent className="p-5">
                        <h3 className="mb-4 font-bold">Situação dos imóveis</h3>
                        {properties.length === 0 ? (
                          <p className="text-sm text-slate-500">Cadastre o primeiro imóvel para iniciar o controle.</p>
                        ) : (
                          <div className="grid gap-3">
                            {properties.slice(0, 6).map((property) => (
                              <div key={property.id} className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                                <div>
                                  <p className="font-semibold">{property.nome}</p>
                                  <p className="text-sm text-slate-500">{property.tipo} • {currency(property.valor_aluguel)}</p>
                                </div>
                                <Badge>{property.status}</Badge>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </section>
              )}

              {active === "properties" && (
                <section>
                  <SectionHeader
                    title="Imóveis"
                    description="Cadastre, acompanhe e exclua imóveis salvos diretamente no Supabase."
                    action={<Button onClick={() => {
                      setEditingPropertyId(null);
                      setPropertyForm({ nome: "", endereco: "", tipo: "Casa", status: "Vago", valor_aluguel: "", observacoes: "" });
                      setShowPropertyForm(!showPropertyForm);
                    }} className="rounded-2xl"><Plus className="mr-2" size={16} /> Novo imóvel</Button>}
                  />

                  {showPropertyForm && (
                    <Card className="mb-5 rounded-3xl shadow-sm">
                      <CardContent className="p-5">
                        <form onSubmit={addProperty} className="grid gap-3 md:grid-cols-6">
                          <input placeholder="Nome do imóvel" className="rounded-2xl border p-3 text-sm md:col-span-2" value={propertyForm.nome} onChange={(e) => setPropertyForm({ ...propertyForm, nome: e.target.value })} />
                          <input placeholder="Endereço" className="rounded-2xl border p-3 text-sm md:col-span-3" value={propertyForm.endereco} onChange={(e) => setPropertyForm({ ...propertyForm, endereco: e.target.value })} />
                          <input placeholder="Valor do aluguel" type="number" className="rounded-2xl border p-3 text-sm" value={propertyForm.valor_aluguel} onChange={(e) => setPropertyForm({ ...propertyForm, valor_aluguel: e.target.value })} />
                          <select className="rounded-2xl border p-3 text-sm" value={propertyForm.tipo} onChange={(e) => setPropertyForm({ ...propertyForm, tipo: e.target.value })}>
                            <option>Casa</option>
                            <option>Apartamento</option>
                            <option>Comercial</option>
                            <option>Terreno</option>
                          </select>
                          <select className="rounded-2xl border p-3 text-sm" value={propertyForm.status} onChange={(e) => setPropertyForm({ ...propertyForm, status: e.target.value })}>
                            <option>Vago</option>
                            <option>Alugado</option>
                            <option>Manutenção</option>
                          </select>
                          <input placeholder="Observações" className="rounded-2xl border p-3 text-sm md:col-span-3" value={propertyForm.observacoes} onChange={(e) => setPropertyForm({ ...propertyForm, observacoes: e.target.value })} />
                          <div className="flex gap-2 md:col-span-1">
                            <Button disabled={saving} className="flex-1 rounded-2xl">
                              {saving ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
                              {editingPropertyId ? "Atualizar" : "Salvar"}
                            </Button>
                            {editingPropertyId && (
                              <Button type="button" onClick={cancelPropertyEdit} variant="outline" className="rounded-2xl">
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {filteredProperties.length === 0 ? (
                    <EmptyState title="Nenhum imóvel encontrado" description="Clique em Novo imóvel para cadastrar o primeiro imóvel no banco de dados." />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {filteredProperties.map((property) => (
                        <Card key={property.id} className="rounded-3xl shadow-sm">
                          <CardContent className="p-5">
                            <div className="mb-4 flex items-start justify-between">
                              <div className="rounded-2xl bg-slate-100 p-3"><Building2 size={22} /></div>
                              <Badge>{property.status}</Badge>
                            </div>
                            <h3 className="text-lg font-bold">{property.nome}</h3>
                            <p className="mt-1 min-h-10 text-sm text-slate-500">{property.endereco || "Endereço não informado"}</p>
                            <div className="mt-4 flex items-center justify-between border-t pt-4">
                              <span className="text-sm text-slate-500">{property.tipo}</span>
                              <strong>{currency(property.valor_aluguel)}</strong>
                            </div>
                            {property.observacoes && <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">{property.observacoes}</p>}
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                              <p className="mb-2 font-semibold text-slate-800">Histórico do imóvel</p>
                              {contracts.filter((contract) => contract.propriedade_id === property.id).length === 0 ? (
                                <p className="text-xs text-slate-500">Nenhum contrato registrado.</p>
                              ) : (
                                <div className="space-y-1">
                                  {contracts
                                    .filter((contract) => contract.propriedade_id === property.id)
                                    .map((contract) => (
                                      <p key={contract.id} className="text-xs">
                                        {contract.inquilinos?.nome || "Inquilino"} • {contract.status} • {formatDateBR(contract.data_inicio)} até {contract.data_fim ? formatDateBR(contract.data_fim) : "atual"}
                                      </p>
                                    ))}
                                </div>
                              )}
                            </div>
                            <Button onClick={() => startEditProperty(property)} variant="outline" className="mt-4 w-full rounded-2xl">
                              Editar imóvel
                            </Button>
                            <Button onClick={() => deleteProperty(property.id)} variant="outline" className="mt-4 w-full rounded-2xl text-red-600 hover:text-red-700">
                              <Trash2 className="mr-2" size={16} /> Excluir imóvel
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {active === "tenants" && (
                <section>
                  <SectionHeader
                    title="Inquilinos"
                    description="Cadastre, acompanhe e exclua inquilinos salvos diretamente no Supabase."
                    action={<Button onClick={() => {
                      setEditingTenantId(null);
                      setTenantForm({
                        nome: "",
                        telefone: "",
                        documento: "",
                        email: "",
                        rg: "",
                        data_nascimento: "",
                        nacionalidade: "Brasileiro(a)",
                        estado_civil: "",
                        profissao: "",
                        endereco: "",
                        cidade: "",
                        estado: "",
                        cep: "",
                      });
                      setShowTenantForm(!showTenantForm);
                    }} className="rounded-2xl"><Plus className="mr-2" size={16} /> Novo inquilino</Button>}
                  />

                  {showTenantForm && (
                    <Card className="mb-5 rounded-3xl shadow-sm">
                      <CardContent className="p-5">
                        <form onSubmit={addTenant} className="grid gap-3 md:grid-cols-6">
                          <input placeholder="Nome completo" className="rounded-2xl border p-3 text-sm md:col-span-3" value={tenantForm.nome} onChange={(e) => setTenantForm({ ...tenantForm, nome: e.target.value })} />
                          <input
                            placeholder="CPF ou CNPJ"
                            inputMode="numeric"
                            maxLength={18}
                            className="rounded-2xl border p-3 text-sm"
                            value={tenantForm.documento}
                            onChange={(e) => setTenantForm({ ...tenantForm, documento: formatDocument(e.target.value) })}
                          />
                          <input placeholder="RG" className="rounded-2xl border p-3 text-sm" value={tenantForm.rg} onChange={(e) => setTenantForm({ ...tenantForm, rg: e.target.value })} />
                          <input type="date" className="rounded-2xl border p-3 text-sm" value={tenantForm.data_nascimento} onChange={(e) => setTenantForm({ ...tenantForm, data_nascimento: e.target.value })} />

                          <input placeholder="Nacionalidade" className="rounded-2xl border p-3 text-sm" value={tenantForm.nacionalidade} onChange={(e) => setTenantForm({ ...tenantForm, nacionalidade: e.target.value })} />
                          <select className="rounded-2xl border p-3 text-sm" value={tenantForm.estado_civil} onChange={(e) => setTenantForm({ ...tenantForm, estado_civil: e.target.value })}>
                            <option value="">Estado civil</option>
                            <option>Solteiro(a)</option>
                            <option>Casado(a)</option>
                            <option>Divorciado(a)</option>
                            <option>Viúvo(a)</option>
                            <option>União estável</option>
                          </select>
                          <input placeholder="Profissão" className="rounded-2xl border p-3 text-sm" value={tenantForm.profissao} onChange={(e) => setTenantForm({ ...tenantForm, profissao: e.target.value })} />
                          <div>
                            <input
                              placeholder="Celular com DDD"
                              inputMode="numeric"
                              maxLength={15}
                              className="w-full rounded-2xl border p-3 text-sm"
                              value={tenantForm.telefone}
                              onChange={(e) => setTenantForm({ ...tenantForm, telefone: formatPhone(e.target.value) })}
                            />
                            <p className="mt-1 px-1 text-xs text-slate-500">{getPhoneStatus(tenantForm.telefone)}</p>
                          </div>
                          <input placeholder="E-mail" type="email" className="rounded-2xl border p-3 text-sm md:col-span-2" value={tenantForm.email} onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })} />

                          <input placeholder="Endereço completo" className="rounded-2xl border p-3 text-sm md:col-span-3" value={tenantForm.endereco} onChange={(e) => setTenantForm({ ...tenantForm, endereco: e.target.value })} />
                          <input placeholder="Cidade" className="rounded-2xl border p-3 text-sm" value={tenantForm.cidade} onChange={(e) => setTenantForm({ ...tenantForm, cidade: e.target.value })} />
                          <input placeholder="UF" maxLength={2} className="rounded-2xl border p-3 text-sm" value={tenantForm.estado} onChange={(e) => setTenantForm({ ...tenantForm, estado: e.target.value.toUpperCase() })} />
                          <input placeholder="CEP" className="rounded-2xl border p-3 text-sm" value={tenantForm.cep} onChange={(e) => setTenantForm({ ...tenantForm, cep: e.target.value })} />

                          <div className="flex gap-2 md:col-span-6">
                            <Button disabled={saving} className="flex-1 rounded-2xl">
                              {saving ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
                              {editingTenantId ? "Atualizar inquilino" : "Salvar inquilino"}
                            </Button>
                            {editingTenantId && (
                              <Button type="button" onClick={cancelTenantEdit} variant="outline" className="rounded-2xl">
                                Cancelar
                              </Button>
                            )}
                          </div>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {tenants.length === 0 ? (
                    <EmptyState title="Nenhum inquilino cadastrado" description="Clique em Novo inquilino para cadastrar o primeiro locatário no banco de dados." />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {tenants.map((tenant) => (
                        <Card key={tenant.id} className="rounded-3xl shadow-sm">
                          <CardContent className="p-5">
                            <div className="mb-4 flex items-start justify-between">
                              <div className="rounded-2xl bg-slate-100 p-3"><Users size={22} /></div>
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">Inquilino</span>
                            </div>
                            <h3 className="text-lg font-bold">{tenant.nome}</h3>
                            <div className="mt-3 space-y-1 text-sm text-slate-500">
                              <p>Telefone: {tenant.telefone || "Não informado"}</p>
                              <p>{getDocumentLabel(tenant.documento)}: {tenant.documento || "Não informado"}</p>
                              <p>E-mail: {tenant.email || "Não informado"}</p>
                              <p>RG: {tenant.rg || "Não informado"}</p>
                              <p>Nascimento: {formatDateBR(tenant.data_nascimento)}</p>
                              <p>Estado civil: {tenant.estado_civil || "Não informado"}</p>
                              <p>Profissão: {tenant.profissao || "Não informado"}</p>
                              <p>Endereço: {tenant.endereco || "Não informado"}</p>
                              <p>Cidade/UF: {tenant.cidade || "Não informado"}{tenant.estado ? `/${tenant.estado}` : ""}</p>
                              <p>CEP: {tenant.cep || "Não informado"}</p>
                            </div>
                            {tenant.telefone && (
                              <a
                                href={`https://wa.me/55${onlyNumbers(tenant.telefone)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-4 block rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-emerald-700"
                              >
                                Chamar no WhatsApp
                              </a>
                            )}
                            <Button onClick={() => startEditTenant(tenant)} variant="outline" className="mt-3 w-full rounded-2xl">
                              Editar inquilino
                            </Button>
                            <Button onClick={() => deleteTenant(tenant.id)} variant="outline" className="mt-3 w-full rounded-2xl text-red-600 hover:text-red-700">
                              <Trash2 className="mr-2" size={16} /> Excluir inquilino
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {active === "contracts" && (
                <section>
                  <SectionHeader
                    title="Contratos"
                    description="Crie contratos vinculando imóvel, inquilino, valor e vencimento."
                    action={<Button onClick={() => setShowContractForm(!showContractForm)} className="rounded-2xl"><Plus className="mr-2" size={16} /> Novo contrato</Button>}
                  />

                  {showContractForm && (
                    <Card className="mb-5 rounded-3xl shadow-sm">
                      <CardContent className="p-5">
                        <form onSubmit={addContract} className="grid gap-3 md:grid-cols-6">
                          <select
                            className="rounded-2xl border p-3 text-sm md:col-span-2"
                            value={contractForm.propriedade_id}
                            onChange={(e) => {
                              const selectedProperty = properties.find((property) => property.id === e.target.value);
                              setContractForm({
                                ...contractForm,
                                propriedade_id: e.target.value,
                                valor_aluguel: selectedProperty?.valor_aluguel || "",
                              });
                            }}
                          >
                            <option value="">Selecione o imóvel</option>
                            {properties
                              .filter((property) => {
                                if (editingContractId && property.id === contractForm.propriedade_id) {
                                  return true;
                                }

                                const alreadyHasActiveContract = contracts.some(
                                  (contract) =>
                                    contract.propriedade_id === property.id &&
                                    contract.status === "Ativo" &&
                                    contract.id !== editingContractId
                                );

                                return property.status !== "Alugado" && !alreadyHasActiveContract;
                              })
                              .map((property) => (
                                <option key={property.id} value={property.id}>
                                  {property.nome} - {currency(property.valor_aluguel)}
                                </option>
                              ))}
                          </select>

                          {properties.filter((property) => {
                            if (editingContractId && property.id === contractForm.propriedade_id) return true;
                            return property.status !== "Alugado" && !contracts.some((contract) => contract.propriedade_id === property.id && contract.status === "Ativo" && contract.id !== editingContractId);
                          }).length === 0 && (
                              <div className="rounded-2xl bg-amber-50 p-3 text-sm font-medium text-amber-700 md:col-span-6">
                                Não há imóveis disponíveis para novo contrato. Todos os imóveis estão alugados ou possuem contrato ativo.
                              </div>
                            )}

                          <select
                            className="rounded-2xl border p-3 text-sm md:col-span-2"
                            value={contractForm.inquilino_id}
                            onChange={(e) => setContractForm({ ...contractForm, inquilino_id: e.target.value })}
                          >
                            <option value="">Selecione o inquilino</option>
                            {tenants.map((tenant) => (
                              <option key={tenant.id} value={tenant.id}>
                                {tenant.nome}
                              </option>
                            ))}
                          </select>

                          <div>
                            <label className="mb-1 block px-1 text-xs font-medium text-slate-500">Valor do aluguel</label>
                            <input
                              type="number"
                              placeholder="Ex: 1500"
                              className="w-full rounded-2xl border p-3 text-sm"
                              value={contractForm.valor_aluguel}
                              onChange={(e) => setContractForm({ ...contractForm, valor_aluguel: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="mb-1 block px-1 text-xs font-medium text-slate-500">Dia do vencimento</label>
                            <input
                              type="number"
                              min="1"
                              max="31"
                              placeholder="Ex: 10"
                              className="w-full rounded-2xl border p-3 text-sm"
                              value={contractForm.dia_vencimento}
                              onChange={(e) => setContractForm({ ...contractForm, dia_vencimento: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="mb-1 block px-1 text-xs font-medium text-slate-500">Multa por atraso</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Ex: 50"
                              className="w-full rounded-2xl border p-3 text-sm"
                              value={contractForm.multa_atraso}
                              onChange={(e) => setContractForm({ ...contractForm, multa_atraso: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="mb-1 block px-1 text-xs font-medium text-slate-500">Juros por atraso</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Ex: 2"
                              className="w-full rounded-2xl border p-3 text-sm"
                              value={contractForm.juros_atraso}
                              onChange={(e) => setContractForm({ ...contractForm, juros_atraso: e.target.value })}
                            />
                          </div>

                          <div>
                            <label className="mb-1 block px-1 text-xs font-medium text-slate-500">Caução</label>
                            <input
                              type="number"
                              step="0.01"
                              placeholder="Ex: 1500"
                              className="w-full rounded-2xl border p-3 text-sm"
                              value={contractForm.caucao}
                              onChange={(e) => setContractForm({ ...contractForm, caucao: e.target.value })}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="mb-1 block px-1 text-xs font-medium text-slate-500">Data de início</label>
                            <input
                              type="date"
                              className="w-full rounded-2xl border p-3 text-sm"
                              value={contractForm.data_inicio}
                              onChange={(e) => setContractForm({ ...contractForm, data_inicio: e.target.value })}
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="mb-1 block px-1 text-xs font-medium text-slate-500">Data de fim</label>
                            <input
                              type="date"
                              className="w-full rounded-2xl border p-3 text-sm"
                              value={contractForm.data_fim}
                              onChange={(e) => setContractForm({ ...contractForm, data_fim: e.target.value })}
                            />
                          </div>

                          <select
                            className="rounded-2xl border p-3 text-sm md:col-span-2"
                            value={contractForm.status}
                            onChange={(e) => setContractForm({ ...contractForm, status: e.target.value })}
                          >
                            <option>Ativo</option>
                            <option>Encerrado</option>
                            <option>Suspenso</option>
                          </select>

                          <textarea
                            placeholder="Cláusulas adicionais ou observações do contrato"
                            className="min-h-28 rounded-2xl border p-3 text-sm md:col-span-6"
                            value={contractForm.observacoes}
                            onChange={(e) => setContractForm({ ...contractForm, observacoes: e.target.value })}
                          />

                          <div className="flex gap-2 md:col-span-6">
                            <Button disabled={saving} className="flex-1 rounded-2xl">
                              {saving ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
                              {editingContractId ? "Atualizar contrato" : "Salvar contrato"}
                            </Button>
                            {editingContractId && (
                              <Button type="button" onClick={() => { resetContractForm(); setShowContractForm(false); }} variant="outline" className="rounded-2xl">
                                Cancelar
                              </Button>
                            )}
                          </div>

                          <Button disabled={saving} className="hidden rounded-2xl md:col-span-6">
                            {saving ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
                            Salvar contrato
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {properties.length === 0 || tenants.length === 0 ? (
                    <EmptyState title="Cadastre imóvel e inquilino primeiro" description="Para criar um contrato, é necessário ter pelo menos um imóvel e um inquilino cadastrados." />
                  ) : contracts.length === 0 ? (
                    <EmptyState title="Nenhum contrato cadastrado" description="Clique em Novo contrato para vincular um imóvel a um inquilino." />
                  ) : (
                    <div className="grid gap-4">
                      {contracts.map((contract) => (
                        <Card key={contract.id} className="rounded-3xl shadow-sm">
                          <CardContent className="p-5">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                              <div>
                                <div className="mb-2 flex items-center gap-2">
                                  <FileText size={18} className="text-slate-500" />
                                  <h3 className="font-bold">{contract.propriedades?.nome || "Imóvel não vinculado"}</h3>
                                </div>
                                <p className="text-sm text-slate-500">Inquilino: {contract.inquilinos?.nome || "Não vinculado"}</p>
                                <p className="text-sm text-slate-500">Início: {contract.data_inicio} • Fim: {contract.data_fim || "12 meses automáticos"}</p>
                                <p className="text-sm text-slate-500">Vencimento todo dia {contract.dia_vencimento}</p>
                                <p className="mt-1 text-xs font-medium text-emerald-700">Pagamentos mensais gerados automaticamente.</p>
                                {contract.observacoes && <p className="mt-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">Cláusulas adicionais: {contract.observacoes}</p>}
                              </div>
                              <div className="flex flex-col items-start gap-2 md:items-end">
                                <p className="text-xl font-bold">{currency(contract.valor_aluguel)}</p>
                                <Badge>{contract.status}</Badge>
                                <Button onClick={() => setPreviewContract(contract)} className="rounded-2xl" size="sm">
                                  Prévia do contrato
                                </Button>
                                <Button type="button" onClick={() => generateLeaseContractPDF(contract, profile)} className="rounded-2xl" size="sm">
                                  Baixar PDF
                                </Button>
                                <Button onClick={() => startEditContract(contract)} variant="outline" className="rounded-2xl" size="sm">
                                  Editar contrato
                                </Button>
                                {contract.status === "Ativo" && (
                                  <Button onClick={() => endContract(contract)} variant="outline" className="rounded-2xl" size="sm">
                                    Encerrar contrato
                                  </Button>
                                )}
                                <Button onClick={() => generatePaymentsForContract(contract)} variant="outline" className="rounded-2xl" size="sm">
                                  Gerar/Atualizar cobranças
                                </Button>
                                <Button onClick={() => deleteContract(contract.id)} variant="outline" className="rounded-2xl text-red-600 hover:text-red-700" size="sm">
                                  <Trash2 className="mr-2" size={16} /> Excluir
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {active === "payments" && (
                <section>
                  <SectionHeader title="Pagamentos" description="Cobranças geradas automaticamente a partir dos contratos. Use o botão para marcar como pago." />
                  <Card className="mb-5 rounded-3xl shadow-sm">
                    <CardContent className="grid gap-3 p-5 md:grid-cols-4">
                      <select
                        className="rounded-2xl border p-3 text-sm"
                        value={paymentFilters.status}
                        onChange={(e) => setPaymentFilters({ ...paymentFilters, status: e.target.value })}
                      >
                        <option>Todos</option>
                        <option>Atrasado</option>
                        <option>Pendente</option>
                        <option>Pago</option>
                        <option>Cancelado</option>
                      </select>

                      <select
                        className="rounded-2xl border p-3 text-sm"
                        value={paymentFilters.property}
                        onChange={(e) => setPaymentFilters({ ...paymentFilters, property: e.target.value })}
                      >
                        <option>Todos</option>
                        {properties.map((property) => (
                          <option key={property.id}>{property.nome}</option>
                        ))}
                      </select>

                      <select
                        className="rounded-2xl border p-3 text-sm"
                        value={paymentFilters.tenant}
                        onChange={(e) => setPaymentFilters({ ...paymentFilters, tenant: e.target.value })}
                      >
                        <option>Todos</option>
                        {tenants.map((tenant) => (
                          <option key={tenant.id}>{tenant.nome}</option>
                        ))}
                      </select>

                      <input
                        placeholder="Buscar por mês, imóvel ou inquilino"
                        className="rounded-2xl border p-3 text-sm"
                        value={paymentFilters.search}
                        onChange={(e) => setPaymentFilters({ ...paymentFilters, search: e.target.value })}
                      />
                    </CardContent>
                  </Card>

                  {payments.length === 0 ? (
                    <EmptyState title="Nenhum pagamento cadastrado" description="Depois vamos gerar cobranças automaticamente a partir dos contratos." />
                  ) : filteredPayments.length === 0 ? (
                    <EmptyState title="Nenhum pagamento encontrado" description="Altere os filtros para visualizar outros pagamentos." />
                  ) : (
                    <div className="grid gap-4">
                      {filteredPayments.map((payment) => (
                        <Card key={payment.id} className="rounded-3xl shadow-sm">
                          <CardContent className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-start gap-4">
                              <div className="rounded-2xl bg-slate-100 p-3">
                                {payment.status === "Pago" ? <CheckCircle2 size={22} /> : payment.status === "Atrasado" ? <XCircle size={22} /> : <Clock size={22} />}
                              </div>
                              <div>
                                <h3 className="font-bold">{payment.contratos?.propriedades?.nome || "Imóvel não vinculado"}</h3>
                                <p className="text-sm text-slate-500">{payment.contratos?.inquilinos?.nome || "Inquilino não vinculado"} • {payment.referencia_mes}</p>
                                <p className="text-sm text-slate-500">Vencimento: {payment.data_vencimento}</p>
                              </div>
                            </div>
                            <div className="flex flex-col items-start gap-2 md:items-end">
                              <p className="text-lg font-bold">{currency(payment.valor)}</p>
                              <Badge>{payment.status}</Badge>
                              {payment.status !== "Pago" ? (
                                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                                  <Button onClick={() => markPaymentAsPaid(payment)} className="rounded-2xl" size="sm">Marcar como pago</Button>
                                  {payment.contratos?.inquilinos?.telefone && (
                                    <a
                                      href={getWhatsAppChargeLink(payment)}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                                    >
                                      Cobrar no WhatsApp
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <div className="mt-1 flex flex-col gap-2 sm:flex-row">
                                  <Button onClick={() => generateReceiptPDF(payment, profile)} className="rounded-2xl" size="sm">Gerar recibo PDF</Button>
                                  <Button onClick={() => unmarkPaymentAsPaid(payment)} variant="outline" className="rounded-2xl text-red-600 hover:text-red-700" size="sm">Desmarcar pagamento</Button>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {active === "expenses" && (
                <section>
                  <SectionHeader
                    title="Despesas"
                    description="Registre custos por imóvel: manutenção, IPTU, condomínio, reforma e outros."
                    action={<Button onClick={() => setShowExpenseForm(!showExpenseForm)} className="rounded-2xl"><Plus className="mr-2" size={16} /> Nova despesa</Button>}
                  />

                  {showExpenseForm && (
                    <Card className="mb-5 rounded-3xl shadow-sm">
                      <CardContent className="p-5">
                        <form onSubmit={addExpense} className="grid gap-3 md:grid-cols-6">
                          <select
                            className="rounded-2xl border p-3 text-sm md:col-span-2"
                            value={expenseForm.propriedade_id}
                            onChange={(e) => setExpenseForm({ ...expenseForm, propriedade_id: e.target.value })}
                          >
                            <option value="">Selecione o imóvel</option>
                            {properties.map((property) => (
                              <option key={property.id} value={property.id}>{property.nome}</option>
                            ))}
                          </select>

                          <select
                            className="rounded-2xl border p-3 text-sm"
                            value={expenseForm.categoria}
                            onChange={(e) => setExpenseForm({ ...expenseForm, categoria: e.target.value })}
                          >
                            <option>Manutenção</option>
                            <option>IPTU</option>
                            <option>Condomínio</option>
                            <option>Água</option>
                            <option>Energia</option>
                            <option>Reforma</option>
                            <option>Comissão</option>
                            <option>Taxas</option>
                            <option>Outros</option>
                          </select>

                          <input
                            type="date"
                            className="rounded-2xl border p-3 text-sm"
                            value={expenseForm.data_despesa}
                            onChange={(e) => setExpenseForm({ ...expenseForm, data_despesa: e.target.value })}
                          />

                          <input
                            type="number"
                            step="0.01"
                            placeholder="Valor"
                            className="rounded-2xl border p-3 text-sm"
                            value={expenseForm.valor}
                            onChange={(e) => setExpenseForm({ ...expenseForm, valor: e.target.value })}
                          />

                          <input
                            placeholder="Descrição"
                            className="rounded-2xl border p-3 text-sm md:col-span-5"
                            value={expenseForm.descricao}
                            onChange={(e) => setExpenseForm({ ...expenseForm, descricao: e.target.value })}
                          />

                          <Button disabled={saving} className="rounded-2xl">
                            {saving ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
                            Salvar
                          </Button>
                        </form>
                      </CardContent>
                    </Card>
                  )}

                  {properties.length === 0 ? (
                    <EmptyState title="Cadastre um imóvel primeiro" description="Para registrar uma despesa, é necessário vincular o custo a um imóvel." />
                  ) : expenses.length === 0 ? (
                    <EmptyState title="Nenhuma despesa cadastrada" description="Clique em Nova despesa para registrar manutenção, IPTU, condomínio ou outro custo." />
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {expenses.map((expense) => (
                        <Card key={expense.id} className="rounded-3xl shadow-sm">
                          <CardContent className="p-5">
                            <div className="mb-3 flex items-center justify-between">
                              <div className="rounded-2xl bg-slate-100 p-3"><Wrench size={22} /></div>
                              <strong>{currency(expense.valor)}</strong>
                            </div>
                            <h3 className="font-bold">{expense.categoria}</h3>
                            <p className="text-sm text-slate-500">{expense.descricao || "Sem descrição"}</p>
                            <p className="mt-2 text-sm font-medium">{expense.propriedades?.nome || "Imóvel não vinculado"}</p>
                            <p className="text-xs text-slate-500">Data: {expense.data_despesa}</p>
                            <Button onClick={() => deleteExpense(expense.id)} variant="outline" className="mt-4 w-full rounded-2xl text-red-600 hover:text-red-700">
                              <Trash2 className="mr-2" size={16} /> Excluir despesa
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>
              )}

              {previewContract && (
                <Card className="mb-6 rounded-3xl border-slate-300 bg-white shadow-sm">
                  <CardContent className="p-5">
                    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-bold">Prévia do contrato</h3>
                        <p className="text-sm text-slate-500">Revise os principais dados antes de baixar o PDF.</p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => generateLeaseContractPDF(previewContract, profile)} className="rounded-2xl" size="sm">Baixar PDF</Button>
                        <Button onClick={() => setPreviewContract(null)} variant="outline" className="rounded-2xl" size="sm">Fechar</Button>
                      </div>
                    </div>
                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <p><strong>Locador:</strong> {profile?.nome_completo || "Preencha o perfil"}</p>
                      <p><strong>Locatário:</strong> {previewContract.inquilinos?.nome || "Não informado"}</p>
                      <p><strong>Imóvel:</strong> {previewContract.propriedades?.nome || "Não informado"}</p>
                      <p><strong>Aluguel:</strong> {currency(previewContract.valor_aluguel)}</p>
                      <p><strong>Início:</strong> {formatDateBR(previewContract.data_inicio)}</p>
                      <p><strong>Fim:</strong> {previewContract.data_fim ? formatDateBR(previewContract.data_fim) : "Prazo indeterminado"}</p>
                      <p><strong>Vencimento:</strong> Dia {previewContract.dia_vencimento}</p>
                      <p><strong>Status:</strong> {previewContract.status}</p>
                    </div>
                    {previewContract.observacoes && (
                      <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                        <strong>Cláusulas adicionais:</strong>
                        <p className="mt-1 whitespace-pre-wrap">{previewContract.observacoes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {active === "reports" && (
                <section>
                  <SectionHeader
                    title="Relatórios financeiros"
                    description="Análise geral de receita, despesas, inadimplência e lucro real por imóvel."
                  />

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard icon={Wallet} title="Total recebido" value={currency(dashboard.received)} subtitle="Pagamentos marcados como pagos" />
                    <StatCard icon={AlertTriangle} title="Total pendente/atrasado" value={currency(dashboard.overdue)} subtitle="Valores ainda não recebidos" />
                    <StatCard icon={Wrench} title="Total de despesas" value={currency(dashboard.expenseTotal)} subtitle="Custos registrados nos imóveis" />
                    <StatCard icon={TrendingUp} title="Lucro real" value={currency(dashboard.netProfit)} subtitle="Recebido menos despesas" />
                  </div>

                  <Card className="mt-6 rounded-3xl shadow-sm">
                    <CardContent className="p-5">
                      <div className="mb-4 flex flex-col gap-1">
                        <h3 className="text-lg font-bold">Desempenho por imóvel</h3>
                        <p className="text-sm text-slate-500">Comparativo entre recebimentos, pendências, despesas e lucro real.</p>
                      </div>

                      {propertyReports.length === 0 ? (
                        <p className="text-sm text-slate-500">Nenhum imóvel cadastrado.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[820px] text-left text-sm">
                            <thead className="border-b bg-slate-50 text-slate-600">
                              <tr>
                                <th className="p-4">Imóvel</th>
                                <th className="p-4">Status</th>
                                <th className="p-4">Aluguel base</th>
                                <th className="p-4">Recebido</th>
                                <th className="p-4">Pendente</th>
                                <th className="p-4">Despesas</th>
                                <th className="p-4">Lucro real</th>
                              </tr>
                            </thead>
                            <tbody>
                              {propertyReports.map((item) => (
                                <tr key={item.id} className="border-b last:border-b-0">
                                  <td className="p-4 font-semibold">{item.nome}</td>
                                  <td className="p-4"><Badge>{item.status}</Badge></td>
                                  <td className="p-4">{currency(item.valor_aluguel)}</td>
                                  <td className="p-4 font-medium text-emerald-700">{currency(item.received)}</td>
                                  <td className="p-4 font-medium text-amber-700">{currency(item.pending)}</td>
                                  <td className="p-4 font-medium text-red-700">{currency(item.expenseTotal)}</td>
                                  <td className={`p-4 font-bold ${item.netProfit >= 0 ? "text-emerald-700" : "text-red-700"}`}>{currency(item.netProfit)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
