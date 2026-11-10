"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

interface Ticket { id:string; ticket_number:number; subject:string; category:string; priority:string; status:string; owner_discord_id:string; owner_username:string|null; assigned_to:string|null; assignee_username:string|null; created_at:string; updated_at:string }
interface Message { id:string; body:string; is_internal_note:number; created_at:string; author_discord_id:string; author_username:string|null }

export function StaffTicketDetail({ ticketId }: { ticketId:string }) {
  const [ticket,setTicket]=useState<Ticket|null>(null);
  const [messages,setMessages]=useState<Message[]>([]);
  const [message,setMessage]=useState("");
  const [internalNote,setInternalNote]=useState(false);
  const [loading,setLoading]=useState(true);
  const [sending,setSending]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");

  async function load(){
    setLoading(true);setError("");
    try{
      const response=await fetch(`/api/admin/tickets/${encodeURIComponent(ticketId)}`,{cache:"no-store"});
      const data=await response.json() as {ticket?:Ticket;messages?:Message[];error?:string};
      if(!response.ok)throw new Error(data.error??"Could not load ticket.");
      setTicket(data.ticket??null);setMessages(data.messages??[]);
    }catch(err){setError(err instanceof Error?err.message:"Could not load ticket.");}
    finally{setLoading(false);}
  }
  useEffect(()=>{void load();},[ticketId]);

  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setSending(true);setError("");setNotice("");
    try{
      const response=await fetch(`/api/admin/tickets/${encodeURIComponent(ticketId)}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,internalNote})});
      const data=await response.json() as {error?:string};
      if(!response.ok)throw new Error(data.error??"Could not send message.");
      setMessage("");setNotice(internalNote?"Internal note added.":"Reply sent to the player.");await load();
    }catch(err){setError(err instanceof Error?err.message:"Could not send message.");}
    finally{setSending(false);}
  }

  if(loading)return <p className="mt-8 text-sm text-slate-400">Loading ticket conversation…</p>;
  if(error&&!ticket)return <div className="mt-8 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">{error}</div>;
  if(!ticket)return <p className="mt-8 text-sm text-slate-400">Ticket not found.</p>;

  return <div className="mt-8 space-y-5">
    <Link href="/tickets" className="text-sm text-blue-300 hover:text-blue-200">← Back to ticket queue</Link>
    <section className="panel-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-semibold text-blue-300">Ticket #{ticket.ticket_number} · {ticket.category.replace("-"," ")}</p><h2 className="mt-1 text-xl font-semibold text-white">{ticket.subject}</h2><p className="mt-2 text-sm text-slate-400">Opened by {ticket.owner_username??ticket.owner_discord_id} · {new Date(ticket.created_at).toLocaleString("en-GB")}</p></div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">{ticket.status.replace("_"," ")}</span>
      </div>
      <p className="mt-3 text-xs text-slate-500">Priority: {ticket.priority} · Assigned to: {ticket.assignee_username??"Unassigned"}</p>
    </section>
    <section className="panel-card p-5 sm:p-6">
      <h3 className="font-semibold text-white">Conversation</h3>
      <div className="mt-4 space-y-3">
        {messages.map(item=><article key={item.id} className={`rounded-xl border p-4 ${item.is_internal_note?"border-amber-400/30 bg-amber-400/[0.06]":"border-white/[0.07] bg-white/[0.025]"}`}>
          <div className="flex flex-wrap justify-between gap-2 text-xs"><span className="font-semibold text-slate-200">{item.author_username??item.author_discord_id}{item.is_internal_note?" · STAFF NOTE":""}</span><time className="text-slate-500">{new Date(item.created_at).toLocaleString("en-GB")}</time></div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-300">{item.body}</p>
        </article>)}
        {!messages.length&&<p className="text-sm text-slate-400">No messages have been added yet.</p>}
      </div>
    </section>
    <section className="panel-card p-5 sm:p-6">
      <h3 className="font-semibold text-white">Reply to ticket</h3>
      {ticket.status==="closed"?<p className="mt-3 text-sm text-amber-200">This ticket is closed. Reopen it from the queue before replying.</p>:<form onSubmit={submit} className="mt-4 space-y-3">
        <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={internalNote} onChange={e=>setInternalNote(e.target.checked)} /> Add as internal staff-only note</label>
        <textarea required maxLength={5000} rows={5} value={message} onChange={e=>setMessage(e.target.value)} placeholder={internalNote?"Write a note visible only to staff…":"Write your response to the player…"} className="w-full rounded-xl border border-white/10 bg-[#0b1627] px-4 py-3 text-sm leading-6 text-white outline-none focus:border-blue-400" />
        {error&&<p role="alert" className="text-sm text-red-300">{error}</p>}{notice&&<p role="status" className="text-sm text-emerald-300">{notice}</p>}
        <button disabled={sending||!message.trim()} className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-400 disabled:opacity-50">{sending?"Sending…":internalNote?"Add internal note":"Send reply"}</button>
      </form>}
    </section>
  </div>;
}
