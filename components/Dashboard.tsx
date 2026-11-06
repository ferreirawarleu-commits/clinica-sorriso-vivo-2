"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type NavId = "dashboard" | "agenda" | "pacientes";
type Status = "Agendada" | "Confirmada" | "Concluída";
type StatusFilter = "Todos" | Status | "Livre";
type Dialog = "consulta" | "paciente" | null;

type Patient = {
  id: string;
  name: string;
  phone: string;
};

type Appointment = {
  id: string;
  date: string;
  time: string;
  patientId: string | null;
  status: Status | null;
  procedure: string;
  dentist: string;
  notes: string;
};

const CLINIC_DAY = "2026-11-05";
const UPCOMING_AFTER = "14:00";
const DENTIST = "Dra. Helena Vasconcelos";
const DATE_OPTIONS = [CLINIC_DAY, "2026-11-06", "2026-11-07"];

/** Totais do wireframe incluem encaixes fora da grade exibida. */
const OFF_GRID = { agendadas: 9, confirmadas: 5, concluidas: 0 };

const NAV: { id: NavId; label: string }[] = [
  { id: "dashboard", label: "Dashboard" },
  { id: "agenda", label: "Agenda" },
  { id: "pacientes", label: "Pacientes" },
];

const STATUS_STYLES: Record<Status, string> = {
  Concluída: "bg-[#e5f4ea] text-[#1d6b3a]",
  Confirmada: "bg-[#e3f0fb] text-[#1d4f86]",
  Agendada: "bg-[#fff1d6] text-[#8a5a10]",
};

const INITIAL_PATIENTS: Patient[] = [
  { id: "p1", name: "Ana Paula Souza", phone: "(11) 98801-1001" },
  { id: "p2", name: "João Ricardo Lima", phone: "(11) 98802-1002" },
  { id: "p3", name: "Maria Fernanda Costa", phone: "(11) 98803-1003" },
  { id: "p4", name: "Pedro Henrique Dias", phone: "(11) 98804-1004" },
  { id: "p5", name: "Carlos Mendes", phone: "(11) 98805-1005" },
  { id: "p6", name: "Juliana Alves", phone: "(11) 98806-1006" },
  { id: "p7", name: "Roberto Nunes", phone: "(11) 98807-1007" },
  { id: "p8", name: "Fernanda Rocha", phone: "(11) 98808-1008" },
  { id: "p9", name: "Luciana Martins", phone: "(11) 98809-1009" },
];

const INITIAL_APPOINTMENTS: Appointment[] = [
  appointment("a1", "08:00", "p1", "Concluída", "Limpeza e profilaxia", "Sem queixas. Retorno em 6 meses."),
  appointment("a2", "09:00", "p2", "Concluída", "Restauração em resina", "Dente 16 restaurado. Orientado sobre higiene."),
  appointment("a3", "10:00", "p3", "Concluída", "Avaliação inicial", "Plano de tratamento apresentado."),
  appointment("a4", "11:00", null, null, "", ""),
  appointment("a5", "13:30", "p4", "Confirmada", "Manutenção de aparelho", "Ajuste de arco superior."),
  appointment("a6", "14:00", "p5", "Confirmada", "Consulta de rotina", "Chegar 10 minutos antes."),
  appointment("a7", "14:30", "p6", "Agendada", "Clareamento", "Primeira sessão."),
  appointment("a8", "15:30", "p7", "Agendada", "Tratamento de canal", "Sessão 2 de 3."),
  appointment("a9", "16:30", "p8", "Confirmada", "Prova de coroa", "Coroa do dente 21."),
  appointment("a10", "17:30", "p9", "Agendada", "Extração", "Trazer exames recentes."),
];

function appointment(
  id: string,
  time: string,
  patientId: string | null,
  status: Status | null,
  procedure: string,
  notes: string,
): Appointment {
  return {
    id,
    date: CLINIC_DAY,
    time,
    patientId,
    status,
    procedure,
    dentist: DENTIST,
    notes,
  };
}

function digits(value: string) {
  return value.replace(/\D/g, "");
}

function matchesPatient(patient: Patient, query: string) {
  const text = query.trim().toLowerCase();
  if (!text) return true;
  if (patient.name.toLowerCase().includes(text)) return true;
  const queryDigits = digits(text);
  return queryDigits.length > 0 && digits(patient.phone).includes(queryDigits);
}

function formatIso(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

function formatToday() {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function fieldClass() {
  return "h-11 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus-visible:border-clinic-soft focus-visible:ring-2 focus-visible:ring-clinic-soft/20";
}

export function Dashboard() {
  const [nav, setNav] = useState<NavId>("dashboard");
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [appointments, setAppointments] = useState<Appointment[]>(INITIAL_APPOINTMENTS);
  const [date, setDate] = useState(CLINIC_DAY);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("Todos");
  const [searchDraft, setSearchDraft] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const [todayLabel, setTodayLabel] = useState("Quinta-feira, 05/11/2026");

  const [consultaPatient, setConsultaPatient] = useState("");
  const [consultaDate, setConsultaDate] = useState(CLINIC_DAY);
  const [consultaTime, setConsultaTime] = useState("09:00");
  const [consultaStatus, setConsultaStatus] = useState<Status>("Agendada");
  const [consultaProcedure, setConsultaProcedure] = useState("Avaliação");
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");

  useEffect(() => {
    setTodayLabel(formatToday());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setDialog(null);
      setSelectedId(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const patientMap = useMemo(
    () => new Map(patients.map((patient) => [patient.id, patient])),
    [patients],
  );

  const dayAppointments = useMemo(
    () =>
      appointments
        .filter((item) => item.date === date)
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time)),
    [appointments, date],
  );

  const stats = useMemo(() => {
    const booked = dayAppointments.filter((item) => item.patientId);
    const visible = {
      agendadas: booked.filter((item) => item.status === "Agendada").length,
      confirmadas: booked.filter((item) => item.status === "Confirmada").length,
      concluidas: booked.filter((item) => item.status === "Concluída").length,
    };
    if (date !== CLINIC_DAY) return visible;
    return {
      agendadas: visible.agendadas + OFF_GRID.agendadas,
      confirmadas: visible.confirmadas + OFF_GRID.confirmadas,
      concluidas: visible.concluidas + OFF_GRID.concluidas,
    };
  }, [date, dayAppointments]);

  const rows = useMemo(() => {
    return dayAppointments.filter((item) => {
      if (statusFilter === "Livre") return !item.patientId;
      if (statusFilter !== "Todos" && item.status !== statusFilter) return false;
      if (!appliedQuery.trim()) return true;
      if (!item.patientId) return false;
      const patient = patientMap.get(item.patientId);
      return patient ? matchesPatient(patient, appliedQuery) : false;
    });
  }, [appliedQuery, dayAppointments, patientMap, statusFilter]);

  const upcoming = useMemo(() => {
    return dayAppointments
      .filter(
        (item) =>
          item.patientId &&
          item.status !== "Concluída" &&
          (date !== CLINIC_DAY || item.time >= UPCOMING_AFTER),
      )
      .slice(0, 3);
  }, [date, dayAppointments]);

  const visiblePatients = useMemo(() => {
    const query = appliedQuery.trim();
    if (!query) return patients;
    return patients.filter((patient) => matchesPatient(patient, query));
  }, [appliedQuery, patients]);

  const selected = appointments.find((item) => item.id === selectedId) ?? null;
  const selectedPatient = selected?.patientId ? patientMap.get(selected.patientId) ?? null : null;

  function search(event: FormEvent) {
    event.preventDefault();
    setAppliedQuery(searchDraft.trim());
  }

  function openConsulta(time?: string) {
    setConsultaPatient("");
    setConsultaDate(date);
    setConsultaTime(time ?? "09:00");
    setConsultaStatus("Agendada");
    setConsultaProcedure("Avaliação");
    setFormError("");
    setDialog("consulta");
  }

  function openPaciente() {
    setPatientName("");
    setPatientPhone("");
    setFormError("");
    setDialog("paciente");
  }

  function saveConsulta(event: FormEvent) {
    event.preventDefault();
    if (!consultaPatient || !consultaTime || !consultaDate) {
      setFormError("Escolha paciente, data e horário.");
      return;
    }
    const next: Appointment = {
      id: `a-${Date.now()}`,
      date: consultaDate,
      time: consultaTime,
      patientId: consultaPatient,
      status: consultaStatus,
      procedure: consultaProcedure.trim() || "Consulta",
      dentist: DENTIST,
      notes: "",
    };
    setAppointments((current) => {
      const freeIndex = current.findIndex(
        (item) => item.date === next.date && item.time === next.time && !item.patientId,
      );
      if (freeIndex >= 0) {
        const copy = current.slice();
        copy[freeIndex] = { ...copy[freeIndex], ...next, id: copy[freeIndex].id };
        return copy;
      }
      return [...current, next];
    });
    setDate(consultaDate);
    setDialog(null);
    setToast("Consulta adicionada à agenda.");
  }

  function savePaciente(event: FormEvent) {
    event.preventDefault();
    if (patientName.trim().length < 3 || digits(patientPhone).length < 8) {
      setFormError("Informe o nome completo e um telefone válido.");
      return;
    }
    setPatients((current) => [
      ...current,
      { id: `p-${Date.now()}`, name: patientName.trim(), phone: patientPhone.trim() },
    ]);
    setDialog(null);
    setToast("Paciente cadastrado.");
    setNav("pacientes");
  }

  function updateStatus(id: string, status: Status) {
    setAppointments((current) =>
      current.map((item) => (item.id === id ? { ...item, status } : item)),
    );
  }

  const title =
    nav === "dashboard" ? "Visão geral" : nav === "agenda" ? "Agenda" : "Pacientes";

  return (
    <div className="flex h-screen overflow-hidden bg-foam text-ink">
      <aside className="flex w-[248px] shrink-0 flex-col bg-clinic text-white">
        <div className="flex items-center gap-3 px-5 pt-7">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 ring-1 ring-white/15">
            <ToothMark />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-white/60">Clínica</p>
            <p
              className="text-lg leading-tight text-white"
              style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
            >
              Sorriso Vivo
            </p>
          </div>
        </div>

        <div className="mx-5 mt-7 border-t border-white/15" />

        <nav className="mt-4 flex flex-col gap-1 px-3" aria-label="Seções">
          {NAV.map((item) => {
            const active = nav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setNav(item.id)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm ${
                  active ? "bg-white/12 font-semibold text-white" : "text-white/70 hover:bg-white/8 hover:text-white"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span className="w-3 text-gold">{active ? ">" : ""}</span>
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto px-8 py-7">
        <header className="flex items-start justify-between gap-6">
          <h1
            className="text-3xl text-ink"
            style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
          >
            {title}
          </h1>
          <p className="pt-2 text-sm text-muted">{todayLabel}</p>
        </header>

        <form onSubmit={search} className="mt-6 flex gap-3">
          <label className="sr-only" htmlFor="busca-paciente">
            Pesquisar paciente por nome ou telefone
          </label>
          <input
            id="busca-paciente"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            placeholder="Pesquisar paciente por nome ou telefone"
            className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-card px-4 text-sm outline-none focus-visible:border-clinic-soft focus-visible:ring-2 focus-visible:ring-clinic-soft/20"
          />
          <button
            type="submit"
            className="h-12 rounded-xl bg-clinic px-6 text-sm font-semibold tracking-[0.14em] text-white hover:bg-clinic-soft"
          >
            BUSCAR
          </button>
        </form>

        {appliedQuery ? (
          <p className="mt-3 text-sm text-muted">
            Resultados para “{appliedQuery}”.{" "}
            <button
              type="button"
              className="font-medium text-clinic-soft underline-offset-2 hover:underline"
              onClick={() => {
                setAppliedQuery("");
                setSearchDraft("");
              }}
            >
              Limpar busca
            </button>
          </p>
        ) : null}

        {toast ? (
          <p className="mt-4 rounded-xl bg-[#e5f4ea] px-4 py-3 text-sm text-[#1d6b3a]" role="status">
            {toast}
          </p>
        ) : null}

        {nav === "dashboard" ? (
          <>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => openConsulta()}
                className="flex h-24 items-center justify-center gap-3 rounded-2xl bg-clinic-soft text-lg font-semibold tracking-wide text-white shadow-[0_16px_32px_-20px_rgba(18,63,59,0.95)] hover:bg-clinic"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">+</span>
                NOVA CONSULTA
              </button>
              <button
                type="button"
                onClick={openPaciente}
                className="flex h-24 items-center justify-center gap-3 rounded-2xl border border-line bg-card text-lg font-semibold tracking-wide text-ink hover:border-clinic-soft"
              >
                <span className="grid h-8 w-8 place-items-center rounded-full bg-foam text-clinic-soft">+</span>
                NOVO PACIENTE
              </button>
            </div>

            <h2 className="mt-8 text-xs font-semibold tracking-[0.2em] text-muted">RESUMO DO DIA</h2>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <StatCard
                label="AGENDADAS"
                value={stats.agendadas}
                active={statusFilter === "Agendada"}
                onClick={() => setStatusFilter(statusFilter === "Agendada" ? "Todos" : "Agendada")}
              />
              <StatCard
                label="CONFIRMADAS"
                value={stats.confirmadas}
                active={statusFilter === "Confirmada"}
                onClick={() => setStatusFilter(statusFilter === "Confirmada" ? "Todos" : "Confirmada")}
              />
              <StatCard
                label="CONCLUÍDAS"
                value={stats.concluidas}
                active={statusFilter === "Concluída"}
                onClick={() => setStatusFilter(statusFilter === "Concluída" ? "Todos" : "Concluída")}
              />
            </div>

            <div className="mt-6 grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
              {renderAgenda()}
              <UpcomingList
                items={upcoming}
                patients={patientMap}
                onOpen={setSelectedId}
                onSeeAll={() => setNav("agenda")}
              />
            </div>
          </>
        ) : null}

        {nav === "agenda" ? (
          <div className="mt-6">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={() => openConsulta()}
                className="rounded-xl bg-clinic px-4 py-2.5 text-sm font-semibold text-white hover:bg-clinic-soft"
              >
                + Nova consulta
              </button>
            </div>
            {renderAgenda()}
          </div>
        ) : null}

        {nav === "pacientes" ? (
          <section className="mt-6 rounded-2xl border border-line bg-card p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold tracking-[0.2em] text-muted">PACIENTES</h2>
              <button
                type="button"
                onClick={openPaciente}
                className="rounded-xl bg-clinic px-4 py-2.5 text-sm font-semibold text-white hover:bg-clinic-soft"
              >
                + Novo paciente
              </button>
            </div>
            {visiblePatients.length === 0 ? (
              <p className="py-8 text-sm text-muted">Nenhum paciente encontrado.</p>
            ) : (
              <ul className="divide-y divide-line">
                {visiblePatients.map((patient) => {
                  const next = appointments
                    .filter((item) => item.patientId === patient.id && item.status !== "Concluída")
                    .slice()
                    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0];
                  return (
                    <li key={patient.id} className="flex items-center justify-between gap-4 py-3">
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-muted">{patient.phone}</p>
                      </div>
                      <p className="text-right text-sm text-muted">
                        {next ? `${formatIso(next.date)} · ${next.time}` : "Sem retorno"}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : null}
      </main>

      {selected && selectedPatient ? (
        <div className="fixed inset-0 z-30 flex justify-end bg-[#14221f]/30" onClick={() => setSelectedId(null)}>
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="detalhe-titulo"
            className="h-full w-full max-w-md overflow-y-auto bg-card p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold tracking-[0.16em] text-muted">CONSULTA</p>
                <h2 id="detalhe-titulo" className="mt-1 text-2xl" style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}>
                  {selectedPatient.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="rounded-lg px-2 py-1 text-xl text-muted hover:bg-foam"
                aria-label="Fechar detalhes"
              >
                ×
              </button>
            </div>
            <dl className="mt-6 space-y-4 text-sm">
              <Detail label="Horário" value={`${formatIso(selected.date)} às ${selected.time}`} />
              <Detail label="Telefone" value={selectedPatient.phone} />
              <Detail label="Procedimento" value={selected.procedure || "—"} />
              <Detail label="Dentista" value={selected.dentist} />
              <Detail label="Observações" value={selected.notes || "Sem observações."} />
            </dl>
            <p className="mt-6 text-xs font-semibold tracking-[0.16em] text-muted">STATUS</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["Agendada", "Confirmada", "Concluída"] as Status[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => updateStatus(selected.id, status)}
                  className={`rounded-full px-3 py-1.5 text-sm ${
                    selected.status === status ? STATUS_STYLES[status] : "bg-foam text-muted"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </aside>
        </div>
      ) : null}

      {dialog === "consulta" ? (
        <Modal title="Nova consulta" onClose={() => setDialog(null)}>
          <form onSubmit={saveConsulta} className="space-y-3">
            <label className="block text-sm">
              Paciente
              <select
                value={consultaPatient}
                onChange={(event) => setConsultaPatient(event.target.value)}
                className={`${fieldClass()} mt-1`}
              >
                <option value="">Selecione</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block text-sm">
                Data
                <input
                  type="date"
                  value={consultaDate}
                  onChange={(event) => setConsultaDate(event.target.value)}
                  className={`${fieldClass()} mt-1`}
                />
              </label>
              <label className="block text-sm">
                Horário
                <input
                  type="time"
                  value={consultaTime}
                  onChange={(event) => setConsultaTime(event.target.value)}
                  className={`${fieldClass()} mt-1`}
                />
              </label>
            </div>
            <label className="block text-sm">
              Status
              <select
                value={consultaStatus}
                onChange={(event) => setConsultaStatus(event.target.value as Status)}
                className={`${fieldClass()} mt-1`}
              >
                <option>Agendada</option>
                <option>Confirmada</option>
                <option>Concluída</option>
              </select>
            </label>
            <label className="block text-sm">
              Procedimento
              <input
                value={consultaProcedure}
                onChange={(event) => setConsultaProcedure(event.target.value)}
                className={`${fieldClass()} mt-1`}
              />
            </label>
            {formError ? <p className="text-sm text-[#9a3b2f]">{formError}</p> : null}
            <button type="submit" className="h-11 w-full rounded-xl bg-clinic font-semibold text-white hover:bg-clinic-soft">
              Salvar consulta
            </button>
          </form>
        </Modal>
      ) : null}

      {dialog === "paciente" ? (
        <Modal title="Novo paciente" onClose={() => setDialog(null)}>
          <form onSubmit={savePaciente} className="space-y-3">
            <label className="block text-sm">
              Nome
              <input
                value={patientName}
                onChange={(event) => setPatientName(event.target.value)}
                className={`${fieldClass()} mt-1`}
                placeholder="Nome completo"
              />
            </label>
            <label className="block text-sm">
              Telefone
              <input
                value={patientPhone}
                onChange={(event) => setPatientPhone(event.target.value)}
                className={`${fieldClass()} mt-1`}
                placeholder="(11) 90000-0000"
              />
            </label>
            {formError ? <p className="text-sm text-[#9a3b2f]">{formError}</p> : null}
            <button type="submit" className="h-11 w-full rounded-xl bg-clinic font-semibold text-white hover:bg-clinic-soft">
              Cadastrar paciente
            </button>
          </form>
        </Modal>
      ) : null}
    </div>
  );

  function renderAgenda() {
    return (
      <section className="rounded-2xl border border-line bg-card p-5">
        <h2 className="text-xs font-semibold tracking-[0.2em] text-muted">AGENDA DO DIA</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <label className="text-sm text-muted">
            Data:{" "}
            <select
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className="ml-1 h-10 rounded-lg border border-line bg-white px-2 text-ink"
              aria-label="Data da agenda"
            >
              {DATE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {formatIso(option)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm text-muted">
            Status:{" "}
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="ml-1 h-10 rounded-lg border border-line bg-white px-2 text-ink"
              aria-label="Filtrar por status"
            >
              <option value="Todos">Todos</option>
              <option value="Agendada">Agendada</option>
              <option value="Confirmada">Confirmada</option>
              <option value="Concluída">Concluída</option>
              <option value="Livre">Horário livre</option>
            </select>
          </label>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] tracking-[0.14em] text-muted">
                <th className="py-3 font-semibold">HORÁRIO</th>
                <th className="py-3 font-semibold">PACIENTE</th>
                <th className="py-3 font-semibold">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-muted">
                    Nenhuma consulta nesta data.
                  </td>
                </tr>
              ) : (
                rows.map((item) => {
                  const patient = item.patientId ? patientMap.get(item.patientId) : null;
                  const active = selectedId === item.id;
                  return (
                    <tr
                      key={item.id}
                      tabIndex={patient ? 0 : undefined}
                      onClick={() => patient && setSelectedId(item.id)}
                      onKeyDown={(event) => {
                        if (!patient) return;
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedId(item.id);
                        }
                      }}
                      className={`border-b border-line/80 ${
                        patient ? "cursor-pointer hover:bg-foam" : ""
                      } ${active ? "bg-foam" : ""}`}
                    >
                      <td className="py-3.5 font-medium tabular-nums">{item.time}</td>
                      <td className="py-3.5">
                        {patient ? patient.name : <span className="text-muted">(horário livre)</span>}
                      </td>
                      <td className="py-3.5">
                        {item.status ? (
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[item.status]}`}>
                            {item.status}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              openConsulta(item.time);
                            }}
                            className="rounded-full border border-clinic-soft px-3 py-1 text-xs font-semibold text-clinic-soft hover:bg-clinic-soft hover:text-white"
                          >
                            + Agendar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted">Clique em uma consulta para ver os detalhes</p>
      </section>
    );
  }
}

function StatCard({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-card px-5 py-5 text-left ${
        active ? "border-clinic-soft ring-2 ring-clinic-soft/20" : "border-line"
      }`}
    >
      <p className="text-xs font-semibold tracking-[0.16em] text-muted">{label}</p>
      <p
        className="mt-6 text-5xl tabular-nums"
        style={{ fontFamily: "var(--font-fraunces), Georgia, serif" }}
      >
        {value}
      </p>
    </button>
  );
}

function UpcomingList({
  items,
  patients,
  onOpen,
  onSeeAll,
}: {
  items: Appointment[];
  patients: Map<string, Patient>;
  onOpen: (id: string) => void;
  onSeeAll: () => void;
}) {
  return (
    <aside className="rounded-2xl border border-line bg-card p-5">
      <h2 className="text-xs font-semibold leading-5 tracking-[0.16em] text-muted">
        PRÓXIMOS
        <br />
        ATENDIMENTOS
      </h2>
      {items.length === 0 ? (
        <p className="mt-6 text-sm text-muted">Nenhum atendimento pendente.</p>
      ) : (
        <ul className="mt-2">
          {items.map((item) => {
            const patient = item.patientId ? patients.get(item.patientId) : null;
            return (
              <li key={item.id} className="border-b border-line py-4 last:border-b-0">
                <button type="button" onClick={() => onOpen(item.id)} className="w-full text-left">
                  <p className="text-sm font-semibold tabular-nums">{item.time}</p>
                  <p className="mt-1">{patient?.name}</p>
                  <p className="text-sm text-muted">({item.status})</p>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <button
        type="button"
        onClick={onSeeAll}
        className="mt-4 text-sm font-medium text-clinic-soft hover:underline"
      >
        Ver agenda completa &gt;
      </button>
    </aside>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-[0.12em] text-muted">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-[#14221f]/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <h2 id="modal-titulo" className="text-lg font-semibold">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-xl text-muted">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ToothMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true">
      <path
        d="M8 3.2c1.7 0 2.1 1.8 4 1.8s2.3-1.8 4-1.8c2.3 0 3.8 1.9 3.8 4.6 0 3.7-1.1 6.7-2.1 8.6-.6 1.2-1.5 3.6-2.5 3.6-1 0-1.3-1.9-3.2-1.9s-2.2 1.9-3.2 1.9c-1 0-1.9-2.4-2.5-3.6C5.3 14.5 4.2 11.5 4.2 7.8c0-2.7 1.5-4.6 3.8-4.6Z"
        fill="#F6E7C8"
        stroke="#E0B56A"
        strokeWidth="1.2"
      />
    </svg>
  );
}
